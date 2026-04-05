export type Tier = "S" | "A" | "B" | "C";

export type DebateStatus = "VERIFICADO" | "AUDITORIA" | "FINALIZADO" | "BORRADOR";

export type DebateCycleStage =
  | "VERIFICACION_INICIAL"
  | "VALIDACION_INICIAL"
  | "DEBATE_FORMAL"
  | "VERIFICACION_RESULTADO_DEBATE"
  | "VALIDACION_RESULTADO_DEBATE"
  | "VOTACION_RANKING"
  | "VERIFICACION_VOTOS"
  | "VALIDACION_VOTOS"
  | "REGISTRO_RESULTADOS"
  | "ENTREGA_LOGROS";

export interface DebateSummary {
  id: string;
  title: string;
  description: string;
  participants: number;
  status: DebateStatus;
  trend?: string;
}

export interface ExploreData {
  stats: Array<{ label: string; value: string; tone: "blue" | "green" | "amber" | "slate"; note?: string }>;
  debates: DebateSummary[];
}

export interface RankingAsset {
  id: string;
  debateId: string;
  name: string;
  tier: Tier;
  category: string;
  consensus: number;
  validation: "VERIFICADO" | "AUDITANDO" | "PENDIENTE";
  debateStage: DebateCycleStage;
}

export interface RankingsData {
  hero: {
    name: string;
    tier: Tier;
    consensus: number;
    participants: string;
  };
  list: RankingAsset[];
}

export interface FeedbackEntry {
  id: string;
  author: string;
  role: string;
  tier: Tier;
  title: string;
  quote: string;
  likes: number;
  replies: number;
  status: "AUDITADO" | "EN PROCESO" | "ARCHIVADO";
}

export interface InventoryItem {
  id: string;
  name: string;
  rarity: "S-TIER RARE" | "LEGENDARY" | "UNIQUE";
  value: string;
  description: string;
}

export interface AuditEvent {
  id: string;
  title: string;
  timestamp: string;
  uuid: string;
  hash: string;
  tone: "blue" | "amber" | "green" | "slate";
}

export interface NotificationItem {
  id: string;
  label: string;
  date: string;
  status: string;
  tx: string;
  category: "system" | "debates" | "transfer";
}

export type DebateWallTool = "pin" | "sticker" | "bubble";

export type DebateWallLayer = "1" | "2" | "3";

export type DebateWallCategory = "informacion" | "importante" | "detalle" | "advertencia" | "nota";

export type DebateWallColorMode = "auto" | "theme" | "custom";

export type DebateWallShape = "normal" | "nube" | "burbuja" | "etiqueta" | "cinta";

export type DebateWallStyle = "glass" | "blur" | "sepia" | "dark" | "transparente";

export type DebateWallTemplate = "estandar" | "minimal" | "tarjeta" | "moderno" | "elegante";

export interface DebateWallPalette {
  background: string;
  border: string;
  title: string;
  body: string;
}

export interface DebateWallPosition {
  left: number;
  top: number;
}

export interface DebateWallNode {
  id: string;
  containerId: string;
  type: DebateWallTool;
  icon: string;
  title: string;
  message: string;
  label: string;
  position: DebateWallPosition;
  tone: "blue" | "amber" | "green" | "slate";
  layer: DebateWallLayer;
  category: DebateWallCategory;
  createdBy: string;
  timestamp: string;
  colorMode: DebateWallColorMode;
  shape: DebateWallShape;
  style: DebateWallStyle;
  template: DebateWallTemplate;
  palette: DebateWallPalette;
  votes: number;
  locked?: boolean;
}

export type DebateWallStore = Record<string, DebateWallNode>;

export interface DebateWallComment {
  id: string;
  author: string;
  role: string;
  content: string;
  createdAt: string;
  layer: DebateWallLayer;
  nodeId?: string;
}

export interface DebateWallVoter {
  id: string;
  name: string;
  handle: string;
  active: boolean;
  avatar?: string;
}

export interface DebateWallData {
  nodes: DebateWallNode[];
  comments: DebateWallComment[];
  voters: DebateWallVoter[];
  activeUsers: number;
}

export interface DebateAnnotationsPayload {
  debateId: string;
  tagsData: DebateWallStore;
  updatedAt: string;
}

export interface DebateLifecycle {
  debateId: string;
  assetName: string;
  stage: DebateCycleStage;
  status: "PENDIENTE" | "EN CURSO" | "VERIFICADO";
  auditStatus: "EN MONITOREO" | "OBSERVADO" | "INTEGRO";
  participants: string;
  summary: string;
  timeline: Array<{
    key: DebateCycleStage;
    label: string;
    state: "done" | "current" | "pending";
  }>;
  voting?: Array<{ label: string; value: number; color: string }>;
}

export type DebateWallEventType = "node_created" | "node_moved" | "node_deleted" | "nodes_imported";

export interface DebateWallEvent {
  id: string;
  type: DebateWallEventType;
  message: string;
  timestamp: string;
}

export interface SessionUser {
  id: string;
  handle: string;
  name: string;
  role: string;
  permissions: string[];
}

export interface TenantInfo {
  id: string;
  name: string;
  locale: "es" | "en";
}