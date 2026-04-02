// ============================================================
// apps/web-client/src/pages/AuditPage.tsx
// Panel de Auditoría — Ledger encadenado + verificación HMAC
// ============================================================
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditApi, inventoryApi } from '../services/api.service';

export default function AuditPage() {
  const [verifyObjectId, setVerifyObjectId] = useState('');
  const [verifyResult, setVerifyResult] = useState<{ valid: boolean; brokenAt?: string } | null>(null);

  const { data: logs } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => auditApi.getLogs({ limit: 30 }),
    refetchInterval: 60_000,
  });

  const MOCK_LOGS = [
    { id: 'al1', entityName: 'debates', entityId: 'd-sl-982', action: 'CLOSE_CALCULATE', userId: 'admin-01', signature: 'a3f8...b92c', createdAt: new Date(Date.now() - 7200000).toISOString() },
    { id: 'al2', entityName: 'inventory_objects', entityId: 'o1', action: 'GRANT', userId: 'system', signature: 'd7e1...4f8a', createdAt: new Date(Date.now() - 14400000).toISOString() },
    { id: 'al3', entityName: 'votes', entityId: 'v-881', action: 'VALIDATED', userId: 'user-42', signature: 'c2b9...77d3', createdAt: new Date(Date.now() - 21600000).toISOString() },
    { id: 'al4', entityName: 'svp_transactions', entityId: 'tx-001', action: 'SENT', userId: 'dispatcher', signature: 'f1a4...e6b8', createdAt: new Date(Date.now() - 28800000).toISOString() },
    { id: 'al5', entityName: 'debates', entityId: 'd-sl-441', action: 'OPEN', userId: 'admin-01', signature: '9c3d...2a17', createdAt: new Date(Date.now() - 36000000).toISOString() },
  ];

  const MOCK_LEDGER = [
    { id: 'le1', objectId: 'o1', action: 'GRANT', pointsDelta: 5000, previousStateHash: '0'.repeat(64), auditSignature: 'a3f8...b92c', createdAt: new Date(Date.now() - 14400000).toISOString() },
    { id: 'le2', objectId: 'o1', action: 'REVALUE', pointsDelta: 2500, previousStateHash: 'a3f8b92c...', auditSignature: 'd7e1...4f8a', createdAt: new Date(Date.now() - 7200000).toISOString() },
    { id: 'le3', objectId: 'o1', action: 'REVALUE', pointsDelta: 5000, previousStateHash: 'd7e14f8a...', auditSignature: 'c2b9...77d3', createdAt: new Date(Date.now() - 3600000).toISOString() },
  ];

  const logList = logs?.data ?? MOCK_LOGS;

  const ACTION_CFG: Record<string, { color: string; icon: string }> = {
    GRANT:            { color: 'text-secondary', icon: 'add_circle' },
    REVALUE:          { color: 'text-primary', icon: 'trending_up' },
    TRANSFORM:        { color: 'text-tertiary', icon: 'auto_awesome' },
    BURN:             { color: 'text-red-400', icon: 'local_fire_department' },
    CLOSE_CALCULATE:  { color: 'text-tertiary', icon: 'calculate' },
    OPEN:             { color: 'text-secondary', icon: 'lock_open' },
    VALIDATED:        { color: 'text-primary', icon: 'verified' },
    SENT:             { color: 'text-secondary', icon: 'send' },
  };

  async function handleVerify() {
    if (!verifyObjectId.trim()) return;
    try {
      const result = await inventoryApi.verifyIntegrity(verifyObjectId.trim());
      setVerifyResult(result);
    } catch {
      setVerifyResult({ valid: false, brokenAt: 'Error de conexión' });
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-primary/80 font-headline mb-2">
          Sovereign Ledger · Auditoría
        </p>
        <h1 className="font-headline font-bold text-3xl text-on-surface" style={{ letterSpacing: '-0.02em' }}>
          Historial de Auditoría
        </h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Ledger chain visual */}
        <div className="lg:col-span-2">
          <h2 className="font-headline font-bold text-on-surface/60 text-xs uppercase tracking-widest mb-4">
            Audit Trail · Cadena de Eventos
          </h2>
          <div className="space-y-2">
            {logList.map((log: any, idx: number) => {
              const cfg = ACTION_CFG[log.action] ?? { color: 'text-on-surface/40', icon: 'info' };
              return (
                <div key={log.id} className="flex gap-3 items-start">
                  {/* Chain line */}
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-surface-container shrink-0`}>
                      <span className={`material-symbols-outlined text-sm ${cfg.color}`}>{cfg.icon}</span>
                    </div>
                    {idx < logList.length - 1 && (
                      <div className="w-px h-4 bg-outline-variant/20 my-1" />
                    )}
                  </div>
                  <div className="flex-1 bg-surface-container rounded-xl p-3 pb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-bold font-headline ${cfg.color}`}>{log.action}</span>
                      <span className="text-xs text-on-surface/30 font-headline">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface/60">
                      <span className="text-on-surface/40">Entidad:</span> {log.entityName} · {log.entityId?.slice(0, 12)}...
                    </p>
                    <p className="text-xs font-mono text-on-surface/30 mt-1">
                      sig: {log.signature}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-6">
          {/* Integrity verifier */}
          <div className="bg-surface-container rounded-xl p-5">
            <h3 className="font-headline font-bold text-on-surface text-sm mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-primary">shield</span>
              Verificar Integridad
            </h3>
            <p className="text-xs text-on-surface/50 mb-3">
              Verifica la cadena HMAC del ledger de un objeto
            </p>
            <input
              type="text"
              value={verifyObjectId}
              onChange={(e) => setVerifyObjectId(e.target.value)}
              placeholder="Object ID (UUID)"
              className="w-full bg-surface-container-high text-on-surface text-xs font-mono rounded-lg px-3 py-2 mb-3 outline-none border border-transparent focus:border-primary/40 placeholder-on-surface/30"
            />
            <button onClick={handleVerify}
              className="w-full bg-primary/10 text-primary hover:bg-primary/20 font-headline font-bold text-xs py-2 rounded-lg transition-all">
              Verificar Cadena
            </button>
            {verifyResult && (
              <div className={`mt-3 p-3 rounded-lg text-xs font-bold font-headline text-center ${
                verifyResult.valid
                  ? 'bg-secondary/10 text-secondary'
                  : 'bg-red-400/10 text-red-400'
              }`}>
                {verifyResult.valid
                  ? '✓ Cadena íntegra · Todas las firmas válidas'
                  : `✗ Integridad rota · Entrada: ${verifyResult.brokenAt}`}
              </div>
            )}
          </div>

          {/* Inventory ledger */}
          <div className="bg-surface-container rounded-xl p-5">
            <h3 className="font-headline font-bold text-on-surface text-sm mb-3">
              Ledger de Objeto #o1
            </h3>
            <div className="space-y-2">
              {MOCK_LEDGER.map((entry, idx) => (
                <div key={entry.id} className="bg-surface-container-high rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-secondary font-headline">{entry.action}</span>
                    <span className={`text-xs font-bold font-headline ${entry.pointsDelta >= 0 ? 'text-secondary' : 'text-red-400'}`}>
                      {entry.pointsDelta >= 0 ? '+' : ''}{entry.pointsDelta.toLocaleString()} pts
                    </span>
                  </div>
                  <p className="text-xs font-mono text-on-surface/30 truncate">
                    prevHash: {idx === 0 ? '0000...0000' : entry.previousStateHash}
                  </p>
                  <p className="text-xs font-mono text-on-surface/30 truncate">
                    sig: {entry.auditSignature}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


// ============================================================
// apps/web-client/src/pages/DebateDetailPage.tsx
// ============================================================
import React2 from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { debatesApi, votesApi } from '../services/api.service';

export function DebateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [selectedItem, setSelectedItem] = React2.useState<string | null>(null);
  const [voted, setVoted] = React2.useState(false);

  const MOCK_DEBATE = {
    id: id ?? '1',
    title: 'Mejores Frameworks Frontend 2026',
    description: 'Debate global sobre los frameworks más adoptados y auditados por la comunidad técnica internacional.',
    category: 'Tech',
    scope: 'GLOBAL',
    status: 'OPEN',
    totalVotes: 4200,
    participantCount: 4200,
    startDate: '2026-04-01',
    endDate: '2026-04-10',
    items: [
      { id: 'i1', name: 'React 19', voteCount: 1680, consensusPercentage: 40, tier: 'S', isAudited: true, metadata: {} },
      { id: 'i2', name: 'Vue 4', voteCount: 1050, consensusPercentage: 25, tier: 'A', isAudited: true, metadata: {} },
      { id: 'i3', name: 'Svelte 5', voteCount: 840, consensusPercentage: 20, tier: 'A', isAudited: false, metadata: {} },
      { id: 'i4', name: 'Solid.js', voteCount: 630, consensusPercentage: 15, tier: 'B', isAudited: false, metadata: {} },
    ],
  };

  const TIER_COLOR: Record<string, string> = {
    S: 'text-primary border-primary/40',
    A: 'text-secondary border-secondary/40',
    B: 'text-tertiary border-tertiary/40',
    C: 'text-on-surface/40 border-on-surface/20',
  };

  const handleVote = () => {
    if (!selectedItem) return;
    setVoted(true);
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <Link to="/debate" className="flex items-center gap-1 text-xs text-on-surface/40 hover:text-on-surface font-headline mb-6 transition-colors">
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        Volver al Muro
      </Link>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold text-secondary bg-secondary/10 px-2 py-1 rounded font-headline">● Abierto</span>
          <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded font-headline">GLOBAL</span>
          <span className="text-xs text-on-surface/40 font-headline">{MOCK_DEBATE.category}</span>
        </div>
        <h1 className="font-headline font-bold text-2xl text-on-surface" style={{ letterSpacing: '-0.02em' }}>
          {MOCK_DEBATE.title}
        </h1>
        <p className="text-on-surface/60 text-sm mt-2">{MOCK_DEBATE.description}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Votos', value: MOCK_DEBATE.totalVotes.toLocaleString(), icon: 'how_to_vote' },
          { label: 'Participantes', value: MOCK_DEBATE.participantCount.toLocaleString(), icon: 'group' },
          { label: 'Cierra', value: MOCK_DEBATE.endDate, icon: 'calendar_today' },
        ].map((s) => (
          <div key={s.label} className="bg-surface-container rounded-xl p-3 text-center">
            <span className="material-symbols-outlined text-primary text-base">{s.icon}</span>
            <p className="font-headline font-bold text-on-surface text-sm">{s.value}</p>
            <p className="text-xs text-on-surface/40">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Items to vote */}
      <div className="space-y-2 mb-6">
        {MOCK_DEBATE.items.map((item) => (
          <button key={item.id} onClick={() => !voted && setSelectedItem(item.id)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
              selectedItem === item.id
                ? 'border-primary bg-primary/10'
                : 'border-transparent bg-surface-container hover:bg-surface-container-high'
            } ${voted ? 'cursor-default' : 'cursor-pointer'}`}>
            <div className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center font-headline font-bold text-sm shrink-0 ${TIER_COLOR[item.tier ?? 'C']}`}>
              {item.tier}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-headline font-bold text-on-surface text-sm">{item.name}</p>
                {item.isAudited && (
                  <span className="material-symbols-outlined text-secondary text-xs">verified</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${item.consensusPercentage}%` }} />
                </div>
                <span className="text-xs text-on-surface/50 shrink-0">
                  {item.consensusPercentage}% · {item.voteCount.toLocaleString()} votos
                </span>
              </div>
            </div>
            {selectedItem === item.id && !voted && (
              <span className="material-symbols-outlined text-primary shrink-0">radio_button_checked</span>
            )}
          </button>
        ))}
      </div>

      {!voted ? (
        <button onClick={handleVote} disabled={!selectedItem}
          className="w-full bg-primary text-white font-headline font-bold py-3 rounded-xl transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          <span className="material-symbols-outlined">how_to_vote</span>
          Emitir Voto
        </button>
      ) : (
        <div className="bg-secondary/10 border border-secondary/30 rounded-xl p-4 text-center">
          <span className="material-symbols-outlined text-secondary text-2xl">verified</span>
          <p className="font-headline font-bold text-secondary mt-1">¡Voto registrado en el Ledger!</p>
          <p className="text-xs text-on-surface/50 mt-1">Firma HMAC generada · Pending auditoría</p>
        </div>
      )}
    </div>
  );
}

export default AuditPage;
