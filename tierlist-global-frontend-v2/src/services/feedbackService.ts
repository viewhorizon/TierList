import { apiRequest, shouldUseMocks } from "@/services/httpClient";
import { mockDebates, mockReviews } from "@/services/mockData";
import type { DebateIssue, FeedbackListResponse, FeedbackReview } from "@/types/contracts";

interface FeedbackFilters {
  page: number;
  pageSize: number;
  topic?: string;
  search?: string;
  rankingState?: DebateIssue["rankingState"] | "";
}

function normalizeIssue(raw: DebateIssue): DebateIssue {
  return {
    ...raw,
    title: raw.title.trim(),
    topic: raw.topic.trim(),
    summary: raw.summary.trim(),
  };
}

export async function getFeedbackIssues(filters: FeedbackFilters): Promise<FeedbackListResponse> {
  if (shouldUseMocks) {
    const search = filters.search?.toLowerCase() ?? "";
    const topic = filters.topic ?? "";
    const rankingState = filters.rankingState ?? "";

    const filtered = mockDebates.filter((item) => {
      const bySearch = item.title.toLowerCase().includes(search) || item.summary.toLowerCase().includes(search);
      const byTopic = topic ? item.topic === topic : true;
      const byRankingState = rankingState ? item.rankingState === rankingState : true;
      return bySearch && byTopic && byRankingState;
    });

    const start = (filters.page - 1) * filters.pageSize;
    const items = filtered.slice(start, start + filters.pageSize).map(normalizeIssue);

    return {
      items,
      total: filtered.length,
      page: filters.page,
      pageSize: filters.pageSize,
    };
  }

  const query = new URLSearchParams({
    page: String(filters.page),
    pageSize: String(filters.pageSize),
    search: filters.search ?? "",
    topic: filters.topic ?? "",
    rankingState: filters.rankingState ?? "",
  });

  const payload = await apiRequest<FeedbackListResponse>(`/feedback?${query.toString()}`);
  return {
    ...payload,
    items: payload.items.map(normalizeIssue),
  };
}

export async function getFeedbackIssueById(id: string): Promise<DebateIssue | null> {
  if (shouldUseMocks) {
    const issue = mockDebates.find((item) => item.id === id);
    return issue ? normalizeIssue(issue) : null;
  }

  const payload = await apiRequest<DebateIssue>(`/feedback/${id}`);
  return normalizeIssue(payload);
}

export async function verifyFeedbackIssue(id: string): Promise<DebateIssue> {
  if (shouldUseMocks) {
    const issue = mockDebates.find((item) => item.id === id);
    if (!issue) {
      throw new Error("No se encontro el debate solicitado");
    }
    issue.verificationPassed = true;
    return normalizeIssue(issue);
  }

  const payload = await apiRequest<DebateIssue>(`/feedback/${id}/verify`, { method: "PUT" });
  return normalizeIssue(payload);
}

export async function validateFeedbackIssue(id: string): Promise<DebateIssue> {
  if (shouldUseMocks) {
    const issue = mockDebates.find((item) => item.id === id);
    if (!issue) {
      throw new Error("No se encontro el debate solicitado");
    }
    issue.validationPassed = true;
    issue.rankingEligible = issue.verificationPassed;
    issue.rankingState = issue.rankingEligible ? "ready" : "not_ready";
    return normalizeIssue(issue);
  }

  const payload = await apiRequest<DebateIssue>(`/feedback/${id}/validate`, { method: "PUT" });
  return normalizeIssue(payload);
}

export async function getFeedbackReviews(): Promise<FeedbackReview[]> {
  if (shouldUseMocks) {
    return mockReviews;
  }
  return apiRequest<FeedbackReview[]>("/feedback/reviews");
}