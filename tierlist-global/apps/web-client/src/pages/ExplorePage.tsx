// src/pages/ExplorePage.tsx
// Fiel a: tierlist_dashboard_geometría_perfeccionada + tierlist_dashboard_principal_móvil

import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { debatesApi } from '../services/api';
import { StateWrapper, LiveIndicator, PageHeader } from '../components/ui';
import type { Debate } from '../types';

// Datos de fallback tomados literalmente del screenshot
const FALLBACK_DEBATES: Debate[] = [
  { id: 'sl-2024-001', title: 'Voto Cuadrático en Tier-3', description: 'Debate sobre la transición de sistemas de mayoría simple a modelos cuadráticos para nodos institucionales.', category: 'Gobernanza', scope: 'GLOBAL', status: 'OPEN', participantCount: 42000, startDate: '', endDate: '', configRules: {}, createdBy: '', createdAt: '', totalVotes: 42000 },
  { id: 'sl-2024-002', title: 'Protocolo de Emergencia', description: 'Revisión de disparadores automáticos para el bloqueo de transacciones sospechosas en el Ledger Central.', category: 'Seguridad', scope: 'GLOBAL', status: 'OPEN', participantCount: 8000, startDate: '', endDate: '', configRules: {}, createdBy: '', createdAt: '', totalVotes: 8000 },
  { id: 'sl-2024-003', title: 'Redistribución de Nodos Regionales', description: 'Arquitectura de Consenso: El Futuro del Protocolo Soberano. Únete al debate sobre redistribución de nodos.', category: 'Infraestructura', scope: 'GLOBAL', status: 'OPEN', participantCount: 1200000, startDate: '', endDate: '', configRules: {}, createdBy: '', createdAt: '', totalVotes: 1200000 },
  { id: 'sl-2024-004', title: 'Reestructuración de Comisiones Layer 2', description: 'La reducción del 15% es bienvenida. Necesitamos visualización en tiempo real antes de la votación final.', category: 'Economía', scope: 'LOCAL', status: 'OPEN', participantCount: 3400, startDate: '', endDate: '', configRules: {}, createdBy: '', createdAt: '', totalVotes: 3400 },
  { id: 'sl-2024-005', title: 'Optimización del Dashboard Institucional', description: 'Los nuevos gráficos de dispersión requieren modo simplificado para resoluciones estándar.', category: 'UX', scope: 'LOCAL', status: 'OPEN', participantCount: 890, startDate: '', endDate: '', configRules: {}, createdBy: '', createdAt: '', totalVotes: 890 },
  { id: 'sl-2024-006', title: 'Descentralización de Nodos Emergentes', description: 'Implementación de salvaguardas contra colusión de pools de staking en regiones emergentes.', category: 'Gobernanza', scope: 'GLOBAL', status: 'OPEN', participantCount: 15600, startDate: '', endDate: '', configRules: {}, createdBy: '', createdAt: '', totalVotes: 15600 },
];

const CATEGORY_COLORS: Record<string, string> = {
  Gobernanza:      'text-primary bg-primary/10',
  Seguridad:       'text-tertiary bg-tertiary/10',
  Infraestructura: 'text-secondary bg-secondary/10',
  Economía:        'text-tertiary bg-tertiary/10',
  UX:              'text-on-surface/50 bg-on-surface/5',
  Ciencia:         'text-secondary bg-secondary/10',
};

export default function ExplorePage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['debates', 'explore'],
    queryFn: () => debatesApi.getAll({ status: 'OPEN', limit: 12 }),
    retry: 2,
  });

  const debates = data?.data ?? FALLBACK_DEBATES;
  const heroDebate = debates[2] ?? debates[0];

  return (
    <div className="min-h-full bg-surface">

      {/* ── Hero — "Arquitectura de Consenso" del screenshot ── */}
      <div className="relative overflow-hidden bg-surface-container border-b border-outline-variant/10">
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container via-transparent to-transparent opacity-80" />
        {/* Decorative grid lines fiel al screenshot */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'linear-gradient(#0052ff 1px, transparent 1px), linear-gradient(90deg, #0052ff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="relative px-6 py-8 lg:px-8 lg:py-10 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <LiveIndicator label="Ledger Auditado: Real-Time" />
            <span className="text-xs text-on-surface/30 font-headline">BLOQUE #882,192,001 · ESTADO FINALIZADO</span>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="font-headline font-bold text-2xl lg:text-3xl text-on-surface mb-3" style={{ letterSpacing: '-0.02em' }}>
                Arquitectura de Consenso:<br />
                <span className="text-primary">El Futuro del Protocolo Soberano.</span>
              </h2>
              <p className="text-on-surface/60 text-sm mb-5 leading-relaxed">
                Únete al debate activo sobre la redistribución de nodos regionales en el estrato global. 1.2M votos verificados.
              </p>
              <div className="flex gap-3">
                <Link to={`/debate/${heroDebate.id}`}
                  className="inline-flex items-center gap-2 bg-primary text-white font-headline font-bold text-sm px-5 py-2.5 rounded-lg hover:opacity-90 transition-all">
                  <span className="material-symbols-outlined text-base">how_to_vote</span>
                  Votar Ahora
                </Link>
                <button className="inline-flex items-center gap-2 bg-surface-container-high text-on-surface/70 font-headline font-bold text-sm px-5 py-2.5 rounded-lg hover:text-on-surface transition-all">
                  Ver Análisis
                </button>
              </div>
            </div>

            {/* Stats strip del screenshot */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Debates Activos', value: '1,429', change: '+12%', icon: 'forum', color: 'text-primary' },
                { label: 'Consenso Global', value: '88.4%', sub: 'Estable', icon: 'check_circle', color: 'text-secondary' },
                { label: 'Tiers Verificados', value: '24', sub: 'Total: 32', icon: 'verified', color: 'text-tertiary' },
                { label: 'Auditoría TierList', value: '99.9', sub: 'Inmune', icon: 'security', color: 'text-primary' },
              ].map((s) => (
                <div key={s.label} className="bg-surface-container-high rounded-xl p-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className={`material-symbols-outlined text-base ${s.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                    <span className="text-xs text-on-surface/40 font-headline uppercase tracking-wide">{s.label}</span>
                  </div>
                  <p className={`font-headline font-bold text-xl ${s.color}`} style={{ letterSpacing: '-0.02em' }}>{s.value}</p>
                  {s.change && <p className="text-xs text-secondary font-headline">{s.change}</p>}
                  {s.sub && <p className="text-xs text-on-surface/40 font-headline">{s.sub}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Muro de Debates Recientes ── */}
      <div className="px-6 py-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs text-on-surface/40 font-headline mb-0.5">Última actualización: hace 4 minutos.</p>
            <h2 className="font-headline font-bold text-base text-on-surface" style={{ letterSpacing: '-0.01em' }}>
              Muro de Debates Recientes
            </h2>
          </div>
          <Link to="/debate"
            className="flex items-center gap-1 text-xs text-primary font-headline font-bold hover:opacity-80 transition-opacity">
            Ver Todos los Debates
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>

        <StateWrapper loading={isLoading} error={error as Error | null} empty={debates.length === 0}
          emptyMessage="No hay debates activos en este momento."
          skeleton={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <div key={i} className="bg-surface-container rounded-xl h-44 animate-pulse" />)}
            </div>
          }>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {debates.map((d) => (
              <DebateCard key={d.id} debate={d} />
            ))}
          </div>
        </StateWrapper>
      </div>
    </div>
  );
}

function DebateCard({ debate }: { debate: Debate }) {
  const catColor = CATEGORY_COLORS[debate.category] ?? 'text-on-surface/50 bg-on-surface/5';
  const isVerified = debate.status === 'FINALIZED' || debate.status === 'OPEN';
  const votes = debate.totalVotes ?? debate.participantCount ?? 0;

  return (
    <Link to={`/debate/${debate.id}`}
      className="group bg-surface-container hover:bg-surface-container-high rounded-xl p-5 border border-transparent hover:border-outline-variant/30 transition-all duration-200 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex gap-2 flex-wrap">
          <span className={`text-xs font-bold px-2 py-0.5 rounded font-headline uppercase tracking-wide ${catColor}`}>
            {debate.category}
          </span>
          {debate.scope === 'GLOBAL' && (
            <span className="text-xs font-bold px-2 py-0.5 rounded font-headline text-primary bg-primary/10">
              🌐 Global
            </span>
          )}
        </div>
        {isVerified && (
          <span className="text-secondary shrink-0">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
          </span>
        )}
      </div>

      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="material-symbols-outlined text-sm text-on-surface/40">gavel</span>
          <span className="text-xs text-on-surface/30 font-headline">ID: {debate.id.slice(0, 12).toUpperCase()}</span>
        </div>
        <h3 className="font-headline font-bold text-on-surface text-sm leading-snug group-hover:text-primary transition-colors" style={{ letterSpacing: '-0.01em' }}>
          {debate.title}
        </h3>
        {debate.description && (
          <p className="text-on-surface/50 text-xs mt-1.5 leading-relaxed line-clamp-2">{debate.description}</p>
        )}
      </div>

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-outline-variant/10">
        <span className="text-xs text-on-surface/40 font-headline">
          +{votes > 999 ? `${(votes / 1000).toFixed(0)}k` : votes} {debate.status === 'OPEN' ? 'Abstención' : 'votos'}
        </span>
        <button className="text-xs font-headline font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1 rounded transition-all">
          Votar SI
        </button>
      </div>
    </Link>
  );
}
