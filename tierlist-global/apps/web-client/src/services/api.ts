import type {
  AuditEvent,
  DebateAnnotationsPayload,
  DebateLifecycle,
  DebateWallData,
  DebateWallStore,
  ExploreData,
  FeedbackEntry,
  InventoryItem,
  NotificationItem,
  RankingsData,
} from "../types";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const annotationsStorage = new Map<string, DebateWallStore>();
const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";

type UnknownRecord = Record<string, unknown>;

export class ApiError extends Error {
  constructor(public status: 401 | 403 | 404 | 409 | 429 | 500, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function safeRequest<T>(factory: () => T): Promise<T> {
  await delay(180);
  return factory();
}

function toApiError(status: number, fallbackMessage: string): ApiError {
  const normalized = [401, 403, 404, 409, 429, 500].includes(status) ? status : 500;
  return new ApiError(normalized as 401 | 403 | 404 | 409 | 429 | 500, fallbackMessage);
}

function isDebateWallStore(value: unknown): value is DebateWallStore {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeAnnotationsPayload(debateId: string, payload: unknown): DebateAnnotationsPayload {
  if (!payload || typeof payload !== "object") {
    return { debateId, tagsData: {}, updatedAt: new Date().toISOString() };
  }
  const record = payload as UnknownRecord;
  const responseDebateId = typeof record.debateId === "string" ? record.debateId : debateId;
  const tagsData = isDebateWallStore(record.tagsData) ? record.tagsData : {};
  const updatedAt = typeof record.updatedAt === "string" ? record.updatedAt : new Date().toISOString();

  return {
    debateId: responseDebateId,
    tagsData,
    updatedAt,
  };
}

async function requestDebateAnnotationsRemote(
  debateId: string,
  method: "GET" | "PUT",
  tagsData?: DebateWallStore,
): Promise<DebateAnnotationsPayload> {
  if (!API_BASE_URL) {
    throw new ApiError(500, "VITE_API_URL no configurado");
  }

  const response = await fetch(`${API_BASE_URL}/api/debates/${debateId}/annotations`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: method === "PUT" ? JSON.stringify({ debateId, tagsData }) : undefined,
  });

  if (!response.ok) {
    throw toApiError(response.status, `Error al ${method === "GET" ? "cargar" : "guardar"} anotaciones`);
  }

  const payload = (await response.json()) as unknown;
  return normalizeAnnotationsPayload(debateId, payload);
}

export async function fetchExploreData(): Promise<ExploreData> {
  return safeRequest(() => ({
    stats: [
      { label: "Debates activos", value: "1,429", tone: "blue", note: "+12%" },
      { label: "Consenso global", value: "88.4%", tone: "amber", note: "Estable" },
      { label: "Tiers verificados", value: "24", tone: "green", note: "Total: 32" },
      { label: "Auditoria ledger", value: "99.9", tone: "slate", note: "Inmune" },
    ],
    debates: [
      {
        id: "SL-2024-001",
        title: "Implementacion de Voto Cuadratico en Tier-3",
        description:
          "Debate formal sobre la transicion de sistemas de mayoria simple a modelos cuadraticos para evitar la concentracion.",
        participants: 42000,
        status: "VERIFICADO",
      },
      {
        id: "SL-2024-002",
        title: "Protocolo de Emergencia: Tier Central",
        description: "Revision de disparadores automaticos para bloqueo transaccional en eventos de latencia regional.",
        participants: 8000,
        status: "AUDITORIA",
      },
      {
        id: "SL-2024-005",
        title: "Expansion de Nodos: America Latina",
        description: "Activacion de cuatro centros soberanos para reducir la dependencia de infraestructura externa.",
        participants: 104000,
        status: "FINALIZADO",
        trend: "Aprobado (92%)",
      },
      {
        id: "SL-2024-009",
        title: "Actualizacion del Manifiesto Sovereign",
        description: "Debate preliminar sobre inclusion de principios de etica IA en el contrato fundamental.",
        participants: 0,
        status: "BORRADOR",
      },
    ],
  }));
}

export async function fetchRankingsData(): Promise<RankingsData> {
  return safeRequest(() => ({
    hero: { name: "Ethereum Core", tier: "S", consensus: 98, participants: "2.4M" },
    list: [
      {
        id: "1",
        debateId: "sl-982-ax",
        name: "Solana Network",
        tier: "A",
        category: "L1 monolitica",
        consensus: 88.2,
        validation: "VERIFICADO",
        debateStage: "VOTACION_RANKING",
      },
      {
        id: "2",
        debateId: "sl-441-tq",
        name: "Circle (USDC)",
        tier: "A",
        category: "Dolar digital",
        consensus: 85.4,
        validation: "AUDITANDO",
        debateStage: "VERIFICACION_INICIAL",
      },
      {
        id: "3",
        debateId: "sl-009-bv",
        name: "Uniswap Protocol",
        tier: "B",
        category: "AMM",
        consensus: 72.1,
        validation: "VERIFICADO",
        debateStage: "DEBATE_FORMAL",
      },
      {
        id: "4",
        debateId: "sl-771-qn",
        name: "Metamask Wallet",
        tier: "C",
        category: "Wallet Web3",
        consensus: 58.9,
        validation: "PENDIENTE",
        debateStage: "REGISTRO_RESULTADOS",
      },
    ],
  }));
}

export async function fetchDebateLifecycle(debateId: string): Promise<DebateLifecycle> {
  return safeRequest(() => {
    const map: Record<string, DebateLifecycle> = {
      "sl-982-ax": {
        debateId: "sl-982-ax",
        assetName: "Solana Network",
        stage: "VOTACION_RANKING",
        status: "EN CURSO",
        auditStatus: "EN MONITOREO",
        participants: "1.24M",
        summary: "El debate formal ya fue consolidado y el activo esta en votacion abierta dentro de su categoria de ranking.",
        timeline: [
          { key: "VERIFICACION_INICIAL", label: "Verificacion inicial", state: "done" },
          { key: "VALIDACION_INICIAL", label: "Validacion inicial", state: "done" },
          { key: "DEBATE_FORMAL", label: "Debate formal", state: "done" },
          { key: "VERIFICACION_RESULTADO_DEBATE", label: "Verificacion del debate en curso", state: "done" },
          { key: "VALIDACION_RESULTADO_DEBATE", label: "Validacion del ingreso a ranking", state: "done" },
          { key: "VOTACION_RANKING", label: "Votacion en ranking", state: "current" },
          { key: "VERIFICACION_VOTOS", label: "Verificacion de votos", state: "pending" },
          { key: "VALIDACION_VOTOS", label: "Validacion de votos", state: "pending" },
          { key: "ENTREGA_LOGROS", label: "Entrega de premios por logro", state: "pending" },
          { key: "REGISTRO_RESULTADOS", label: "Registro final en base de datos", state: "pending" },
        ],
        voting: [
          { label: "Provincia mas limpia", value: 54, color: "#4edea3" },
          { label: "Municipio mas limpio", value: 31, color: "#ffb95f" },
          { label: "Pendiente de prueba", value: 15, color: "#0052ff" },
        ],
      },
      "sl-441-tq": {
        debateId: "sl-441-tq",
        assetName: "Circle (USDC)",
        stage: "VERIFICACION_INICIAL",
        status: "EN CURSO",
        auditStatus: "EN MONITOREO",
        participants: "890K",
        summary: "El activo se encuentra en la puerta de entrada del ciclo para determinar si habilita debate formal.",
        timeline: [
          { key: "VERIFICACION_INICIAL", label: "Verificacion inicial", state: "current" },
          { key: "VALIDACION_INICIAL", label: "Validacion inicial", state: "pending" },
          { key: "DEBATE_FORMAL", label: "Debate formal", state: "pending" },
          { key: "VERIFICACION_RESULTADO_DEBATE", label: "Verificacion del debate en curso", state: "pending" },
          { key: "VALIDACION_RESULTADO_DEBATE", label: "Validacion del ingreso a ranking", state: "pending" },
          { key: "VOTACION_RANKING", label: "Votacion en ranking", state: "pending" },
          { key: "VERIFICACION_VOTOS", label: "Verificacion de votos", state: "pending" },
          { key: "VALIDACION_VOTOS", label: "Validacion de votos", state: "pending" },
          { key: "ENTREGA_LOGROS", label: "Entrega de premios por logro", state: "pending" },
          { key: "REGISTRO_RESULTADOS", label: "Registro final en base de datos", state: "pending" },
        ],
      },
      "sl-009-bv": {
        debateId: "sl-009-bv",
        assetName: "Uniswap Protocol",
        stage: "DEBATE_FORMAL",
        status: "EN CURSO",
        auditStatus: "EN MONITOREO",
        participants: "560K",
        summary: "Debate formal activo para decidir criterios previos al ingreso de la votacion en ranking.",
        timeline: [
          { key: "VERIFICACION_INICIAL", label: "Verificacion inicial", state: "done" },
          { key: "VALIDACION_INICIAL", label: "Validacion inicial", state: "done" },
          { key: "DEBATE_FORMAL", label: "Debate formal", state: "current" },
          { key: "VERIFICACION_RESULTADO_DEBATE", label: "Verificacion del debate en curso", state: "pending" },
          { key: "VALIDACION_RESULTADO_DEBATE", label: "Validacion del ingreso a ranking", state: "pending" },
          { key: "VOTACION_RANKING", label: "Votacion en ranking", state: "pending" },
          { key: "VERIFICACION_VOTOS", label: "Verificacion de votos", state: "pending" },
          { key: "VALIDACION_VOTOS", label: "Validacion de votos", state: "pending" },
          { key: "ENTREGA_LOGROS", label: "Entrega de premios por logro", state: "pending" },
          { key: "REGISTRO_RESULTADOS", label: "Registro final en base de datos", state: "pending" },
        ],
      },
    };
    return (
      map[debateId] ?? {
        debateId,
        assetName: "Activo Institucional",
        stage: "VERIFICACION_INICIAL",
        status: "PENDIENTE",
        auditStatus: "EN MONITOREO",
        participants: "0",
        summary: "El debate aun no tiene datos suficientes para iniciar ciclo de ranking.",
        timeline: [
          { key: "VERIFICACION_INICIAL", label: "Verificacion inicial", state: "current" },
          { key: "VALIDACION_INICIAL", label: "Validacion inicial", state: "pending" },
          { key: "DEBATE_FORMAL", label: "Debate formal", state: "pending" },
          { key: "VERIFICACION_RESULTADO_DEBATE", label: "Verificacion del debate en curso", state: "pending" },
          { key: "VALIDACION_RESULTADO_DEBATE", label: "Validacion del ingreso a ranking", state: "pending" },
          { key: "VOTACION_RANKING", label: "Votacion en ranking", state: "pending" },
          { key: "VERIFICACION_VOTOS", label: "Verificacion de votos", state: "pending" },
          { key: "VALIDACION_VOTOS", label: "Validacion de votos", state: "pending" },
          { key: "ENTREGA_LOGROS", label: "Entrega de premios por logro", state: "pending" },
          { key: "REGISTRO_RESULTADOS", label: "Registro final en base de datos", state: "pending" },
        ],
      }
    );
  });
}

export async function fetchFeedbackEntries(): Promise<FeedbackEntry[]> {
  return safeRequest(() => [
    {
      id: "f1",
      author: "Dr. Aris Thorne",
      role: "Senior Auditor",
      tier: "S",
      title: "Protocolo de Descentralizacion de Nodos en Regiones Emergentes",
      quote: "La implementacion propuesta carece de salvaguardas contra colusion en pools de staking.",
      likes: 412,
      replies: 89,
      status: "AUDITADO",
    },
    {
      id: "f2",
      author: "Elena Vance",
      role: "Network Analyst",
      tier: "A",
      title: "Reestructuracion de Comisiones de Transaccion en Layer 2",
      quote: "La reduccion es bienvenida, pero la estructura de quema aun no es clara para validadores pequenos.",
      likes: 1200,
      replies: 24,
      status: "EN PROCESO",
    },
    {
      id: "f3",
      author: "Valid-0492",
      role: "Anonymous Node",
      tier: "C",
      title: "Optimizacion del Dashboard Institucional",
      quote: "Los nuevos graficos de dispersion son densos para monitores de resolucion estandar.",
      likes: 12,
      replies: 0,
      status: "ARCHIVADO",
    },
  ]);
}

export async function fetchInventoryItems(): Promise<InventoryItem[]> {
  return safeRequest(() => [
    {
      id: "i1",
      name: "Emblema de Consenso S",
      rarity: "S-TIER RARE",
      value: "12,500 SVP",
      description: "Otorgado por auditores con precision sostenida por encima del 99.9%.",
    },
    {
      id: "i2",
      name: "Orbe de Auditoria",
      rarity: "LEGENDARY",
      value: "8,750 SVP",
      description: "Visualizador critico para flujo de datos de auditoria en tiempo real.",
    },
    {
      id: "i3",
      name: "Llave del Ledger",
      rarity: "UNIQUE",
      value: "25,000 SVP",
      description: "Acceso criptografico a archivos historicos de la primera era de consenso.",
    },
  ]);
}

export async function fetchAuditEvents(): Promise<AuditEvent[]> {
  return safeRequest(() => [
    {
      id: "a1",
      title: "Logro Nivel S Desbloqueado",
      timestamp: "2023-11-24 14:22:01 UTC",
      uuid: "8f2-da11-4922",
      hash: "5f9d7a2...e2b4c1a90",
      tone: "blue",
    },
    {
      id: "a2",
      title: "Revaluacion de Objeto",
      timestamp: "2023-11-24 13:05:48 UTC",
      uuid: "a42-bc88-1102",
      hash: "9a1c3e4...f1b2d3a4b",
      tone: "amber",
    },
    {
      id: "a3",
      title: "Despacho SVP Exitoso",
      timestamp: "2023-11-24 11:42:15 UTC",
      uuid: "c11-e344-9921",
      hash: "d4e5f6g...8h9i0j1k2",
      tone: "green",
    },
    {
      id: "a4",
      title: "Sincronizacion de Estado",
      timestamp: "2023-11-24 09:12:00 UTC",
      uuid: "f09-22ad-771c",
      hash: "b2c4d6f...a8e0g2h4j",
      tone: "slate",
    },
  ]);
}

export async function fetchNotifications(): Promise<NotificationItem[]> {
  return safeRequest(() => [
    {
      id: "n1",
      label: "Token de Gobernanza TierList #042",
      date: "14 MAY 2024",
      status: "Sincronizado",
      tx: "0xFD...21",
      category: "transfer",
    },
    {
      id: "n2",
      label: "Certificacion: Auditor Senior Elite",
      date: "12 MAY 2024",
      status: "Sincronizado",
      tx: "0xCE...99",
      category: "system",
    },
    {
      id: "n3",
      label: "Nuevo comentario auditado en Debate #SL-982-AX",
      date: "11 MAY 2024",
      status: "Pendiente de revision",
      tx: "DEBATE-982",
      category: "debates",
    },
  ]);
}

export async function fetchDebateWallData(): Promise<DebateWallData> {
  return safeRequest(() => ({
    nodes: [
      {
        id: "node-pin-1",
        containerId: "debate-42",
        type: "pin",
        icon: "pin",
        title: "Priorizacion Q3",
        message: "Alinear presupuesto regional para Tier-1 y reducir latencia de validacion.",
        label: "Priorizar Tier-1 Regionales en el Q3",
        position: { left: 42, top: 22 },
        tone: "green",
        layer: "1",
        category: "importante",
        createdBy: "@audit_master",
        timestamp: "2026-01-20T09:30:00.000Z",
        colorMode: "theme",
        shape: "normal",
        style: "glass",
        template: "estandar",
        palette: { background: "#14233f", border: "#4edea3", title: "#ffffff", body: "#dbe8ff" },
        votes: 284,
      },
      {
        id: "node-sticker-1",
        containerId: "debate-42",
        type: "sticker",
        icon: "sticker",
        title: "Control de riesgo",
        message: "El bloque de validacion institucional supero el umbral objetivo de seguridad.",
        label: "ALPHA VERIFIED",
        position: { left: 28, top: 48 },
        tone: "amber",
        layer: "2",
        category: "informacion",
        createdBy: "@ops_node_09",
        timestamp: "2026-01-20T10:05:00.000Z",
        colorMode: "auto",
        shape: "etiqueta",
        style: "blur",
        template: "moderno",
        palette: { background: "#29253a", border: "#ffb95f", title: "#fff7ea", body: "#ffe4ba" },
        votes: 146,
      },
      {
        id: "node-bubble-1",
        containerId: "debate-42",
        type: "bubble",
        icon: "bubble",
        title: "Liquidez",
        message: "Mantener ratio de liquidez sostenible durante dos ciclos de consenso.",
        label: "Liquidez Sostenible",
        position: { left: 64, top: 50 },
        tone: "slate",
        layer: "3",
        category: "detalle",
        createdBy: "@policy_lab",
        timestamp: "2026-01-20T11:12:00.000Z",
        colorMode: "custom",
        shape: "burbuja",
        style: "transparente",
        template: "minimal",
        palette: { background: "#1d2841", border: "#9aa7c7", title: "#f2f6ff", body: "#d1dcf8" },
        votes: 91,
      },
    ],
    comments: [
      {
        id: "c1",
        author: "@audit_master",
        role: "Tier 1 Contributor",
        content: "Apoyo el pin de liquidez regional para fortalecer el mercado sudamericano.",
        createdAt: "AUDITED 2m AGO",
        layer: "1",
        nodeId: "node-pin-1",
      },
    ],
    voters: Array.from({ length: 24 }).map((_, index) => ({
      id: `v-${index + 1}`,
      name: index < 4 ? `Voter ${index + 1}` : `ID:${String(index + 1).padStart(2, "0")}`,
      handle:
        index === 0
          ? "@audit_master"
          : index === 1
            ? "@ops_node_09"
            : index === 2
              ? "@policy_lab"
              : `@node_${String(index + 1).padStart(2, "0")}`,
      active: index < 6,
    })),
    activeUsers: 2400,
  }));
}

export async function fetchDebateAnnotations(debateId: string): Promise<DebateAnnotationsPayload> {
  if (API_BASE_URL) {
    try {
      return await requestDebateAnnotationsRemote(debateId, "GET");
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, "No se pudo cargar anotaciones del debate");
    }
  }

  return safeRequest(() => ({
    debateId,
    tagsData: annotationsStorage.get(debateId) ?? {},
    updatedAt: new Date().toISOString(),
  }));
}

export async function saveDebateAnnotations(debateId: string, tagsData: DebateWallStore): Promise<DebateAnnotationsPayload> {
  if (API_BASE_URL) {
    try {
      return await requestDebateAnnotationsRemote(debateId, "PUT", tagsData);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, "No se pudo guardar anotaciones del debate");
    }
  }

  return safeRequest(() => {
    annotationsStorage.set(debateId, tagsData);
    return {
      debateId,
      tagsData,
      updatedAt: new Date().toISOString(),
    };
  });
}