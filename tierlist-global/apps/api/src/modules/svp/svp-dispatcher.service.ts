// ============================================================
// apps/api/src/modules/svp/svp-dispatcher.service.ts
// SVP Event Dispatcher — Patrón Outbox con firma HMAC-SHA256
// ============================================================

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { SvpTransactionEntity } from '../../database/entities';
import { HmacService } from '../../../../libs/hmac/src/hmac.service';
import type { SvpEvent, SvpEventStatus } from '../../../../libs/common/src/types';

interface EnqueuePayload {
  userId: string;
  activityType: SvpEvent['activityType'];
  activityId: string;
  rawMetrics: {
    horasActividad: number;
    votesLocales: number;
    votesGlobales: number;
  };
  rank?: number;
  category: string;
  isGlobalAchievement?: boolean;
}

@Injectable()
export class SvpDispatcherService {
  private readonly logger = new Logger(SvpDispatcherService.name);
  private readonly RETRY_DELAYS_MS = [30_000, 300_000, 1_800_000, 7_200_000]; // 30s, 5m, 30m, 2h
  private readonly MAX_RETRIES = 5;

  constructor(
    @InjectRepository(SvpTransactionEntity)
    private readonly svpRepo: Repository<SvpTransactionEntity>,
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {}

  /**
   * Encola un evento SVP dentro de la misma transacción que cierra el debate.
   * Garantiza atomicidad: si el debate se revierte, el evento también.
   */
  async enqueue(payload: EnqueuePayload, queryRunner?: ReturnType<DataSource['createQueryRunner']>): Promise<string> {
    const { userId, activityType, activityId, rawMetrics, rank = 0, category, isGlobalAchievement = false } = payload;

    const votosTotales = rawMetrics.votesLocales + rawMetrics.votesGlobales;
    // Fórmula: puntosSVP = horasActividad * (votosLocales + votosGlobales)
    const calculatedPoints = rawMetrics.horasActividad * votosTotales;

    const eventId = HmacService.generateEventId();
    const nonce = HmacService.generateNonce();
    const timestamp = Math.floor(Date.now() / 1000);

    const svpEvent: SvpEvent = {
      eventId,
      sourceApp: 'tierlist-global',
      sourceEnv: this.config.get('NODE_ENV') === 'production' ? 'prod' : 'dev',
      userId,
      activityType,
      activityId,
      score: Math.round(calculatedPoints),
      unit: 'liveops_points',
      metadata: {
        rank,
        votesLocales: rawMetrics.votesLocales,
        votesGlobales: rawMetrics.votesGlobales,
        votosTotales,
        horasActividad: rawMetrics.horasActividad,
        calculatedPoints,
        category,
        isGlobalAchievement,
      },
      occurredAt: new Date().toISOString(),
    };

    const body = JSON.stringify(svpEvent);
    const signature = HmacService.generateSignature({
      body,
      nonce,
      timestamp,
      secret: this.config.get<string>('SVP_HMAC_SECRET'),
    });

    const transaction = queryRunner
      ? queryRunner.manager.getRepository(SvpTransactionEntity)
      : this.svpRepo;

    const record = transaction.create({
      eventId,
      payload: svpEvent as unknown as Record<string, unknown>,
      status: 'PENDING' as SvpEventStatus,
      retryCount: 0,
      signature,
    });

    await transaction.save(record);
    this.logger.log(`[OUTBOX] Evento encolado: ${eventId} | puntos=${calculatedPoints}`);
    return eventId;
  }

  /**
   * Worker del Outbox: procesa eventos PENDING cada 30 segundos.
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  async processOutbox(): Promise<void> {
    const pending = await this.svpRepo.find({
      where: { status: 'PENDING' },
      order: { createdAt: 'ASC' },
      take: 50,
    });

    for (const tx of pending) {
      await this.dispatch(tx);
    }
  }

  /**
   * Reintenta eventos FAILED con backoff exponencial.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async retryFailed(): Promise<void> {
    const failed = await this.svpRepo.find({
      where: { status: 'FAILED' },
      order: { updatedAt: 'ASC' },
      take: 20,
    });

    for (const tx of failed) {
      if (tx.retryCount >= this.MAX_RETRIES) {
        await this.svpRepo.update(tx.id, { status: 'CRITICAL_FAILURE' });
        this.logger.error(`[SVP] CRITICAL_FAILURE: ${tx.eventId} tras ${tx.retryCount} intentos`);
        continue;
      }

      const delayMs = this.RETRY_DELAYS_MS[Math.min(tx.retryCount, this.RETRY_DELAYS_MS.length - 1)];
      const shouldRetryAt = new Date(tx.updatedAt.getTime() + delayMs);

      if (new Date() >= shouldRetryAt) {
        await this.dispatch(tx);
      }
    }
  }

  private async dispatch(tx: SvpTransactionEntity): Promise<void> {
    const svpEndpoint = this.config.get<string>('SVP_ENDPOINT_URL');
    const nonce = HmacService.generateNonce();
    const timestamp = Math.floor(Date.now() / 1000);
    const body = JSON.stringify(tx.payload);

    const signature = HmacService.generateSignature({
      body,
      nonce,
      timestamp,
      secret: this.config.get<string>('SVP_HMAC_SECRET'),
    });

    try {
      const response = await fetch(svpEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-SVP-Signature': signature,
          'X-SVP-Nonce': nonce,
          'X-SVP-Timestamp': timestamp.toString(),
          'X-Idempotency-Key': tx.eventId,
        },
        body,
        signal: AbortSignal.timeout(10_000),
      });

      if (response.ok) {
        await this.svpRepo.update(tx.id, {
          status: 'SENT',
          sentAt: new Date(),
          signature,
        });
        this.logger.log(`[SVP] SENT: ${tx.eventId}`);
      } else {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      await this.svpRepo.update(tx.id, {
        status: 'FAILED',
        retryCount: tx.retryCount + 1,
        lastError: msg,
      });
      this.logger.warn(`[SVP] FAILED: ${tx.eventId} | ${msg}`);
    }
  }

  async getMetrics() {
    const [pending, sent, failed, acknowledged, critical] = await Promise.all([
      this.svpRepo.count({ where: { status: 'PENDING' } }),
      this.svpRepo.count({ where: { status: 'SENT' } }),
      this.svpRepo.count({ where: { status: 'FAILED' } }),
      this.svpRepo.count({ where: { status: 'ACKNOWLEDGED' } }),
      this.svpRepo.count({ where: { status: 'CRITICAL_FAILURE' } }),
    ]);

    return { pending, sent, failed, acknowledged, critical };
  }

  async getTransactions(page = 1, limit = 20) {
    const [data, total] = await this.svpRepo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }
}
