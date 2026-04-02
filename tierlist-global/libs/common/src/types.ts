// ============================================================
// libs/common/src/types.ts
// Tipos de dominio compartidos entre frontend y backend
// ============================================================

// ── Enums ────────────────────────────────────────────────────

export enum UserRole {
  USER = 'USER',
  AUDITOR = 'AUDITOR',
  ADMIN = 'ADMIN',
  POLICY_OPERATOR = 'POLICY_OPERATOR',
}

export enum DebateStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  CALC_POINTS = 'CALC_POINTS',
  FINALIZED = 'FINALIZED',
}

export enum DebateScope {
  LOCAL = 'LOCAL',
  GLOBAL = 'GLOBAL',
}

export enum TierLevel {
  S = 'S',
  A = 'A',
  B = 'B',
  C = 'C',
}

export enum SvpEventStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  CRITICAL_FAILURE = 'CRITICAL_FAILURE',
}

export enum ObjectStatus {
  ACTIVE = 'ACTIVE',
  TRANSFORMED = 'TRANSFORMED',
  BURNED = 'BURNED',
  TRANSFERRED = 'TRANSFERRED',
}

export enum InventoryAction {
  GRANT = 'GRANT',
  REVALUE = 'REVALUE',
  TRANSFORM = 'TRANSFORM',
  BURN = 'BURN',
  TRANSFER = 'TRANSFER',
}

export enum PolicyActionType {
  REVALUE = 'REVALUE',
  TRANSFORM = 'TRANSFORM',
  BURN = 'BURN',
  BADGE = 'BADGE',
}

// ── Entidades de dominio ─────────────────────────────────────

export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  svpPoints: number;
  level: number;
  createdAt: Date;
}

export interface Debate {
  id: string;
  title: string;
  description: string;
  category: string;
  scope: DebateScope;
  status: DebateStatus;
  startDate: Date;
  endDate: Date;
  totalVotes: number;
  participantCount: number;
  configRules: Record<string, unknown>;
  createdBy: string;
  createdAt: Date;
}

export interface DebateItem {
  id: string;
  debateId: string;
  name: string;
  description: string;
  imageUrl?: string;
  tier?: TierLevel;
  voteCount: number;
  consensusPercentage: number;
  isAudited: boolean;
  metadata: Record<string, unknown>;
}

export interface Vote {
  id: string;
  userId: string;
  itemId: string;
  debateId: string;
  scope: DebateScope;
  durationSeconds: number;
  comment?: string;
  createdAt: Date;
}

export interface InventoryObject {
  id: string;
  ownerId: string;
  templateId: string;
  name: string;
  description: string;
  imageUrl?: string;
  currentValue: number;
  isDynamic: boolean;
  status: ObjectStatus;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryLedgerEntry {
  id: string;
  objectId: string;
  transactionId: string;
  action: InventoryAction;
  pointsDelta: number;
  previousStateHash: string;
  currentStateSnapshot: Record<string, unknown>;
  auditSignature: string;
  createdAt: Date;
}

export interface SvpEvent {
  eventId: string;
  sourceApp: 'tierlist-global';
  sourceEnv: 'prod' | 'staging' | 'dev';
  userId: string;
  activityType: 'vote_result' | 'achievement_grant' | 'object_mutation';
  activityId: string;
  score: number;
  unit: 'liveops_points';
  metadata: SvpEventMetadata;
  occurredAt: string;
}

export interface SvpEventMetadata {
  rank?: number;
  votesLocales: number;
  votesGlobales: number;
  votosTotales: number;
  horasActividad: number;
  calculatedPoints: number;
  category: string;
  isGlobalAchievement: boolean;
}

export interface PolicyRule {
  id: string;
  condition: string;
  action: PolicyActionType;
  multiplier?: number;
  basePoints?: number;
  targetTemplateId?: string;
}

export interface Policy {
  policyId: string;
  version: string;
  description: string;
  targetType: string;
  rules: PolicyRule[];
  isActive: boolean;
}

export interface AuditLog {
  id: string;
  entityName: string;
  entityId: string;
  action: string;
  userId: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  signature: string;
  createdAt: Date;
}

// ── DTOs compartidos ─────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

// ── SVP Dispatcher ───────────────────────────────────────────

export interface SvpTransaction {
  id: string;
  eventId: string;
  payload: SvpEvent;
  status: SvpEventStatus;
  retryCount: number;
  lastError?: string;
  signature: string;
  sentAt?: Date;
  acknowledgedAt?: Date;
  createdAt: Date;
}

export interface DispatcherMetrics {
  totalPending: number;
  totalSent: number;
  totalFailed: number;
  totalAcknowledged: number;
  avgLatencyMs: number;
  lastDispatchedAt?: Date;
}
