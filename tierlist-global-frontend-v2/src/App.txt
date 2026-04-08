import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { SessionProvider } from "@/context/SessionContext";
import { AdminPage } from "@/pages/AdminPage";
import { AuditPage } from "@/pages/AuditPage";
import { DebateDetailPage } from "@/pages/DebateDetailPage";
import { DebateWallPage } from "@/pages/DebateWallPage";
import { ExplorePage } from "@/pages/ExplorePage";
import { FeedbackDetailPage } from "@/pages/FeedbackDetailPage";
import { FeedbackPage } from "@/pages/FeedbackPage";
import { InventoryPage } from "@/pages/InventoryPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { NotificationsPage } from "@/pages/NotificationsPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { RankingsPage } from "@/pages/RankingsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { TransferPage } from "@/pages/TransferPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 20_000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/" element={<Navigate to="/explore" replace />} />
              <Route path="/explore" element={<ExplorePage />} />
              <Route path="/rankings" element={<RankingsPage />} />
              <Route path="/debate" element={<DebateWallPage />} />
              <Route path="/debate/:id" element={<DebateDetailPage />} />
              <Route path="/feedback" element={<FeedbackPage />} />
              <Route path="/feedback/:id" element={<FeedbackDetailPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/transfer" element={<TransferPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/audit" element={<AuditPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </SessionProvider>
    </QueryClientProvider>
  );
}
