export type ApiHttpStatus = 401 | 403 | 404 | 409 | 429 | 500;

export interface ApiErrorShape {
  status: number;
  message: string;
}

export type CycleStageKey =
  | "issue_verification"
  | "issue_validation"
  | "formal_debate"
  | "debate_verification"
  | "debate_validation"
  | "ranking_vote"
  | "vote_verification"
  | "vote_validation"
  | "awards_delivery"
  | "database_register";

export type CycleStageStatus = "pending" | "active" | "complete" | "blocked";

export interface CycleStage {
  key: CycleStageKey;
  label: string;
  status: CycleStageStatus;
  owner: string;
  updatedAt: string;
}

export interface DebateIssue {
  id: string;
  title: string;
  topic: string;
  region: string;
  participants: number;
  createdAt: string;
  creatorId?: string;
  verificationPassed: boolean;
  validationPassed: boolean;
  rankingEligible: boolean;
  rankingState: "not_ready" | "ready" | "voting" | "closed";
  rankingType?: "competitors" | "goal";
  coverImageUrl?: string;
  rewardObjectName?: string;
  rewardApprovalVotes?: number;
  rewardDelivery?: "market_svp" | "inventory" | "decide_at_close";
  summary: string;
}

export interface FeedbackReview {
  id: string;
  author: string;
  score: number;
  message: string;
  createdAt: string;
}

export interface FeedbackListResponse {
  items: DebateIssue[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DebateWallPost {
  id: string;
  userId: string;
  author: string;
  text: string;
  tags: string[];
  x: number;
  y: number;
  color: "blue" | "indigo" | "emerald" | "violet";
  updatedAt: string;
}

export interface RankingItem {
  issueId: string;
  title: string;
  topic: string;
  imageUrl?: string;
  summary?: string;
  rewardObjectName?: string;
  rewardApprovalVotes?: number;
  rewardDelivery?: "market_svp" | "inventory" | "decide_at_close";
  stateLabel: string;
  rankingState: "ready" | "voting" | "closed";
  voteMode?: "competitors" | "goal";
  voteGoal?: number;
  voteWindowHours?: number;
  competitors?: RankingCompetitor[];
  myGoalStars?: 1 | 2 | 3 | 4 | 5;
  votes: {
    first: number;
    second: number;
    third: number;
  };
  myVote?: 1 | 2 | 3;
}

export interface RankingCompetitor {
  id: string;
  name: string;
  team?: string;
  tier?: 1 | 2 | 3 | 4 | 5;
}

export interface AuditSummary {
  cycle: CycleStage[];
  trackedDebates: number;
  openAlerts: number;
  svpTraceability: number;
}

export interface SessionState {
  userId: string;
  tenantId: string;
  displayName: string;
  permissions: string[];
}

export type SvpActivityType = "vote_result" | "achievement_unlock" | "object_mutation";

export interface SvpEventMetadata {
  rank?: number;
  votesReceived?: number;
  category?: string;
  [key: string]: string | number | boolean | null | undefined;
}

export interface SvpEventPayload {
  eventId: string;
  sourceApp: "tierlist-global";
  sourceEnv: "dev" | "staging" | "prod";
  userId: string;
  activityType: SvpActivityType;
  activityId: string;
  score: number;
  unit: string;
  metadata: SvpEventMetadata;
  occurredAt: string;
}

export interface SvpEventAck {
  accepted: boolean;
  eventId: string;
  receivedAt: string;
  idempotencyKey?: string;
}