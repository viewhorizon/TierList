// src/pages/InventoryPage.tsx
// Fiel a: tierlist_inventario_de_objetos_únicos + tierlist_exportación_de_objetos

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '../services/api';
import { AuditChip, LedgerHash, StateWrapper, PageHeader } from '../components/ui';

const MOCK_OBJECTS = [
  {
    id: 'o1', name: 'Vanguardista Supremo 2024', templateId: 'trophy_sovereign_2024',
    description: 'Recompensa única otorgada por completar el ciclo de auditoría del primer cuatrimestre con una precisión del 99.8%.',
    currentValue: 12500, isDynamic: false, status: 'ACTIVE' as const,
    metadata: { rarity: 'legendary', auditHash: '0x882...F92A', tier: 'S', svpActivity: 1250, svpBonus: 450, multiplier: 1.2 },
    createdAt: '14 Mayo 2024, 18:32',
  },
  {
    id: 'o2', name: 'Badge Auditor Elite', templateId: 'badge_auditor_elite',
    description: 'Insignia de alto rango para auditores que superaron 100 validaciones exitosas.',
    currentValue: 5000, isDynamic: true, status: 'ACTIVE' as const,
    metadata: { rarity: 'epic', level: 7, hash: '0xFD...21' },
    createdAt: '12 Mayo 2024, 09:15',
  },
  {
    id: 'o3', name: 'Token de Gobernanza #042', templateId: 'gov_token_042',
    description: 'Token de participación en decisiones institucionales del protocolo.',
    currentValue: 2800, isDynamic: true, status: 'ACTIVE' as const,
    metadata: { rarity: 'rare', hash: '0xCE...99' },
    createdAt: '10 Mayo 2024, 14:00',
  },
];

const RARITY_CFG = {
  legendary: { label: 'Legendario', color: 'text-tertiary',  bg: 'bg-tertiary/10',  border: 'border-tertiary/30',  glow: 'drop-shadow-[0_0_20px_rgba(255,185,95,0.3)]' },
  epic:      { label: 'Épico',      color: 'text-primary',   bg: 'bg-primary/10',   border: 'border-primary/30',   glow: 'drop-shadow-[0_0_20px_rgba(0,82,255,0.3)]' },
  rare:      { label: 'Raro',       color: 'text-secondary', bg: 'bg-secondary/10', border: 'border-secondary/30', glow: '' },
  common:    { label: 'Común',      color: 'text-on-surface/40', bg: 'bg-on-surface/5', border: 'border-on-surface/20', glow: '' },
};

export default function InventoryPage() {
  const [selected, setSelected] = useState<string | null>('o1');

  const selectedObj = MOCK_OBJECTS.find((o) => o.id === selected) ?? MOCK_OBJECTS[0];
  const rarity = (selectedObj.metadata.rarity as string) ?? 'common';
  const cfg = RARITY_CFG[rarity as keyof typeof RARITY_CFG] ?? RARITY_CFG.common;

  const SYNC_HISTORY = [
    { icon: 'check_circle', label: 'Token de Gobernanza TierList #042', sub: 'Auditado • 14 Mayo 2024, 18:32', hash: '0xFD...21', color: 'text-secondary' },
    { icon: 'check_circle', label: 'Certificación: Auditor Senior Elite', sub: 'Auditado • 12 Mayo 2024, 09:15', hash: '0xCE...99', color: 'text-secondary' },
  ];

  return (
    <div className="min-h-full bg-surface">
      <div className="max-w-6xl mx-auto px-4 py-6 lg:px-8 grid lg:grid-cols-[1fr_380px] gap-6">

        {/* ── Left: objeto destacado — fiel al screenshot ── */}
        <div className="space-y-5">
          <PageHeader eyebrow="Inventario Global" title="Transferencia de Activos"
            subtitle="Mueve tus recompensas únicas auditadas al inventario externo de la red institucional." />

          {/* Firma de auditoría */}
          <div className="flex items-center gap-2 text-xs font-headline text-on-surface/40">
            <span className="material-symbols-outlined text-sm text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            <span>Firma de Auditoría TierList:</span>
            <LedgerHash hash={String(selectedObj.metadata.auditHash ?? '0x882...F92A')} full />
          </div>

          {/* Object card — fiel al radial gradient del screenshot */}
          <div className={`relative rounded-2xl p-6 border ${cfg.border} overflow-hidden`}
            style={{ background: `radial-gradient(circle at center, ${rarity === 'legendary' ? 'rgba(255,185,95,0.08)' : rarity === 'epic' ? 'rgba(0,82,255,0.08)' : 'rgba(78,222,163,0.06)'} 0%, transparent 70%), #191f2e` }}>

            {/* Glow orb */}
            <div className="absolute top-6 right-6 w-24 h-24 rounded-full opacity-20"
              style={{ background: rarity === 'legendary' ? '#ffb95f' : rarity === 'epic' ? '#0052ff' : '#4edea3', filter: 'blur(30px)' }} />

            <div className="relative">
              <div className="flex items-start justify-between gap-3 mb-4">
                <span className={`text-xs font-headline font-bold px-2 py-1 rounded uppercase tracking-wide ${cfg.color} ${cfg.bg}`}>
                  {cfg.label}
                </span>
                <span className={`text-xs font-headline font-bold ${selectedObj.isDynamic ? 'text-primary' : 'text-on-surface/40'}`}>
                  {selectedObj.isDynamic ? '⚡ Dinámico' : '🔒 Estático'}
                </span>
              </div>

              <h2 className="font-headline font-bold text-xl text-on-surface mb-2" style={{ letterSpacing: '-0.02em' }}>
                {selectedObj.name}
              </h2>
              <p className="text-on-surface/60 text-sm leading-relaxed mb-5">{selectedObj.description}</p>

              <button className="flex items-center gap-2 bg-primary text-white font-headline font-bold text-sm px-5 py-2.5 rounded-lg hover:opacity-90 transition-all">
                <span className="material-symbols-outlined text-base">ios_share</span>
                Exportar a Inventario
              </button>
            </div>
          </div>

          {/* Estado de red */}
          <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/10">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-sm text-tertiary">pending_actions</span>
              <span className="text-xs font-headline font-bold text-tertiary">Procesando</span>
            </div>
            <p className="text-xs text-on-surface/50">Validando bloques de seguridad en TierList Ledger. Tiempo estimado: 4 min.</p>
          </div>

          {/* SVP breakdown */}
          <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/10">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-sm text-on-surface/40">analytics</span>
              <p className="text-xs font-headline font-bold uppercase tracking-widest text-on-surface/30">Puntos SVP TierList</p>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Actividad de Auditoría', value: `+${selectedObj.metadata.svpActivity ?? 1250}` },
                { label: 'Bonificación de Rango', value: `+${selectedObj.metadata.svpBonus ?? 450}` },
                { label: 'Multiplicador Early Access', value: `x${selectedObj.metadata.multiplier ?? 1.2}` },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="text-xs text-on-surface/50 font-headline">{row.label}</span>
                  <span className="text-xs font-headline font-bold text-secondary">{row.value}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 border-t border-outline-variant/10">
                <span className="text-xs font-headline font-bold text-on-surface">Total Acumulado</span>
                <span className="font-headline font-bold text-base text-secondary">
                  {((selectedObj.metadata.svpActivity as number ?? 1250) + (selectedObj.metadata.svpBonus as number ?? 450)).toLocaleString()} SVP
                </span>
              </div>
            </div>
          </div>

          {/* Detalles hash */}
          <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/10">
            <p className="text-xs font-headline font-bold uppercase tracking-widest text-on-surface/30 mb-3">Detalles de Auditoría TierList</p>
            <div className="space-y-2">
              {[
                { label: 'Hash de Auditoría', value: 'TL_9901_AUDIT_OBJ_EXPORT' },
                { label: 'Destino de Red', value: '0x44B1...C9E2 (Global)' },
                { label: 'Coste de Verificación', value: 'Bonificado (TierList Elite)' },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="text-xs text-on-surface/40 font-headline">{row.label}</span>
                  <span className="text-xs font-mono text-on-surface/60">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sync history */}
          <div>
            <p className="text-xs font-headline font-bold uppercase tracking-widest text-on-surface/30 mb-3">Sincronización del Ledger</p>
            <div className="space-y-2">
              {SYNC_HISTORY.map((h, i) => (
                <div key={i} className="flex items-center gap-3 bg-surface-container rounded-xl p-3 border border-outline-variant/10">
                  <span className={`material-symbols-outlined text-base ${h.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{h.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-headline font-bold text-on-surface truncate">{h.label}</p>
                    <p className="text-xs text-on-surface/40">{h.sub}</p>
                  </div>
                  <LedgerHash hash={h.hash} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: object gallery ── */}
        <div className="space-y-3">
          <p className="text-xs font-headline font-bold uppercase tracking-widest text-on-surface/30">Tus Objetos</p>
          {MOCK_OBJECTS.map((obj) => {
            const r = (obj.metadata.rarity as string) ?? 'common';
            const c = RARITY_CFG[r as keyof typeof RARITY_CFG] ?? RARITY_CFG.common;
            return (
              <button key={obj.id} onClick={() => setSelected(obj.id)}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                  selected === obj.id ? `${c.border} ${c.bg}` : 'border-outline-variant/10 bg-surface-container hover:bg-surface-container-high'
                }`}
                aria-pressed={selected === obj.id}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${c.bg}`}>
                  <span className={`material-symbols-outlined text-lg ${c.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                    {obj.isDynamic ? 'auto_awesome' : 'workspace_premium'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-headline font-bold text-sm truncate ${selected === obj.id ? c.color : 'text-on-surface'}`}>{obj.name}</p>
                  <p className="text-xs text-on-surface/40 font-headline">{obj.isDynamic ? '⚡ Dinámico' : '🔒 Estático'} · {c.label}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`font-headline font-bold text-sm ${c.color}`}>{obj.currentValue.toLocaleString()}</p>
                  <p className="text-xs text-on-surface/30 font-headline">pts SVP</p>
                </div>
              </button>
            );
          })}
          <div className="bg-surface-container rounded-xl p-3 text-center border border-outline-variant/10">
            <span className="text-xs text-on-surface/30 font-headline">Estado de Red TierList: </span>
            <span className="text-xs text-secondary font-headline font-bold">Operacional</span>
          </div>
        </div>
      </div>
    </div>
  );
}
