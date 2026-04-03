// src/components/ui/index.tsx
// Componentes reutilizables del Design System

import React, { ReactNode } from 'react';

// ── Estado de carga / error / vacío ──────────────────────────

interface StateWrapperProps {
  loading?: boolean;
  error?: Error | null;
  empty?: boolean;
  emptyMessage?: string;
  children: ReactNode;
  skeleton?: ReactNode;
}

export function StateWrapper({ loading, error, empty, emptyMessage, children, skeleton }: StateWrapperProps) {
  if (loading) return <>{skeleton ?? <DefaultSkeleton />}</>;
  if (error)   return <ErrorState error={error} />;
  if (empty)   return <EmptyState message={emptyMessage} />;
  return <>{children}</>;
}

function DefaultSkeleton() {
  return (
    <div className="p-6 space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-surface-container rounded-xl h-16 animate-pulse" style={{ opacity: 1 - i * 0.15 }} />
      ))}
    </div>
  );
}

function ErrorState({ error }: { error: Error }) {
  const isAuth    = error.message.includes('autenticado') || error.message.includes('UNAUTHORIZED');
  const isForbid  = error.message.includes('permisos') || error.message.includes('FORBIDDEN');
  const isRate    = error.message.includes('solicitudes') || error.message.includes('RATE');

  const icon = isAuth ? 'lock' : isForbid ? 'block' : isRate ? 'hourglass_empty' : 'error_outline';
  const color = isRate ? 'text-tertiary' : 'text-red-400';

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <span className={`material-symbols-outlined text-4xl ${color}`}>{icon}</span>
      <p className={`font-headline font-bold text-sm ${color}`}>{error.message}</p>
    </div>
  );
}

function EmptyState({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <span className="material-symbols-outlined text-4xl text-on-surface/20">inbox</span>
      <p className="text-on-surface/40 text-sm font-headline">{message ?? 'Sin resultados.'}</p>
    </div>
  );
}

// ── Tier Badge — fiel a colores de los screenshots ────────────

const TIER_CFG = {
  S: { text: 'text-primary',       bg: 'bg-primary/10',      border: 'border-primary/40',      icon: 'military_tech' },
  A: { text: 'text-secondary',     bg: 'bg-secondary/10',    border: 'border-secondary/40',    icon: 'grade' },
  B: { text: 'text-tertiary',      bg: 'bg-tertiary/10',     border: 'border-tertiary/40',     icon: 'star' },
  C: { text: 'text-on-surface/50', bg: 'bg-on-surface/5',    border: 'border-on-surface/20',   icon: 'star_half' },
} as const;

interface TierBadgeProps {
  tier: 'S' | 'A' | 'B' | 'C';
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function TierBadge({ tier, showIcon = true, size = 'md' }: TierBadgeProps) {
  const cfg = TIER_CFG[tier];
  const sizes = { sm: 'text-xs px-1.5 py-0.5', md: 'text-sm px-2.5 py-1', lg: 'text-base px-3 py-1.5' };
  return (
    <span className={`inline-flex items-center gap-1 font-headline font-bold rounded border ${cfg.text} ${cfg.bg} ${cfg.border} ${sizes[size]}`}>
      {showIcon && <span className="material-symbols-outlined" style={{ fontSize: 'inherit' }}>{cfg.icon}</span>}
      Tier-{tier}
    </span>
  );
}

// ── Audit Chip — "AUDITADO" / "VERIFICADO" / "EN PROCESO" ────

interface AuditChipProps {
  status: 'audited' | 'verifying' | 'pending' | 'winner';
  label?: string;
}

export function AuditChip({ status, label }: AuditChipProps) {
  const cfg = {
    audited:   { text: 'text-secondary', bg: 'bg-secondary/10', icon: 'verified',        default: 'AUDITADO' },
    verifying: { text: 'text-tertiary',  bg: 'bg-tertiary/10',  icon: 'sync',            default: 'EN PROCESO' },
    pending:   { text: 'text-on-surface/40', bg: 'bg-on-surface/5', icon: 'schedule',    default: 'PENDIENTE' },
    winner:    { text: 'text-secondary', bg: 'bg-secondary/10', icon: 'workspace_premium', default: 'GANADOR' },
  }[status];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-headline font-bold px-2 py-1 rounded ${cfg.text} ${cfg.bg}`}>
      <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>{cfg.icon}</span>
      {label ?? cfg.default}
    </span>
  );
}

// ── Ledger Hash — 0x4F...E2 style ─────────────────────────────

export function LedgerHash({ hash, full = false }: { hash: string; full?: boolean }) {
  const display = full ? hash : `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  return (
    <span className="font-mono text-xs text-on-surface/30 tracking-wide">{display}</span>
  );
}

// ── Consensus Bar ─────────────────────────────────────────────

export function ConsensusBar({ pct, tier = 'S' }: { pct: number; tier?: 'S' | 'A' | 'B' | 'C' }) {
  const colors = { S: 'bg-primary', A: 'bg-secondary', B: 'bg-tertiary', C: 'bg-on-surface/40' };
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${colors[tier]}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className={`text-xs font-headline font-bold w-10 text-right ${TIER_CFG[tier].text}`}>
        {pct.toFixed(1)}%
      </span>
    </div>
  );
}

// ── Live indicator ────────────────────────────────────────────

export function LiveIndicator({ label = 'Auditado en Vivo' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-headline font-bold text-secondary">
      <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
      {label}
    </span>
  );
}

// ── Page header — patrón común en todos los screenshots ───────

export function PageHeader({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-6 lg:mb-8">
      {eyebrow && (
        <p className="text-xs font-bold uppercase tracking-widest text-primary/80 font-headline mb-2">{eyebrow}</p>
      )}
      <h1 className="font-headline font-bold text-2xl lg:text-3xl text-on-surface" style={{ letterSpacing: '-0.02em' }}>
        {title}
      </h1>
      {subtitle && <p className="text-on-surface/50 text-sm mt-1">{subtitle}</p>}
    </div>
  );
}
