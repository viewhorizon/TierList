// ============================================================
// apps/web-client/src/pages/AdminPage.tsx
// Panel de Administración — SVP Dispatcher + Policy Engine + Debates
// ============================================================
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { svpApi, debatesApi, policiesApi } from '../services/api.service';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'dispatcher' | 'debates' | 'policy'>('dispatcher');
  const qc = useQueryClient();

  const { data: metrics } = useQuery({
    queryKey: ['svp-metrics'],
    queryFn: svpApi.getMetrics,
    refetchInterval: 15_000,
  });

  const { data: transactions } = useQuery({
    queryKey: ['svp-transactions'],
    queryFn: () => svpApi.getTransactions({ limit: 20 }),
    refetchInterval: 30_000,
  });

  const { data: debates } = useQuery({
    queryKey: ['debates-admin'],
    queryFn: () => debatesApi.getAll({ limit: 20 }),
  });

  const { data: policies } = useQuery({
    queryKey: ['policies'],
    queryFn: () => policiesApi.getAll(),
  });

  const retryMutation = useMutation({
    mutationFn: svpApi.retry,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['svp-transactions'] }),
  });

  const closeMutation = useMutation({
    mutationFn: (id: string) => debatesApi.close(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['debates-admin'] }),
  });

  const MOCK_METRICS = { pending: 42, sent: 1248, failed: 3, acknowledged: 1198, critical: 0 };
  const m = metrics ?? MOCK_METRICS;

  const MOCK_TXS = [
    { id: 'tx1', eventId: 'evt-0x4F...E2', status: 'SENT', retryCount: 0, payload: { metadata: { calculatedPoints: 6000 } }, createdAt: new Date().toISOString() },
    { id: 'tx2', eventId: 'evt-0x8A...99', status: 'FAILED', retryCount: 2, lastError: 'SVP timeout 10s', payload: { metadata: { calculatedPoints: 1500 } }, createdAt: new Date().toISOString() },
    { id: 'tx3', eventId: 'evt-0x22...C1', status: 'PENDING', retryCount: 0, payload: { metadata: { calculatedPoints: 3200 } }, createdAt: new Date().toISOString() },
    { id: 'tx4', eventId: 'evt-0xEF...34', status: 'ACKNOWLEDGED', retryCount: 0, payload: { metadata: { calculatedPoints: 800 } }, createdAt: new Date().toISOString() },
  ];

  const txList = transactions?.data ?? MOCK_TXS;

  const MOCK_DEBATES_ADMIN = [
    { id: 'd-sl-982', title: 'Global Carbon Tax Allocation Framework', status: 'OPEN', scope: 'GLOBAL', participantCount: 1240 },
    { id: 'd-sl-441', title: 'Mars Settlement Jurisdiction Protocol', status: 'CALC_POINTS', scope: 'GLOBAL', participantCount: 890 },
    { id: 'd-sl-009', title: 'Universal Basic Income Distribution', status: 'OPEN', scope: 'GLOBAL', participantCount: 5600 },
  ];

  const debateList = debates?.data ?? MOCK_DEBATES_ADMIN;

  const STATUS_CFG: Record<string, { color: string; bg: string; label: string }> = {
    PENDING:        { color: 'text-tertiary',      bg: 'bg-tertiary/10',      label: 'Pendiente' },
    SENT:           { color: 'text-secondary',     bg: 'bg-secondary/10',     label: 'Enviado' },
    FAILED:         { color: 'text-red-400',       bg: 'bg-red-400/10',       label: 'Fallido' },
    ACKNOWLEDGED:   { color: 'text-primary',       bg: 'bg-primary/10',       label: 'Confirmado' },
    CRITICAL_FAILURE:{ color: 'text-red-500',      bg: 'bg-red-500/20',       label: 'Crítico' },
    OPEN:           { color: 'text-secondary',     bg: 'bg-secondary/10',     label: 'Abierto' },
    CALC_POINTS:    { color: 'text-tertiary',      bg: 'bg-tertiary/10',      label: 'Calculando' },
    FINALIZED:      { color: 'text-on-surface/40', bg: 'bg-on-surface/5',     label: 'Finalizado' },
    DRAFT:          { color: 'text-on-surface/40', bg: 'bg-on-surface/5',     label: 'Borrador' },
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-primary/80 font-headline mb-2">
          Institutional Admin Hub
        </p>
        <h1 className="font-headline font-bold text-3xl text-on-surface" style={{ letterSpacing: '-0.02em' }}>
          Panel de Administración
        </h1>
      </div>

      {/* SVP Status strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        {[
          { label: 'Pendientes', val: m.pending, color: 'text-tertiary' },
          { label: 'Enviados', val: m.sent, color: 'text-secondary' },
          { label: 'Fallidos', val: m.failed, color: 'text-red-400' },
          { label: 'Confirmados', val: m.acknowledged, color: 'text-primary' },
          { label: 'Críticos', val: m.critical, color: 'text-red-500' },
        ].map((s) => (
          <div key={s.label} className="bg-surface-container rounded-xl p-3 text-center">
            <p className={`font-headline font-bold text-2xl ${s.color}`}>{s.val}</p>
            <p className="text-xs text-on-surface/40 font-headline mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-surface-container p-1 rounded-xl w-fit">
        {(['dispatcher', 'debates', 'policy'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-bold font-headline transition-all capitalize ${
              activeTab === tab ? 'bg-primary text-white' : 'text-on-surface/60 hover:text-on-surface'
            }`}>
            {tab === 'dispatcher' ? 'SVP Dispatcher' : tab === 'debates' ? 'Debates' : 'Policy Engine'}
          </button>
        ))}
      </div>

      {/* ── Tab: SVP Dispatcher ── */}
      {activeTab === 'dispatcher' && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span className="text-xs font-bold text-secondary font-headline uppercase tracking-wide">
              Dispatcher Operacional · 14ms latencia
            </span>
          </div>
          <div className="space-y-2">
            {txList.map((tx: any) => {
              const cfg = STATUS_CFG[tx.status] ?? STATUS_CFG.PENDING;
              return (
                <div key={tx.id} className="flex items-center gap-4 bg-surface-container rounded-xl p-4">
                  <span className={`text-xs font-bold px-2 py-1 rounded font-headline ${cfg.color} ${cfg.bg} shrink-0`}>
                    {cfg.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-on-surface/60 truncate">{tx.eventId}</p>
                    <p className="text-xs text-on-surface/40">
                      {tx.payload?.metadata?.calculatedPoints?.toLocaleString() ?? '—'} pts · Intento {tx.retryCount}
                    </p>
                  </div>
                  {tx.lastError && (
                    <span className="text-xs text-red-400 truncate max-w-xs hidden md:block">{tx.lastError}</span>
                  )}
                  {tx.status === 'FAILED' && (
                    <button onClick={() => retryMutation.mutate(tx.id)}
                      className="shrink-0 flex items-center gap-1 text-xs bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-lg font-headline font-bold transition-all">
                      <span className="material-symbols-outlined text-sm">refresh</span>
                      Reintentar
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Tab: Debates ── */}
      {activeTab === 'debates' && (
        <div className="space-y-2">
          {debateList.map((d: any) => {
            const cfg = STATUS_CFG[d.status] ?? STATUS_CFG.DRAFT;
            return (
              <div key={d.id} className="flex items-center gap-4 bg-surface-container rounded-xl p-4">
                <span className={`text-xs font-bold px-2 py-1 rounded font-headline shrink-0 ${cfg.color} ${cfg.bg}`}>
                  {cfg.label}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-on-surface font-headline truncate">{d.title}</p>
                  <p className="text-xs text-on-surface/40">
                    {(d.participantCount || 0).toLocaleString()} participantes · {d.scope}
                  </p>
                </div>
                {d.status === 'OPEN' && (
                  <button onClick={() => closeMutation.mutate(d.id)}
                    disabled={closeMutation.isPending}
                    className="shrink-0 flex items-center gap-1 text-xs bg-tertiary/10 text-tertiary hover:bg-tertiary/20 px-3 py-1.5 rounded-lg font-headline font-bold transition-all disabled:opacity-50">
                    <span className="material-symbols-outlined text-sm">lock</span>
                    Cerrar & Calcular
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Tab: Policy Engine ── */}
      {activeTab === 'policy' && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-secondary text-sm">security</span>
            <span className="text-xs font-bold text-secondary font-headline uppercase tracking-wide">
              Policy Engine v2.4.8-Stable · Activo
            </span>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                policyId: 'pol_news_expert_2026',
                description: 'Revalorización para categoría noticias nivel experto',
                targetType: 'news_token_v1',
                version: '1.2.0',
                rules: [
                  { condition: 'activity_hours > 10 && total_votes > 5000', action: 'REVALUE ×1.5 +1000pts' },
                  { condition: 'is_global_winner == true', action: 'TRANSFORM → news_legendary_v1' },
                ],
              },
              {
                policyId: 'pol_tech_debate_2026',
                description: 'Reglas para debates de tecnología',
                targetType: 'tech_badge_v1',
                version: '2.0.1',
                rules: [
                  { condition: 'activity_hours > 5', action: 'REVALUE ×1.25 +500pts' },
                  { condition: 'total_votes > 10000', action: 'TRANSFORM → tech_legendary_v2' },
                ],
              },
            ].map((p) => (
              <div key={p.policyId} className="bg-surface-container rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded font-headline">
                    {p.version}
                  </span>
                  <span className="text-xs text-secondary font-headline">● Activa</span>
                </div>
                <h3 className="font-headline font-bold text-on-surface text-sm mb-1">{p.policyId}</h3>
                <p className="text-xs text-on-surface/50 mb-3">{p.description}</p>
                <p className="text-xs text-on-surface/30 font-headline mb-2">Target: {p.targetType}</p>
                <div className="space-y-2">
                  {p.rules.map((r, i) => (
                    <div key={i} className="bg-surface-container-high rounded-lg p-2">
                      <p className="text-xs font-mono text-tertiary mb-1">{r.condition}</p>
                      <p className="text-xs text-secondary font-headline">→ {r.action}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
