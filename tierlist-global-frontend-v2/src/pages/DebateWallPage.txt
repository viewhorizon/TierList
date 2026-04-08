import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { VotersPanel } from "@/components/debate-wall/VotersPanel";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useSession } from "@/context/SessionContext";
import { createDebateWallPost, deleteDebateWallPost, getDebateWallPosts, moveDebateWallPost, updateDebateWallPost } from "@/services/debateWallService";
import type { DebateWallPost } from "@/types/contracts";

interface PointerSession {
  postId: string;
  pointerId: number;
  pointerType: string;
  startPointerX: number;
  startPointerY: number;
  originX: number;
  originY: number;
  boardWidth: number;
  boardHeight: number;
  moved: boolean;
  dragging: boolean;
  longPressTriggered: boolean;
  movementThreshold: number;
  longPressTimer?: number;
  pressedAt: number;
}

interface SegmentSwitchProps {
  leftLabel: string;
  rightLabel: string;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

function clearLongPressTimer(session: PointerSession | null) {
  if (!session?.longPressTimer) {
    return;
  }
  window.clearTimeout(session.longPressTimer);
  session.longPressTimer = undefined;
}

function getMovementThreshold(pointerType: string) {
  return pointerType === "touch" ? MOVE_THRESHOLD_TOUCH : MOVE_THRESHOLD_MOUSE;
}


const fallbackUsers = [
  { userId: "demo-owner", author: "Demo Owner" },
  { userId: "u-12", author: "Camila Ruiz" },
  { userId: "u-17", author: "Ibrahim Noor" },
  { userId: "u-19", author: "Aiko Mendes" },
];

const LAYER_SIZE = 12;
const LONG_PRESS_MS = 420;
const MOVE_THRESHOLD_MOUSE = 6;
const MOVE_THRESHOLD_TOUCH = 12;

function SegmentSwitch({ leftLabel, rightLabel, checked, onToggle, disabled }: SegmentSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onToggle}
      className={`relative grid h-8 w-full grid-cols-2 items-center rounded-full border border-white/10 bg-[#0c1529]/95 p-0.5 text-[10px] font-semibold tracking-[0.02em] text-slate-100 sm:h-9 sm:p-1 sm:text-[11px] sm:tracking-[0.05em] ${
        disabled ? "cursor-not-allowed opacity-50" : ""
      }`}
    >
      <span
        className={`absolute inset-y-0.5 w-[calc(50%-0.25rem)] rounded-full bg-[#2f8bff] transition-transform sm:inset-y-1 ${checked ? "translate-x-[calc(100%+0.25rem)]" : "translate-x-0"}`}
      />
      <span className="relative z-10 pl-2 text-left sm:pl-2.5">{leftLabel}</span>
      <span className="relative z-10 pr-2 text-right sm:pr-2.5">{rightLabel}</span>
    </button>
  );
}

export function DebateWallPage() {
  const session = useSession();
  const queryClient = useQueryClient();
  const boardRef = useRef<HTMLDivElement>(null);
  const pointerSessionRef = useRef<PointerSession | null>(null);

  const [selectedHandles, setSelectedHandles] = useState<string[]>([session.userId]);
  const [voterQuery, setVoterQuery] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [openMessageIds, setOpenMessageIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"pins" | "messages">("pins");
  const [messageViewMode, setMessageViewMode] = useState<"tagfly" | "list">("tagfly");
  const [localPositions, setLocalPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [dragEnabled, setDragEnabled] = useState(true);
  const [canvasLocked, setCanvasLocked] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [multiSelectEnabled, setMultiSelectEnabled] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<string[]>([]);
  const [helpOpen, setHelpOpen] = useState(false);
  const [layerPage, setLayerPage] = useState(1);
  const [isMobileViewport, setIsMobileViewport] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 767px)").matches : false
  );

  const [addOpen, setAddOpen] = useState(false);
  const [newUserId, setNewUserId] = useState(session.userId);
  const [message, setMessage] = useState("");
  const [tags, setTags] = useState("");

  const [contextPost, setContextPost] = useState<DebateWallPost | null>(null);
  const [editText, setEditText] = useState("");

  const postsQuery = useQuery({ queryKey: ["debate-wall"], queryFn: getDebateWallPosts });

  const createMutation = useMutation({
    mutationFn: createDebateWallPost,
    onSuccess: () => {
      setMessage("");
      setTags("");
      setAddOpen(false);
      queryClient.invalidateQueries({ queryKey: ["debate-wall"] });
    },
  });

  const moveMutation = useMutation({
    mutationFn: ({ id, x, y }: { id: string; x: number; y: number }) => moveDebateWallPost(id, x, y),
    onSuccess: (updated) => {
      queryClient.setQueryData<DebateWallPost[]>(["debate-wall"], (previous) =>
        previous?.map((post) => (post.id === updated.id ? { ...post, x: updated.x, y: updated.y } : post)) ?? previous
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) => updateDebateWallPost(id, text),
    onSuccess: () => {
      setContextPost(null);
      queryClient.invalidateQueries({ queryKey: ["debate-wall"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDebateWallPost,
    onSuccess: () => {
      setContextPost(null);
      queryClient.invalidateQueries({ queryKey: ["debate-wall"] });
    },
  });

  const deleteManyMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => deleteDebateWallPost(id)));
    },
    onSuccess: () => {
      setSelectedForDelete([]);
      queryClient.invalidateQueries({ queryKey: ["debate-wall"] });
    },
  });

  const userOptions = useMemo(() => {
    const existing = postsQuery.data?.reduce<Record<string, { userId: string; author: string }>>((acc, post) => {
      acc[post.userId] = { userId: post.userId, author: post.author };
      return acc;
    }, {}) ?? {};
    fallbackUsers.forEach((user) => {
      existing[user.userId] = existing[user.userId] ?? user;
    });
    return Object.values(existing);
  }, [postsQuery.data]);

  const voters = useMemo(() => {
    const posts = postsQuery.data ?? [];
    const postCountByUser = posts.reduce<Record<string, number>>((acc, post) => {
      acc[post.userId] = (acc[post.userId] ?? 0) + 1;
      return acc;
    }, {});

    return userOptions.map((user) => ({
      id: user.userId,
      name: user.author,
      handle: user.userId,
      active: selectedHandles.includes(user.userId),
      posts: postCountByUser[user.userId] ?? 0,
    }));
  }, [postsQuery.data, selectedHandles, userOptions]);

  const effectiveSelectedHandles = useMemo(() => {
    if (selectedHandles.length) {
      return selectedHandles;
    }
    return [session.userId];
  }, [selectedHandles, session.userId]);

  const filteredPosts = useMemo(() => {
    const all = postsQuery.data ?? [];
    return all.filter((post) => effectiveSelectedHandles.includes(post.userId));
  }, [postsQuery.data, effectiveSelectedHandles]);

  const totalLayers = Math.max(1, Math.ceil(filteredPosts.length / LAYER_SIZE));

  const visiblePosts = useMemo(() => {
    const start = (layerPage - 1) * LAYER_SIZE;
    return filteredPosts.slice(start, start + LAYER_SIZE);
  }, [filteredPosts, layerPage]);

  useEffect(() => {
    if (!postsQuery.data) {
      return;
    }
    setLocalPositions(
      postsQuery.data.reduce<Record<string, { x: number; y: number }>>((acc, post) => {
        acc[post.id] = { x: post.x, y: post.y };
        return acc;
      }, {})
    );
  }, [postsQuery.data]);

  useEffect(() => {
    if (contextPost) {
      setEditText(contextPost.text);
    }
  }, [contextPost]);

  useEffect(() => {
    if (!newUserId && userOptions[0]) {
      setNewUserId(userOptions[0].userId);
    }
  }, [newUserId, userOptions]);

  useEffect(() => {
      setLayerPage((previous) => Math.max(1, Math.min(previous, totalLayers)));
  }, [totalLayers]);

  useEffect(() => {
    if (messageViewMode === "list") {
      setOpenMessageIds([]);
    }
  }, [messageViewMode]);

  useEffect(() => {
    // In message view the content is already visible on canvas, so TagFly bubbles stay disabled.
    if (viewMode === "messages") {
      setOpenMessageIds([]);
    }
  }, [viewMode]);

  useEffect(() => {
    if (!multiSelectEnabled) {
      setSelectedForDelete([]);
    }
  }, [multiSelectEnabled]);

  useEffect(() => {
    // Canvas lock keeps reading interactions but blocks modification flows.
    if (canvasLocked) {
      setMultiSelectEnabled(false);
    }
  }, [canvasLocked]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const handleChange = () => setIsMobileViewport(media.matches);
    handleChange();
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (!visiblePosts.length) {
      setSelectedPostId(null);
      return;
    }
    const existsInLayer = visiblePosts.some((post) => post.id === selectedPostId);
    if (!existsInLayer) {
      setSelectedPostId(visiblePosts[0].id);
    }
  }, [selectedPostId, visiblePosts]);

  useEffect(() => {
    const visibleIds = new Set(visiblePosts.map((post) => post.id));
    setOpenMessageIds((previous) => previous.filter((id) => visibleIds.has(id)));
    setSelectedForDelete((previous) => previous.filter((id) => visibleIds.has(id)));
  }, [visiblePosts]);

  function getPositionFromPointer(session: PointerSession, pointerX: number, pointerY: number) {
    const deltaX = pointerX - session.startPointerX;
    const deltaY = pointerY - session.startPointerY;
    const x = Number(clamp(session.originX + (deltaX / (session.boardWidth || 1)) * 100, 6, 94).toFixed(2));
    const y = Number(clamp(session.originY + (deltaY / (session.boardHeight || 1)) * 100, 8, 92).toFixed(2));
    return { x, y, deltaX, deltaY };
  }

  function handlePointerStart(post: DebateWallPost, pointerId: number, pointerType: string, pointerX: number, pointerY: number) {
    const board = boardRef.current;
    if (!board) {
      return;
    }
    const current = localPositions[post.id] ?? { x: post.x, y: post.y };
    pointerSessionRef.current = {
      postId: post.id,
      pointerId,
      pointerType,
      startPointerX: pointerX,
      startPointerY: pointerY,
      originX: current.x,
      originY: current.y,
      boardWidth: board.clientWidth,
      boardHeight: board.clientHeight,
      moved: false,
      dragging: false,
      longPressTriggered: false,
      movementThreshold: getMovementThreshold(pointerType),
      pressedAt: Date.now(),
    };

    const session = pointerSessionRef.current;
    if (!session) {
      return;
    }

    // While canvas is locked we keep click-only behavior.
    if (canvasLocked) {
      return;
    }

    session.longPressTimer = window.setTimeout(() => {
      const current = pointerSessionRef.current;
      if (!current || current.postId !== post.id || current.pointerId !== pointerId) {
        return;
      }
      if (!current.moved && !current.dragging) {
        current.longPressTriggered = true;
        setContextPost(post);
      }
    }, LONG_PRESS_MS);
  }

  function handlePointerMove(post: DebateWallPost, pointerId: number, pointerX: number, pointerY: number) {
    const session = pointerSessionRef.current;
    if (!session || session.postId !== post.id || session.pointerId !== pointerId) {
      return;
    }

    const { x, y, deltaX, deltaY } = getPositionFromPointer(session, pointerX, pointerY);
    const movedEnough = Math.abs(deltaX) > session.movementThreshold || Math.abs(deltaY) > session.movementThreshold;
    if (movedEnough) {
      session.moved = true;
    }

    if (session.longPressTriggered) {
      return;
    }

    if (movedEnough) {
      clearLongPressTimer(session);
    }

    const canStartDrag = !canvasLocked && dragEnabled && movedEnough;

    if (!session.dragging && canStartDrag) {
      session.dragging = true;
      setDraggingId(post.id);
    }

    if (session.dragging) {
      setLocalPositions((previous) => ({
        ...previous,
        [post.id]: { x, y },
      }));
    }
  }

  function handlePointerEnd(post: DebateWallPost, pointerId: number, pointerX: number, pointerY: number) {
    const pointerState = pointerSessionRef.current;
    if (!pointerState || pointerState.postId !== post.id || pointerState.pointerId !== pointerId) {
      return;
    }

    clearLongPressTimer(pointerState);

    if (pointerState.dragging) {
      const { x, y } = getPositionFromPointer(pointerState, pointerX, pointerY);
      setLocalPositions((previous) => ({
        ...previous,
        [post.id]: { x, y },
      }));
      const next = { x, y };
      const changed = Math.abs(next.x - post.x) > 0.05 || Math.abs(next.y - post.y) > 0.05;
      if (changed) {
        moveMutation.mutate({ id: post.id, x: next.x, y: next.y });
      }
      setDraggingId(null);
      pointerSessionRef.current = null;
      return;
    }

    if (pointerState.longPressTriggered) {
      pointerSessionRef.current = null;
      return;
    }

    const pressDuration = Date.now() - pointerState.pressedAt;

    if (!pointerState.moved && pressDuration < LONG_PRESS_MS) {
      if (viewMode === "messages" && !multiSelectEnabled) {
        pointerSessionRef.current = null;
        return;
      }
      setSelectedPostId(post.id);
      if (multiSelectEnabled) {
        const isOwnPin = post.userId === session.userId;
        if (!isOwnPin) {
          pointerSessionRef.current = null;
          return;
        }
        setSelectedForDelete((previous) =>
          previous.includes(post.id) ? previous.filter((id) => id !== post.id) : [...previous, post.id]
        );
      } else if (viewMode === "pins" && messageViewMode === "tagfly") {
        setOpenMessageIds((previous) => (previous.includes(post.id) ? previous : [...previous, post.id]));
      }
    }

    pointerSessionRef.current = null;
  }

  function getBubblePosition(post: DebateWallPost) {
    const pos = localPositions[post.id] ?? { x: post.x, y: post.y };
    const board = boardRef.current;
    if (!board) {
      return { leftPx: 0, topPx: 0, widthPx: 280 };
    }

    const boardWidth = board.clientWidth;
    const boardHeight = board.clientHeight;
    const pinX = (pos.x / 100) * boardWidth;
    const pinY = (pos.y / 100) * boardHeight;
    const bubbleWidth = Math.min(280, Math.max(200, boardWidth - 20));

    // Anchor by left edge to keep the close button fully visible on right-side pins.
    const leftPx = clamp(pinX - bubbleWidth / 2, 8, boardWidth - bubbleWidth - 8);
    const topPx = clamp(pinY - 90, 8, boardHeight - 96);

    return { leftPx, topPx, widthPx: bubbleWidth };
  }

  function getMessageCardStyle(post: DebateWallPost) {
    const pos = localPositions[post.id] ?? { x: post.x, y: post.y };
    const board = boardRef.current;
    if (!board) {
      return {
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        transform: "translate(-50%, -50%)",
      } as const;
    }

    if (!isMobileViewport) {
      // On desktop we allow slight overflow so cards stay readable near edges.
      return {
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        transform: "translate(-50%, -50%)",
      } as const;
    }

    const boardWidth = board.clientWidth;
    const pinX = (pos.x / 100) * boardWidth;
    const cardWidth = Math.min(220, Math.max(176, boardWidth - 16));
    const leftPx = clamp(pinX - cardWidth / 2, 8, boardWidth - cardWidth - 8);

    return {
      left: leftPx,
      top: `${pos.y}%`,
      width: cardWidth,
      maxWidth: cardWidth,
      transform: "translateY(-50%)",
    } as const;
  }

  function canDeleteSelection() {
    if (!selectedForDelete.length) {
      return false;
    }
    const postsById = new Map((postsQuery.data ?? []).map((post) => [post.id, post]));
    return selectedForDelete.every((id) => postsById.get(id)?.userId === session.userId);
  }

  function handlePointerCancel(post: DebateWallPost) {
    const session = pointerSessionRef.current;
    if (!session || session.postId !== post.id) {
      return;
    }
    // On cancel we keep local position and skip persistence to avoid jumpy states.
    clearLongPressTimer(session);
    setDraggingId(null);
    pointerSessionRef.current = null;
  }

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const user = userOptions.find((item) => item.userId === newUserId);
    if (!user || !message.trim()) {
      return;
    }

    createMutation.mutate({
      author: user.author,
      userId: user.userId,
      text: message.trim(),
      tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    });
  }

  function handleToggleUser(handle: string) {
    setSelectedHandles((previous) => {
      if (previous.includes(handle)) {
        return previous.filter((item) => item !== handle);
      }
      return [...previous, handle];
    });
    setNewUserId(handle);
  }

  return (
    <ModuleLayout
      title="Debate Wall"
      subtitle=""
      titleHelpLabel="Ayuda de Debate Wall"
      onTitleHelpClick={() => setHelpOpen(true)}
      actions={
        <>
          <Button className="w-full" onClick={() => setAddOpen(true)}>Add</Button>
          <Button className="w-full" variant="secondary" onClick={() => setCanvasLocked((prev) => !prev)}>
            {canvasLocked ? "Canvas: bloqueado" : "Canvas: libre"}
          </Button>
          {multiSelectEnabled ? (
            <Button
              className="w-full"
              variant="danger"
              disabled={!canDeleteSelection() || deleteManyMutation.isPending}
              onClick={() => {
                if (!canDeleteSelection()) {
                  return;
                }
                deleteManyMutation.mutate(selectedForDelete);
              }}
            >
              {deleteManyMutation.isPending ? "Eliminando..." : `Eliminar seleccion (${selectedForDelete.length})`}
            </Button>
          ) : null}
          <Button className="w-full" variant="secondary" onClick={() => queryClient.invalidateQueries({ queryKey: ["debate-wall"] })}>
            Recargar muro
          </Button>
        </>
      }
    >
      <section className="tl-surface p-3 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-semibold tracking-[0.18em] text-[#f6d050]">MURO DE CONSENSO</p>
          <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1.5 text-right sm:px-3 sm:py-2">
            <p className="text-[10px] tracking-[0.14em] text-emerald-200">NODOS ACTIVOS</p>
            <p className="text-xl font-bold text-emerald-300 sm:text-2xl">{visiblePosts.length}</p>
          </div>
        </div>
      </section>

      <VotersPanel
        voters={voters}
        query={voterQuery}
        onQueryChange={setVoterQuery}
        selectedHandles={effectiveSelectedHandles}
        onToggleUser={handleToggleUser}
        onClearSelection={() => setSelectedHandles([])}
      />

      {postsQuery.isLoading ? <p className="text-sm text-slate-400">Cargando mensajes del muro...</p> : null}
      {postsQuery.isError ? <p className="text-sm text-rose-300">No fue posible cargar el muro.</p> : null}

      <section className="grid grid-cols-3 gap-1.5 text-[10px] text-slate-300 sm:gap-2 sm:text-xs">
        <p className="tl-metric flex items-center justify-center gap-1.5 px-1.5 py-1 sm:justify-start sm:gap-2 sm:px-2.5 sm:py-1.5" title="Mensajes visibles en la capa">
          <svg aria-hidden="true" className="h-3 w-3 text-slate-300 sm:h-3.5 sm:w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 5h16v10H8l-4 4V5z" />
          </svg>
          <span className="font-semibold text-slate-100">{visiblePosts.length}</span>
        </p>
        <p className="tl-metric flex items-center justify-center gap-1.5 px-1.5 py-1 sm:justify-start sm:gap-2 sm:px-2.5 sm:py-1.5" title="Mensajes filtrados por usuarios">
          <svg aria-hidden="true" className="h-3 w-3 text-slate-300 sm:h-3.5 sm:w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M3 5h18M6 12h12M10 19h4" />
          </svg>
          <span className="font-semibold text-slate-100">{filteredPosts.length}</span>
        </p>
        <p className="tl-metric flex items-center justify-center gap-1.5 px-1.5 py-1 sm:justify-start sm:gap-2 sm:px-2.5 sm:py-1.5" title="Usuarios seleccionados">
          <svg aria-hidden="true" className="h-3 w-3 text-slate-300 sm:h-3.5 sm:w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M16 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10z" />
            <path d="M2 21a6 6 0 0 1 12 0M14 21a6 6 0 0 1 8 0" />
          </svg>
          <span className="font-semibold text-slate-100">{effectiveSelectedHandles.length}</span>
        </p>
      </section>

      <section className="tl-surface p-2 sm:p-3">
        <div className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#0b1730]/70 px-2.5 py-2 sm:px-3">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-slate-300 sm:text-xs">Configuracion de vista</p>
          <button
            type="button"
            aria-expanded={controlsOpen}
            aria-label="Abrir configuracion de switches"
            onClick={() => setControlsOpen((prev) => !prev)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-200"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M10.3 3.1 9 5.6a6.7 6.7 0 0 0-1.8 1L4.4 6l-1.3 2.3 2 2.1a7 7 0 0 0 0 2.2l-2 2.1L4.4 17l2.8-.6c.5.4 1.1.7 1.8 1l1.3 2.5h2.6l1.3-2.5c.7-.3 1.3-.6 1.8-1l2.8.6 1.3-2.3-2-2.1a7 7 0 0 0 0-2.2l2-2.1L19.6 6l-2.8.6a6.7 6.7 0 0 0-1.8-1l-1.3-2.5h-2.6Z" />
              <circle cx="12" cy="12" r="2.3" />
            </svg>
          </button>
        </div>

        {controlsOpen ? (
          <div className="mt-2 grid grid-cols-2 gap-1.5 sm:gap-2.5 xl:grid-cols-4">
            <div className="w-full">
              <SegmentSwitch
                leftLabel="Pines"
                rightLabel="Mensajes"
                checked={viewMode === "messages"}
                onToggle={() => setViewMode((prev) => (prev === "pins" ? "messages" : "pins"))}
              />
            </div>
            <div className="w-full">
              <SegmentSwitch
                leftLabel="TagFly"
                rightLabel="Lista"
                checked={messageViewMode === "list"}
                onToggle={() => setMessageViewMode((prev) => (prev === "tagfly" ? "list" : "tagfly"))}
              />
            </div>
            <div className="w-full">
              <SegmentSwitch
                leftLabel="Drag"
                rightLabel="Block"
                checked={!dragEnabled || canvasLocked}
                disabled={canvasLocked}
                onToggle={() => setDragEnabled((prev) => !prev)}
              />
            </div>
            <div className="w-full">
              <SegmentSwitch
                leftLabel="Single"
                rightLabel="Multi"
                checked={multiSelectEnabled}
                disabled={canvasLocked}
                onToggle={() => setMultiSelectEnabled((prev) => !prev)}
              />
            </div>
          </div>
        ) : null}
      </section>

      <section
        className="tl-grid-board relative min-h-[430px] select-none overflow-hidden md:overflow-visible rounded-2xl border border-white/8 bg-[#0d1629]/80 p-4 sm:min-h-[520px] sm:p-6"
        ref={boardRef}
        onContextMenu={(event) => event.preventDefault()}
        style={{ WebkitTouchCallout: "none", WebkitUserSelect: "none", userSelect: "none" }}
      >
        {visiblePosts.map((post) => {
          const position = localPositions[post.id] ?? { x: post.x, y: post.y };
          const ownPin = post.userId === session.userId;
          const selectedInMulti = selectedForDelete.includes(post.id);

          const nodeStyle = viewMode === "messages"
            ? getMessageCardStyle(post)
            : { left: `${position.x}%`, top: `${position.y}%`, transform: "translate(-50%, -50%)" };

          return (
            <div key={post.id} className="absolute" style={nodeStyle}>
              <button
                type="button"
                onPointerDown={(event) => {
                  if (event.button !== 0) {
                    return;
                  }
                  if (multiSelectEnabled && post.userId !== session.userId) {
                    return;
                  }
                  event.preventDefault();
                  event.currentTarget.setPointerCapture(event.pointerId);
                  handlePointerStart(post, event.pointerId, event.pointerType, event.clientX, event.clientY);
                }}
                onPointerMove={(event) => {
                  handlePointerMove(post, event.pointerId, event.clientX, event.clientY);
                }}
                onPointerUp={(event) => {
                  if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                    event.currentTarget.releasePointerCapture(event.pointerId);
                  }
                  handlePointerEnd(post, event.pointerId, event.clientX, event.clientY);
                }}
                onPointerCancel={() => handlePointerCancel(post)}
                onDragStart={(event) => event.preventDefault()}
                className={`select-none border font-semibold text-white ${
                  viewMode === "pins"
                    ? `flex h-7 w-7 items-center justify-center rounded-full text-[10px] ${
                        draggingId === post.id
                          ? "cursor-grabbing border-[#4c95ff] bg-[#1d4d9a]"
                          : dragEnabled && !canvasLocked
                            ? "cursor-grab border-sky-200/50 bg-[#1f66dc]"
                            : "cursor-pointer border-amber-200/70 bg-[#1f66dc]/80 shadow-[0_0_0_1px_rgba(250,204,21,0.28)]"
                      }`
                    : `min-w-40 max-w-[min(13.5rem,calc(100vw-2.25rem))] rounded-md px-2 py-1 text-left text-xs ${
                        draggingId === post.id
                          ? "cursor-grabbing border-[#4c95ff] bg-[#16305c]"
                          : dragEnabled && !canvasLocked
                            ? "cursor-grab border-white/20 bg-[#102446]/95"
                            : "cursor-pointer border-amber-200/50 bg-[#0d1a30]/95 shadow-[0_0_0_1px_rgba(250,204,21,0.24)]"
                      }`
                } ${selectedInMulti ? "ring-2 ring-rose-300" : ""} ${multiSelectEnabled && !ownPin ? "cursor-not-allowed opacity-60" : ""}`}
                style={{ touchAction: "none", WebkitTouchCallout: "none", WebkitUserSelect: "none", userSelect: "none" }}
                title={`${post.author}: ${post.text}`}
                aria-label={`Pin de ${post.author}`}
              >
                {viewMode === "pins" ? (
                  post.author.slice(0, 1).toUpperCase()
                ) : (
                  <>
                    <p className="text-[11px] font-semibold text-slate-100">{post.author}</p>
                    <p className="line-clamp-2 text-[11px] text-slate-200">{post.text}</p>
                  </>
                )}
              </button>

            </div>
          );
          })}

        {viewMode === "pins" && messageViewMode === "tagfly" && !multiSelectEnabled
          ? visiblePosts
              .filter((post) => openMessageIds.includes(post.id))
              .map((post) => {
                const bubble = getBubblePosition(post);
                return (
                  <article
                    key={`bubble-${post.id}`}
                    className="absolute z-20 rounded-lg border border-white/15 bg-[#0c1930]/95 p-2 pr-7 text-xs text-slate-200 shadow-xl"
                    style={{ left: bubble.leftPx, top: bubble.topPx, width: bubble.widthPx, maxWidth: bubble.widthPx }}
                    onPointerDown={(event) => event.stopPropagation()}
                  >
                    <button
                      type="button"
                      aria-label={`Cerrar mensaje de ${post.author}`}
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={(event) => {
                        event.stopPropagation();
                        setOpenMessageIds((previous) => previous.filter((id) => id !== post.id));
                      }}
                      className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-md border border-white/15 bg-white/5 text-[11px] text-slate-200 hover:bg-white/10"
                    >
                      x
                    </button>
                    <p className="font-semibold text-slate-100">{post.author}</p>
                    <p className="mt-1 max-h-20 overflow-auto pr-1">{post.text}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-slate-400">{post.tags.join(" | ") || "sin tags"}</p>
                  </article>
                );
              })
          : null}
      </section>

      <div className="tl-muted-surface flex items-center justify-between px-3 py-2 text-xs tracking-[0.16em] text-slate-400">
        <p>CAPA {layerPage} DE {totalLayers}</p>
        <div className="flex gap-2">
          <Button variant="secondary" disabled={layerPage <= 1} onClick={() => setLayerPage((prev) => prev - 1)}>Anterior</Button>
          <Button variant="secondary" disabled={layerPage >= totalLayers} onClick={() => setLayerPage((prev) => prev + 1)}>Siguiente</Button>
        </div>
      </div>

       {messageViewMode === "list" ? (
        <section className="tl-surface p-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-300">Lista de mensajes</h3>
          <div className="mt-2 max-h-56 space-y-2 overflow-y-auto pr-1">
            {visiblePosts.map((post) => (
              <button
                key={`list-${post.id}`}
                type="button"
                onClick={() => setSelectedPostId(post.id)}
                className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                  selectedPostId === post.id ? "border-[#2f8bff]/70 bg-[#12305e]/45 text-slate-100" : "border-white/10 bg-[#0d1a30]/80 text-slate-300"
                }`}
              >
                <p className="font-semibold text-slate-100">{post.author}</p>
                <p className="mt-1 line-clamp-2">{post.text}</p>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <Modal title="Agregar mensaje al muro" open={addOpen} onClose={() => setAddOpen(false)}>
        <form className="space-y-3" onSubmit={handleCreate}>
          <label className="block text-sm text-slate-300" htmlFor="add-user">
            Usuario
          </label>
          <select
            id="add-user"
            className="h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f8bff]"
            onChange={(event) => setNewUserId(event.target.value)}
            value={newUserId}
          >
            {userOptions.map((option) => (
              <option key={option.userId} value={option.userId}>{option.author}</option>
            ))}
          </select>

          <label className="block text-sm text-slate-300" htmlFor="add-message">
            Mensaje
          </label>
          <textarea
            id="add-message"
            className="min-h-32 w-full rounded-md border border-slate-700 bg-slate-950 p-2 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f8bff]"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />

          <label className="block text-sm text-slate-300" htmlFor="add-tags">
            Tags (separados por coma)
          </label>
          <input
            id="add-tags"
            className="h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f8bff]"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
          />

          <Button className="w-full" type="submit" disabled={createMutation.isPending || !message.trim()}>
            {createMutation.isPending ? "Guardando..." : "Guardar mensaje"}
          </Button>
        </form>
      </Modal>

      <Modal title="Editar o eliminar mensaje" open={Boolean(contextPost)} onClose={() => setContextPost(null)}>
        <div className="space-y-3">
          <label className="block text-sm text-slate-300" htmlFor="edit-message">
            Editar mensaje
          </label>
          <textarea
            id="edit-message"
            className="min-h-28 w-full rounded-md border border-slate-700 bg-slate-950 p-2 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f8bff]"
            value={editText}
            onChange={(event) => setEditText(event.target.value)}
          />
          <Button
            className="w-full"
            onClick={() => contextPost && updateMutation.mutate({ id: contextPost.id, text: editText.trim() })}
            disabled={!editText.trim() || updateMutation.isPending}
          >
            Guardar cambios
          </Button>
          <Button
            className="w-full"
            variant="danger"
            onClick={() => contextPost && deleteMutation.mutate(contextPost.id)}
            disabled={deleteMutation.isPending}
          >
            Eliminar
          </Button>
        </div>
      </Modal>

      <Modal title="Ayuda de Debate Wall" open={helpOpen} onClose={() => setHelpOpen(false)}>
        <div className="space-y-2 text-sm text-slate-200">
          <p>Muro visual paralelo al debate formal para opiniones cortas, tags y trazabilidad por usuario.</p>
          <p>Click rapido abre mensaje. Long press sin arrastre abre editar y eliminar. Drag mueve pines dentro del muro.</p>
          <p>Si bloqueas pines o canvas, se mantiene click para lectura y se inhabilitan cambios de posicion.</p>
          <p>Se mantiene paginacion por capas para gestionar densidad visual cuando hay muchos mensajes activos.</p>
        </div>
      </Modal>

    </ModuleLayout>
  );
}
