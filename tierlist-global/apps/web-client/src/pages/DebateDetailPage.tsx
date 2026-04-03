// src/pages/DebateDetailPage.tsx
// Fiel a: tierlist_resultados_finales
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { debatesApi } from '../services/api';
import { TierBadge, AuditChip, ConsensusBar, LedgerHash, StateWrapper } from '../components/ui';

const MOCK_ITEMS = [
  { id: 'i1', name: 'Arquitectura Descentralizada', tier: 'S' as const, voteCount: 12402, consensusPercentage: 94.8, isAudited: true, debateId: '', metadata: {} },
  { id: 'i2', name: 'Gobernanza Algorítmica', tier: 'A' as const, voteCount: 7800, consensusPercentage: 78.2, isAudited: true, debateId: '', metadata: {} },
  { id: 'i3', name: 'Validación por Pares', tier: 'B' as const, voteCount: 4200, consensusPercentage: 62.4, isAudited: false, debateId: '', metadata: {} },
];

const CONTRIBUTORS = [
  { init: 'AL', name: 'Alpha_Ledger', rep: 9.98, level: 'Level 5 Expert',   sp: 1200 },
  { init: 'NX', name: 'Nexus_Prime',  rep: 9.92, level: 'Genesis Node',     sp: 980 },
  { init: 'KV', name: 'Krypt_Vault',  rep: 9.85, level: 'Senior Auditor',   sp: 850 },
];

export default function DebateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [voted, setVoted] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'distribution' | 'audit' | 'activity'>('distribution');

  const { data: debate, isLoading, error } = useQuery({
    queryKey: ['debate', id],
    queryFn: () => debatesApi.getOne(id!),
    enabled: !!id,
    retry: 1,
  });
  const { data: ranking } = useQuery({
    queryKey: ['ranking', id],
    queryFn: () => debatesApi.getRanking(id!),
    enabled: !!id,
    retry: 1,
  });

  const items = ranking ?? MOCK_ITEMS;
  const isFinalized = debate?.status === 'FINALIZED';

  return (
    <StateWrapper loading={isLoading} error={error as Error | null}>
      <div className="min-h-full bg-surface">

        {/* Audit trail header — fiel al screenshot */}
        <div className="bg-surface-container border-b border-outline-variant/10 px-6 py-3">
          <div className="max-w-5xl mx-auto flex items-center gap-3">
            <Link to="/debate" className="text-on-surface/40 hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined text-sm">arrow_back</span>
            </Link>
            <span className="text-xs font-headline text-on-surface/30">Sovereign Ledger | Resultados de Debate</span>
            <span className="ml-auto text-xs font-headline font-bold text-on-surface/40">
              Audit Trail: #{(id ?? '882-VLT').slice(0, 7).toUpperCase()}
            </span>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-6 lg:px-6">

          {/* ── S-TIER winner card — fiel al screenshot ── */}
          {isFinalized && (
            <div className="bg-gradient-to-br from-primary/15 via-surface-container to-transparent rounded-xl p-6 border border-primary/20 mb-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="inline-block text-xs font-headline font-bold text-primary bg-primary/10 px-2 py-0.5 rounded mb-2">
                    Debate Cerrado · Finalizado el 24 OCT 2023
                  </span>
                  <div className="flex items-center gap-2 mb-2">
                    <TierBadge tier="S" size="lg" />
                  </div>
                  <h1 className="font-headline font-bold text-xl text-on-surface mb-2" style={{ letterSpacing: '-0.02em' }}>
                    {debate?.title ?? items[0]?.name ?? 'Resultado del Debate'}
                  </h1>
                  <p className="text-on-surface/60 text-sm leading-relaxed max-w-2xl">
                    {debate?.description ?? 'Tras 14 días de debate intenso, la comunidad ha ratificado la arquitectura descentralizada como el pilar fundamental del Sovereign Ledger.'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-headline font-bold text-primary" style={{ fontSize: '3.5rem', letterSpacing: '-0.04em', lineHeight: 1 }}>
                    {items[0]?.consensusPercentage.toFixed(1)}%
                  </p>
                  <p className="text-xs text-on-surface/40 font-headline">Consenso Final</p>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button className="flex items-center gap-2 bg-primary text-white font-headline font-bold text-xs px-4 py-2 rounded-lg hover:opacity-90 transition-all">
                  Ver Informe Auditado
                </button>
              </div>
            </div>
          )}

          {!isFinalized && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                <span className="text-xs font-headline font-bold text-secondary">Debate Abierto · Votación Activa</span>
              </div>
              <h1 className="font-headline font-bold text-2xl text-on-surface mb-2" style={{ letterSpacing: '-0.02em' }}>
                {debate?.title ?? 'Debate en Progreso'}
              </h1>
              <p className="text-on-surface/60 text-sm">{debate?.description ?? 'Emite tu voto y contribuye al consenso global.'}</p>
            </div>
          )}

          {/* Stats — Votos Globales, Locales, Impacto */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Votos Globales', value: `${(items[0]?.voteCount ?? 12402).toLocaleString()} V`, icon: 'analytics', color: 'text-primary' },
              { label: 'Votos Locales', value: '2,810 V', icon: 'location_on', color: 'text-secondary' },
              { label: 'Impacto Ledger', value: '+12.4 TPS', icon: 'trending_up', color: 'text-tertiary' },
            ].map((s) => (
              <div key={s.label} className="bg-surface-container rounded-xl p-3 text-center">
                <span className={`material-symbols-outlined text-lg ${s.color}`}>{s.icon}</span>
                <p className={`font-headline font-bold text-base mt-1 ${s.color}`}>{s.value}</p>
                <p className="text-xs text-on-surface/40 font-headline">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Tabs — Distribución, Auditoría, Actividad */}
          <div className="flex gap-1 mb-5 bg-surface-container p-1 rounded-xl w-fit">
            {(['distribution', 'audit', 'activity'] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-headline font-bold transition-all ${
                  activeTab === tab ? 'bg-primary text-white' : 'text-on-surface/50 hover:text-on-surface'
                }`}>
                {tab === 'distribution' ? 'Distribución de Votos' : tab === 'audit' ? 'Detalles de Bloque' : 'Actividad de Auditoría'}
              </button>
            ))}
          </div>

          {/* Items/ranking */}
          <div className="space-y-2 mb-6">
            {items.map((item) => (
              <button key={item.id} onClick={() => !isFinalized && setVoted(item.id)}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                  voted === item.id
                    ? 'border-primary bg-primary/10'
                    : isFinalized
                    ? 'border-outline-variant/10 bg-surface-container cursor-default'
                    : 'border-transparent bg-surface-container hover:bg-surface-container-high hover:border-outline-variant/20 cursor-pointer'
                }`}
                aria-pressed={voted === item.id}
                tabIndex={isFinalized ? -1 : 0}>
                <TierBadge tier={item.tier} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="font-headline font-bold text-sm text-on-surface mb-1.5">{item.name}</p>
                  <ConsensusBar pct={item.consensusPercentage} tier={item.tier} />
                </div>
                {item.isAudited && <AuditChip status="audited" />}
                {voted === item.id && !isFinalized && (
                  <span className="material-symbols-outlined text-primary text-sm shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>radio_button_checked</span>
                )}
              </button>
            ))}
          </div>

          {/* CTA votar / resultado */}
          {!isFinalized && (
            voted
              ? <div className="bg-secondary/10 border border-secondary/30 rounded-xl p-4 text-center">
                  <span className="material-symbols-outlined text-secondary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  <p className="font-headline font-bold text-secondary mt-1">¡Voto registrado en el Ledger!</p>
                  <p className="text-xs text-on-surface/50 mt-1">Firma HMAC generada · Pending auditoría</p>
                </div>
              : <button className="w-full bg-primary text-white font-headline font-bold py-3 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined">how_to_vote</span>
                  Emitir Voto en el Ledger
                </button>
          )}

          {/* Principales contribuyentes — fiel al screenshot de resultados */}
          {isFinalized && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-sm text-on-surface/40">verified_user</span>
                <h2 className="font-headline font-bold text-xs uppercase tracking-widest text-on-surface/40">
                  Principales Contribuyentes · Top 1% Auditors
                </h2>
              </div>
              <div className="bg-surface-container rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-outline-variant/10">
                      {['Auditor', 'Reputación', 'Nivel', 'Validación', 'Impacto'].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left text-xs font-headline font-bold text-on-surface/30 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {CONTRIBUTORS.map((c) => (
                      <tr key={c.name} className="border-b border-outline-variant/5 hover:bg-surface-container-high transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-headline font-bold text-primary">{c.init}</div>
                            <span className="font-headline font-bold text-sm text-on-surface">{c.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-headline font-bold text-secondary">{c.rep} / 10</td>
                        <td className="px-4 py-3 text-xs font-headline text-on-surface/50">{c.level}</td>
                        <td className="px-4 py-3"><AuditChip status="audited" /></td>
                        <td className="px-4 py-3 text-sm font-headline font-bold text-primary">+{c.sp} SP</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between mt-4 px-1">
                {[
                  { icon: 'security', label: 'Secured by SOVEREIGN_AUTH' },
                  { icon: 'hub',      label: 'Protocol LEDGER_SYNC_4.0' },
                  { icon: 'lock',     label: 'Encrypted by AES_QUANTUM' },
                ].map((b) => (
                  <div key={b.label} className="flex items-center gap-1 text-xs text-on-surface/20 font-headline">
                    <span className="material-symbols-outlined text-xs">{b.icon}</span>
                    {b.label}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </StateWrapper>
  );
}
