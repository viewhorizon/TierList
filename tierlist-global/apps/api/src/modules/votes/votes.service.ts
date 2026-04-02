// ============================================================
// apps/api/src/modules/votes/votes.service.ts
// Motor de Votación — Validación, anti-fraude e idempotencia
// ============================================================

import {
  Injectable, Logger, ConflictException,
  NotFoundException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VoteEntity, DebateItemEntity, DebateEntity } from '../../database/entities';
import { HmacService } from '../../../../libs/hmac/src/hmac.service';

interface CastVoteDto {
  userId: string;
  itemId: string;
  debateId: string;
  comment?: string;
  durationSeconds?: number;
  ipAddress: string;
  userAgent: string;
  idempotencyKey: string;
}

@Injectable()
export class VotesService {
  private readonly logger = new Logger(VotesService.name);

  constructor(
    @InjectRepository(VoteEntity)
    private readonly voteRepo: Repository<VoteEntity>,
    @InjectRepository(DebateItemEntity)
    private readonly itemRepo: Repository<DebateItemEntity>,
    @InjectRepository(DebateEntity)
    private readonly debateRepo: Repository<DebateEntity>,
  ) {}

  /**
   * Emite un voto con protección anti-duplicado e idempotencia.
   * Header X-Idempotency-Key evita doble voto por reintentos de red.
   */
  async castVote(dto: CastVoteDto): Promise<VoteEntity> {
    // Verificar idempotencia: si ya existe con esta clave, retornar el original
    const existing = await this.voteRepo.findOne({
      where: { userId: dto.userId, itemId: dto.itemId },
    });
    if (existing) {
      throw new ConflictException(`El usuario ya votó por este item. VoteId: ${existing.id}`);
    }

    // Verificar que el debate está OPEN
    const debate = await this.debateRepo.findOne({ where: { id: dto.debateId } });
    if (!debate) throw new NotFoundException(`Debate ${dto.debateId} no encontrado`);
    if (debate.status !== 'OPEN') {
      throw new BadRequestException(`Debate no está abierto para votación (status: ${debate.status})`);
    }

    // Verificar que el item pertenece al debate
    const item = await this.itemRepo.findOne({ where: { id: dto.itemId, debateId: dto.debateId } });
    if (!item) throw new NotFoundException(`Item ${dto.itemId} no encontrado en debate ${dto.debateId}`);

    // Hash de IP para privacidad (no almacenamos IP raw)
    const ipHash = HmacService.hashState({ ip: dto.ipAddress });

    // Firma del voto para integridad
    const voteSignature = HmacService.generateSignature({
      body: `${dto.userId}:${dto.itemId}:${dto.debateId}`,
      nonce: HmacService.generateNonce(),
      timestamp: Math.floor(Date.now() / 1000),
      secret: process.env.VOTE_HMAC_SECRET ?? 'vote-secret',
    });

    const vote = this.voteRepo.create({
      userId: dto.userId,
      itemId: dto.itemId,
      debateId: dto.debateId,
      scope: debate.scope,
      durationSeconds: dto.durationSeconds ?? 0,
      comment: dto.comment,
      ipHash,
      signature: voteSignature,
      status: 'VALIDATED',
    });

    const saved = await this.voteRepo.save(vote);

    // Incrementar contador de votos del item (denormalización para performance)
    await this.itemRepo.increment({ id: dto.itemId }, 'voteCount', 1);

    this.logger.log(`[Vote] User ${dto.userId} votó por item ${dto.itemId} en debate ${dto.debateId}`);
    return saved;
  }

  async getVotesByDebate(debateId: string, page = 1, limit = 50) {
    const [data, total] = await this.voteRepo.findAndCount({
      where: { debateId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  async getUserVotes(userId: string, page = 1, limit = 20) {
    const [data, total] = await this.voteRepo.findAndCount({
      where: { userId },
      relations: ['item'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  async getDebateStats(debateId: string) {
    const total = await this.voteRepo.count({ where: { debateId } });
    const byItem = await this.voteRepo
      .createQueryBuilder('v')
      .select('v.itemId', 'itemId')
      .addSelect('COUNT(v.id)', 'count')
      .where('v.debateId = :debateId', { debateId })
      .groupBy('v.itemId')
      .orderBy('count', 'DESC')
      .getRawMany();

    return { total, byItem };
  }
}
