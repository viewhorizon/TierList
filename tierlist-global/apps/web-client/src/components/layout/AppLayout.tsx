// src/components/layout/AppLayout.tsx
// Layout fiel a los screenshots: sidebar izquierdo + topbar + bottom nav móvil

import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const MAIN_NAV = [
  { to: '/explore',       icon: 'explore',              label: 'Explorar',       labelEn: 'Explore' },
  { to: '/rankings',      icon: 'leaderboard',          label: 'Rankings',       labelEn: 'Rankings' },
  { to: '/debate',        icon: 'forum',                label: 'Muro de Debate', labelEn: 'Debate Wall' },
  { to: '/feedback',      icon: 'rate_review',          label: 'Feedback',       labelEn: 'Feedback' },
  { to: '/inventory',     icon: 'inventory_2',          label: 'Inventario',     labelEn: 'Inventory' },
  { to: '/notifications', icon: 'notifications',        label: 'Notificaciones', badge: 3 },
];

const ADMIN_NAV = [
  { to: '/admin',  icon: 'admin_panel_settings', label: 'Admin' },
  { to: '/audit',  icon: 'verified_user',        label: 'Auditoría' },
];

// Bottom nav mobile (4 principales — fiel a screenshots móvil)
const BOTTOM_NAV = [
  { to: '/explore',   icon: 'explore',      label: 'Explorar' },
  { to: '/rankings',  icon: 'leaderboard',  label: 'Rankings' },
  { to: '/debate',    icon: 'forum',        label: 'Debate' },
  { to: '/feedback',  icon: 'rate_review',  label: 'Feedback' },
];

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();

  const sideLink = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-150 font-headline ${
      isActive
        ? 'bg-primary/10 text-primary border-r-2 border-primary'
        : 'text-on-surface/50 hover:bg-surface-container-high hover:text-on-surface'
    }`;

  const topLink = ({ isActive }: { isActive: boolean }) =>
    `relative flex items-center h-16 px-1 text-sm font-bold font-headline tracking-tight transition-colors ${
      isActive
        ? 'text-primary after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-primary'
        : 'text-on-surface/60 hover:text-on-surface'
    }`;

  const bottomLink = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center gap-0.5 px-3 py-2 transition-colors ${
      isActive ? 'text-primary' : 'text-on-surface/40'
    }`;

  return (
    <div className="flex h-screen bg-surface text-on-surface overflow-hidden">

      {/* ── Sidebar desktop ── */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 bg-surface-container border-r border-outline-variant/10 h-full">

        {/* Logo — fiel a "podium TierList" de los screenshots */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-outline-variant/10">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-white text-base" style={{ fontVariationSettings: "'FILL' 1" }}>podium</span>
          </div>
          <div className="flex items-baseline gap-0">
            <span className="font-headline font-bold text-on-surface text-base" style={{ letterSpacing: '-0.02em' }}>TierList</span>
          </div>
          <span className="ml-auto text-xs text-secondary font-headline font-bold">
            <span className="material-symbols-outlined text-xs align-middle" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span> Live
          </span>
        </div>

        {/* Tier filter labels — aparecen en screenshots */}
        <div className="px-5 py-3 border-b border-outline-variant/10">
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface/30 font-headline mb-2">Tier Filters</p>
          <div className="space-y-1">
            {[
              { icon: 'language',    label: 'Global Tiers',    to: '/explore' },
              { icon: 'map',         label: 'Regional Tiers',  to: '/rankings' },
              { icon: 'trending_up', label: 'Emerging Tiers',  to: '/rankings' },
              { icon: 'history',     label: 'Archived Tiers',  to: '/debate' },
            ].map((f) => (
              <NavLink key={f.label} to={f.to}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-on-surface/50 hover:text-on-surface hover:bg-surface-container-high transition-colors">
                <span className="material-symbols-outlined text-sm">{f.icon}</span>
                <span className="text-xs font-headline">{f.label}</span>
              </NavLink>
            ))}
          </div>
        </div>

        {/* Main nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {MAIN_NAV.map((item) => (
            <NavLink key={item.to} to={item.to} className={sideLink}>
              <span className="material-symbols-outlined text-lg">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {'badge' in item && item.badge && (
                <span className="bg-primary text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}

          <div className="pt-3 pb-1">
            <p className="px-2 text-xs font-bold uppercase tracking-widest text-on-surface/25 font-headline">Admin</p>
          </div>
          {ADMIN_NAV.map((item) => (
            <NavLink key={item.to} to={item.to} className={sideLink}>
              <span className="material-symbols-outlined text-lg">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom utils */}
        <div className="px-3 py-3 border-t border-outline-variant/10 space-y-0.5">
          <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-on-surface/40 hover:text-on-surface hover:bg-surface-container-high transition-colors text-xs font-headline font-bold">
            <span className="material-symbols-outlined text-base">sync</span>Sync Ledger
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-on-surface/40 hover:text-on-surface hover:bg-surface-container-high transition-colors text-xs font-headline font-bold">
            <span className="material-symbols-outlined text-base">settings</span>Settings
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-on-surface/40 hover:text-on-surface hover:bg-surface-container-high transition-colors text-xs font-headline font-bold">
            <span className="material-symbols-outlined text-base">help_outline</span>Support
          </button>
        </div>

        {/* User — fiel a "Level 42 Auditor 12,450 Points" */}
        <div className="px-4 py-3 border-t border-outline-variant/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>account_circle</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-on-surface text-xs font-bold font-headline truncate">
                {user?.displayName ?? user?.email ?? 'Auditor'}
              </p>
              <p className="text-secondary text-xs font-headline truncate">12,450 pts SVP</p>
            </div>
            <button onClick={logout} className="text-on-surface/30 hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined text-base">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar — fiel a screenshots desktop */}
        <header className="h-16 shrink-0 flex items-center px-6 bg-surface-container border-b border-outline-variant/10 gap-6">

          {/* Mobile: logo + hamburger */}
          <button className="md:hidden text-on-surface/60 hover:text-on-surface transition-colors"
            onClick={() => setMobileOpen(true)}>
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="md:hidden flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>podium</span>
            </div>
            <span className="font-headline font-bold text-sm" style={{ letterSpacing: '-0.02em' }}>TierList</span>
          </div>

          {/* Desktop top nav — fiel a "Explore Rankings Debate Wall Feedback" */}
          <nav className="hidden md:flex items-center gap-8 h-full">
            {[
              { to: '/explore', label: 'Explore' },
              { to: '/rankings', label: 'Rankings' },
              { to: '/debate', label: 'Debate Wall' },
              { to: '/feedback', label: 'Feedback' },
            ].map((n) => (
              <NavLink key={n.to} to={n.to} className={topLink}>{n.label}</NavLink>
            ))}
          </nav>

          <div className="flex-1" />

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg text-on-surface/50 hover:text-on-surface hover:bg-surface-container-high transition-colors hidden sm:block">
              <span className="material-symbols-outlined text-xl">search</span>
            </button>
            <button className="p-2 rounded-lg text-on-surface/50 hover:text-on-surface hover:bg-surface-container-high transition-colors hidden sm:block">
              <span className="material-symbols-outlined text-xl">translate</span>
            </button>
            <button className="p-2 rounded-lg text-on-surface/50 hover:text-on-surface hover:bg-surface-container-high transition-colors hidden sm:block">
              <span className="material-symbols-outlined text-xl">dark_mode</span>
            </button>
            <NavLink to="/notifications"
              className="relative p-2 rounded-lg text-on-surface/50 hover:text-on-surface hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined text-xl">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
            </NavLink>
            <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center cursor-pointer hover:bg-primary/25 transition-colors">
              <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>account_circle</span>
            </div>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          <Outlet />
        </main>

        {/* Bottom nav mobile — fiel a screenshots móvil */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-container border-t border-outline-variant/10 flex items-center justify-around px-2 z-40">
          {BOTTOM_NAV.map((item) => (
            <NavLink key={item.to} to={item.to} className={bottomLink}>
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              <span className="text-xs font-headline font-bold">{item.label}</span>
            </NavLink>
          ))}
          <NavLink to="/notifications" className={bottomLink}>
            <span className="material-symbols-outlined text-xl">notifications</span>
            <span className="text-xs font-headline font-bold">Avisos</span>
          </NavLink>
        </nav>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-50 md:hidden" onClick={() => setMobileOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-72 bg-surface-container z-50 md:hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>podium</span>
                </div>
                <span className="font-headline font-bold text-base" style={{ letterSpacing: '-0.02em' }}>TierList</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-on-surface/40 hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
              {[...MAIN_NAV, ...ADMIN_NAV].map((item) => (
                <NavLink key={item.to} to={item.to} className={sideLink} onClick={() => setMobileOpen(false)}>
                  <span className="material-symbols-outlined text-lg">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </aside>
        </>
      )}
    </div>
  );
}
