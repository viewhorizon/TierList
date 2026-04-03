// src/types/index.ts
// Contratos tipados alineados con backend PostgreSQL + API /v1

export type UserRole = 'USER' | 'AUDITOR' | 'ADMIN' | 'POLICY_OPERATOR';
export type DebateStatus = 'DRAFT' | 'OPEN' | 'CLOSED' | 'CALC_POINTS' | 'FINALIZED';
export type DebateScope = 'LOCAL' | 'GLOBAL';
export type TierLevel = 'S' | 'A' | 'B' | 'C';
export type SvpEventStatus = 'PENDING' | 'SENT' | 'FAILED' | 'ACKNOWLEDGED' | 'CRITICAL_FAILURE';
export type ObjectStatus = 'ACTIVE' | 'TRANSFORMED' | 'BURNED' | 'TRANSFERRED';
export type InventoryAction = 'GRANT' | 'REVALUE' | 'TRANSFORM' | 'BURN' | 'TRANSFER';

export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  svpPoints: number;
  level: number;
  status: string;
  createdAt: string;
}

export interface Debate {
  id: string;
  title: string;
  description: string;
  category: string;
  scope: DebateScope;
  status: DebateStatus;
  startDate: string;
  endDate: string;
  totalVotes?: number;
  participantCount?: number;
  configRules: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
  items?: DebateItem[];
}

export interface DebateItem {
  id: string;
  debateId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  tier?: TierLevel;
  voteCount: number;
  consensusPercentage: number;
  isAudited: boolean;
  metadata: Record<string, unknown>;
  rank?: number;
}

export interface Vote {
  id: string;
  userId: string;
  itemId: string;
  debateId: string;
  scope: DebateScope;
  durationSeconds: number;
  comment?: string;
  createdAt: string;
}

export interface InventoryObject {
  id: string;
  ownerId: string;
  templateId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  currentValue: number;
  isDynamic: boolean;
  status: ObjectStatus;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface LedgerEntry {
  id: string;
  objectId: string;
  transactionId: string;
  action: InventoryAction;
  pointsDelta: number;
  previousStateHash: string;
  currentStateSnapshot: Record<string, unknown>;
  auditSignature: string;
  createdAt: string;
}

export interface SvpTransaction {
  id: string;
  eventId: string;
  payload: Record<string, unknown>;
  status: SvpEventStatus;
  retryCount: number;
  lastError?: string;
  signature: string;
  sentAt?: string;
  acknowledgedAt?: string;
  createdAt: string;
}

export interface DispatcherMetrics {
  pending: number;
  sent: number;
  failed: number;
  acknowledged: number;
  critical: number;
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
  createdAt: string;
}

export interface Policy {
  id: string;
  policyId: string;
  version: string;
  description: string;
  targetType: string;
  rules: PolicyRule[];
  isActive: boolean;
  createdAt: string;
}

export interface PolicyRule {
  id: string;
  condition: string;
  action: { type: string; params: Record<string, unknown> };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
  requestId?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface HttpError {
  code: string;
  message: string;
  status: number;
}
