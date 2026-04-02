// ============================================================
// apps/api/src/modules/inventory/inventory.service.ts
// Inventario Global — Gestión de objetos con ledger auditado
// ============================================================

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import {
  InventoryObjectEntity,
  InventoryLedgerEntity,
  AuditLogEntity,
} from '../../database/entities';
import { HmacService } from '../../../../libs/hmac/src/hmac.service';
import type { InventoryAction } from '../../../../libs/common/src/types';

interface GrantAchievementDto {
  userId: string;
  achievementId: string;
  objectTemplateId: string;
  initialValue: number;
}

interface MutateObjectDto {
  objectId: string;
  action: InventoryAction;
  pointsDelta: number;
  newTemplateId?: string;
  reason: string;
  operatorId: string;
}

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    @InjectRepository(InventoryObjectEntity)
    private readonly objectRepo: Repository<InventoryObjectEntity>,
    @InjectRepository(InventoryLedgerEntity)
    private readonly ledgerRepo: Repository<InventoryLedgerEntity>,
    @InjectRepository(AuditLogEntity)
    private readonly auditRepo: Repository<AuditLogEntity>,
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {}

  /**
   * Asigna un objeto al inventario del usuario desde un logro.
   * Puede ejecutarse dentro de una transacción externa (QueryRunner de debates).
   */
  async grantAchievement(dto: GrantAchievementDto, qr?: QueryRunner): Promise<InventoryObjectEntity> {
    const manager = qr ? qr.manager : this.dataSource.manager;
    const transactionId = crypto.randomUUID();

    // 1. Crear el objeto en el inventario
    const obj = manager.getRepository(InventoryObjectEntity).create({
      ownerId: dto.userId,
      templateId: dto.objectTemplateId,
      name: `Achievement Object — ${dto.achievementId}`,
      currentValue: dto.initialValue,
      isDynamic: true,
      status: 'ACTIVE',
      metadata: { achievementId: dto.achievementId, grantedAt: new Date().toISOString() },
    });
    const saved = await manager.getRepository(InventoryObjectEntity).save(obj);

    // 2. Crear primera entrada en el ledger (cadena inicial)
    await this.appendLedger(saved, 'GRANT', dto.initialValue, '0'.repeat(64), transactionId, manager);

    this.logger.log(`[Inventory] GRANT: objeto ${saved.id} para user ${dto.userId}`);
    return saved;
  }

  /**
   * Aplica una mutación a un objeto (REVALUE, TRANSFORM, BURN, TRANSFER).
   * Genera entrada auditada y encadenada en el ledger.
   */
  async mutate(dto: MutateObjectDto): Promise<{ object: InventoryObjectEntity; ledgerEntry: InventoryLedgerEntity }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const obj = await queryRunner.manager.findOne(InventoryObjectEntity, { where: { id: dto.objectId } });
      if (!obj) throw new NotFoundException(`Objeto ${dto.objectId} no encontrado`);

      const transactionId = crypto.randomUUID();
      const previousSnapshot = { ...obj };

      // Aplicar mutación
      switch (dto.action) {
        case 'REVALUE':
          obj.currentValue += dto.pointsDelta;
          break;
        case 'TRANSFORM':
          if (dto.newTemplateId) obj.templateId = dto.newTemplateId;
          obj.currentValue += dto.pointsDelta;
          break;
        case 'BURN':
          obj.status = 'BURNED';
          obj.currentValue = 0;
          break;
        case 'TRANSFER':
          obj.status = 'TRANSFERRED';
          break;
      }

      obj.updatedAt = new Date();
      const updated = await queryRunner.manager.save(InventoryObjectEntity, obj);

      // Registrar en ledger encadenado
      const ledgerEntry = await this.appendLedger(
        updated,
        dto.action,
        dto.pointsDelta,
        HmacService.hashState(previousSnapshot as unknown as Record<string, unknown>),
        transactionId,
        queryRunner.manager,
      );

      // Audit log
      await this.createAuditLog('inventory_objects', dto.objectId, dto.action, dto.operatorId, previousSnapshot, updated);

      await queryRunner.commitTransaction();
      return { object: updated, ledgerEntry };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Appends a signed, chained entry to the InventoryLedger.
   * auditSignature = HMAC_SHA256(secret, id+objectId+pointsDelta+previousStateHash+action+createdAt)
   */
  private async appendLedger(
    obj: InventoryObjectEntity,
    action: string,
    pointsDelta: number,
    previousStateHash: string,
    transactionId: string,
    manager: DataSource['manager'],
  ): Promise<InventoryLedgerEntity> {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    const auditSignature = HmacService.generateAuditSignature({
      id,
      objectId: obj.id,
      pointsDelta,
      previousStateHash,
      action,
      createdAt,
      secret: this.config.get<string>('AUDIT_HMAC_SECRET') ?? 'audit-secret',
    });

    const currentStateSnapshot = {
      id: obj.id,
      ownerId: obj.ownerId,
      templateId: obj.templateId,
      currentValue: obj.currentValue,
      status: obj.status,
      metadata: obj.metadata,
    };

    const entry = manager.getRepository(InventoryLedgerEntity).create({
      id,
      objectId: obj.id,
      transactionId,
      action,
      pointsDelta,
      previousStateHash,
      currentStateSnapshot,
      auditSignature,
    });

    return manager.getRepository(InventoryLedgerEntity).save(entry);
  }

  async getInventory(userId: string, page = 1, limit = 20) {
    const [data, total] = await this.objectRepo.findAndCount({
      where: { ownerId: userId, status: 'ACTIVE' },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getLedger(objectId: string) {
    return this.ledgerRepo.find({
      where: { objectId },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Verifica la integridad de la cadena del ledger para un objeto.
   * Detecta si alguna entrada fue alterada post-inserción.
   */
  async verifyLedgerIntegrity(objectId: string): Promise<{ valid: boolean; brokenAt?: string }> {
    const entries = await this.ledgerRepo.find({
      where: { objectId },
      order: { createdAt: 'ASC' },
    });

    const secret = this.config.get<string>('AUDIT_HMAC_SECRET') ?? 'audit-secret';

    for (const entry of entries) {
      const expected = HmacService.generateAuditSignature({
        id: entry.id,
        objectId: entry.objectId,
        pointsDelta: entry.pointsDelta,
        previousStateHash: entry.previousStateHash,
        action: entry.action,
        createdAt: entry.createdAt.toISOString(),
        secret,
      });

      if (expected !== entry.auditSignature) {
        return { valid: false, brokenAt: entry.id };
      }
    }

    return { valid: true };
  }

  private async createAuditLog(
    entityName: string,
    entityId: string,
    action: string,
    userId: string,
    oldValue: unknown,
    newValue: unknown,
  ): Promise<void> {
    const signature = HmacService.generateAuditSignature({
      id: crypto.randomUUID(),
      objectId: entityId,
      pointsDelta: 0,
      previousStateHash: HmacService.hashState(oldValue as Record<string, unknown>),
      action,
      createdAt: new Date().toISOString(),
      secret: process.env.AUDIT_HMAC_SECRET ?? 'audit-secret',
    });
    await this.auditRepo.save({ entityName, entityId, action, userId, oldValue, newValue, signature });
  }
}
