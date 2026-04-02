// ============================================================
// apps/web-client/src/services/api.service.ts
// Capa de servicio — Cliente HTTP tipado para el backend
// ============================================================

import type {
  Debate, DebateItem, Vote, InventoryObject,
  InventoryLedgerEntry, SvpTransaction, AuditLog,
  Policy, PaginatedResponse, ApiResponse, DispatcherMetrics,
} from '../../../libs/common/src/types';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

class ApiError extends Error {
  constructor(public code: string, message: string, public status: number) {
    super(message);
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new ApiError(
      json.error?.code ?? 'API_ERROR',
      json.error?.message ?? 'Error desconocido',
      res.status,
    );
  }
  return json.data as T;
}

// ── Debates ──────────────────────────────────────────────────

export const debatesApi = {
  getAll: (params?: { page?: number; limit?: number; status?: string; scope?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<PaginatedResponse<Debate>>(`/v1/debates?${qs}`);
  },
  getOne: (id: string) => request<Debate>(`/v1/debates/${id}`),
  getRanking: (id: string) => request<DebateItem[]>(`/v1/debates/${id}/ranking`),
  create: (data: Partial<Debate> & { items: Partial<DebateItem>[] }) =>
    request<Debate>('/v1/debates', { method: 'POST', body: JSON.stringify(data) }),
  open: (id: string) =>
    request<Debate>(`/v1/debates/${id}/open`, { method: 'PATCH' }),
  close: (id: string) =>
    request<{ id: string; status: string; totalVotes: number; calculatedPoints: number; eventId: string }>(
      `/v1/debates/${id}/close`, { method: 'POST' }
    ),
};

// ── Votes ────────────────────────────────────────────────────

export const votesApi = {
  cast: (debateId: string, data: { userId: string; itemId: string; comment?: string; durationSeconds?: number }) =>
    request<Vote>(`/v1/debates/${debateId}/vote`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'X-Idempotency-Key': crypto.randomUUID() },
    }),
  getUserVotes: (userId: string, params?: { page?: number }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<PaginatedResponse<Vote>>(`/v1/votes/user/${userId}?${qs}`);
  },
};

// ── Inventory ────────────────────────────────────────────────

export const inventoryApi = {
  getByUser: (userId: string, params?: { page?: number; limit?: number }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<PaginatedResponse<InventoryObject>>(`/v1/inventory/${userId}?${qs}`);
  },
  getLedger: (objectId: string) =>
    request<InventoryLedgerEntry[]>(`/v1/inventory/object/${objectId}/ledger`),
  verifyIntegrity: (objectId: string) =>
    request<{ valid: boolean; brokenAt?: string }>(`/v1/inventory/object/${objectId}/verify`),
  grant: (data: { userId: string; achievementId: string; objectTemplateId: string; initialValue: number }) =>
    request<InventoryObject>('/v1/inventory/grant', { method: 'POST', body: JSON.stringify(data) }),
};

// ── SVP Dispatcher ────────────────────────────────────────────

export const svpApi = {
  getTransactions: (params?: { page?: number; limit?: number; status?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<PaginatedResponse<SvpTransaction>>(`/v1/dispatcher/transactions?${qs}`);
  },
  getMetrics: () => request<DispatcherMetrics>('/v1/dispatcher/metrics'),
  retry: (id: string) => request<{ id: string; status: string }>(`/v1/dispatcher/retry/${id}`, { method: 'POST' }),
};

// ── Audit ────────────────────────────────────────────────────

export const auditApi = {
  getLogs: (params?: { page?: number; limit?: number; entityName?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<PaginatedResponse<AuditLog>>(`/v1/audit/logs?${qs}`);
  },
};

// ── Policies ─────────────────────────────────────────────────

export const policiesApi = {
  getAll: (params?: { page?: number }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<PaginatedResponse<Policy>>(`/v1/policies?${qs}`);
  },
  create: (data: Partial<Policy>) =>
    request<Policy>('/v1/policies', { method: 'POST', body: JSON.stringify(data) }),
  revalue: (data: {
    policyId: string;
    context: { activityHours: number; votesLocales: number; votesGlobales: number; isGlobalWinner: boolean };
    objectMetadata: { currentLevel: number; baseValue: number };
  }) => request('/v1/engine/revalue', { method: 'POST', body: JSON.stringify(data) }),
};

export { ApiError };
