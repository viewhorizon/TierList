// src/pages/NotificationsPage.tsx
// Fiel a: tierlist_notificaciones_de_logros

import React from 'react';
import { LedgerHash } from '../components/ui';

const TRANSACTIONS = [
  { ts: '2023-11-24 14:02:11', event: 'Reward Distribution: Consensus reached on #82,109', hash: '0xbfd3...7742' },
  { ts: '2023-11-24 13:45:02', event: 'Multiplier Trigger: Activity burst detected (x2.5)', hash: '0xae44...119c' },
  { ts: '2023-11-24 12:30:58', event: "Item Unlock: 'Sentinel of Data' rare skin applied",  hash: '0x992b...d33a' },
];

const WEEKLY_BARS = [40, 60, 45, 80, 70, 55, 90]; // Mon–Sun
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function NotificationsPage() {
  return (
    <div className="min-h-full bg-surface">
      <div className="max-w-4xl mx-auto px-4 py-6 lg:px-8 grid lg:grid-cols-[1fr_300px] gap-6">

        {/* ── Left main ── */}
        <div className="space-y-5">

          {/* Multiplier card — fiel al screenshot */}
          <div className="bg-surface-container rounded-xl p-5 border border-primary/20 relative overflow-hidden">
            <div className="absolute inset-0 opacity-5"
              style={{ background: 'radial-gradient(circle at top right, #0052ff, transparent 60%)' }} />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-base text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                <span className="text-xs font-headline font-bold text-tertiary uppercase tracking-wide">
                  Multiplicador de Actividad Activo x2.5 · Protocol Boost
                </span>
              </div>
              <p className="text-on-surface/60 text-sm leading-relaxed mb-3">
                Su participación en las TierLists de Gobernanza ha disparado su factor de recompensa. El multiplicador expira en{' '}
                <span className="font-mono text-tertiary font-bold">04:22:15</span>.
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs font-headline text-on-surface/40">Transaction Hash</span>
                <LedgerHash hash="0x88f2...9a21" full />
                <button className="text-xs font-headline font-bold text-primary hover:opacity-80 transition-opacity uppercase tracking-wide flex items-center gap-1">
                  AUDIT TRAIL
                  <span className="material-symbols-outlined text-xs">open_in_new</span>
                </button>
              </div>
            </div>
          </div>

          {/* Consensus sealed */}
          <div className="bg-surface-container rounded-xl p-4 border border-secondary/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-base text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              <span className="font-headline font-bold text-sm text-secondary">Consenso Alcanzado · Bloque #82,109 · Auditado</span>
            </div>
            <p className="text-on-surface/60 text-sm">
              La TierList global de 'Seguridad Nacional' ha sido sellada por el protocolo. <span className="font-bold text-secondary">98.2% Acuerdo</span>
            </p>
          </div>

          {/* Last rewards */}
          <div>
            <p className="text-xs font-headline font-bold uppercase tracking-widest text-on-surface/30 mb-3">Últimas Recompensas</p>
            <div className="space-y-2">
              {[
                { icon: 'deployed_code', color: 'text-primary bg-primary/10', label: 'Nuevo Objeto Desbloqueado', time: 'Hace 2m', desc: 'Avatar: Centinela de Datos', hash: 'c022...f9e1' },
                { icon: 'military_tech', color: 'text-tertiary bg-tertiary/10', label: 'Ascenso de Rango', time: 'Hace 1h', desc: 'Auditor de Clase III', hash: '' },
              ].map((r) => (
                <div key={r.label} className="flex items-start gap-3 bg-surface-container rounded-xl p-4 border border-outline-variant/10">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${r.color}`}>
                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>{r.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-headline font-bold text-sm text-on-surface">{r.label}</p>
                      <span className="text-xs text-on-surface/30 font-headline shrink-0">{r.time}</span>
                    </div>
                    <p className="text-xs text-on-surface/50 mt-0.5">{r.desc}</p>
                    {r.hash && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-xs text-on-surface/30 font-headline font-mono">HASH: {r.hash}</span>
                        <button className="text-xs text-primary font-headline font-bold hover:opacity-80 transition-opacity">Ver Audit</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transaction log table — fiel al screenshot */}
          <div>
            <p className="text-xs font-headline font-bold uppercase tracking-widest text-on-surface/30 mb-3">Registro de Transacciones Recientes</p>
            <div className="bg-surface-container rounded-xl overflow-hidden border border-outline-variant/10">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-outline-variant/10">
                    {['Timestamp', 'Evento de Protocolo', 'Hash de Bloque', 'Acción'].map((h) => (
                      <th key={h} className="px-3 py-2.5 text-left text-xs font-headline font-bold text-on-surface/30 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TRANSACTIONS.map((tx, i) => (
                    <tr key={i} className="border-b border-outline-variant/5 hover:bg-surface-container-high transition-colors">
                      <td className="px-3 py-2.5 text-xs font-mono text-on-surface/40 whitespace-nowrap">{tx.ts}</td>
                      <td className="px-3 py-2.5 text-xs text-on-surface/70 max-w-xs">{tx.event}</td>
                      <td className="px-3 py-2.5"><LedgerHash hash={tx.hash} /></td>
                      <td className="px-3 py-2.5">
                        <button className="text-xs font-headline font-bold text-primary hover:opacity-80 transition-opacity">Audit Trail</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <div className="space-y-4">
          {/* User card */}
          <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/10 text-center">
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
              <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>account_circle</span>
            </div>
            <p className="font-headline font-bold text-on-surface text-sm">Usuario de la Legión</p>
            <p className="text-xs text-primary font-headline font-bold">Nivel 42 · Sovereign Ledger</p>
          </div>

          {/* Weekly chart — fiel al screenshot */}
          <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/10">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-headline font-bold uppercase tracking-widest text-on-surface/30">Métricas de Recompensa</p>
              <span className="text-xs font-headline font-bold text-secondary">+14.2% Global Yield</span>
            </div>
            <div className="flex items-end gap-1 h-16">
              {WEEKLY_BARS.map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="w-full rounded-t" style={{ height: `${h}%`, background: h === Math.max(...WEEKLY_BARS) ? '#0052ff' : '#242a39' }} />
                  <span className="text-xs text-on-surface/20 font-headline">{DAYS[i]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
