import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { SessionUser, TenantInfo } from "../types";

interface AppContextValue {
  user: SessionUser;
  tenant: TenantInfo;
  can: (permission: string) => boolean;
  switchLocale: (locale: TenantInfo["locale"]) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<TenantInfo>({ id: "tierlist-global", name: "TierList Global", locale: "es" });

  const user: SessionUser = {
    id: "u-42",
    handle: "@tierlist_user",
    name: "Auditor Nvl 42",
    role: "Institutional Moderator",
    permissions: ["debate:create", "debate:moderate", "audit:review", "inventory:transfer"],
  };

  const value = useMemo<AppContextValue>(
    () => ({
      user,
      tenant,
      can: (permission) => user.permissions.includes(permission),
      switchLocale: (locale) => setTenant((prev) => ({ ...prev, locale })),
    }),
    [tenant],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used inside AppProvider");
  }
  return context;
}