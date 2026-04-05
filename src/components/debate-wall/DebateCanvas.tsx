import { motion } from "framer-motion";
import { Pin, Sparkles, Sticker } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { DebateWallNode } from "../../types";

interface DebateCanvasProps {
  nodes: DebateWallNode[];
  selectedNodeIds: string[];
  onMoveNode: (id: string, left: number, top: number) => void;
  onSelectNode: (id: string, additive: boolean) => void;
  onOpenNode: (id: string) => void;
  onCreateAtPosition: (left: number, top: number) => void;
  onClearSelection: () => void;
  onLongPressNode: (id: string) => void;
  quickActionsNodeId?: string;
  onQuickEdit: (id: string) => void;
  onQuickDelete: (id: string) => void;
  canManageNode: (node: DebateWallNode) => boolean;
}

const categoryTone: Record<DebateWallNode["category"], string> = {
  informacion: "border-[#2f8bff]/55 bg-[#14233f]",
  importante: "border-emerald-300/55 bg-[#17263a]",
  detalle: "border-slate-300/35 bg-[#142036]",
  advertencia: "border-amber-300/55 bg-[#2b2637]",
  nota: "border-violet-300/45 bg-[#251d3a]",
};

function NodeIcon({ type }: Pick<DebateWallNode, "type">) {
  if (type === "pin") {
    return <Pin className="h-4 w-4" />;
  }
  if (type === "sticker") {
    return <Sticker className="h-4 w-4" />;
  }
  return <Sparkles className="h-4 w-4" />;
}

export function DebateCanvas({
  nodes,
  selectedNodeIds,
  onMoveNode,
  onSelectNode,
  onOpenNode,
  onCreateAtPosition,
  onClearSelection,
  onLongPressNode,
  quickActionsNodeId,
  onQuickEdit,
  onQuickDelete,
  canManageNode,
}: DebateCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [justDraggedId, setJustDraggedId] = useState<string | null>(null);
  const longPressTimers = useRef<Record<string, number>>({});
  const longPressTriggered = useRef<Record<string, boolean>>({});

  const nodeMetrics = useMemo(
    () =>
      nodes.reduce<Record<string, { left: number; top: number }>>((acc, node) => {
        const width = containerRef.current?.clientWidth ?? 960;
        const height = containerRef.current?.clientHeight ?? 520;
        acc[node.id] = {
          left: (node.position.left / 100) * width,
          top: (node.position.top / 100) * height,
        };
        return acc;
      }, {}),
    [nodes],
  );

  return (
    <div
      ref={containerRef}
      className="relative min-h-[380px] overflow-hidden rounded-2xl border border-white/8 bg-[#0d1629]/80 p-4 md:min-h-[520px] md:p-6"
      onClick={(event) => {
        if (event.target !== event.currentTarget) {
          return;
        }
        const rect = event.currentTarget.getBoundingClientRect();
        const left = ((event.clientX - rect.left) / rect.width) * 100;
        const top = ((event.clientY - rect.top) / rect.height) * 100;
        onClearSelection();
        onCreateAtPosition(left, top);
      }}
      role="presentation"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(38,64,120,0.2),transparent_65%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.09)_1px,transparent_1px)] bg-[length:28px_28px] opacity-[0.13]" />

      {nodes.map((node) => {
        const isBubble = node.type === "bubble";
        const isSticker = node.type === "sticker";
        const isActive = selectedNodeIds.includes(node.id);
        const xy = nodeMetrics[node.id] ?? { left: 0, top: 0 };

        const nodeShell = isBubble
          ? "flex h-36 w-36 items-center justify-center rounded-full text-center"
          : isSticker
            ? "w-[190px] rounded-2xl px-4 py-4"
            : "max-w-[340px] rounded-2xl px-4 py-3";

        return (
          <motion.button
            key={node.id}
            type="button"
            drag
            dragMomentum={false}
            dragElastic={0.08}
            onDragEnd={(event, info) => {
              if (!containerRef.current) {
                return;
              }
              const moved = Math.abs(info.offset.x) > 8 || Math.abs(info.offset.y) > 8;
              if (!moved) {
                return;
              }
              const target = event.currentTarget;
              if (!(target instanceof HTMLElement)) {
                return;
              }
              const containerRect = containerRef.current.getBoundingClientRect();
              const nodeRect = target.getBoundingClientRect();
              const width = containerRect.width;
              const height = containerRect.height;
              const nextLeft = ((nodeRect.left - containerRect.left) / width) * 100;
              const nextTop = ((nodeRect.top - containerRect.top) / height) * 100;
              onMoveNode(node.id, nextLeft, nextTop);
              setJustDraggedId(node.id);
              window.setTimeout(() => setJustDraggedId(null), 120);
            }}
            onPointerDown={() => {
              longPressTriggered.current[node.id] = false;
              longPressTimers.current[node.id] = window.setTimeout(() => {
                longPressTriggered.current[node.id] = true;
                onLongPressNode(node.id);
              }, 520);
            }}
            onPointerUp={() => {
              if (longPressTimers.current[node.id]) {
                window.clearTimeout(longPressTimers.current[node.id]);
              }
            }}
            onPointerLeave={() => {
              if (longPressTimers.current[node.id]) {
                window.clearTimeout(longPressTimers.current[node.id]);
              }
            }}
            onClick={(event) => {
              event.stopPropagation();
              if (longPressTriggered.current[node.id]) {
                longPressTriggered.current[node.id] = false;
                return;
              }
              if (justDraggedId === node.id) {
                return;
              }
              const additive = event.shiftKey || event.metaKey || event.ctrlKey;
              onSelectNode(node.id, additive);
              onOpenNode(node.id);
            }}
            className={`absolute relative cursor-grab border text-left active:cursor-grabbing ${categoryTone[node.category]} ${nodeShell} ${isActive ? "ring-2 ring-[#4c95ff]" : "ring-1 ring-white/5"}`}
            style={{ left: xy.left, top: xy.top }}
          >
            <div className={`flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.1em] ${isBubble ? "hidden" : ""}`}>
              <NodeIcon type={node.type} />
              {node.category}
            </div>
            <p className={`${isBubble ? "px-2 text-sm" : "mt-1 text-base md:text-lg"}`}>{node.label}</p>
            {!isBubble && <p className="mt-2 text-xs text-slate-300">{node.createdBy} - {node.votes} votos</p>}
            {quickActionsNodeId === node.id && canManageNode(node) && (
              <div className="absolute -top-10 left-0 z-20 flex gap-2">
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(event) => {
                    event.stopPropagation();
                    onQuickEdit(node.id);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      onQuickEdit(node.id);
                    }
                  }}
                  className="rounded-md border border-white/15 bg-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.12em]"
                >
                  Editar
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(event) => {
                    event.stopPropagation();
                    onQuickDelete(node.id);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      onQuickDelete(node.id);
                    }
                  }}
                  className="rounded-md border border-red-300/40 bg-red-500/15 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-red-200"
                >
                  Eliminar
                </span>
              </div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}