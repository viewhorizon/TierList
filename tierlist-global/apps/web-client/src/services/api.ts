// src/services/api.ts
// Cliente HTTP tipado — manejo de errores por código, auth Bearer, x-tenant-id

import type {
  Debate, DebateItem, Vote, InventoryObject, LedgerEntry,
  SvpTransaction, DispatcherMetrics, AuditLog, Policy,
  ApiResponse, PaginatedResponse, HttpError,
} from '../types';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

class ApiError extends Error {
  constructor(public code: string, message: string, public status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions extends RequestInit {
  token?: string | null;
  tenantId?: string | null;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { token, tenantId, ...fetchOpts } = opts;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOpts.headers as Record<string, string>),
  };
  if (token)    headers['Authorization'] = `Bearer ${token}`;
  if (tenantId) headers['x-tenant-id']   = tenantId;

  const res = await fetch(`${BASE}${path}`, { ...fetchOpts, headers });
  const json = await res.json().catch(() => ({}));

  if (!res.ok || !json.success) {
    const err: HttpError = {
      code: json.error?.code ?? statusToCode(res.status),
      message: json.error?.message ?? statusToMessage(res.status),
      status: res.status,
    };
    throw new ApiError(err.code, err.message, err.status);
  }

  return json.data as T;
}

function statusToCode(status: number): string {
  const map: Record<number, string> = {
    401: 'UNAUTHORIZED', 403: 'FORBIDDEN', 404: 'NOT_FOUND',
    409: 'CONFLICT', 429: 'RATE_LIMITED', 500: 'INTERNAL_ERROR',
  };
  return map[status] ?? 'API_ERROR';
}

function statusToMessage(status: number): string {
  const map: Record<number, string> = {
    401: 'No autenticado. Iniciá sesión.',
    403: 'Sin permisos para esta acción.',
    404: 'Recurso no encontrado.',
    409: 'Conflicto: el recurso ya existe.',
    429: 'Demasiadas solicitudes. Intentá en un momento.',
    500: 'Error interno del servidor.',
  };
  return map[status] ?? 'Error desconocido.';
}

// ── Debates ──────────────────────────────────────────────────
export const debatesApi = {
  getAll: (p?: { page?: number; limit?: number; status?: string; scope?: string }, token?: string | null) => {
    const qs = new URLSearchParams(Object.entries(p ?? {}).map(([k, v]) => [k, String(v)])).toString();
    return request<PaginatedResponse<Debate>>(`/v1/debates?${qs}`, { token });
  },
  getOne: (id: string, token?: string | null) =>
    request<Debate>(`/v1/debates/${id}`, { token }),
  getRanking: (id: string, token?: string | null) =>
    request<DebateItem[]>(`/v1/debates/${id}/ranking`, { token }),
  create: (data: Partial<Debate> & { items: Partial<DebateItem>[] }, token?: string | null) =>
    request<Debate>('/v1/debates', { method: 'POST', body: JSON.stringify(data), token }),
  open: (id: string, token?: string | null) =>
    request<Debate>(`/v1/debates/${id}/open`, { method: 'PATCH', token }),
  close: (id: string, token?: string | null) =>
    request<{ id: string; status: string; totalVotes: number; calculatedPoints: number; eventId: string }>(
      `/v1/debates/${id}/close`, { method: 'POST', token }
    ),
};

// ── Votes ────────────────────────────────────────────────────
export const votesApi = {
  cast: (debateId: string, data: { userId: string; itemId: string; comment?: string; durationSeconds?: number }, token?: string | null) =>
    request<Vote>(`/v1/debates/${debateId}/vote`, {
      method: 'POST',
      body: JSON.stringify(data),
      token,
      headers: { 'X-Idempotency-Key': crypto.randomUUID() },
    }),
  getUserVotes: (userId: string, p?: { page?: number }, token?: string | null) => {
    const qs = new URLSearchParams(Object.entries(p ?? {}).map(([k, v]) => [k, String(v)])).toString();
    return request<PaginatedResponse<Vote>>(`/v1/votes/user/${userId}?${qs}`, { token });
  },
};

// ── Inventory ────────────────────────────────────────────────
export const inventoryApi = {
  getByUser: (userId: string, p?: { page?: number; limit?: number }, token?: string | null) => {
    const qs = new URLSearchParams(Object.entries(p ?? {}).map(([k, v]) => [k, String(v)])).toString();
    return request<PaginatedResponse<InventoryObject>>(`/v1/inventory/${userId}?${qs}`, { token });
  },
  getLedger: (objectId: string, token?: string | null) =>
    request<LedgerEntry[]>(`/v1/inventory/object/${objectId}/ledger`, { token }),
  verifyIntegrity: (objectId: string, token?: string | null) =>
    request<{ valid: boolean; brokenAt?: string }>(`/v1/inventory/object/${objectId}/verify`, { token }),
  grant: (data: { userId: string; achievementId: string; objectTemplateId: string; initialValue: number }, token?: string | null) =>
    request<InventoryObject>('/v1/inventory/grant', { method: 'POST', body: JSON.stringify(data), token }),
};

// ── SVP Dispatcher ────────────────────────────────────────────
export const svpApi = {
  getTransactions: (p?: { page?: number; limit?: number; status?: string }, token?: string | null) => {
    const qs = new URLSearchParams(Object.entries(p ?? {}).map(([k, v]) => [k, String(v)])).toString();
    return request<PaginatedResponse<SvpTransaction>>(`/v1/dispatcher/transactions?${qs}`, { token });
  },
  getMetrics: (token?: string | null) =>
    request<DispatcherMetrics>('/v1/dispatcher/metrics', { token }),
  retry: (id: string, token?: string | null) =>
    request<{ id: string; status: string }>(`/v1/dispatcher/retry/${id}`, { method: 'POST', token }),
};

// ── Audit ────────────────────────────────────────────────────
export const auditApi = {
  getLogs: (p?: { page?: number; limit?: number; entityName?: string }, token?: string | null) => {
    const qs = new URLSearchParams(Object.entries(p ?? {}).map(([k, v]) => [k, String(v)])).toString();
    return request<PaginatedResponse<AuditLog>>(`/v1/audit/logs?${qs}`, { token });
  },
};

// ── Policies ─────────────────────────────────────────────────
export const policiesApi = {
  getAll: (p?: { page?: number }, token?: string | null) => {
    const qs = new URLSearchParams(Object.entries(p ?? {}).map(([k, v]) => [k, String(v)])).toString();
    return request<PaginatedResponse<Policy>>(`/v1/policies?${qs}`, { token });
  },
};

export { ApiError };
