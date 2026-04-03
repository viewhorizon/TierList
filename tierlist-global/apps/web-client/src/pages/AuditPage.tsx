// src/pages/AuditPage.tsx
// Panel de Auditoría — Ledger encadenado + verificación de integridad HMAC

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditApi, inventoryApi } from '../services/api';
import { LedgerHash, PageHeader, StateWrapper } from '../components/ui';
import type { AuditLog } from '../types';

const ACTION_CFG: Record<string, { icon: string; color: string }> = {
  GRANT:            { icon: 'add_circle',              color: 'text-secondary' },
  REVALUE:          { icon: 'trending_up',             color: 'text-primary' },
  TRANSFORM:        { icon: 'auto_awesome',            color: 'text-tertiary' },
  BURN:             { icon: 'local_fire_department',   color: 'text-red-400' },
  CLOSE_CALCULATE:  { icon: 'calculate',               color: 'text-tertiary' },
  OPEN:             { icon: 'lock_open',               color: 'text-secondary' },
  VALIDATED:        { icon: 'verified',                color: 'text-primary' },
  SENT:             { icon: 'send',                    color: 'text-secondary' },
  VOTE_COMMIT:      { icon: 'how_to_vote',             color: 'text-primary' },
  REWARD_DIST:      { icon: 'workspace_premium',       color: 'text-tertiary' },
};

const MOCK_LOGS: AuditLog[] = [
  { id: 'al1', entityName: 'debates', entityId: 'd-sl-982', action: 'CLOSE_CALCULATE', userId: 'admin-01', signature: 'a3f8...b92c', createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: 'al2', entityName: 'inventory_objects', entityId: 'o1', action: 'GRANT', userId: 'system', signature: 'd7e1...4f8a', createdAt: new Date(Date.now() - 14400000).toISOString() },
  { id: 'al3', entityName: 'votes', entityId: 'v-881', action: 'VALIDATED', userId: 'user-42', signature: 'c2b9...77d3', createdAt: new Date(Date.now() - 21600000).toISOString() },
  { id: 'al4', entityName: 'svp_transactions', entityId: 'tx-001', action: 'SENT', userId: 'dispatcher', signature: 'f1a4...e6b8', createdAt: new Date(Date.now() - 28800000).toISOString() },
  { id: 'al5', entityName: 'debates', entityId: 'd-sl-441', action: 'OPEN', userId: 'admin-01', signature: '9c3d...2a17', createdAt: new Date(Date.now() - 36000000).toISOString() },
  { id: 'al6', entityName: 'inventory_objects', entityId: 'o2', action: 'REVALUE', userId: 'policy-engine', signature: 'b8f2...c34a', createdAt: new Date(Date.now() - 43200000).toISOString() },
];

export default function AuditPage() {
  const [verifyId, setVerifyId] = useState('');
  const [verifyResult, setVerifyResult] = useState<{ valid: boolean; brokenAt?: string } | null>(null);
  const [verifying, setVerifying] = useState(false);

  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => auditApi.getLogs({ limit: 30 }),
    refetchInterval: 60_000,
    retry: 1,
  });

  const logList = logs?.data ?? MOCK_LOGS;

  async function handleVerify() {
    if (!verifyId.trim()) return;
    setVerifying(true);
    setVerifyResult(null);
    try {
      const result = await inventoryApi.verifyIntegrity(verifyId.trim());
      setVerifyResult(result);
    } catch {
      setVerifyResult({ valid: false, brokenAt: 'Error de conexión con el backend' });
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="min-h-full bg-surface">
      <div className="max-w-7xl mx-auto px-4 py-6 lg:px-8">
        <PageHeader eyebrow="Sovereign Ledger · Auditoría" title="Historial de Auditoría"
          subtitle="Trazabilidad inmutable de cada evento firmado criptográficamente." />

        <div className="grid lg:grid-cols-3 gap-6">

          {/* ── Audit trail chain ── */}
          <div className="lg:col-span-2">
            <p className="text-xs font-headline font-bold uppercase tracking-widest text-on-surface/30 mb-4">
              Audit Trail · Cadena de Eventos
            </p>
            <StateWrapper loading={isLoading} empty={logList.length === 0} emptyMessage="Sin entradas de auditoría.">
              <div className="space-y-0">
                {logList.map((log, idx) => {
                  const cfg = ACTION_CFG[log.action] ?? { icon: 'info', color: 'text-on-surface/40' };
                  const isLast = idx === logList.length - 1;
                  return (
                    <div key={log.id} className="flex gap-3">
                      {/* Chain visual */}
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-surface-container shrink-0 z-10`}>
                          <span className={`material-symbols-outlined text-sm ${cfg.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{cfg.icon}</span>
                        </div>
                        {!isLast && <div className="w-px flex-1 bg-outline-variant/20 my-0.5 min-h-[16px]" />}
                      </div>

                      {/* Content */}
                      <div className={`flex-1 bg-surface-container rounded-xl p-3.5 ${!isLast ? 'mb-1.5' : ''}`}>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className={`text-xs font-headline font-bold ${cfg.color}`}>{log.action}</span>
                          <span className="text-xs text-on-surface/30 font-headline shrink-0">
                            {new Date(log.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface/50">
                          <span className="text-on-surface/30">Entidad:</span>{' '}
                          <span className="font-mono">{log.entityName}</span>{' '}
                          <span className="text-on-surface/20">·</span>{' '}
                          <span className="font-mono">{log.entityId.slice(0, 14)}...</span>
                        </p>
                        <p className="text-xs text-on-surface/30 mt-0.5">
                          <span className="font-mono">sig: {log.signature}</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </StateWrapper>
          </div>

          {/* ── Right panel ── */}
          <div className="space-y-4">

            {/* Integrity verifier */}
            <div className="bg-surface-container rounded-xl p-5 border border-outline-variant/10">
              <h3 className="font-headline font-bold text-on-surface text-sm mb-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-primary">shield</span>
                Verificar Integridad
              </h3>
              <p className="text-xs text-on-surface/50 mb-4 leading-relaxed">
                Verifica la cadena HMAC del ledger de un objeto. Detecta si alguna entrada fue alterada post-inserción.
              </p>
              <label className="sr-only" htmlFor="object-id-input">Object ID para verificar</label>
              <input
                id="object-id-input"
                type="text"
                value={verifyId}
                onChange={(e) => setVerifyId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                placeholder="Object ID (UUID)"
                className="w-full bg-surface-container-high text-on-surface text-xs font-mono rounded-lg px-3 py-2.5 mb-3 outline-none border border-transparent focus:border-primary/40 placeholder-on-surface/25 transition-colors"
              />
              <button onClick={handleVerify} disabled={verifying || !verifyId.trim()}
                className="w-full flex items-center justify-center gap-2 bg-primary/10 text-primary hover:bg-primary/20 font-headline font-bold text-xs py-2.5 rounded-lg transition-all disabled:opacity-40">
                {verifying
                  ? <><span className="material-symbols-outlined text-sm animate-spin">sync</span>Verificando...</>
                  : <><span className="material-symbols-outlined text-sm">verified_user</span>Verificar Cadena</>
                }
              </button>
              {verifyResult && (
                <div className={`mt-3 p-3 rounded-lg text-xs font-headline font-bold text-center ${
                  verifyResult.valid
                    ? 'bg-secondary/10 text-secondary border border-secondary/20'
                    : 'bg-red-400/10 text-red-400 border border-red-400/20'
                }`}>
                  {verifyResult.valid
                    ? '✓ Cadena íntegra · Todas las firmas válidas'
                    : `✗ Integridad rota · Entrada: ${verifyResult.brokenAt}`
                  }
                </div>
              )}
            </div>

            {/* Ledger sample */}
            <div className="bg-surface-container rounded-xl p-5 border border-outline-variant/10">
              <h3 className="font-headline font-bold text-on-surface text-sm mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-on-surface/40">link</span>
                Ledger Encadenado · Objeto #o1
              </h3>
              <div className="space-y-2">
                {[
                  { id: 'le1', action: 'GRANT',   delta: '+5,000', prev: '0000...0000', sig: 'a3f8...b92c' },
                  { id: 'le2', action: 'REVALUE',  delta: '+2,500', prev: 'a3f8b92c...', sig: 'd7e1...4f8a' },
                  { id: 'le3', action: 'REVALUE',  delta: '+5,000', prev: 'd7e14f8a...', sig: 'c2b9...77d3' },
                ].map((entry, i) => {
                  const c = ACTION_CFG[entry.action] ?? { icon: 'info', color: 'text-on-surface/40' };
                  return (
                    <div key={entry.id} className="bg-surface-container-high rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-xs font-headline font-bold flex items-center gap-1 ${c.color}`}>
                          <span className="material-symbols-outlined text-xs">{c.icon}</span>
                          {entry.action}
                        </span>
                        <span className="text-xs font-headline font-bold text-secondary">{entry.delta} pts</span>
                      </div>
                      <p className="text-xs font-mono text-on-surface/25 truncate">prev: {i === 0 ? '0000...0000' : entry.prev}</p>
                      <p className="text-xs font-mono text-on-surface/25 truncate">sig: {entry.sig}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stats */}
            <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/10">
              <div className="space-y-2">
                {[
                  { label: 'Entradas totales', value: logList.length.toString() },
                  { label: 'Audit latency', value: '4ms' },
                  { label: 'Protocolo', value: 'HMAC-SHA256' },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between">
                    <span className="text-xs text-on-surface/40 font-headline">{s.label}</span>
                    <span className="text-xs font-headline font-bold text-on-surface">{s.value}</span>
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
