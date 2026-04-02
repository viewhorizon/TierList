// ============================================================
// apps/web-client/src/pages/RankingsPage.tsx
// ============================================================
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { debatesApi } from '../services/api.service';

const TIER_CONFIG = {
  S: { bg: 'bg-primary/10', border: 'border-primary/40', text: 'text-primary', label: 'Tier-S', icon: 'military_tech' },
  A: { bg: 'bg-secondary/10', border: 'border-secondary/40', text: 'text-secondary', label: 'Tier-A', icon: 'grade' },
  B: { bg: 'bg-tertiary/10', border: 'border-tertiary/40', text: 'text-tertiary', label: 'Tier-B', icon: 'star' },
  C: { bg: 'bg-on-surface/5', border: 'border-on-surface/20', text: 'text-on-surface/50', label: 'Tier-C', icon: 'star_half' },
};

const MOCK_RANKING = [
  { id: '1', debateId: 'd1', name: 'React 19', tier: 'S', voteCount: 12400, consensusPercentage: 94.2, isAudited: true, category: 'Frontend' },
  { id: '2', debateId: 'd2', name: 'Next.js 15', tier: 'S', voteCount: 11200, consensusPercentage: 91.8, isAudited: true, category: 'Framework' },
  { id: '3', debateId: 'd3', name: 'TypeScript 5.4', tier: 'A', voteCount: 9800, consensusPercentage: 88.1, isAudited: true, category: 'Lenguaje' },
  { id: '4', debateId: 'd4', name: 'Bun Runtime', tier: 'A', voteCount: 7600, consensusPercentage: 82.4, isAudited: true, category: 'Runtime' },
  { id: '5', debateId: 'd5', name: 'Vite 5', tier: 'A', voteCount: 6400, consensusPercentage: 79.0, isAudited: true, category: 'Tooling' },
  { id: '6', debateId: 'd6', name: 'Tailwind CSS 4', tier: 'B', voteCount: 4800, consensusPercentage: 71.3, isAudited: false, category: 'CSS' },
  { id: '7', debateId: 'd7', name: 'Deno 2', tier: 'B', voteCount: 3200, consensusPercentage: 64.7, isAudited: false, category: 'Runtime' },
  { id: '8', debateId: 'd8', name: 'SvelteKit 2', tier: 'C', voteCount: 1900, consensusPercentage: 52.1, isAudited: false, category: 'Framework' },
];

export default function RankingsPage() {
  const [activeFilter, setActiveFilter] = useState<string>('ALL');

  const filtered = activeFilter === 'ALL'
    ? MOCK_RANKING
    : MOCK_RANKING.filter((r) => r.tier === activeFilter);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-primary/80 font-headline mb-2">
          Consenso Auditado · Tiempo Real
        </p>
        <h1 className="font-headline font-bold text-3xl text-on-surface" style={{ letterSpacing: '-0.02em' }}>
          Rankings Globales
        </h1>
      </div>

      {/* Tier filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['ALL', 'S', 'A', 'B', 'C'].map((tier) => {
          const cfg = tier !== 'ALL' ? TIER_CONFIG[tier as keyof typeof TIER_CONFIG] : null;
          return (
            <button key={tier} onClick={() => setActiveFilter(tier)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold font-headline transition-all border ${
                activeFilter === tier
                  ? 'bg-primary text-white border-primary'
                  : 'bg-surface-container text-on-surface/60 border-transparent hover:border-primary/30'
              }`}>
              {cfg && <span className="material-symbols-outlined text-base">{cfg.icon}</span>}
              {tier === 'ALL' ? 'Todos' : `Tier-${tier}`}
            </button>
          );
        })}
      </div>

      {/* Ranking list */}
      <div className="space-y-2">
        {filtered.map((item, idx) => {
          const cfg = TIER_CONFIG[item.tier as keyof typeof TIER_CONFIG];
          return (
            <Link key={item.id} to={`/debate/${item.debateId}`}
              className={`flex items-center gap-4 p-4 rounded-xl border ${cfg.bg} ${cfg.border} hover:opacity-90 transition-all group`}>
              <span className="text-on-surface/30 font-headline font-bold text-lg w-8 text-right shrink-0">
                {String(idx + 1).padStart(2, '0')}
              </span>
              <div className={`flex items-center gap-1 px-2.5 py-1 rounded font-headline font-bold text-sm ${cfg.text} bg-current/10 shrink-0`}
                style={{ backgroundColor: 'transparent' }}>
                <span className="material-symbols-outlined text-sm">{cfg.icon}</span>
                {item.tier}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-headline font-bold text-on-surface text-sm group-hover:text-primary transition-colors truncate">
                  {item.name}
                </p>
                <p className="text-xs text-on-surface/40">{item.category}</p>
              </div>
              {item.isAudited && (
                <span className="flex items-center gap-1 text-xs text-secondary bg-secondary/10 px-2 py-1 rounded font-headline shrink-0">
                  <span className="material-symbols-outlined text-xs">verified</span>
                  Auditado
                </span>
              )}
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-24 h-2 bg-surface-container rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${cfg.text.replace('text-', 'bg-')}`}
                    style={{ width: `${item.consensusPercentage}%` }} />
                </div>
                <span className={`font-headline font-bold text-sm ${cfg.text} w-12 text-right`}>
                  {item.consensusPercentage.toFixed(1)}%
                </span>
              </div>
              <span className="text-xs text-on-surface/40 shrink-0 hidden md:block">
                {item.voteCount.toLocaleString()} votos
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}


// ============================================================
// apps/web-client/src/pages/DebatePage.tsx
// ============================================================
export function DebatePage() {
  const MOCK_DEBATES = [
    { id: '1', title: 'Mejores Frameworks Frontend 2026', category: 'Tech', status: 'OPEN', scope: 'GLOBAL', totalVotes: 4200, endDate: '2026-04-10' },
    { id: '2', title: 'Liderazgo Institucional Global', category: 'Política', status: 'OPEN', scope: 'GLOBAL', totalVotes: 12800, endDate: '2026-04-15' },
    { id: '3', title: 'Protocolos de IA más seguros', category: 'Ciencia', status: 'CLOSED', scope: 'GLOBAL', totalVotes: 7600, endDate: '2026-03-30' },
    { id: '4', title: 'Economías post-cripto', category: 'Economía', status: 'OPEN', scope: 'LOCAL', totalVotes: 890, endDate: '2026-04-20' },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-primary/80 font-headline mb-2">
          Muro de Debate
        </p>
        <h1 className="font-headline font-bold text-3xl text-on-surface" style={{ letterSpacing: '-0.02em' }}>
          Debates Activos
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {MOCK_DEBATES.map((d) => (
          <Link key={d.id} to={`/debate/${d.id}`}
            className="bg-surface-container rounded-xl p-6 hover:bg-surface-container-high transition-all border border-transparent hover:border-primary/20 group">
            <div className="flex items-start justify-between mb-4">
              <div className="flex gap-2">
                <span className={`text-xs font-bold px-2 py-1 rounded font-headline ${
                  d.status === 'OPEN' ? 'text-secondary bg-secondary/10' : 'text-on-surface/40 bg-on-surface/10'
                }`}>
                  {d.status === 'OPEN' ? '● Abierto' : '○ Cerrado'}
                </span>
                <span className={`text-xs font-bold px-2 py-1 rounded font-headline ${
                  d.scope === 'GLOBAL' ? 'text-primary bg-primary/10' : 'text-tertiary bg-tertiary/10'
                }`}>
                  {d.scope}
                </span>
              </div>
              <span className="text-xs text-on-surface/40">{d.category}</span>
            </div>
            <h3 className="font-headline font-bold text-on-surface mb-3 group-hover:text-primary transition-colors" style={{ letterSpacing: '-0.01em' }}>
              {d.title}
            </h3>
            <div className="flex items-center justify-between text-xs text-on-surface/50">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">how_to_vote</span>
                {d.totalVotes.toLocaleString()} votos
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">calendar_today</span>
                Cierre: {d.endDate}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}


// ============================================================
// apps/web-client/src/pages/FeedbackPage.tsx
// ============================================================
export function FeedbackPage() {
  const MOCK_REVIEWS = [
    { id: '1', user: 'Auditor_X92', debate: 'Mejores Frameworks 2026', rating: 5, comment: 'El consenso fue impecable. Cada voto verificado con hash.', isAudited: true, date: '2026-04-01' },
    { id: '2', user: 'Validator_88', debate: 'Liderazgo Institucional', rating: 4, comment: 'Excelente trazabilidad en el ledger. Recomendado.', isAudited: true, date: '2026-03-31' },
    { id: '3', user: 'Community_42', debate: 'IA Segura 2026', rating: 5, comment: 'Nunca había visto un sistema tan transparente.', isAudited: false, date: '2026-03-30' },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-primary/80 font-headline mb-2">
          Feedback & Reseñas
        </p>
        <h1 className="font-headline font-bold text-3xl text-on-surface" style={{ letterSpacing: '-0.02em' }}>
          Comunidad
        </h1>
      </div>
      <div className="space-y-4">
        {MOCK_REVIEWS.map((r) => (
          <div key={r.id} className="bg-surface-container rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-headline font-bold text-on-surface text-sm">{r.user}</p>
                <p className="text-xs text-on-surface/40">{r.debate}</p>
              </div>
              <div className="flex items-center gap-2">
                {r.isAudited && (
                  <span className="flex items-center gap-1 text-xs text-secondary bg-secondary/10 px-2 py-1 rounded">
                    <span className="material-symbols-outlined text-xs">verified</span> Auditado
                  </span>
                )}
                <span className="text-xs text-on-surface/40">{r.date}</span>
              </div>
            </div>
            <div className="flex gap-0.5 mb-2">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={`material-symbols-outlined text-sm ${i < r.rating ? 'text-tertiary' : 'text-on-surface/20'}`}>
                  star
                </span>
              ))}
            </div>
            <p className="text-on-surface/70 text-sm">{r.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}


// ============================================================
// apps/web-client/src/pages/InventoryPage.tsx
// ============================================================
export function InventoryPage() {
  const MOCK_OBJECTS = [
    { id: 'o1', name: 'Trofeo Global S-Rank', templateId: 'trophy_s_global', currentValue: 12500, status: 'ACTIVE', isDynamic: false, metadata: { rarity: 'legendary', tier: 'S' } },
    { id: 'o2', name: 'Badge Auditor Elite', templateId: 'badge_auditor', currentValue: 5000, status: 'ACTIVE', isDynamic: true, metadata: { rarity: 'epic', level: 7 } },
    { id: 'o3', name: 'Token Debate Master', templateId: 'token_debate', currentValue: 2800, status: 'ACTIVE', isDynamic: true, metadata: { rarity: 'rare', votes: 450 } },
    { id: 'o4', name: 'Insignia Consenso Global', templateId: 'badge_consensus', currentValue: 1200, status: 'TRANSFORMED', isDynamic: true, metadata: { rarity: 'common', evolving: true } },
  ];

  const RARITY_CFG = {
    legendary: { color: 'text-tertiary', bg: 'bg-tertiary/10', border: 'border-tertiary/30' },
    epic: { color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30' },
    rare: { color: 'text-secondary', bg: 'bg-secondary/10', border: 'border-secondary/30' },
    common: { color: 'text-on-surface/50', bg: 'bg-on-surface/5', border: 'border-on-surface/20' },
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-primary/80 font-headline mb-2">
          Inventario Global
        </p>
        <h1 className="font-headline font-bold text-3xl text-on-surface" style={{ letterSpacing: '-0.02em' }}>
          Objetos Únicos
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {MOCK_OBJECTS.map((obj) => {
          const rarity = (obj.metadata?.rarity as string) || 'common';
          const cfg = RARITY_CFG[rarity as keyof typeof RARITY_CFG] || RARITY_CFG.common;
          return (
            <div key={obj.id} className={`bg-surface-container rounded-xl p-5 border ${cfg.border}`}>
              <div className="flex items-center justify-between mb-4">
                <span className={`text-xs font-bold px-2 py-1 rounded font-headline uppercase ${cfg.color} ${cfg.bg}`}>
                  {rarity}
                </span>
                <span className={`text-xs font-bold font-headline ${obj.isDynamic ? 'text-primary' : 'text-on-surface/40'}`}>
                  {obj.isDynamic ? '⚡ Dinámico' : '🔒 Estático'}
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-2xl text-on-surface/60">
                  {obj.isDynamic ? 'auto_awesome' : 'workspace_premium'}
                </span>
              </div>
              <h3 className="font-headline font-bold text-on-surface text-sm mb-1">{obj.name}</h3>
              <p className="text-xs text-on-surface/40 mb-3 font-headline">{obj.templateId}</p>
              <div className="flex items-center justify-between">
                <span className={`font-headline font-bold text-lg ${cfg.color}`}>
                  {obj.currentValue.toLocaleString()}
                </span>
                <span className="text-xs text-on-surface/40">pts SVP</span>
              </div>
              {obj.status === 'TRANSFORMED' && (
                <div className="mt-2 text-xs text-tertiary bg-tertiary/10 px-2 py-1 rounded font-headline text-center">
                  Transformado
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ============================================================
// apps/web-client/src/pages/NotificationsPage.tsx
// ============================================================
export function NotificationsPage() {
  const MOCK_NOTIFS = [
    { id: '1', type: 'achievement', title: 'Logro Desbloqueado: S-Rank Global', desc: 'Tu debate alcanzó el Tier-S con 94.2% de consenso auditado.', hash: '0x4F...E2', time: 'Hace 2h', read: false },
    { id: '2', type: 'audit', title: 'Ledger Auditado', desc: 'Entrada #0x8A...99 verificada. Firma HMAC válida. +1,500 pts SVP confirmados.', hash: '0x8A...99', time: 'Hace 4h', read: false },
    { id: '3', type: 'svp', title: 'Puntos SVP Confirmados', desc: 'El Dispatcher confirmó 6,000 pts SVP del debate "Frameworks 2026".', hash: '0x22...C1', time: 'Hace 6h', read: true },
    { id: '4', type: 'vote', title: 'Nuevo voto en tu debate', desc: '3,421 nuevos votos registrados en "Liderazgo Institucional".', hash: '0xEF...34', time: 'Hace 8h', read: true },
  ];

  const TYPE_CFG = {
    achievement: { icon: 'workspace_premium', color: 'text-tertiary', bg: 'bg-tertiary/10' },
    audit: { icon: 'verified_user', color: 'text-secondary', bg: 'bg-secondary/10' },
    svp: { icon: 'account_balance', color: 'text-primary', bg: 'bg-primary/10' },
    vote: { icon: 'how_to_vote', color: 'text-on-surface/60', bg: 'bg-on-surface/5' },
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-primary/80 font-headline mb-2">
          Centro de Avisos
        </p>
        <h1 className="font-headline font-bold text-3xl text-on-surface" style={{ letterSpacing: '-0.02em' }}>
          Notificaciones
        </h1>
      </div>

      <div className="space-y-3">
        {MOCK_NOTIFS.map((n) => {
          const cfg = TYPE_CFG[n.type as keyof typeof TYPE_CFG];
          return (
            <div key={n.id} className={`flex gap-4 p-4 rounded-xl transition-all ${
              n.read ? 'bg-surface-container' : 'bg-surface-container border border-primary/20'
            }`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                <span className={`material-symbols-outlined text-lg ${cfg.color}`}>{cfg.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`font-headline font-bold text-sm ${n.read ? 'text-on-surface/60' : 'text-on-surface'}`}>
                    {n.title}
                  </p>
                  <span className="text-xs text-on-surface/40 shrink-0">{n.time}</span>
                </div>
                <p className="text-xs text-on-surface/50 mt-1">{n.desc}</p>
                <p className="text-xs font-mono text-on-surface/30 mt-1">Hash: {n.hash}</p>
              </div>
              {!n.read && <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
