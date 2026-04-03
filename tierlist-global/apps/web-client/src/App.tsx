// src/App.tsx
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { ApiError } from './services/api';

const ExplorePage       = lazy(() => import('./pages/ExplorePage'));
const RankingsPage      = lazy(() => import('./pages/RankingsPage'));
const DebatePage        = lazy(() => import('./pages/DebatePage'));
const DebateDetailPage  = lazy(() => import('./pages/DebateDetailPage'));
const FeedbackPage      = lazy(() => import('./pages/FeedbackPage'));
const InventoryPage     = lazy(() => import('./pages/InventoryPage'));
const AdminPage         = lazy(() => import('./pages/AdminPage'));
const AuditPage         = lazy(() => import('./pages/AuditPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        if (error instanceof ApiError) {
          // No reintentar en 401, 403, 404, 409
          if ([401, 403, 404, 409].includes(error.status)) return false;
          // Reintentar máx 2 veces en 429, 500
          if ([429, 500].includes(error.status)) return failureCount < 2;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
  },
});

function Loader() {
  return (
    <div className="flex items-center justify-center h-screen bg-surface">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs font-headline font-bold text-on-surface/30 uppercase tracking-widest">Sincronizando Ledger</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
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
      </AuthProvider>
    </QueryClientProvider>
  );
}
