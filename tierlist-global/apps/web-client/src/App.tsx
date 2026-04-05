import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { useAppContext } from "./context/AppContext";
import { AdminPage } from "./pages/AdminPage";
import { AuditPage } from "./pages/AuditPage";
import { DebateDetailPage } from "./pages/DebateDetailPage";
import { DebatePage } from "./pages/DebatePage";
import { ExplorePage } from "./pages/ExplorePage";
import { FeedbackPage } from "./pages/FeedbackPage";
import { InventoryPage } from "./pages/InventoryPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { RankingsPage } from "./pages/RankingsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { TransferPage } from "./pages/TransferPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function AdminRoute() {
  const { can } = useAppContext();
  if (!can("admin:read")) {
    return <Navigate replace to="/settings?section=security" />;
  }
  return <AdminPage />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <Router>
          <Routes>
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/rankings" element={<RankingsPage />} />
            <Route path="/debate" element={<DebatePage />} />
            <Route path="/debate/:id" element={<DebateDetailPage />} />
            <Route path="/feedback" element={<FeedbackPage />} />
            <Route path="/feedback/:id" element={<DebateDetailPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/transfer" element={<TransferPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/admin" element={<AdminRoute />} />
            <Route path="/audit" element={<AuditPage />} />
            <Route path="*" element={<Navigate replace to="/explore" />} />
          </Routes>
        </Router>
      </AppProvider>
    </QueryClientProvider>
  );
}
