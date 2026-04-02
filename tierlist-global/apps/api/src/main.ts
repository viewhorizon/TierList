// ============================================================
// apps/api/src/main.ts
// Entrypoint — Express + TypeORM + Rutas completas
// ============================================================

import 'reflect-metadata';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { DataSource } from 'typeorm';
import * as crypto from 'crypto';
import {
  UserEntity, DebateEntity, DebateItemEntity, VoteEntity,
  SvpTransactionEntity, InventoryObjectEntity, InventoryLedgerEntity,
  AuditLogEntity, AchievementEntity, PolicyEntity,
} from './database/entities';
import { HmacService } from '../../libs/hmac/src/hmac.service';

// ─── Bootstrap ───────────────────────────────────────────────

async function bootstrap() {
  const app = express();
  app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:3000' }));
  app.use(helmet());
  app.use(express.json({ limit: '10mb' }));

  // ─── Database ────────────────────────────────────────────
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USER ?? 'tierlist',
    password: process.env.DB_PASSWORD ?? 'tierlist_secret',
    database: process.env.DB_NAME ?? 'tierlist_global',
    entities: [
      UserEntity, DebateEntity, DebateItemEntity, VoteEntity,
      SvpTransactionEntity, InventoryObjectEntity, InventoryLedgerEntity,
      AuditLogEntity, AchievementEntity, PolicyEntity,
    ],
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV === 'development',
  });

  await dataSource.initialize();
  console.log('✅ PostgreSQL conectado');

  // ─── Repositorios ────────────────────────────────────────
  const debateRepo = dataSource.getRepository(DebateEntity);
  const itemRepo = dataSource.getRepository(DebateItemEntity);
  const voteRepo = dataSource.getRepository(VoteEntity);
  const svpRepo = dataSource.getRepository(SvpTransactionEntity);
  const inventoryRepo = dataSource.getRepository(InventoryObjectEntity);
  const ledgerRepo = dataSource.getRepository(InventoryLedgerEntity);
  const auditRepo = dataSource.getRepository(AuditLogEntity);
  const achievementRepo = dataSource.getRepository(AchievementEntity);
  const policyRepo = dataSource.getRepository(PolicyEntity);
  const userRepo = dataSource.getRepository(UserEntity);

  // ─── Middleware de auditoría ──────────────────────────────
  const auditMiddleware = (entity: string) => async (req: Request, _res: Response, next: NextFunction) => {
    req.body.__auditEntity = entity;
    next();
  };

  // ─── Health ──────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
  });

  // ════════════════════════════════════════════════════════
  // DEBATES
  // ════════════════════════════════════════════════════════
  app.get('/v1/debates', async (req, res) => {
    const { page = 1, limit = 20, status, scope } = req.query;
    const where: Record<string, string> = {};
    if (status) where.status = String(status);
    if (scope) where.scope = String(scope);
    const [data, total] = await debateRepo.findAndCount({
      where,
      relations: ['items'],
      order: { createdAt: 'DESC' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });
    res.json({ success: true, data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)), timestamp: new Date().toISOString() });
  });

  app.get('/v1/debates/:id', async (req, res) => {
    const debate = await debateRepo.findOne({ where: { id: req.params.id }, relations: ['items'] });
    if (!debate) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Debate no encontrado' }, timestamp: new Date().toISOString() });
    res.json({ success: true, data: debate, timestamp: new Date().toISOString() });
  });

  app.get('/v1/debates/:id/ranking', async (req, res) => {
    const items = await itemRepo.find({ where: { debateId: req.params.id }, order: { voteCount: 'DESC' } });
    const totalVotes = items.reduce((s, i) => s + i.voteCount, 0);
    const ranking = items.map((item, idx) => ({
      ...item,
      rank: idx + 1,
      consensusPercentage: totalVotes > 0 ? ((item.voteCount / totalVotes) * 100).toFixed(2) : '0.00',
    }));
    res.json({ success: true, data: ranking, timestamp: new Date().toISOString() });
  });

  app.post('/v1/debates', async (req, res) => {
    const { title, description, category, scope, startDate, endDate, items, configRules, createdBy } = req.body;
    const debate = debateRepo.create({ title, description, category, scope: scope ?? 'LOCAL', status: 'DRAFT', startDate, endDate, configRules: configRules ?? {}, createdBy });
    const saved = await debateRepo.save(debate);
    if (items?.length) {
      const debateItems = items.map((i: Record<string, string>) => itemRepo.create({ ...i, debateId: saved.id }));
      await itemRepo.save(debateItems);
    }
    res.status(201).json({ success: true, data: saved, timestamp: new Date().toISOString() });
  });

  app.patch('/v1/debates/:id/open', async (req, res) => {
    await debateRepo.update(req.params.id, { status: 'OPEN' });
    res.json({ success: true, data: { id: req.params.id, status: 'OPEN' }, timestamp: new Date().toISOString() });
  });

  app.post('/v1/debates/:id/close', async (req, res) => {
    const id = req.params.id;
    const debate = await debateRepo.findOne({ where: { id }, relations: ['items'] });
    if (!debate) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Debate no encontrado' }, timestamp: new Date().toISOString() });

    const items = await itemRepo.find({ where: { debateId: id }, order: { voteCount: 'DESC' } });
    const totalVotes = items.reduce((s, i) => s + i.voteCount, 0);

    // Calcular y asignar tiers
    const tiers = ['S', 'A', 'B', 'C'];
    for (let i = 0; i < items.length; i++) {
      const tierIdx = Math.min(Math.floor((i / items.length) * 4), 3);
      const pct = totalVotes > 0 ? (items[i].voteCount / totalVotes) * 100 : 0;
      await itemRepo.update(items[i].id, { tier: tiers[tierIdx], consensusPercentage: pct, isAudited: true });
    }

    // Insertar evento SVP en Outbox
    const eventId = HmacService.generateEventId();
    const nonce = HmacService.generateNonce();
    const timestamp = Math.floor(Date.now() / 1000);
    const horasActividad = Math.max(totalVotes / 1000, 0.1);
    const votesLocales = debate.scope === 'LOCAL' ? totalVotes : Math.floor(totalVotes * 0.4);
    const votesGlobales = debate.scope === 'GLOBAL' ? totalVotes : Math.floor(totalVotes * 0.6);
    const calculatedPoints = horasActividad * (votesLocales + votesGlobales);

    const payload = {
      eventId,
      sourceApp: 'tierlist-global',
      sourceEnv: process.env.NODE_ENV === 'production' ? 'prod' : 'dev',
      userId: debate.createdBy,
      activityType: 'vote_result',
      activityId: id,
      score: Math.round(calculatedPoints),
      unit: 'liveops_points',
      metadata: { rank: 1, votesLocales, votesGlobales, votosTotales: totalVotes, horasActividad, calculatedPoints, category: debate.category, isGlobalAchievement: debate.scope === 'GLOBAL' },
      occurredAt: new Date().toISOString(),
    };

    const body = JSON.stringify(payload);
    const signature = HmacService.generateSignature({ body, nonce, timestamp, secret: process.env.SVP_HMAC_SECRET ?? 'svp-secret' });

    await svpRepo.save(svpRepo.create({ eventId, payload, status: 'PENDING', retryCount: 0, signature }));
    await debateRepo.update(id, { status: 'FINALIZED' });

    res.json({ success: true, data: { id, status: 'FINALIZED', totalVotes, calculatedPoints, eventId }, timestamp: new Date().toISOString() });
  });

  // ════════════════════════════════════════════════════════
  // VOTES
  // ════════════════════════════════════════════════════════
  app.post('/v1/debates/:id/vote', async (req, res) => {
    const { userId, itemId, comment, durationSeconds } = req.body;
    const debateId = req.params.id;

    const debate = await debateRepo.findOne({ where: { id: debateId } });
    if (!debate || debate.status !== 'OPEN') return res.status(400).json({ success: false, error: { code: 'DEBATE_NOT_OPEN', message: 'El debate no está abierto' }, timestamp: new Date().toISOString() });

    const existing = await voteRepo.findOne({ where: { userId, itemId } });
    if (existing) return res.status(409).json({ success: false, error: { code: 'ALREADY_VOTED', message: 'Ya votaste por este item' }, timestamp: new Date().toISOString() });

    const ipHash = HmacService.hashState({ ip: req.ip ?? 'unknown' });
    const signature = HmacService.generateSignature({ body: `${userId}:${itemId}:${debateId}`, nonce: HmacService.generateNonce(), timestamp: Math.floor(Date.now() / 1000), secret: process.env.VOTE_HMAC_SECRET ?? 'vote-secret' });

    const vote = await voteRepo.save(voteRepo.create({ userId, itemId, debateId, scope: debate.scope, durationSeconds: durationSeconds ?? 0, comment, ipHash, signature, status: 'VALIDATED' }));
    await itemRepo.increment({ id: itemId }, 'voteCount', 1);

    res.status(201).json({ success: true, data: vote, timestamp: new Date().toISOString() });
  });

  app.get('/v1/votes/user/:userId', async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const [data, total] = await voteRepo.findAndCount({ where: { userId: req.params.userId }, order: { createdAt: 'DESC' }, skip: (Number(page) - 1) * Number(limit), take: Number(limit) });
    res.json({ success: true, data, total, timestamp: new Date().toISOString() });
  });

  // ════════════════════════════════════════════════════════
  // INVENTORY
  // ════════════════════════════════════════════════════════
  app.get('/v1/inventory/:userId', async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const [data, total] = await inventoryRepo.findAndCount({ where: { ownerId: req.params.userId, status: 'ACTIVE' }, order: { createdAt: 'DESC' }, skip: (Number(page) - 1) * Number(limit), take: Number(limit) });
    res.json({ success: true, data, total, totalPages: Math.ceil(total / Number(limit)), timestamp: new Date().toISOString() });
  });

  app.get('/v1/inventory/object/:objectId/ledger', async (req, res) => {
    const entries = await ledgerRepo.find({ where: { objectId: req.params.objectId }, order: { createdAt: 'ASC' } });
    res.json({ success: true, data: entries, timestamp: new Date().toISOString() });
  });

  app.get('/v1/inventory/object/:objectId/verify', async (req, res) => {
    const entries = await ledgerRepo.find({ where: { objectId: req.params.objectId }, order: { createdAt: 'ASC' } });
    const secret = process.env.AUDIT_HMAC_SECRET ?? 'audit-secret';
    for (const entry of entries) {
      const expected = HmacService.generateAuditSignature({ id: entry.id, objectId: entry.objectId, pointsDelta: entry.pointsDelta, previousStateHash: entry.previousStateHash, action: entry.action, createdAt: entry.createdAt.toISOString(), secret });
      if (expected !== entry.auditSignature) {
        return res.json({ success: true, data: { valid: false, brokenAt: entry.id }, timestamp: new Date().toISOString() });
      }
    }
    res.json({ success: true, data: { valid: true }, timestamp: new Date().toISOString() });
  });

  app.post('/v1/inventory/grant', async (req, res) => {
    const { userId, achievementId, objectTemplateId, initialValue } = req.body;
    const transactionId = crypto.randomUUID();
    const id = crypto.randomUUID();
    const obj = await inventoryRepo.save(inventoryRepo.create({ ownerId: userId, templateId: objectTemplateId, name: `Achievement — ${achievementId}`, currentValue: initialValue, isDynamic: true, status: 'ACTIVE', metadata: { achievementId } }));
    const createdAt = new Date().toISOString();
    const auditSignature = HmacService.generateAuditSignature({ id, objectId: obj.id, pointsDelta: initialValue, previousStateHash: '0'.repeat(64), action: 'GRANT', createdAt, secret: process.env.AUDIT_HMAC_SECRET ?? 'audit-secret' });
    await ledgerRepo.save(ledgerRepo.create({ id, objectId: obj.id, transactionId, action: 'GRANT', pointsDelta: initialValue, previousStateHash: '0'.repeat(64), currentStateSnapshot: { ...obj }, auditSignature }));
    res.status(201).json({ success: true, data: obj, timestamp: new Date().toISOString() });
  });

  // ════════════════════════════════════════════════════════
  // SVP DISPATCHER
  // ════════════════════════════════════════════════════════
  app.get('/v1/dispatcher/transactions', async (req, res) => {
    const { page = 1, limit = 20, status } = req.query;
    const where: Record<string, string> = {};
    if (status) where.status = String(status);
    const [data, total] = await svpRepo.findAndCount({ where, order: { createdAt: 'DESC' }, skip: (Number(page) - 1) * Number(limit), take: Number(limit) });
    res.json({ success: true, data, total, timestamp: new Date().toISOString() });
  });

  app.get('/v1/dispatcher/metrics', async (_req, res) => {
    const [pending, sent, failed, acknowledged, critical] = await Promise.all([
      svpRepo.count({ where: { status: 'PENDING' } }),
      svpRepo.count({ where: { status: 'SENT' } }),
      svpRepo.count({ where: { status: 'FAILED' } }),
      svpRepo.count({ where: { status: 'ACKNOWLEDGED' } }),
      svpRepo.count({ where: { status: 'CRITICAL_FAILURE' } }),
    ]);
    res.json({ success: true, data: { pending, sent, failed, acknowledged, critical }, timestamp: new Date().toISOString() });
  });

  app.post('/v1/dispatcher/retry/:id', async (req, res) => {
    const tx = await svpRepo.findOne({ where: { id: req.params.id } });
    if (!tx) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Transacción no encontrada' }, timestamp: new Date().toISOString() });
    await svpRepo.update(tx.id, { status: 'PENDING', retryCount: 0, lastError: null });
    res.json({ success: true, data: { id: tx.id, status: 'PENDING' }, timestamp: new Date().toISOString() });
  });

  // ════════════════════════════════════════════════════════
  // AUDIT LOGS
  // ════════════════════════════════════════════════════════
  app.get('/v1/audit/logs', async (req, res) => {
    const { page = 1, limit = 50, entityName } = req.query;
    const where: Record<string, string> = {};
    if (entityName) where.entityName = String(entityName);
    const [data, total] = await auditRepo.findAndCount({ where, order: { createdAt: 'DESC' }, skip: (Number(page) - 1) * Number(limit), take: Number(limit) });
    res.json({ success: true, data, total, totalPages: Math.ceil(total / Number(limit)), timestamp: new Date().toISOString() });
  });

  // ════════════════════════════════════════════════════════
  // POLICY ENGINE
  // ════════════════════════════════════════════════════════
  app.get('/v1/policies', async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const [data, total] = await policyRepo.findAndCount({ where: { isActive: true }, order: { createdAt: 'DESC' }, skip: (Number(page) - 1) * Number(limit), take: Number(limit) });
    res.json({ success: true, data, total, timestamp: new Date().toISOString() });
  });

  app.post('/v1/policies', async (req, res) => {
    const policy = await policyRepo.save(policyRepo.create({ ...req.body, isActive: true }));
    res.status(201).json({ success: true, data: policy, timestamp: new Date().toISOString() });
  });

  app.post('/v1/engine/revalue', async (req, res) => {
    const { policyId, context, objectMetadata } = req.body;
    const policy = await policyRepo.findOne({ where: { policyId, isActive: true } });
    if (!policy) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Policy no encontrada' }, timestamp: new Date().toISOString() });

    const mutations: Array<{ type: string; newPoints?: number; newTemplate?: string; reason: string }> = [];
    for (const rule of policy.rules as Array<{ condition: string; action: { type: string; params: Record<string, number | string> } }>) {
      const sanitized = rule.condition
        .replace(/activity_hours/g, String(context.activityHours))
        .replace(/total_votes/g, String(context.votesLocales + context.votesGlobales))
        .replace(/is_global_winner/g, String(context.isGlobalWinner));
      try {
        // eslint-disable-next-line no-new-func
        if (new Function(`return (${sanitized})`)()) {
          const m = rule.action.type === 'REVALUE'
            ? { type: 'REVALUE', newPoints: Math.round((objectMetadata.baseValue * (rule.action.params.multiplier as number ?? 1)) + (rule.action.params.baseBonus as number ?? 0)), reason: 'Rule matched' }
            : { type: rule.action.type, newTemplate: rule.action.params.targetTemplateId as string, reason: 'Rule matched' };
          mutations.push(m);
        }
      } catch { /* skip invalid conditions */ }
    }

    res.json({ success: true, data: { mutationProposed: mutations.length > 0, mutations, engineVersion: '2.4.8-Stable', executionTraceId: crypto.randomUUID() }, timestamp: new Date().toISOString() });
  });

  // ════════════════════════════════════════════════════════
  // USERS
  // ════════════════════════════════════════════════════════
  app.get('/v1/users/:id', async (req, res) => {
    const user = await userRepo.findOne({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Usuario no encontrado' }, timestamp: new Date().toISOString() });
    const { passwordHash, refreshToken, ...safe } = user;
    res.json({ success: true, data: safe, timestamp: new Date().toISOString() });
  });

  // ─── Error handler ────────────────────────────────────
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message }, timestamp: new Date().toISOString() });
  });

  const PORT = process.env.PORT ?? 4000;
  app.listen(PORT, () => console.log(`🚀 TierList API corriendo en http://localhost:${PORT}`));
}

bootstrap().catch(console.error);
