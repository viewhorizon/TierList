// ============================================================
// apps/web-client/src/pages/ExplorePage.tsx
// ============================================================
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { debatesApi } from '../services/api.service';

export default function ExplorePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['debates', 'OPEN'],
    queryFn: () => debatesApi.getAll({ status: 'OPEN', limit: 12 }),
  });

  const MOCK_TRENDING = [
    { id: '1', title: 'Mejores Frameworks 2026', category: 'Tech', participants: 4200, scope: 'GLOBAL', consensusPct: 87 },
    { id: '2', title: 'Liderazgo Global Institucional', category: 'Política', participants: 12800, scope: 'GLOBAL', consensusPct: 92 },
    { id: '3', title: 'Protocolos de IA más seguros', category: 'Ciencia', participants: 7600, scope: 'GLOBAL', consensusPct: 78 },
    { id: '4', title: 'Economías post-cripto 2026', category: 'Economía', participants: 3100, scope: 'LOCAL', consensusPct: 65 },
    { id: '5', title: 'Mejores plataformas de debate', category: 'Social', participants: 890, scope: 'LOCAL', consensusPct: 81 },
    { id: '6', title: 'Protocolos energéticos sostenibles', category: 'Medio Ambiente', participants: 5400, scope: 'GLOBAL', consensusPct: 94 },
  ];

  const debates = data?.data ?? MOCK_TRENDING;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Hero */}
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-primary/80 font-headline mb-2">
          Sovereign Ledger · Live
        </p>
        <h1 className="font-headline font-bold text-3xl lg:text-4xl text-on-surface tracking-tight" style={{ letterSpacing: '-0.02em' }}>
          Explorar Debates
        </h1>
        <p className="text-on-surface/60 mt-2 text-sm">
          Consenso global auditado en tiempo real
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Debates Activos', value: '1,248', icon: 'forum', color: 'text-primary' },
          { label: 'Votos Hoy', value: '94,320', icon: 'how_to_vote', color: 'text-secondary' },
          { label: 'Auditados', value: '99.8%', icon: 'verified_user', color: 'text-tertiary' },
        ].map((s) => (
          <div key={s.label} className="bg-surface-container rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className={`material-symbols-outlined text-base ${s.color}`}>{s.icon}</span>
              <span className="text-xs font-bold uppercase tracking-widest text-on-surface/40 font-headline">{s.label}</span>
            </div>
            <p className={`font-headline font-bold text-2xl ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Debates grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-surface-container rounded-xl p-5 animate-pulse h-40" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {debates.map((d: any) => (
            <Link key={d.id} to={`/debate/${d.id}`}
              className="bg-surface-container hover:bg-surface-container-high rounded-xl p-5 transition-all group border border-transparent hover:border-primary/20">
              <div className="flex items-start justify-between mb-3">
                <span className={`text-xs font-bold px-2 py-1 rounded font-headline uppercase tracking-wide ${
                  d.scope === 'GLOBAL'
                    ? 'text-secondary bg-secondary/10'
                    : 'text-tertiary bg-tertiary/10'
                }`}>
                  {d.scope === 'GLOBAL' ? '🌐 Global' : '📍 Local'}
                </span>
                <span className="text-xs text-on-surface/40 font-headline">{d.category}</span>
              </div>
              <h3 className="font-headline font-bold text-on-surface text-sm mb-3 group-hover:text-primary transition-colors" style={{ letterSpacing: '-0.01em' }}>
                {d.title}
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-xs text-on-surface/50">
                  {(d.participants || d.participantCount || 0).toLocaleString()} participantes
                </span>
                <div className="flex items-center gap-1">
                  <div className="w-16 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                    <div className="h-full bg-secondary rounded-full" style={{ width: `${d.consensusPct || 70}%` }} />
                  </div>
                  <span className="text-xs text-secondary font-bold">{d.consensusPct || 70}%</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
