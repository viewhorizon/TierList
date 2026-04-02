// ============================================================
// apps/api/src/modules/policy/policy-engine.service.ts
// Motor de Reglas — Evaluación stateless de políticas de objetos
// ============================================================

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PolicyEntity } from '../../database/entities';
import type { PolicyActionType } from '../../../../libs/common/src/types';

interface ActivityContext {
  userId: string;
  objectId: string;
  activityHours: number;
  votesLocales: number;
  votesGlobales: number;
  isGlobalWinner: boolean;
}

interface ObjectMetadata {
  currentLevel: number;
  baseValue: number;
  rarity?: string;
  [key: string]: unknown;
}

interface PolicyMutation {
  type: PolicyActionType;
  newPoints?: number;
  newTemplate?: string;
  reason: string;
}

interface EvaluationResult {
  mutationProposed: boolean;
  mutations: PolicyMutation[];
  engineVersion: string;
  executionTraceId: string;
}

interface PolicyConditionContext {
  activity_hours: number;
  total_votes: number;
  votes_locales: number;
  votes_globales: number;
  is_global_winner: boolean;
  current_level: number;
  base_value: number;
  rarity: string;
}

@Injectable()
export class PolicyEngineService {
  private readonly logger = new Logger(PolicyEngineService.name);
  private readonly ENGINE_VERSION = '2.4.8-Stable';

  constructor(
    @InjectRepository(PolicyEntity)
    private readonly policyRepo: Repository<PolicyEntity>,
  ) {}

  /**
   * Evalúa las reglas de una política dada un contexto de actividad.
   * POST /v1/engine/revalue
   */
  async evaluate(
    policyId: string,
    context: ActivityContext,
    objectMeta: ObjectMetadata,
  ): Promise<EvaluationResult> {
    const policy = await this.policyRepo.findOne({
      where: { policyId, isActive: true },
    });

    if (!policy) {
      throw new NotFoundException(`Policy ${policyId} no encontrada o inactiva`);
    }

    const traceId = crypto.randomUUID();
    const mutations: PolicyMutation[] = [];

    const evalContext: PolicyConditionContext = {
      activity_hours: context.activityHours,
      total_votes: context.votesLocales + context.votesGlobales,
      votes_locales: context.votesLocales,
      votes_globales: context.votesGlobales,
      is_global_winner: context.isGlobalWinner,
      current_level: objectMeta.currentLevel,
      base_value: objectMeta.baseValue,
      rarity: objectMeta.rarity ?? 'common',
    };

    for (const rule of policy.rules as Array<{
      id: string;
      condition: string;
      action: { type: PolicyActionType; params: Record<string, number | string> };
    }>) {
      try {
        const conditionMet = this.evaluateCondition(rule.condition, evalContext);

        if (conditionMet) {
          const mutation = this.buildMutation(rule.action, objectMeta);
          mutations.push(mutation);
          this.logger.debug(`[Policy ${policyId}] Regla ${rule.id} activada → ${mutation.type}`);
        }
      } catch (err) {
        this.logger.error(`Error evaluando regla ${rule.id}: ${err}`);
      }
    }

    return {
      mutationProposed: mutations.length > 0,
      mutations,
      engineVersion: this.ENGINE_VERSION,
      executionTraceId: traceId,
    };
  }

  /**
   * Evalúa una expresión de condición de forma segura.
   * Usa un subconjunto acotado de expresiones (no eval global).
   */
  private evaluateCondition(expression: string, ctx: PolicyConditionContext): boolean {
    // Reemplaza las variables del contexto en la expresión
    const sanitized = expression
      .replace(/activity_hours/g, String(ctx.activity_hours))
      .replace(/total_votes/g, String(ctx.total_votes))
      .replace(/votes_locales/g, String(ctx.votes_locales))
      .replace(/votes_globales/g, String(ctx.votes_globales))
      .replace(/is_global_winner/g, String(ctx.is_global_winner))
      .replace(/current_level/g, String(ctx.current_level))
      .replace(/base_value/g, String(ctx.base_value))
      .replace(/rarity\s*==\s*['"](\w+)['"]/g, (_, v) => String(ctx.rarity === v));

    // Solo permite comparaciones y operadores lógicos básicos
    if (!/^[\d\s<>=!&|().truefals]+$/.test(sanitized)) {
      this.logger.warn(`Expresión rechazada por seguridad: ${expression}`);
      return false;
    }

    try {
      // eslint-disable-next-line no-new-func
      return Boolean(new Function(`return (${sanitized})`)());
    } catch {
      return false;
    }
  }

  private buildMutation(
    action: { type: PolicyActionType; params: Record<string, number | string> },
    meta: ObjectMetadata,
  ): PolicyMutation {
    switch (action.type) {
      case 'REVALUE': {
        const multiplier = (action.params.multiplier as number) ?? 1;
        const bonus = (action.params.baseBonus as number) ?? 0;
        const newPoints = Math.round(meta.baseValue * multiplier + bonus);
        return { type: 'REVALUE', newPoints, reason: `Multiplier ${multiplier}x + bonus ${bonus}` };
      }
      case 'TRANSFORM':
        return {
          type: 'TRANSFORM',
          newTemplate: action.params.targetTemplateId as string,
          reason: `Transform to ${action.params.targetTemplateId}`,
        };
      case 'BURN':
        return { type: 'BURN', newPoints: meta.baseValue, reason: 'Burn for base points' };
      default:
        return { type: action.type, reason: 'Policy action applied' };
    }
  }

  async createPolicy(data: {
    policyId: string;
    version: string;
    description: string;
    targetType: string;
    rules: Record<string, unknown>[];
  }): Promise<PolicyEntity> {
    const entity = this.policyRepo.create({ ...data, isActive: true });
    return this.policyRepo.save(entity);
  }

  async getPolicies(page = 1, limit = 20) {
    const [data, total] = await this.policyRepo.findAndCount({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }
}
