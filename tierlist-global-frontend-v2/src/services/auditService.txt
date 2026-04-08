import { apiRequest, shouldUseMocks } from "@/services/httpClient";
import { mockAudit } from "@/services/mockData";
import type { AuditSummary } from "@/types/contracts";

export async function getAuditSummary(): Promise<AuditSummary> {
  if (shouldUseMocks) {
    return mockAudit;
  }
  return apiRequest<AuditSummary>("/audit/summary");
}