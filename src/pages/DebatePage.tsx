import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { DebateCanvas } from "../components/debate-wall/DebateCanvas";
import { VotersPanel } from "../components/debate-wall/VotersPanel";
import { AppLayout } from "../components/layout/AppLayout";
import { SidebarQuickAccess } from "../components/ui";
import { useAppContext } from "../context/AppContext";
import { fetchDebateAnnotations, fetchDebateWallData, saveDebateAnnotations } from "../services/api";
import type {
  DebateWallCategory,
  DebateWallColorMode,
  DebateWallComment,
  DebateWallLayer,
  DebateWallNode,
  DebateWallShape,
  DebateWallStore,
  DebateWallStyle,
  DebateWallTemplate,
  DebateWallTool,
} from "../types";

const STORAGE_KEY = "tierlist:debate-wall:debate-42";
const DEBATE_ID = "debate-42";

const layerTabs: DebateWallLayer[] = ["1", "2", "3"];

const categoryLabelMap: Record<DebateWallCategory, string> = {
  informacion: "Informacion",
  importante: "Importante",
  detalle: "Detalle",
  advertencia: "Advertencia",
  nota: "Nota",
};

const categoryToneMap: Record<DebateWallCategory, DebateWallNode["tone"]> = {
  informacion: "blue",
  importante: "green",
  detalle: "slate",
  advertencia: "amber",
  nota: "slate",
};

const defaultPaletteMap: Record<DebateWallCategory, DebateWallNode["palette"]> = {
  informacion: { background: "#132842", border: "#2f8bff", title: "#f0f6ff", body: "#d4e6ff" },
  importante: { background: "#163127", border: "#4edea3", title: "#f0fff8", body: "#d5ffec" },
  detalle: { background: "#1a2637", border: "#94a3b8", title: "#f8fafc", body: "#dbe3f0" },
  advertencia: { background: "#312515", border: "#ffb95f", title: "#fff7eb", body: "#ffe2b4" },
  nota: { background: "#241b3d", border: "#c4b5fd", title: "#f6f2ff", body: "#dfd2ff" },
};

const toStore = (nodes: DebateWallNode[]): DebateWallStore =>
  nodes.reduce<DebateWallStore>((acc, node) => {
    acc[node.id] = node;
    return acc;
  }, {});

const mergeStores = (base: DebateWallStore, incoming: DebateWallStore): DebateWallStore => ({ ...base, ...incoming });

const clampPercent = (value: number) => Math.max(2, Math.min(96, value));

function createTagNode({
  tool,
  layer,
  category,
  message,
  left,
  top,
  colorMode,
  shape,
  style,
  template,
  createdBy,
}: {
  tool: DebateWallTool;
  layer: DebateWallLayer;
  category: DebateWallCategory;
  message: string;
  left: number;
  top: number;
  colorMode: DebateWallColorMode;
  shape: DebateWallShape;
  style: DebateWallStyle;
  template: DebateWallTemplate;
  createdBy: string;
}): DebateWallNode {
  const now = new Date().toISOString();
  const id = `annotation-${Date.now()}`;
  return {
    id,
    containerId: DEBATE_ID,
    type: tool,
    icon: tool,
    title: message.slice(0, 46) || "Nuevo aporte",
    message,
    label: message.slice(0, 52),
    position: { left: clampPercent(left), top: clampPercent(top) },
    tone: categoryToneMap[category],
    layer,
    category,
    createdBy,
    timestamp: now,
    colorMode,
    shape,
    style,
    template,
    palette: defaultPaletteMap[category],
    votes: 0,
  };
}

export function DebatePage() {
  const { can, user } = useAppContext();
  const hasHydrated = useRef(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeFilter = searchParams.get("tier") ?? "global";
  const activeLayer = (searchParams.get("layer") as DebateWallLayer | null) ?? "1";
  const categoryFilter = (searchParams.get("category") as DebateWallCategory | "all" | null) ?? "all";
  const [query, setQuery] = useState("");
  const [activeTool, setActiveTool] = useState<DebateWallTool>("pin");
  const [activeCategory, setActiveCategory] = useState<DebateWallCategory>(categoryFilter === "all" ? "importante" : categoryFilter);
  const [colorMode, setColorMode] = useState<DebateWallColorMode>("theme");
  const [shape, setShape] = useState<DebateWallShape>("normal");
  const [style, setStyle] = useState<DebateWallStyle>("glass");
  const [template, setTemplate] = useState<DebateWallTemplate>("estandar");
  const [composerText, setComposerText] = useState("");
  const [tagsData, setTagsData] = useState<DebateWallStore>({});
  const [comments, setComments] = useState<DebateWallComment[]>([]);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [selectedUserHandles, setSelectedUserHandles] = useState<string[]>([]);
  const [overlayTagId, setOverlayTagId] = useState<string | null>(null);
  const [quickActionsNodeId, setQuickActionsNodeId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalEditId, setModalEditId] = useState<string | null>(null);
  const [modalPosition, setModalPosition] = useState<{ left: number; top: number }>({ left: 50, top: 50 });
  const [history, setHistory] = useState<DebateWallStore[]>([]);
  const [future, setFuture] = useState<DebateWallStore[]>([]);
  const { data } = useQuery({ queryKey: ["debate-wall"], queryFn: fetchDebateWallData, retry: 2 });
  const { data: annotations } = useQuery({
    queryKey: ["debate-wall-annotations", DEBATE_ID],
    queryFn: () => fetchDebateAnnotations(DEBATE_ID),
    retry: 1,
  });

  const nodes = useMemo(() => Object.values(tagsData), [tagsData]);

  const saveTags = (store: DebateWallStore) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  };

  const loadTags = (): DebateWallStore => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    try {
      return JSON.parse(raw) as DebateWallStore;
    } catch {
      return {};
    }
  };

  useEffect(() => {
    if (!data || hasHydrated.current) {
      return;
    }
    const persisted = loadTags();
    const remote = annotations?.tagsData ?? {};
    const merged = mergeStores(mergeStores(toStore(data.nodes), persisted), remote);
    setTagsData(merged);
    setComments(data.comments);
    const defaultUsers = data.voters.filter((voter) => voter.active).map((voter) => voter.handle);
    setSelectedUserHandles(Array.from(new Set([...defaultUsers, user.handle])));
    hasHydrated.current = true;
  }, [data, annotations, user.handle]);

  useEffect(() => {
    if (Object.keys(tagsData).length > 0) {
      saveTags(tagsData);
      void saveDebateAnnotations(DEBATE_ID, tagsData);
    }
  }, [tagsData]);

  const canManageNode = (node: DebateWallNode) => node.createdBy === user.handle || can("debate:moderate") || can("admin:read");

  const visibleNodes = useMemo(
    () =>
      nodes.filter(
        (node) =>
          node.layer === activeLayer &&
          (categoryFilter === "all" || node.category === categoryFilter) &&
          selectedUserHandles.includes(node.createdBy),
      ),
    [nodes, activeLayer, categoryFilter, selectedUserHandles],
  );

  const visibleComments = comments.filter((comment) => comment.layer === activeLayer);

  const overlayNode = overlayTagId ? tagsData[overlayTagId] : null;

  const setLayer = (layer: DebateWallLayer) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("layer", layer);
    setSearchParams(nextParams);
  };

  const applyStoreUpdate = (updater: (prev: DebateWallStore) => DebateWallStore) => {
    setTagsData((prev) => {
      setHistory((historyPrev) => [...historyPrev, prev].slice(-20));
      setFuture([]);
      return updater(prev);
    });
  };

  const handleCreate = (left = 50, top = 50) => {
    setModalEditId(null);
    setComposerText("");
    setActiveTool("pin");
    setActiveCategory(categoryFilter === "all" ? "importante" : categoryFilter);
    setColorMode("theme");
    setShape("normal");
    setStyle("glass");
    setTemplate("estandar");
    setModalPosition({ left, top });
    setModalOpen(true);
  };

  const handleOpenFromHash = (hash: string) => {
    if (!hash.startsWith("#annotation-")) {
      return;
    }
    const id = hash.replace("#", "");
    if (tagsData[id]) {
      setOverlayTagId(id);
    }
  };

  useEffect(() => {
    handleOpenFromHash(window.location.hash);
    const onHash = () => handleOpenFromHash(window.location.hash);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [tagsData]);

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOverlayTagId(null);
        setModalOpen(false);
      }
      if ((event.key === "Delete" || event.key === "Backspace") && selectedNodeIds.length > 0) {
        event.preventDefault();
        applyStoreUpdate((prev) => {
          const next = { ...prev };
          selectedNodeIds.forEach((id) => {
            const node = next[id];
            if (node && canManageNode(node)) {
              delete next[id];
            }
          });
          return next;
        });
        setSelectedNodeIds([]);
      }
      if (event.key.toLowerCase() === "z" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        if (event.shiftKey) {
          const redo = future[0];
          if (!redo) {
            return;
          }
          setFuture((prev) => prev.slice(1));
          setHistory((prev) => [...prev, tagsData].slice(-20));
          setTagsData(redo);
          return;
        }
        const previous = history[history.length - 1];
        if (!previous) {
          return;
        }
        setHistory((prev) => prev.slice(0, -1));
        setFuture((prev) => [tagsData, ...prev].slice(0, 20));
        setTagsData(previous);
      }
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [selectedNodeIds, tagsData, history, future]);

  useEffect(() => {
    if (categoryFilter === "all") {
      return;
    }
    setActiveCategory(categoryFilter);
  }, [categoryFilter]);

  const handlePublish = () => {
    if (!composerText.trim()) {
      return;
    }
    const newNode = createTagNode({
      tool: activeTool,
      layer: activeLayer,
      category: activeCategory,
      message: composerText,
      left: modalPosition.left,
      top: modalPosition.top,
      colorMode,
      shape,
      style,
      template,
      createdBy: user.handle,
    });
    applyStoreUpdate((prev) => ({ ...prev, [newNode.id]: newNode }));
    setComments((prev) => [
      {
        id: `comment-${Date.now()}`,
        author: user.handle,
        role: user.role,
        content: composerText,
        createdAt: "Ahora",
        layer: activeLayer,
        nodeId: newNode.id,
      },
      ...prev,
    ]);
    setComposerText("");
    setModalOpen(false);
    setOverlayTagId(newNode.id);
    window.location.hash = newNode.id;
  };

  return (
    <AppLayout
      leftSidebar={
        <div className="flex h-full flex-col justify-between rounded-2xl border border-white/6 bg-[#0f1829] p-4">
          <div>
            <h2 className="text-xl font-bold tracking-[-0.02em] text-[#2f8bff]">Tier Filters</h2>
            <p className="text-xs uppercase tracking-[0.15em] text-slate-500">Verified Audit Strata</p>
            <div className="mt-6 space-y-2 text-slate-300">
              {"Global Tiers,Regional Tiers,Emerging Tiers,Archived Tiers".split(",").map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    const nextParams = new URLSearchParams(searchParams);
                    nextParams.set("tier", label.split(" ")[0].toLowerCase());
                    setSearchParams(nextParams);
                  }}
                  className={`sidebar-action w-full rounded-xl px-4 py-3 text-left text-base ${activeFilter === label.split(" ")[0].toLowerCase() ? "sidebar-action-active bg-[#0052ff]/20 text-[#6cb5ff] ring-1 ring-[#0052ff]/45" : "hover:bg-white/5"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="mt-6 text-xs uppercase tracking-[0.14em] text-slate-500">Categoria</p>
            <div className="mt-2 space-y-2 text-slate-300">
              {(["all", "importante", "informacion", "detalle", "advertencia", "nota"] as const).map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => {
                    const nextParams = new URLSearchParams(searchParams);
                    nextParams.set("category", category);
                    setSearchParams(nextParams);
                  }}
                  className={`sidebar-action w-full rounded-xl px-4 py-2 text-left text-sm ${categoryFilter === category ? "sidebar-action-active bg-white/10 text-white" : "hover:bg-white/5"}`}
                >
                  {category === "all" ? "Todas" : categoryLabelMap[category]}
                </button>
              ))}
            </div>
          </div>
          <SidebarQuickAccess />
        </div>
      }
      rightSidebar={
        <div className="grid h-full gap-4 [grid-template-rows:minmax(0,1fr)_minmax(0,1fr)]">
          <VotersPanel
            voters={data?.voters ?? []}
            query={query}
            onQueryChange={setQuery}
            activeUsers={data?.activeUsers ?? 2400}
            selectedUserHandles={selectedUserHandles}
            onToggleUser={(handle) =>
              setSelectedUserHandles((prev) => (prev.includes(handle) ? prev.filter((item) => item !== handle) : [...prev, handle]))
            }
          />
          <section className="rounded-2xl border border-white/8 bg-[#101a2c] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold">Lista de Capa Activa</h3>
              <span className="text-xs text-slate-400">{visibleNodes.length} tags</span>
            </div>
            <div className="space-y-2 overflow-y-auto pr-1 text-sm text-slate-200">
              {visibleNodes.map((node) => (
                <div key={node.id} className="rounded-lg border border-white/8 bg-[#0e1627] p-2">
                  <div className="flex items-center justify-between gap-2">
                    <button type="button" className="truncate text-left font-semibold hover:text-white" onClick={() => setOverlayTagId(node.id)}>
                      {node.title}
                    </button>
                    {canManageNode(node) && (
                      <div className="flex gap-1">
                        <button type="button" className="rounded border border-white/10 px-2 py-0.5 text-[10px] uppercase" onClick={() => {
                          setModalEditId(node.id);
                          setComposerText(node.message);
                          setModalPosition(node.position);
                          setActiveTool(node.type);
                          setActiveCategory(node.category);
                          setColorMode(node.colorMode);
                          setShape(node.shape);
                          setStyle(node.style);
                          setTemplate(node.template);
                          setModalOpen(true);
                        }}>
                          Editar
                        </button>
                        <button
                          type="button"
                          className="rounded border border-red-300/30 px-2 py-0.5 text-[10px] uppercase text-red-200"
                          onClick={() => applyStoreUpdate((prev) => {
                            const next = { ...prev };
                            delete next[node.id];
                            return next;
                          })}
                        >
                          Del
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-400">{node.message}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      }
    >
      <section className="relative flex min-h-[78vh] flex-col overflow-hidden rounded-3xl border border-white/6 bg-[#0d1528] p-5 md:p-8">
        <div className="relative z-10">
          <h1 className="text-4xl font-black tracking-[-0.04em] md:text-5xl">Muro de Consenso</h1>
          <p className="mt-3 max-w-3xl text-base text-slate-300 md:text-xl">
            Construya el consenso con mensajes visuales del debate activo, filtrando por usuarios y categoria.
          </p>
           <div className="mt-4 flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-slate-400">
             <button
               type="button"
               onClick={() => {
                  const idx = layerTabs.findIndex((item) => item === activeLayer);
                  const previous = layerTabs[Math.max(0, idx - 1)];
                  setLayer(previous);
               }}
               className="rounded-lg border border-white/12 bg-white/6 p-1.5"
               aria-label="Capa anterior"
             >
               <ChevronLeft className="h-3.5 w-3.5" />
             </button>
             <span>
                Capa {activeLayer} / {layerTabs.length}
             </span>
             <button
               type="button"
               onClick={() => {
                  const idx = layerTabs.findIndex((item) => item === activeLayer);
                  const next = layerTabs[Math.min(layerTabs.length - 1, idx + 1)];
                  setLayer(next);
               }}
               className="rounded-lg border border-white/12 bg-white/6 p-1.5"
               aria-label="Capa siguiente"
             >
               <ChevronRight className="h-3.5 w-3.5" />
             </button>
           </div>
        </div>

        <div className="mt-8">
          <DebateCanvas
            nodes={visibleNodes}
            onMoveNode={(id, left, top) =>
              applyStoreUpdate((prev) => ({
                ...prev,
                [id]: { ...prev[id], position: { left: clampPercent(left), top: clampPercent(top) } },
              }))
            }
            selectedNodeIds={selectedNodeIds}
            onSelectNode={(id, additive) =>
              setSelectedNodeIds((prev) => {
                if (!additive) {
                  return [id];
                }
                return prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
              })
            }
            onOpenNode={(id) => {
              setOverlayTagId(id);
              window.location.hash = id;
            }}
            onCreateAtPosition={handleCreate}
            onClearSelection={() => setSelectedNodeIds([])}
            onLongPressNode={(id) => {
              const node = tagsData[id];
              if (!node || !canManageNode(node)) {
                return;
              }
              setQuickActionsNodeId(id);
              setSelectedNodeIds([id]);
            }}
            quickActionsNodeId={quickActionsNodeId ?? undefined}
            canManageNode={canManageNode}
            onQuickEdit={(id) => {
              const node = tagsData[id];
              if (!node || !canManageNode(node)) {
                return;
              }
              setModalEditId(id);
              setComposerText(node.message);
              setModalPosition(node.position);
              setActiveTool(node.type);
              setActiveCategory(node.category);
              setColorMode(node.colorMode);
              setShape(node.shape);
              setStyle(node.style);
              setTemplate(node.template);
              setModalOpen(true);
            }}
            onQuickDelete={(id) =>
              applyStoreUpdate((prev) => {
                const node = prev[id];
                if (!node || !canManageNode(node)) {
                  return prev;
                }
                const next = { ...prev };
                delete next[id];
                return next;
              })
            }
          />
        </div>

        <div className="relative z-10 mt-6 flex justify-start xl:mt-8">
          <button
            type="button"
            onClick={() => handleCreate(50, 50)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0052ff] px-5 py-3 text-sm font-semibold tracking-[0.08em] text-white"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>

      </section>

      {overlayNode && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4" onClick={() => setOverlayTagId(null)}>
          <article
            className="w-full max-w-xl rounded-2xl border border-white/12 bg-[#131c2f] p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-slate-400">{categoryLabelMap[overlayNode.category]}</p>
                <h3 className="mt-1 text-2xl font-bold tracking-[-0.02em]">{overlayNode.title}</h3>
              </div>
              <button type="button" onClick={() => setOverlayTagId(null)} className="rounded-lg border border-white/10 p-2">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-3 text-slate-300">{overlayNode.message}</p>
            <p className="mt-4 text-xs uppercase tracking-[0.12em] text-slate-400">Publicado por {overlayNode.createdBy}</p>
          </article>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4" onClick={() => setModalOpen(false)}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/12 bg-[#121c2f] p-5" onClick={(event) => event.stopPropagation()}>
            <h3 className="text-2xl font-bold tracking-[-0.02em]">{modalEditId ? "Editar anotacion" : "Configurar anotacion"}</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {([
                ["pin", "Pines"],
                ["sticker", "Stickers"],
                ["bubble", "Burbujas"],
              ] as const).map(([tool, label]) => (
                <button
                  key={tool}
                  type="button"
                  onClick={() => setActiveTool(tool)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] ${activeTool === tool ? "bg-[#0052ff] text-white" : "bg-white/10 text-slate-200"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <label className="text-xs uppercase tracking-[0.1em] text-slate-400">
                Categoria
                <select value={activeCategory} onChange={(event) => setActiveCategory(event.target.value as DebateWallCategory)} className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-[#0b1324] px-2 text-sm text-slate-200">
                  <option value="informacion">Informacion</option>
                  <option value="importante">Importante</option>
                  <option value="detalle">Detalle</option>
                  <option value="advertencia">Advertencia</option>
                  <option value="nota">Nota</option>
                </select>
              </label>
              <label className="text-xs uppercase tracking-[0.1em] text-slate-400">
                Color
                <select value={colorMode} onChange={(event) => setColorMode(event.target.value as DebateWallColorMode)} className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-[#0b1324] px-2 text-sm text-slate-200">
                  <option value="auto">Automatico</option>
                  <option value="theme">Tema</option>
                  <option value="custom">Custom</option>
                </select>
              </label>
              <label className="text-xs uppercase tracking-[0.1em] text-slate-400">
                Forma
                <select value={shape} onChange={(event) => setShape(event.target.value as DebateWallShape)} className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-[#0b1324] px-2 text-sm text-slate-200">
                  <option value="normal">Normal</option>
                  <option value="nube">Nube</option>
                  <option value="burbuja">Burbuja</option>
                  <option value="etiqueta">Etiqueta</option>
                  <option value="cinta">Cinta</option>
                </select>
              </label>
              <label className="text-xs uppercase tracking-[0.1em] text-slate-400">
                Estilo
                <select value={style} onChange={(event) => setStyle(event.target.value as DebateWallStyle)} className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-[#0b1324] px-2 text-sm text-slate-200">
                  <option value="glass">Glass</option>
                  <option value="blur">Blur</option>
                  <option value="sepia">Sepia</option>
                  <option value="dark">Dark</option>
                  <option value="transparente">Transparente</option>
                </select>
              </label>
              <label className="text-xs uppercase tracking-[0.1em] text-slate-400 sm:col-span-2">
                Plantilla
                <select value={template} onChange={(event) => setTemplate(event.target.value as DebateWallTemplate)} className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-[#0b1324] px-2 text-sm text-slate-200">
                  <option value="estandar">Estandar</option>
                  <option value="minimal">Minimal</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="moderno">Moderno</option>
                  <option value="elegante">Elegante</option>
                </select>
              </label>
            </div>
            <textarea
              value={composerText}
              onChange={(event) => setComposerText(event.target.value)}
              className="mt-3 h-36 w-full rounded-xl border border-white/10 bg-[#0b1324] p-3 text-sm outline-none focus:border-[#2f8bff]"
              placeholder="Escriba el mensaje del tag..."
              aria-label="Mensaje del tag"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-white/15 px-4 py-2 text-sm">
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!composerText.trim()) {
                    return;
                  }
                  if (modalEditId) {
                    applyStoreUpdate((prev) => ({
                      ...prev,
                      [modalEditId]: {
                        ...prev[modalEditId],
                        type: activeTool,
                        icon: activeTool,
                        title: composerText.slice(0, 46),
                        label: composerText.slice(0, 52),
                        message: composerText,
                        layer: activeLayer,
                        category: activeCategory,
                        colorMode,
                        shape,
                        style,
                        template,
                      },
                    }));
                    setModalOpen(false);
                    return;
                  }
                  handlePublish();
                }}
                className="rounded-lg bg-[#0052ff] px-4 py-2 text-sm font-semibold"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {visibleComments[0] && (
        <div className="fixed bottom-4 left-0 z-30 hidden w-[320px] rounded-r-2xl border border-white/12 bg-gradient-to-r from-[#17233a] to-[#11192d] p-4 2xl:block">
          <p className="text-xl font-bold">{visibleComments[0].author}</p>
          <p className="text-xs uppercase tracking-[0.14em] text-slate-400">{visibleComments[0].role}</p>
          <p className="mt-2 text-slate-300">"{visibleComments[0].content}"</p>
          <p className="mt-2 text-xs text-slate-500">{visibleComments[0].createdAt}</p>
        </div>
      )}
    </AppLayout>
  );
}