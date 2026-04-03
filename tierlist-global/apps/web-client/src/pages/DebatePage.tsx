// src/pages/DebatePage.tsx
// Fiel a: tierlist_muro_layout_progresivo + tierlist_muro_de_consenso_móvil

import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { debatesApi, votesApi } from '../services/api';
import { AuditChip, LiveIndicator, StateWrapper, LedgerHash } from '../components/ui';
import type { Debate } from '../types';

// Posts del Muro fiel al screenshot
const WALL_POSTS = [
  { id: 'p1', author: 'Marcus_V', role: 'Votante Elite', pts: '12.4k', time: 'HACE 2M', content: 'Confirmo que el ajuste de latencia en el Nivel S es intencional. Voto positivo para la recalibración.', likes: 142, replies: 24, verified: true },
  { id: 'p2', author: 'Elena_K', role: 'Votante Activa', pts: '8.2k', time: 'HACE 15M', content: '¿Alguien más está validando el flujo en Nivel B? Mis nodos detectan rotación institucional coordinada.', likes: 89, replies: 12, verified: false },
];

const VOTER_RANKS = [
  { init: 'MV', pts: 15000 }, { init: 'EK', pts: 14200 }, { init: 'NX', pts: 12900 },
  { init: 'MV', pts: 12400 }, { init: 'JD', pts: 8200 }, { init: 'RX', pts: 5100 },
  { init: 'MP', pts: 4800 },
];

const MOCK_DEBATES: Debate[] = [
  { id: 'sl-001', title: 'Voto Cuadrático en Tier-3', description: 'Transición de mayoría simple a modelos cuadráticos para nodos institucionales.', category: 'Gobernanza', scope: 'GLOBAL', status: 'OPEN', participantCount: 42000, startDate: '2026-04-01', endDate: '2026-04-15', configRules: {}, createdBy: '', createdAt: '', totalVotes: 42000 },
  { id: 'sl-002', title: 'Protocolo de Emergencia Tier Central', description: 'Revisión de disparadores automáticos para bloqueo de transacciones sospechosas.', category: 'Seguridad', scope: 'GLOBAL', status: 'OPEN', participantCount: 8000, startDate: '2026-04-02', endDate: '2026-04-20', configRules: {}, createdBy: '', createdAt: '', totalVotes: 8000 },
  { id: 'sl-003', title: 'Descentralización de Nodos Emergentes', description: 'Salvaguardas contra la colusión de pools de staking en el Sudeste Asiático.', category: 'Infraestructura', scope: 'GLOBAL', status: 'OPEN', participantCount: 15600, startDate: '2026-04-01', endDate: '2026-04-30', configRules: {}, createdBy: '', createdAt: '', totalVotes: 15600 },
  { id: 'sl-004', title: 'Reestructuración de Comisiones Layer 2', description: 'La reducción del 15% requiere visualización en tiempo real antes de la votación final.', category: 'Economía', scope: 'LOCAL', status: 'OPEN', participantCount: 3400, startDate: '2026-04-03', endDate: '2026-04-25', configRules: {}, createdBy: '', createdAt: '', totalVotes: 3400 },
];

export default function DebatePage() {
  const [postText, setPostText] = useState('');
  const [markType, setMarkType] = useState<'pin' | 'bubble' | 'sticker'>('pin');
  const { data } = useQuery({ queryKey: ['debates-wall'], queryFn: () => debatesApi.getAll({ status: 'OPEN' }), retry: 1 });
  const debates = data?.data ?? MOCK_DEBATES;

  return (
    <div className="min-h-full bg-surface">
      <div className="max-w-7xl mx-auto px-4 py-5 lg:px-8 grid lg:grid-cols-[1fr_300px] gap-6">

        {/* ── Main wall ── */}
        <div className="space-y-5">

          {/* Header fiel al screenshot */}
          <div className="bg-surface-container rounded-xl p-5 border border-outline-variant/10">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              <span className="text-xs font-headline font-bold text-secondary uppercase tracking-wide">Consenso en Tiempo Real · Activo</span>
            </div>
            <h1 className="font-headline font-bold text-xl text-on-surface mb-1" style={{ letterSpacing: '-0.02em' }}>
              EL MURO DE CONSENSO
            </h1>
            <p className="text-on-surface/50 text-xs leading-relaxed">
              Fija tus posiciones en el libro mayor soberano. Valida el pulso de la infraestructura global mediante votaciones entre pares.
            </p>

            {/* Mark type selector fiel al screenshot */}
            <div className="flex gap-2 mt-4">
              {(['pin', 'bubble', 'sticker'] as const).map((t) => (
                <button key={t} onClick={() => setMarkType(t)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-headline font-bold transition-all border ${
                    markType === t ? 'border-primary bg-primary/10 text-primary' : 'border-outline-variant/20 text-on-surface/40 hover:text-on-surface'
                  }`}>
                  <span className="material-symbols-outlined text-sm">
                    {t === 'pin' ? 'push_pin' : t === 'bubble' ? 'chat_bubble' : 'emoji_emotions'}
                  </span>
                  {t.charAt(0).toUpperCase() + t.slice(1)}s
                </button>
              ))}
            </div>
          </div>

          {/* Compositor de voto */}
          <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/10">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-sm text-on-surface/40">edit_square</span>
              <span className="text-xs font-headline font-bold text-on-surface/50">Deja tu Huella</span>
              <span className="ml-auto text-xs text-on-surface/30 font-headline font-mono">
                2024.05.24 // 14:02 UTC
              </span>
            </div>
            <textarea value={postText} onChange={(e) => setPostText(e.target.value)}
              placeholder="Publica tu posición en el Muro..."
              className="w-full bg-surface-container-high text-on-surface text-sm rounded-lg px-3 py-2 resize-none outline-none placeholder-on-surface/30 border border-transparent focus:border-primary/30 transition-colors"
              rows={3}
              aria-label="Escribe tu posición en el Muro de Debate" />
            <div className="flex justify-end mt-2">
              <button className="flex items-center gap-1.5 bg-primary text-white font-headline font-bold text-xs px-4 py-2 rounded-lg hover:opacity-90 transition-all">
                <span className="material-symbols-outlined text-sm">send</span>
                Publicar Muro
              </button>
            </div>
          </div>

          {/* Consensos recientes — fiel al screenshot */}
          <div>
            <h2 className="font-headline font-bold text-xs uppercase tracking-widest text-on-surface/40 mb-3">
              Consensos Recientes
            </h2>
            <div className="space-y-3">
              {WALL_POSTS.map((post) => (
                <div key={post.id} className="bg-surface-container rounded-xl p-4 border border-outline-variant/10">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-headline font-bold text-primary">
                        {post.author.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-headline font-bold text-on-surface">{post.author}</p>
                        <p className="text-xs text-on-surface/40 font-headline">{post.role} · {post.pts} pts</p>
                      </div>
                    </div>
                    <span className="text-xs text-on-surface/30 font-headline shrink-0">{post.time}</span>
                  </div>
                  <p className="text-sm text-on-surface/80 leading-relaxed mb-3">{post.content}</p>
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-1 text-xs text-on-surface/40 hover:text-secondary transition-colors font-headline">
                      <span className="material-symbols-outlined text-sm">thumb_up</span>
                      {post.likes}
                    </button>
                    <button className="flex items-center gap-1 text-xs text-on-surface/40 hover:text-primary transition-colors font-headline">
                      <span className="material-symbols-outlined text-sm">reply</span>
                      {post.replies}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Debates activos */}
          <div>
            <h2 className="font-headline font-bold text-xs uppercase tracking-widest text-on-surface/40 mb-3">
              Debates Activos · Abiertos
            </h2>
            <div className="space-y-2">
              {debates.slice(0, 4).map((d) => (
                <Link key={d.id} to={`/debate/${d.id}`}
                  className="flex items-center gap-3 bg-surface-container hover:bg-surface-container-high rounded-xl p-3 border border-transparent hover:border-outline-variant/20 transition-all group">
                  <div className={`w-1 h-10 rounded-full shrink-0 ${d.scope === 'GLOBAL' ? 'bg-primary' : 'bg-secondary'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-headline font-bold text-sm text-on-surface group-hover:text-primary transition-colors truncate">{d.title}</p>
                    <p className="text-xs text-on-surface/40">{(d.participantCount ?? 0).toLocaleString()} participantes · {d.category}</p>
                  </div>
                  <AuditChip status="audited" label="AUDITADO" />
                  <span className="material-symbols-outlined text-on-surface/20 shrink-0">chevron_right</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right sidebar — fiel al screenshot ── */}
        <div className="space-y-4 hidden lg:block">

          {/* Filtros institucionales */}
          <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/10">
            <p className="text-xs font-headline font-bold uppercase tracking-widest text-on-surface/30 mb-3">Filtros Institucionales · Niveles de Red</p>
            <div className="space-y-1.5">
              {[
                { icon: 'military_tech', label: 'Nivel S (Global)',  color: 'text-primary' },
                { icon: 'grade',         label: 'Nivel A (Regional)', color: 'text-secondary' },
                { icon: 'star',          label: 'Nivel B (Local)',    color: 'text-tertiary' },
                { icon: 'star_half',     label: 'Nivel C (Privado)', color: 'text-on-surface/40' },
                { icon: 'play_circle',   label: 'Multimedia',         color: 'text-on-surface/40' },
              ].map((f) => (
                <button key={f.label} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-container-high transition-colors text-xs font-headline font-bold ${f.color}`}>
                  <span className="material-symbols-outlined text-sm">{f.icon}</span>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ranking votantes — fiel al screenshot */}
          <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/10">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-headline font-bold uppercase tracking-widest text-on-surface/30">Ranking Votantes</p>
              <span className="material-symbols-outlined text-sm text-on-surface/30">query_stats</span>
            </div>
            <div className="flex gap-2 flex-wrap mb-3">
              {VOTER_RANKS.map((v, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-xs font-headline font-bold text-on-surface/60">
                      {v.init}
                    </div>
                    {/* Bar */}
                    <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-0.5 rounded-full bg-primary"
                      style={{ height: `${(v.pts / 15000) * 24}px` }} />
                  </div>
                  <span className="text-xs text-on-surface/30 font-headline">{(v.pts / 1000).toFixed(1)}k</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-xs text-on-surface/30 font-headline">
              <button><span className="material-symbols-outlined text-sm">chevron_left</span></button>
              <span>Pág 1 / 12</span>
              <button><span className="material-symbols-outlined text-sm">chevron_right</span></button>
            </div>
          </div>

          {/* Métricas */}
          <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/10">
            <p className="text-xs font-headline font-bold uppercase tracking-widest text-on-surface/30 mb-3">Estadísticas del Muro</p>
            <div className="space-y-2">
              {[
                { label: 'Votos Totales', value: '1.24M' },
                { label: 'Tasa de Consenso', value: '98.4%' },
                { label: 'Auditor', value: 'Sovereign_AI_v4' },
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
  );
}
