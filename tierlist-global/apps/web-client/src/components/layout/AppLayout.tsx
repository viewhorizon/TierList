// ============================================================
// apps/web-client/src/components/layout/AppLayout.tsx
// Layout principal con navegación funcional entre módulos
// ============================================================

import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';

interface NavItem {
  to: string;
  icon: string;
  label: string;
  badge?: number;
}

const TOP_NAV: NavItem[] = [
  { to: '/explore',       icon: 'explore',       label: 'Explorar' },
  { to: '/rankings',      icon: 'leaderboard',   label: 'Rankings' },
  { to: '/debate',        icon: 'forum',         label: 'Muro de Debate' },
  { to: '/feedback',      icon: 'rate_review',   label: 'Feedback' },
];

const SIDE_NAV_MAIN: NavItem[] = [
  { to: '/explore',       icon: 'language',      label: 'Global Tiers' },
  { to: '/rankings',      icon: 'military_tech', label: 'Rankings S–C' },
  { to: '/debate',        icon: 'hub',           label: 'Muro de Debate' },
  { to: '/feedback',      icon: 'rate_review',   label: 'Feedback' },
  { to: '/inventory',     icon: 'inventory_2',   label: 'Inventario' },
  { to: '/notifications', icon: 'notifications', label: 'Notificaciones', badge: 3 },
];

const SIDE_NAV_ADMIN: NavItem[] = [
  { to: '/admin',         icon: 'admin_panel_settings', label: 'Panel Admin' },
  { to: '/audit',         icon: 'verified_user',        label: 'Auditoría' },
];

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg font-headline text-sm font-bold transition-all ${
      isActive
        ? 'bg-primary/10 text-primary border-r-2 border-primary'
        : 'text-on-surface/50 hover:bg-surface-container hover:text-on-surface'
    }`;

  const topNavClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center h-16 px-1 font-headline tracking-tight font-bold text-sm transition-colors relative ${
      isActive
        ? 'text-primary after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-primary'
        : 'text-on-surface/60 hover:text-on-surface'
    }`;

  return (
    <div className="flex h-screen bg-surface text-on-surface overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-surface-container flex flex-col
        transform transition-transform duration-300
        md:relative md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-outline-variant/20">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-base">podium</span>
          </div>
          <div>
            <span className="font-headline font-bold text-on-surface text-base">TierList</span>
            <span className="text-primary font-bold text-base"> Global</span>
          </div>
        </div>

        {/* Main Nav */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {SIDE_NAV_MAIN.map((item) => (
            <NavLink key={item.to} to={item.to} className={navLinkClass}
              onClick={() => setSidebarOpen(false)}>
              <span className="material-symbols-outlined text-lg">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="bg-primary text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}

          <div className="pt-4 pb-1">
            <p className="px-4 text-xs font-bold uppercase tracking-widest text-on-surface/30">
              Administración
            </p>
          </div>
          {SIDE_NAV_ADMIN.map((item) => (
            <NavLink key={item.to} to={item.to} className={navLinkClass}
              onClick={() => setSidebarOpen(false)}>
              <span className="material-symbols-outlined text-lg">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom links */}
        <div className="px-4 py-4 border-t border-outline-variant/20 space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-2 text-on-surface/50 hover:text-on-surface text-xs font-bold font-headline transition-colors rounded-lg hover:bg-surface-container-high">
            <span className="material-symbols-outlined text-base">settings</span>
            Ajustes
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2 text-on-surface/50 hover:text-on-surface text-xs font-bold font-headline transition-colors rounded-lg hover:bg-surface-container-high">
            <span className="material-symbols-outlined text-base">help_outline</span>
            Soporte
          </button>
        </div>

        {/* User info */}
        <div className="px-4 py-4 border-t border-outline-variant/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-base">account_circle</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-on-surface text-sm font-bold truncate">Auditor</p>
              <p className="text-secondary text-xs truncate">12,450 pts SVP</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center h-16 px-6 bg-surface-container border-b border-outline-variant/20 shrink-0">
          {/* Mobile menu toggle */}
          <button className="md:hidden mr-4 text-on-surface/60 hover:text-on-surface"
            onClick={() => setSidebarOpen(true)}>
            <span className="material-symbols-outlined">menu</span>
          </button>

          {/* Desktop top nav */}
          <nav className="hidden md:flex items-center gap-8 h-full">
            {TOP_NAV.map((item) => (
              <NavLink key={item.to} to={item.to} className={topNavClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex-1" />

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <NavLink to="/notifications"
              className="relative p-2 rounded-lg text-on-surface/60 hover:text-on-surface hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined text-xl">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
            </NavLink>
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-base">account_circle</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
