// src/pages/RankingsPage.tsx
// Fiel a: tierlist_rankings_simetría_total + tierlist_rankings_globales_móvil

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { debatesApi } from '../services/api';
import { TierBadge, AuditChip, ConsensusBar, LiveIndicator, StateWrapper } from '../components/ui';
import type { TierLevel } from '../types';

// Datos fiel al screenshot (Ethereum, Chainlink, Solana, etc.)
const FALLBACK_ITEMS = [
  { id: 'i1', debateId: 'd1', name: 'Ethereum Core', description: 'La base del valor programable. Líder indiscutible en descentralización y seguridad.', tier: 'S' as TierLevel, voteCount: 2400000, consensusPercentage: 98, isAudited: true, rank: 1, icon: 'hub', category: 'L1 Protocol', metadata: {}, svpImpact: 98 },
  { id: 'i2', debateId: 'd1', name: 'Chainlink Oracle', description: 'Puente de datos crítico para la conectividad cross-chain y contratos inteligentes.', tier: 'S' as TierLevel, voteCount: 1900000, consensusPercentage: 94.8, isAudited: true, rank: 2, icon: 'database', category: 'Infrastructure', metadata: {}, svpImpact: 94.8 },
  { id: 'i3', debateId: 'd2', name: 'Solana Network', description: 'L1 Monolítica de alto rendimiento para aplicaciones de alta frecuencia.', tier: 'A' as TierLevel, voteCount: 1400000, consensusPercentage: 88.2, isAudited: true, rank: 3, icon: 'rocket_launch', category: 'L1 Protocol', metadata: {}, svpImpact: 88.2 },
  { id: 'i4', debateId: 'd2', name: 'Circle (USDC)', description: 'Dólar digital regulado. Infraestructura crítica para liquidez institucional.', tier: 'A' as TierLevel, voteCount: 1100000, consensusPercentage: 85.4, isAudited: false, rank: 4, icon: 'toll', category: 'Stablecoin', metadata: {}, svpImpact: 85.4 },
  { id: 'i5', debateId: 'd3', name: 'Uniswap Protocol', description: 'Pionero en AMM automatizados. Referencia en mercados descentralizados.', tier: 'B' as TierLevel, voteCount: 780000, consensusPercentage: 72.1, isAudited: true, rank: 5, icon: 'token', category: 'DeFi', metadata: {}, svpImpact: 72.1 },
  { id: 'i6', debateId: 'd3', name: 'Metamask Wallet', description: 'Portal líder para el ecosistema Web3 y gestión de identidad digital.', tier: 'C' as TierLevel, voteCount: 390000, consensusPercentage: 58.9, isAudited: false, rank: 6, icon: 'account_balance_wallet', category: 'Wallet', metadata: {}, svpImpact: 58.9 },
];

const TIER_HEADER_CFG = {
  S: { gradient: 'from-primary/20 to-transparent', badge: 'bg-primary text-white', label: 'Tier-S · Consenso Dominante' },
  A: { gradient: 'from-secondary/15 to-transparent', badge: 'bg-secondary text-surface', label: 'Tier-A · Alto Impacto' },
  B: { gradient: 'from-tertiary/10 to-transparent', badge: 'bg-tertiary text-surface', label: 'Tier-B · Relevante' },
  C: { gradient: 'from-on-surface/5 to-transparent', badge: 'bg-on-surface/20 text-on-surface/60', label: 'Tier-C · Observación' },
};

const STATUS_LABEL: Record<string, { label: string; icon: string; color: string }> = {
  audited:   { label: 'VERIFICADO',  icon: 'verified',        color: 'text-secondary' },
  verifying: { label: 'AUDITANDO',   icon: 'sync',            color: 'text-tertiary' },
  pending:   { label: 'PENDIENTE',   icon: 'schedule',        color: 'text-on-surface/40' },
};

export default function RankingsPage() {
  const [activeTier, setActiveTier] = useState<TierLevel | 'ALL'>('ALL');

  const tiers: Array<TierLevel | 'ALL'> = ['ALL', 'S', 'A', 'B', 'C'];

  const filtered = activeTier === 'ALL'
    ? FALLBACK_ITEMS
    : FALLBACK_ITEMS.filter((i) => i.tier === activeTier);

  // Featured S-tier item (top del screenshot)
  const featured = FALLBACK_ITEMS.find((i) => i.tier === 'S') ?? FALLBACK_ITEMS[0];

  return (
    <div className="min-h-full bg-surface">

      {/* ── Header strip ── */}
      <div className="bg-surface-container border-b border-outline-variant/10 px-6 py-4 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <LiveIndicator label="Auditado en Vivo" />
              <span className="text-xs text-on-surface/30 font-headline hidden sm:block">
                Última sincronización: hace 12 segundos
              </span>
            </div>
            <h1 className="font-headline font-bold text-xl text-on-surface" style={{ letterSpacing: '-0.02em' }}>
              TierList | Rankings Globales
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 text-xs text-on-surface/50 hover:text-on-surface font-headline font-bold px-3 py-1.5 rounded-lg bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined text-sm">filter_list</span>
              Filtros
            </button>
            <button className="flex items-center gap-1.5 text-xs text-on-surface/50 hover:text-on-surface font-headline font-bold px-3 py-1.5 rounded-lg bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined text-sm">sort</span>
              Impacto
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 lg:px-8 max-w-7xl mx-auto">

        {/* ── Featured Tier-S — fiel al screenshot ── */}
        <div className={`rounded-xl p-5 bg-gradient-to-br ${TIER_HEADER_CFG.S.gradient} border border-primary/20 mb-6`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>military_tech</span>
                <span className="font-headline font-bold text-primary text-xl" style={{ letterSpacing: '-0.02em' }}>Tier-S</span>
                <span className="text-xs text-primary/60 font-headline">trending_up +4.2% Impacto</span>
              </div>
              <h2 className="font-headline font-bold text-on-surface text-lg mb-1" style={{ letterSpacing: '-0.02em' }}>
                {featured.name}
              </h2>
              <p className="text-on-surface/60 text-sm leading-relaxed mb-3">{featured.description}</p>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-on-surface/40 font-headline">
                  Votos Activos <span className="text-on-surface font-bold">{(featured.voteCount / 1000000).toFixed(1)}M</span>
                </span>
                <AuditChip status="audited" label="Verificado" />
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="font-headline font-bold text-primary text-4xl" style={{ letterSpacing: '-0.04em' }}>
                {featured.consensusPercentage}%
              </p>
              <p className="text-xs text-on-surface/40 font-headline">Consenso Final</p>
            </div>
          </div>
        </div>

        {/* ── Tier filter tabs ── */}
        <div className="flex gap-1.5 mb-5 flex-wrap">
          {tiers.map((t) => (
            <button key={t} onClick={() => setActiveTier(t)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-headline transition-all ${
                activeTier === t
                  ? 'bg-primary text-white'
                  : 'bg-surface-container text-on-surface/50 hover:text-on-surface hover:bg-surface-container-high'
              }`}>
              {t !== 'ALL' && (
                <span className="material-symbols-outlined text-xs">
                  {t === 'S' ? 'military_tech' : t === 'A' ? 'grade' : t === 'B' ? 'star' : 'star_half'}
                </span>
              )}
              {t === 'ALL' ? 'Todos' : `Tier-${t}`}
            </button>
          ))}
        </div>

        {/* ── Rankings table — fiel a la estructura del screenshot ── */}
        <div className="space-y-2">
          {filtered.map((item, idx) => {
            const auditStatus = item.isAudited
              ? idx % 3 === 1 ? 'verifying' : 'audited'
              : 'pending';
            const st = STATUS_LABEL[auditStatus];

            return (
              <Link key={item.id} to={`/debate/${item.debateId}`}
                className="flex items-center gap-3 md:gap-4 bg-surface-container hover:bg-surface-container-high rounded-xl p-3 md:p-4 border border-transparent hover:border-outline-variant/20 transition-all group">

                {/* Tier + rank */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-on-surface/20 font-headline font-bold text-sm w-5 text-right hidden sm:block">
                    {String(item.rank).padStart(2, '0')}
                  </span>
                  <TierBadge tier={item.tier} size="sm" />
                </div>

                {/* Icon + name */}
                <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-sm text-on-surface/50">{item.icon}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-headline font-bold text-on-surface text-sm group-hover:text-primary transition-colors truncate" style={{ letterSpacing: '-0.01em' }}>
                    {item.name}
                  </p>
                  <p className="text-xs text-on-surface/40 truncate hidden sm:block">{item.description}</p>
                </div>

                {/* Consensus bar */}
                <div className="w-28 md:w-40 shrink-0 hidden sm:block">
                  <ConsensusBar pct={item.consensusPercentage} tier={item.tier} />
                </div>

                {/* Mobile pct */}
                <span className="sm:hidden font-headline font-bold text-sm text-primary">
                  {item.consensusPercentage.toFixed(0)}%
                </span>

                {/* Audit status */}
                <div className="shrink-0 hidden md:flex items-center gap-1">
                  <span className={`material-symbols-outlined text-sm ${st.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{st.icon}</span>
                  <span className={`text-xs font-headline font-bold ${st.color}`}>{st.label}</span>
                  {auditStatus === 'audited' && (
                    <span className="text-xs text-on-surface/30 font-headline hidden lg:block">Hace {2 + idx}m</span>
                  )}
                </div>

                <span className="material-symbols-outlined text-on-surface/20 shrink-0">chevron_right</span>
              </Link>
            );
          })}
        </div>

        {/* Paginación — fiel al screenshot */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-outline-variant/10">
          <span className="text-xs text-on-surface/40 font-headline">Página 1 de 48 | 1-10 de 482 activos</span>
          <div className="flex items-center gap-1">
            <button className="w-7 h-7 flex items-center justify-center rounded text-on-surface/30">
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            {[1, 2, 3].map((p) => (
              <button key={p} className={`w-7 h-7 rounded text-xs font-headline font-bold transition-all ${
                p === 1 ? 'bg-primary text-white' : 'text-on-surface/50 hover:bg-surface-container-high'
              }`}>{p}</button>
            ))}
            <button className="w-7 h-7 flex items-center justify-center rounded text-on-surface/50 hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
