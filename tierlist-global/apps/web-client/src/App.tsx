// ============================================================
// apps/web-client/src/App.tsx
// Router principal — TierList Global
// ============================================================

import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './components/layout/AppLayout';

// Lazy-loaded pages
const ExplorePage      = lazy(() => import('./pages/ExplorePage'));
const RankingsPage     = lazy(() => import('./pages/RankingsPage'));
const DebatePage       = lazy(() => import('./pages/DebatePage'));
const FeedbackPage     = lazy(() => import('./pages/FeedbackPage'));
const InventoryPage    = lazy(() => import('./pages/InventoryPage'));
const AdminPage        = lazy(() => import('./pages/AdminPage'));
const AuditPage        = lazy(() => import('./pages/AuditPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const DebateDetailPage = lazy(() => import('./pages/DebateDetailPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 2, refetchOnWindowFocus: false },
  },
});

const Loader = () => (
  <div className="flex items-center justify-center h-screen bg-surface">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-on-surface/60 text-sm font-headline tracking-wider uppercase">Cargando</p>
    </div>
  </div>
);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<Loader />}>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Navigate to="/explore" replace />} />
              <Route path="explore"       element={<ExplorePage />} />
              <Route path="rankings"      element={<RankingsPage />} />
              <Route path="debate"        element={<DebatePage />} />
              <Route path="debate/:id"    element={<DebateDetailPage />} />
              <Route path="feedback"      element={<FeedbackPage />} />
              <Route path="inventory"     element={<InventoryPage />} />
              <Route path="admin"         element={<AdminPage />} />
              <Route path="audit"         element={<AuditPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
