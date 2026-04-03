// src/pages/FeedbackPage.tsx
// Fiel a: tierlist_feedback_y_reseñas_consolidado

import React, { useState } from 'react';
import { AuditChip, LiveIndicator, ConsensusBar } from '../components/ui';

const FILTERS_TIER = ['Todos los Tiers', 'Tier S (Crítico)', 'Tier A (Relevante)', 'Tier B (Observación)'];
const FILTERS_CAT  = ['Todas las Categorías', 'Seguridad', 'Gobernanza', 'Infraestructura'];

const REVIEWS = [
  {
    id: 'r1', author: 'Dr. Aris Thorne', role: 'Senior Auditor', consensus: 98.4, tier: 'S' as const,
    event: '#GSL-2024-089 Protocolo de Descentralización de Nodos en Regiones Emergentes',
    date: '14 OCT 2024 04:22 UTC',
    comment: 'La implementación propuesta carece de salvaguardas contra la colusión de pools de staking en el Sudeste Asiático. Recomiendo una auditoría profunda sobre la latencia de red antes de pasar a la fase 3 de despliegue.',
    likes: 412, replies: 89, status: 'audited' as const,
  },
  {
    id: 'r2', author: 'Elena Vance', role: 'Network Analyst', consensus: 91.1, tier: 'A' as const,
    event: '#FIN-AUD-102 Reestructuración de Comisiones de Transacción en Layer 2',
    date: '12 OCT 2024 21:55 UTC',
    comment: 'La reducción del 15% es bienvenida, pero la estructura de quema de tokens no es clara para los pequeños validadores. Necesitamos visualización de datos en tiempo real antes de la votación final.',
    likes: 1200, replies: 24, status: 'verifying' as const,
  },
  {
    id: 'r3', author: 'Valid-0492', role: 'Anonymous Node', consensus: 64.2, tier: 'C' as const,
    event: '#UX-UPDT-001 Optimización del Dashboard Institucional',
    date: '10 OCT 2024 14:00 UTC',
    comment: 'Los nuevos gráficos de dispersión son demasiado densos para monitores de resolución estándar. Sugiero un modo simplificado.',
    likes: 12, replies: 0, status: 'pending' as const,
  },
];

const TIER_BORDER = { S: 'border-l-primary', A: 'border-l-secondary', B: 'border-l-tertiary', C: 'border-l-on-surface/20' };

export default function FeedbackPage() {
  const [tierFilter, setTierFilter] = useState(0);
  const [catFilter, setCatFilter] = useState(0);

  return (
    <div className="min-h-full bg-surface">
      <div className="max-w-5xl mx-auto px-4 py-6 lg:px-8">

        {/* Header — "Archivo de Consenso v4.2" del screenshot */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-headline font-bold text-on-surface/30">Archivo de Consenso v4.2</span>
          </div>
          <h1 className="font-headline font-bold text-2xl text-on-surface mb-1" style={{ letterSpacing: '-0.02em' }}>
            Feedback y Reseñas
          </h1>
          <p className="text-on-surface/50 text-sm">
            Registro inmutable de comentarios críticos y evaluaciones de la comunidad sobre eventos de consenso global.
          </p>
          <div className="flex items-center gap-3 mt-2">
            <LiveIndicator label="Tasa Global 94.2%" />
            <span className="text-xs text-on-surface/30 font-headline font-mono">2,419 AUDITORES EN LÍNEA</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <div className="flex gap-1 bg-surface-container p-1 rounded-lg">
            {FILTERS_TIER.map((f, i) => (
              <button key={f} onClick={() => setTierFilter(i)}
                className={`px-3 py-1.5 rounded text-xs font-headline font-bold transition-all ${tierFilter === i ? 'bg-primary text-white' : 'text-on-surface/50 hover:text-on-surface'}`}>
                {f}
              </button>
            ))}
          </div>
          <div className="flex gap-1 bg-surface-container p-1 rounded-lg">
            {FILTERS_CAT.map((f, i) => (
              <button key={f} onClick={() => setCatFilter(i)}
                className={`px-3 py-1.5 rounded text-xs font-headline font-bold transition-all ${catFilter === i ? 'bg-primary text-white' : 'text-on-surface/50 hover:text-on-surface'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Reviews — border-l-4 fiel al screenshot */}
        <div className="space-y-4">
          {REVIEWS.map((r) => (
            <div key={r.id} className={`bg-surface-container rounded-xl p-5 border-l-4 ${TIER_BORDER[r.tier]} border border-outline-variant/10`}>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center font-headline font-bold text-sm text-primary shrink-0">
                    {r.author.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-headline font-bold text-on-surface text-sm">{r.author}</p>
                    <p className="text-xs text-on-surface/40">{r.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <AuditChip status={r.status} />
                </div>
              </div>

              {/* Consensus + tier */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-headline font-bold text-on-surface/30">
                  <span className="material-symbols-outlined text-xs align-middle">analytics</span>{' '}
                  {r.consensus}% Consenso
                </span>
                <span className={`text-xs font-headline font-bold px-2 py-0.5 rounded ${
                  r.tier === 'S' ? 'text-primary bg-primary/10' :
                  r.tier === 'A' ? 'text-secondary bg-secondary/10' :
                  r.tier === 'B' ? 'text-tertiary bg-tertiary/10' :
                  'text-on-surface/30 bg-on-surface/5'
                }`}>Tier {r.tier}</span>
              </div>

              {/* Event */}
              <p className="text-xs font-headline text-on-surface/40 mb-2">Evento: {r.event}</p>
              <p className="text-xs text-on-surface/30 font-headline mb-3">{r.date}</p>

              {/* Comment */}
              <blockquote className="text-sm text-on-surface/80 leading-relaxed border-l-2 border-outline-variant/20 pl-3 mb-4 italic">
                "{r.comment}"
              </blockquote>

              {/* Actions */}
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-1.5 text-xs text-on-surface/40 hover:text-secondary transition-colors font-headline">
                  <span className="material-symbols-outlined text-sm">thumb_up</span>
                  {r.likes.toLocaleString()} Acuerdos
                </button>
                <button className="flex items-center gap-1.5 text-xs text-on-surface/40 hover:text-primary transition-colors font-headline">
                  <span className="material-symbols-outlined text-sm">chat_bubble</span>
                  {r.replies} Réplicas
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer del screenshot */}
        <div className="mt-8 pt-4 border-t border-outline-variant/10 text-center">
          <p className="text-xs text-on-surface/20 font-headline">
            © 2024 TierList Ledger · Consensus Protocol v8.4.1 · Audit Latency: 4ms
          </p>
        </div>
      </div>
    </div>
  );
}
