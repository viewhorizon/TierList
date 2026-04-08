import { apiRequest, shouldUseMocks } from "@/services/httpClient";
import { mockDebates, mockRanking } from "@/services/mockData";
import type { DebateIssue, RankingItem } from "@/types/contracts";

type RankingApiItem = Omit<RankingItem, "rankingState"> & { rankingState?: RankingItem["rankingState"] };

function inferRankingState(stateLabel: string): RankingItem["rankingState"] {
  const text = stateLabel.toLowerCase();
  if (text.includes("cerr")) {
    return "closed";
  }
  if (text.includes("abierta") || text.includes("abierto") || text.includes("votacion")) {
    return "voting";
  }
  return "ready";
}

function normalizeRankingItem(item: RankingApiItem): RankingItem {
  const totalVotes = item.votes.first + item.votes.second + item.votes.third;
  return {
    ...item,
    title: item.title.trim(),
    topic: item.topic.trim(),
    imageUrl: item.imageUrl?.trim(),
    rankingState: item.rankingState ?? inferRankingState(item.stateLabel),
    voteMode: item.voteMode ?? "competitors",
    voteGoal: item.voteGoal ?? (item.voteMode === "goal" ? Math.max(500, totalVotes + 100) : undefined),
    voteWindowHours: item.voteWindowHours ?? 72,
    summary: item.summary?.trim() ?? "",
  };
}

function stateLabelFromIssue(issue: DebateIssue): string {
  if (issue.rankingState === "voting") return "Votacion abierta";
  if (issue.rankingState === "ready") return "Listo para votar";
  return "Votacion cerrada";
}

function rankingFromDebate(issue: DebateIssue): RankingItem {
  return normalizeRankingItem({
    issueId: issue.id,
    title: issue.title,
    topic: issue.topic,
    imageUrl: issue.coverImageUrl,
    summary: issue.summary,
    rewardObjectName: issue.rewardObjectName,
    rewardApprovalVotes: issue.rewardApprovalVotes,
    rewardDelivery: issue.rewardDelivery,
    stateLabel: stateLabelFromIssue(issue),
    rankingState: issue.rankingState === "not_ready" ? "ready" : issue.rankingState,
    voteMode: issue.rankingType ?? "competitors",
    voteGoal: issue.rewardApprovalVotes,
    voteWindowHours: 72,
    votes: {
      first: Math.floor(issue.participants * 0.42),
      second: Math.floor(issue.participants * 0.31),
      third: Math.floor(issue.participants * 0.22),
    },
  });
}

export async function getRankings(): Promise<RankingItem[]> {
  if (shouldUseMocks) {
    const fromDebates = mockDebates
      .filter((issue) => issue.rankingEligible)
      .map(rankingFromDebate)
      .filter((issue) => !mockRanking.some((existing) => existing.issueId === issue.issueId));

    return [...mockRanking.map(normalizeRankingItem), ...fromDebates];
  }

  const payload = await apiRequest<RankingApiItem[]>("/rankings");
  return payload.map(normalizeRankingItem);
}

export async function submitRankingVote(issueId: string, position: 1 | 2 | 3): Promise<RankingItem> {
  if (shouldUseMocks) {
    const target = mockRanking.find((item) => item.issueId === issueId);
    if (!target) {
      throw new Error("El asunto no esta disponible para votar");
    }

    target.myVote = position;
    if (position === 1) {
      target.votes.first += 1;
    }
    if (position === 2) {
      target.votes.second += 1;
    }
    if (position === 3) {
      target.votes.third += 1;
    }
    return normalizeRankingItem(target);
  }

  const payload = await apiRequest<RankingApiItem>(`/rankings/${issueId}/vote`, {
    method: "POST",
    body: JSON.stringify({ position }),
  });
  return normalizeRankingItem(payload);
}

export async function submitGoalVote(issueId: string, stars: 1 | 2 | 3 | 4 | 5): Promise<RankingItem> {
  if (shouldUseMocks) {
    const target = mockRanking.find((item) => item.issueId === issueId);
    if (!target) {
      throw new Error("El asunto no esta disponible para votar");
    }

    target.votes.first += 1;
    target.myGoalStars = stars;
    return normalizeRankingItem(target);
  }

  const payload = await apiRequest<RankingApiItem>(`/rankings/${issueId}/goal-vote`, {
    method: "POST",
    body: JSON.stringify({ support: true, stars }),
  });
  return normalizeRankingItem(payload);
}

export async function submitCompetitiveTierlist(
  issueId: string,
  placements: Record<string, 1 | 2 | 3 | 4 | 5 | null>,
): Promise<RankingItem> {
  if (shouldUseMocks) {
    const target = mockRanking.find((item) => item.issueId === issueId);
    if (!target) {
      throw new Error("El asunto no esta disponible para votar");
    }

    if (target.competitors?.length) {
      target.competitors = target.competitors.map((competitor) => ({
        ...competitor,
        tier: placements[competitor.id] ?? undefined,
      }));
      target.votes.first += 1;
    }
    return normalizeRankingItem(target);
  }

  const payload = await apiRequest<RankingApiItem>(`/rankings/${issueId}/tierlist`, {
    method: "POST",
    body: JSON.stringify({ placements }),
  });
  return normalizeRankingItem(payload);
}