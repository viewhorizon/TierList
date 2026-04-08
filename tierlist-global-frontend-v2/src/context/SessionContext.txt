import { createContext, useContext } from "react";
import type { PropsWithChildren } from "react";
import type { SessionState } from "@/types/contracts";

const defaultSession: SessionState = {
  userId: "demo-owner",
  tenantId: "tierlist-global",
  displayName: "Demo Owner",
  permissions: ["feedback.review", "rankings.vote", "audit.read", "wall.manage"],
};

const SessionContext = createContext<SessionState>(defaultSession);

export function SessionProvider({ children }: PropsWithChildren) {
  return <SessionContext.Provider value={defaultSession}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}