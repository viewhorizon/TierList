// src/pages/AdminPage.tsx
// Fiel a: panel_de_administración screenshot

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { svpApi, debatesApi } from '../services/api';
import { AuditChip, LiveIndicator, LedgerHash } from '../components/ui';

const LEDGER_ENTRIES = [
  { hash: '0x4F...E2', action: 'VOTE_COMMIT',  delta: '+25',    status: 'AUDITED',    color: 'text-secondary' },
  { hash: '0x8A...99', action: 'REWARD_DIST',  delta: '+1,500', status: 'VERIFYING',  color: 'text-tertiary' },
  { hash: '0x22...C1', action: 'SLASH_PENALTY',delta: '-450',   status: 'AUDITED',    color: 'text-red-400' },
  { hash: '0xEF...34', action: 'BADGE_CLAIM',  delta: '+100',   status: 'AUDITED',    color: 'text-secondary' },
];

const FAILED_LOGS = [
  { level: 'Critical', label: 'Timeout', time: '12:44:09', event: 'SVP_STATE_COMMIT_FAILURE', trace: 'e773-44b2-a912-ledger-fail' },
  { level: 'Identity', label: 'Mismatch', time: '12:40:12', event: 'AUTH_NODE_VERIFICATION_REJECT', trace: 'node-99-validator-denied' },
];

const MOCK_DEBATES_ADMIN = [
  { id: '#SL-982-AX', title: 'Global Carbon Tax Allocation Framework', origin: 'World Finance Node', participants: 1240, status: 'Pending Calc' },
  { id: '#SL-441-TQ', title: 'Mars Settlement Jurisdiction Protocol',    origin: 'Aero-Space Authority', participants: 890, status: 'Active' },
  { id: '#SL-009-BV', title: 'Universal Basic Income Distribution Threshold', origin: 'Social Equity Council', participants: 5600, status: 'Pending Calc' },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'debates' | 'logs'>('dashboard');
  const qc = useQueryClient();

  const { data: metrics } = useQuery({
    queryKey: ['svp-metrics'],
    queryFn: () => svpApi.getMetrics(),
    refetchInterval: 15_000,
    retry: 1,
  });
  const { data: transactions } = useQuery({
    queryKey: ['svp-txs-admin'],
    queryFn: () => svpApi.getTransactions({ limit: 10 }),
    refetchInterval: 30_000,
    retry: 1,
  });

  const retryMutation = useMutation({
    mutationFn: svpApi.retry,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['svp-txs-admin'] }),
  });

  const m = metrics ?? { pending: 42, sent: 1248, failed: 3, acknowledged: 1198, critical: 0 };
  const txList = transactions?.data ?? [];

  return (
    <div className="min-h-full bg-surface">
      <div className="max-w-7xl mx-auto px-4 py-5 lg:px-8">

        {/* Header fiel al screenshot */}
        <div className="mb-6">
          <p className="text-xs font-headline font-bold uppercase tracking-widest text-on-surface/30 mb-1">Institutional Admin Hub</p>
          <h1 className="font-headline font-bold text-2xl text-on-surface mb-1" style={{ letterSpacing: '-0.02em' }}>Admin Control Panel</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
              <span className="text-xs font-headline font-bold text-secondary">SVP Dispatcher Operational · 14ms Latency</span>
            </div>
          </div>
        </div>

        {/* ── Stats strip ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Debates Activos', value: '1,248', icon: 'analytics', sub: '+12%', color: 'text-primary' },
            { label: 'Pending Calculation', value: String(m.pending), icon: 'hourglass_empty', sub: '', color: 'text-tertiary' },
            { label: 'Awaiting Audit', value: '156', icon: 'verified_user', sub: '', color: 'text-secondary' },
            { label: 'Policy Engine', value: 'v2.4.8', icon: 'security', sub: 'Stable', color: 'text-secondary' },
          ].map((s) => (
            <div key={s.label} className="bg-surface-container rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`material-symbols-outlined text-base ${s.color}`}>{s.icon}</span>
                <span className="text-xs text-on-surface/40 font-headline uppercase tracking-wide">{s.label}</span>
              </div>
              <p className={`font-headline font-bold text-xl ${s.color}`} style={{ letterSpacing: '-0.02em' }}>{s.value}</p>
              {s.sub && <p className="text-xs text-secondary font-headline">{s.sub}</p>}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-6">

          {/* ── Main panel ── */}
          <div className="space-y-5">

            {/* Tabs */}
            <div className="flex gap-1 bg-surface-container p-1 rounded-xl w-fit">
              {(['dashboard', 'debates', 'logs'] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-headline font-bold transition-all capitalize ${
                    activeTab === tab ? 'bg-primary text-white' : 'text-on-surface/50 hover:text-on-surface'
                  }`}>
                  {tab === 'dashboard' ? 'SVP Dispatcher' : tab === 'debates' ? 'Debates' : 'Logs'}
                </button>
              ))}
            </div>

            {/* SVP Dispatcher tab */}
            {activeTab === 'dashboard' && (
              <div className="space-y-2">
                <p className="text-xs font-headline font-bold uppercase tracking-widest text-on-surface/30 mb-2">
                  Debate Moderation Control · Live Ledger Sync
                </p>
                {MOCK_DEBATES_ADMIN.map((d) => (
                  <div key={d.id} className="flex items-center gap-3 bg-surface-container rounded-xl p-4 border border-outline-variant/10">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-mono text-on-surface/30">{d.id}</span>
                        <span className={`text-xs font-headline font-bold px-2 py-0.5 rounded ${
                          d.status === 'Pending Calc' ? 'text-tertiary bg-tertiary/10' : 'text-secondary bg-secondary/10'
                        }`}>{d.status}</span>
                      </div>
                      <p className="font-headline font-bold text-sm text-on-surface truncate">{d.title}</p>
                      <p className="text-xs text-on-surface/40">Initiated by {d.origin} · {d.participants.toLocaleString()} Participants</p>
                    </div>
                    {d.status === 'Pending Calc' && (
                      <button className="shrink-0 flex items-center gap-1.5 text-xs bg-surface-container-high hover:bg-primary/10 text-on-surface/60 hover:text-primary font-headline font-bold px-3 py-1.5 rounded-lg transition-all">
                        <span className="material-symbols-outlined text-sm">lock_open</span>
                        Close & Calculate
                      </button>
                    )}
                    {d.status === 'Active' && (
                      <button className="shrink-0 flex items-center gap-1.5 text-xs bg-tertiary/10 text-tertiary font-headline font-bold px-3 py-1.5 rounded-lg">
                        <span className="material-symbols-outlined text-sm">hourglass_empty</span>
                        In Progress
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Debates tab — SVP transactions */}
            {activeTab === 'debates' && (
              <div className="space-y-2">
                {(txList.length > 0 ? txList : [
                  { id: 't1', eventId: 'evt-0x4F...E2', status: 'SENT' as const, retryCount: 0, payload: { metadata: { calculatedPoints: 6000 } }, createdAt: new Date().toISOString(), signature: '', lastError: undefined },
                  { id: 't2', eventId: 'evt-0x8A...99', status: 'FAILED' as const, retryCount: 2, lastError: 'SVP timeout 10s', payload: { metadata: { calculatedPoints: 1500 } }, createdAt: new Date().toISOString(), signature: '' },
                  { id: 't3', eventId: 'evt-0x22...C1', status: 'PENDING' as const, retryCount: 0, payload: { metadata: { calculatedPoints: 3200 } }, createdAt: new Date().toISOString(), signature: '', lastError: undefined },
                ]).map((tx) => {
                  const cfg = {
                    PENDING:          { label: 'Pendiente',  color: 'text-tertiary bg-tertiary/10' },
                    SENT:             { label: 'Enviado',    color: 'text-secondary bg-secondary/10' },
                    FAILED:           { label: 'Fallido',    color: 'text-red-400 bg-red-400/10' },
                    ACKNOWLEDGED:     { label: 'Confirmado', color: 'text-primary bg-primary/10' },
                    CRITICAL_FAILURE: { label: 'Crítico',    color: 'text-red-500 bg-red-500/20' },
                  }[tx.status] ?? { label: tx.status, color: 'text-on-surface/40 bg-on-surface/5' };
                  return (
                    <div key={tx.id} className="flex items-center gap-3 bg-surface-container rounded-xl p-3 border border-outline-variant/10">
                      <span className={`text-xs font-headline font-bold px-2 py-0.5 rounded shrink-0 ${cfg.color}`}>{cfg.label}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono text-on-surface/50 truncate">{tx.eventId}</p>
                        <p className="text-xs text-on-surface/30">{tx.retryCount} reintentos{tx.lastError ? ` · ${tx.lastError}` : ''}</p>
                      </div>
                      {tx.status === 'FAILED' && (
                        <button onClick={() => retryMutation.mutate(tx.id)}
                          className="shrink-0 flex items-center gap-1 text-xs bg-primary/10 text-primary hover:bg-primary/20 px-2.5 py-1.5 rounded-lg font-headline font-bold transition-all">
                          <span className="material-symbols-outlined text-sm">refresh</span>
                          Reintentar
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Logs tab */}
            {activeTab === 'logs' && (
              <div className="space-y-2">
                <p className="text-xs font-headline font-bold text-red-400 uppercase tracking-widest mb-2">report Failed Event Logs</p>
                {FAILED_LOGS.map((log, i) => (
                  <div key={i} className="flex items-start gap-3 bg-red-400/5 border border-red-400/20 rounded-xl p-4">
                    <span className="material-symbols-outlined text-sm text-red-400 shrink-0">error</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-headline font-bold text-red-400">{log.level} {log.label}</span>
                        <span className="text-xs font-mono text-on-surface/30">{log.time}</span>
                      </div>
                      <p className="text-xs text-on-surface/50 font-mono">Event: {log.event}</p>
                      <p className="text-xs text-on-surface/30 font-mono">Trace: {log.trace}</p>
                    </div>
                    <button className="shrink-0 text-xs text-primary font-headline font-bold hover:opacity-80">
                      <span className="material-symbols-outlined text-sm">refresh</span>
                    </button>
                  </div>
                ))}
                <p className="text-xs text-on-surface/30 font-headline text-center py-2">End of High Priority Failures</p>
              </div>
            )}
          </div>

          {/* ── Right: Ledger + Policy ── */}
          <div className="space-y-4">

            {/* Recent Ledger Entries — fiel al screenshot */}
            <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/10">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-sm text-on-surface/40">list_alt</span>
                <p className="text-xs font-headline font-bold uppercase tracking-widest text-on-surface/30">Recent Ledger Entries</p>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-outline-variant/10">
                    {['Object ID', 'Action', 'Δ Points', 'Status'].map((h) => (
                      <th key={h} className="pb-2 text-left text-xs font-headline font-bold text-on-surface/20 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {LEDGER_ENTRIES.map((e) => (
                    <tr key={e.hash} className="border-b border-outline-variant/5">
                      <td className="py-2"><LedgerHash hash={e.hash} /></td>
                      <td className="py-2 text-xs font-mono text-on-surface/50">{e.action}</td>
                      <td className={`py-2 text-xs font-headline font-bold ${e.color}`}>{e.delta}</td>
                      <td className="py-2"><span className={`text-xs font-headline font-bold ${e.color}`}>{e.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Policy Engine — fiel al screenshot */}
            <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/10">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-sm text-secondary">security</span>
                <p className="text-xs font-headline font-bold text-secondary">Policy Engine v2.4.8-Stable</p>
              </div>
              <div className="space-y-2 text-xs font-headline">
                {[
                  { label: 'Consensus Logic', value: 'Optimized', color: 'text-secondary' },
                  { label: 'Node Validation', value: 'Active', color: 'text-secondary' },
                  { label: 'Error Threshold', value: '0.002%', color: 'text-tertiary' },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span className="text-on-surface/40">{row.label}</span>
                    <span className={`font-bold ${row.color}`}>{row.value}</span>
                  </div>
                ))}
              </div>
              <button className="w-full mt-3 text-xs font-headline font-bold text-on-surface/50 hover:text-on-surface bg-surface-container-high py-2 rounded-lg transition-colors">
                Check for Updates
              </button>
            </div>

            {/* SVP metrics */}
            <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/10">
              <p className="text-xs font-headline font-bold uppercase tracking-widest text-on-surface/30 mb-3">SVP Dispatcher Metrics</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Pending', value: m.pending, color: 'text-tertiary' },
                  { label: 'Sent', value: m.sent, color: 'text-secondary' },
                  { label: 'Failed', value: m.failed, color: 'text-red-400' },
                  { label: 'Acknowledged', value: m.acknowledged, color: 'text-primary' },
                ].map((s) => (
                  <div key={s.label} className="bg-surface-container-high rounded-lg p-2.5 text-center">
                    <p className={`font-headline font-bold text-lg ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-on-surface/30 font-headline">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
