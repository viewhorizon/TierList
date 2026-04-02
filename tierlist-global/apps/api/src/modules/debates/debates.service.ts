// ============================================================
// apps/api/src/modules/debates/debates.service.ts
// Debate Engine — Ciclo de vida completo + cierre atómico
// ============================================================

import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  DebateEntity,
  DebateItemEntity,
  AuditLogEntity,
  AchievementEntity,
} from '../../database/entities';
import { SvpDispatcherService } from '../svp/svp-dispatcher.service';
import { InventoryService } from '../inventory/inventory.service';
import { HmacService } from '../../../../libs/hmac/src/hmac.service';
import type { TierLevel } from '../../../../libs/common/src/types';

interface CreateDebateDto {
  title: string;
  description: string;
  category: string;
  scope: 'LOCAL' | 'GLOBAL';
  startDate: Date;
  endDate: Date;
  items: Array<{ name: string; description?: string; imageUrl?: string }>;
  configRules?: Record<string, unknown>;
  createdBy: string;
}

interface CalculatedRanking {
  itemId: string;
  name: string;
  voteCount: number;
  consensusPercentage: number;
  tier: TierLevel;
  rank: number;
}

@Injectable()
export class DebatesService {
  private readonly logger = new Logger(DebatesService.name);

  constructor(
    @InjectRepository(DebateEntity)
    private readonly debateRepo: Repository<DebateEntity>,
    @InjectRepository(DebateItemEntity)
    private readonly itemRepo: Repository<DebateItemEntity>,
    @InjectRepository(AuditLogEntity)
    private readonly auditRepo: Repository<AuditLogEntity>,
    @InjectRepository(AchievementEntity)
    private readonly achievementRepo: Repository<AchievementEntity>,
    private readonly dataSource: DataSource,
    private readonly svpDispatcher: SvpDispatcherService,
    private readonly inventoryService: InventoryService,
  ) {}

  async create(dto: CreateDebateDto): Promise<DebateEntity> {
    const debate = this.debateRepo.create({
      title: dto.title,
      description: dto.description,
      category: dto.category,
      scope: dto.scope,
      status: 'DRAFT',
      startDate: dto.startDate,
      endDate: dto.endDate,
      configRules: dto.configRules ?? {},
      createdBy: dto.createdBy,
    });

    const saved = await this.debateRepo.save(debate);

    const items = dto.items.map((item) =>
      this.itemRepo.create({ ...item, debateId: saved.id }),
    );
    await this.itemRepo.save(items);

    await this.createAuditLog('debates', saved.id, 'CREATE', dto.createdBy, null, saved);
    return saved;
  }

  async findAll(page = 1, limit = 20, status?: string, scope?: string) {
    const where: Record<string, string> = {};
    if (status) where.status = status;
    if (scope) where.scope = scope;

    const [data, total] = await this.debateRepo.findAndCount({
      where,
      relations: ['items'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<DebateEntity> {
    const debate = await this.debateRepo.findOne({ where: { id }, relations: ['items'] });
    if (!debate) throw new NotFoundException(`Debate ${id} no encontrado`);
    return debate;
  }

  async openDebate(id: string, operatorId: string): Promise<DebateEntity> {
    const debate = await this.findOne(id);
    if (debate.status !== 'DRAFT') {
      throw new BadRequestException('Solo debates en DRAFT pueden abrirse');
    }
    await this.debateRepo.update(id, { status: 'OPEN' });
    await this.createAuditLog('debates', id, 'OPEN', operatorId, { status: 'DRAFT' }, { status: 'OPEN' });
    return this.findOne(id);
  }

  /**
   * Cierre atómico de debate — Patrón Transacción + Outbox
   *
   * Garantía:
   * 1. BEGIN TRANSACTION
   * 2. Calcular rankings y asignar tiers
   * 3. Detectar logros alcanzados
   * 4. Registrar en InventoryLedger (PENDING)
   * 5. Insertar evento SVP en Outbox (PENDING)
   * 6. COMMIT
   * 7. [Async] Dispatcher envía al SVP
   */
  async closeAndCalculate(id: string, operatorId: string): Promise<{ debate: DebateEntity; ranking: CalculatedRanking[] }> {
    const debate = await this.findOne(id);
    if (debate.status !== 'OPEN') {
      throw new BadRequestException('Solo debates OPEN pueden cerrarse');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // ─── 1. Calcular rankings ─────────────────────────────
      const items = await queryRunner.manager.find(DebateItemEntity, {
        where: { debateId: id },
        order: { voteCount: 'DESC' },
      });

      const totalVotes = items.reduce((sum, i) => sum + i.voteCount, 0);
      const ranking: CalculatedRanking[] = items.map((item, idx) => ({
        itemId: item.id,
        name: item.name,
        voteCount: item.voteCount,
        consensusPercentage: totalVotes > 0 ? (item.voteCount / totalVotes) * 100 : 0,
        tier: this.assignTier(idx, items.length),
        rank: idx + 1,
      }));

      // ─── 2. Actualizar tiers en los items ─────────────────
      for (const r of ranking) {
        await queryRunner.manager.update(DebateItemEntity, r.itemId, {
          tier: r.tier,
          consensusPercentage: r.consensusPercentage,
          isAudited: true,
        });
      }

      // ─── 3. Actualizar estado del debate ──────────────────
      await queryRunner.manager.update(DebateEntity, id, { status: 'CALC_POINTS' });

      // ─── 4. Detectar logros y encolar en Outbox ───────────
      const achievements = await queryRunner.manager.find(AchievementEntity, {
        where: { scope: debate.scope, isActive: true },
      });

      for (const ach of achievements) {
        const winner = ranking[0];
        const conditionMet = this.evaluateAchievement(ach.triggerCondition, {
          rank: winner.rank,
          total_votes: totalVotes,
          is_global: debate.scope === 'GLOBAL',
        });

        if (conditionMet) {
          this.logger.log(`[Achievement] ${ach.name} activado en debate ${id}`);
          // El inventario crea la entrada en ledger dentro de la misma transacción
          await this.inventoryService.grantAchievement(
            { userId: debate.createdBy, achievementId: ach.id, objectTemplateId: ach.objectTemplateId, initialValue: ach.initialValue },
            queryRunner,
          );
        }
      }

      // ─── 5. Encolar evento SVP (Outbox) ───────────────────
      const horasActividad = totalVotes > 0 ? Math.max(totalVotes / 1000, 0.1) : 0.1;
      await this.svpDispatcher.enqueue(
        {
          userId: debate.createdBy,
          activityType: 'vote_result',
          activityId: id,
          rawMetrics: {
            horasActividad,
            votesLocales: debate.scope === 'LOCAL' ? totalVotes : Math.floor(totalVotes * 0.4),
            votesGlobales: debate.scope === 'GLOBAL' ? totalVotes : Math.floor(totalVotes * 0.6),
          },
          rank: ranking[0]?.rank ?? 0,
          category: debate.category,
          isGlobalAchievement: debate.scope === 'GLOBAL',
        },
        queryRunner,
      );

      // ─── 6. COMMIT ────────────────────────────────────────
      await queryRunner.commitTransaction();

      await this.debateRepo.update(id, { status: 'FINALIZED' });
      await this.createAuditLog('debates', id, 'CLOSE_CALCULATE', operatorId, { status: 'OPEN' }, { status: 'FINALIZED', totalVotes });

      this.logger.log(`[Debate] ${id} cerrado y calculado. Votos totales: ${totalVotes}`);
      return { debate: await this.findOne(id), ranking };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`[Debate] Error cerrando ${id}: ${error}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getRanking(debateId: string): Promise<CalculatedRanking[]> {
    const items = await this.itemRepo.find({
      where: { debateId },
      order: { voteCount: 'DESC' },
    });
    const totalVotes = items.reduce((s, i) => s + i.voteCount, 0);
    return items.map((item, idx) => ({
      itemId: item.id,
      name: item.name,
      voteCount: item.voteCount,
      consensusPercentage: totalVotes > 0 ? (item.voteCount / totalVotes) * 100 : 0,
      tier: item.tier as TierLevel ?? this.assignTier(idx, items.length),
      rank: idx + 1,
    }));
  }

  private assignTier(rank: number, total: number): TierLevel {
    const pct = rank / total;
    if (pct <= 0.1) return 'S';
    if (pct <= 0.3) return 'A';
    if (pct <= 0.6) return 'B';
    return 'C';
  }

  private evaluateAchievement(condition: string, ctx: Record<string, unknown>): boolean {
    try {
      const sanitized = condition
        .replace(/rank/g, String(ctx.rank))
        .replace(/total_votes/g, String(ctx.total_votes))
        .replace(/is_global/g, String(ctx.is_global));
      if (!/^[\d\s<>=!&|().truefals]+$/.test(sanitized)) return false;
      // eslint-disable-next-line no-new-func
      return Boolean(new Function(`return (${sanitized})`)());
    } catch {
      return false;
    }
  }

  private async createAuditLog(
    entityName: string,
    entityId: string,
    action: string,
    userId: string,
    oldValue: unknown,
    newValue: unknown,
  ): Promise<void> {
    const payload = `${entityId}${action}${JSON.stringify(newValue)}`;
    const signature = HmacService.generateSignature({
      body: payload,
      nonce: HmacService.generateNonce(),
      timestamp: Math.floor(Date.now() / 1000),
      secret: process.env.AUDIT_HMAC_SECRET ?? 'audit-secret',
    });

    await this.auditRepo.save({
      entityName,
      entityId,
      action,
      userId,
      oldValue: oldValue as Record<string, unknown>,
      newValue: newValue as Record<string, unknown>,
      signature,
    });
  }
}
