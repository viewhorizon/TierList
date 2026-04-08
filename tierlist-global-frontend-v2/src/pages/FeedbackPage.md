```tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { Button } from "@/components/ui/Button";
import { SelectField, TextField } from "@/components/ui/Field";
import { HelpIconButton } from "@/components/ui/HelpIconButton";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getFeedbackIssues, getFeedbackReviews, validateFeedbackIssue, verifyFeedbackIssue } from "@/services/feedbackService";
import type { DebateIssue } from "@/types/contracts";

type TabKey = "feedback" | "reviews";
type FlowFilter = "all" | "needs_verification" | "needs_validation" | "ready_for_ranking" | "in_ranking";
type FeedbackSection = "intake" | "debate" | "discarded";
type DebateLane = "ready" | "voting" | "closed";
type DiscardedStatus = "all" | "DESCARTADO" | "EN REVISION" | "APROBADO CONDICIONAL" | "REINTEGRADO";
type HelpTopic = "overview" | "intake" | "seed" | "debate" | "discarded" | "reviews";

interface DiscardedRow {
  id: string;
  subject: string;
  status: Exclude<DiscardedStatus, "all">;
  reason: string;
}

const PAGE_SIZE = 3;
const topicOptions = ["Infraestructura", "Seguridad alimentaria", "Trabajo", "Salud", "Clima"];
const tierOptions = ["Todos los Tiers", "Tier S", "Tier A", "Tier B"];
const categoryOptions = ["Todas las Categorias", "Tecnologia e IA", "Economia y Finanzas", "Ciencia y Ambiente"];

const rankingStateOptions = [
  { value: "", label: "Todos" },
  { value: "not_ready", label: "Aun no habilitado" },
  { value: "ready", label: "Listo para votar" },
  { value: "voting", label: "Votacion activa" },
  { value: "closed", label: "Votacion cerrada" },
] as const;

const initialDiscardedRows: DiscardedRow[] = [
  { id: "TL-X01", subject: "Ganador de proximas elecciones", status: "DESCARTADO", reason: "Prediccion politica activa" },
  { id: "TL-X02", subject: "Accion militar en conflicto activo", status: "EN REVISION", reason: "Alta sensibilidad geopolitica" },
  { id: "TL-X03", subject: "Legalizacion global de cannabis", status: "EN REVISION", reason: "Depende de marco legal por region" },
  { id: "TL-X05", subject: "Ranking personas mas ricas", status: "DESCARTADO", reason: "Dato factual, no debate" },
  { id: "TL-X06", subject: "Messi vs Ronaldo", status: "APROBADO CONDICIONAL", reason: "Requiere categoria y limite definido" },
];

function rankingLabel(issue: DebateIssue) {
  if (issue.rankingState === "not_ready") return "Aun no habilitado";
  if (issue.rankingState === "ready") return "Listo para votar";
  if (issue.rankingState === "voting") return "Votacion activa";
  return "Votacion cerrada";
}

function processLabel(issue: DebateIssue) {
  if (!issue.verificationPassed) return "Pendiente de verificacion inicial";
  if (!issue.validationPassed) return "Pendiente de validacion inicial";
  if (!issue.rankingEligible) return "Checklist para ingreso a ranking";
  return "Aprobado para ingresar al ranking";
}

function processStep(issue: DebateIssue) {
  if (!issue.verificationPassed) return 1;
  if (!issue.validationPassed) return 2;
  if (!issue.rankingEligible) return 3;
  return 4;
}

function issueCode(index: number) {
  return `TL-${String(index + 1).padStart(3, "0")}`;
}

function discardedTone(status: Exclude<DiscardedStatus, "all">) {
  if (status === "DESCARTADO") return "bg-rose-500/15 text-rose-200";
  if (status === "EN REVISION") return "bg-amber-500/15 text-amber-200";
  if (status === "APROBADO CONDICIONAL") return "bg-emerald-500/15 text-emerald-200";
  return "bg-sky-500/15 text-sky-200";
}

function IconActionButton({
  label,
  onClick,
  tone = "neutral",
  disabled,
  children,
}: {
  label: string;
  onClick?: () => void;
  tone?: "neutral" | "primary";
  disabled?: boolean;
  children: import("react").ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-md border transition ${
        tone === "primary"
          ? "border-[#2f8bff]/50 bg-[#2f8bff]/20 text-[#9ec6ff] hover:bg-[#2f8bff]/30"
          : "border-white/15 bg-[#0d1a34] text-slate-300 hover:bg-[#162747]"
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {children}
    </button>
  );
}

export function FeedbackPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabKey>("feedback");
  const [feedbackSection, setFeedbackSection] = useState<FeedbackSection>("intake");
  const [debateLane, setDebateLane] = useState<DebateLane>("ready");
  const [helpTopic, setHelpTopic] = useState<HelpTopic | null>(null);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [draftSubject, setDraftSubject] = useState("");
  const [draftSummary, setDraftSummary] = useState("");
  const [draftImageUrl, setDraftImageUrl] = useState("");
  const [draftImageName, setDraftImageName] = useState("");
  const [draftRankingType, setDraftRankingType] = useState<"competitors" | "goal">("competitors");
  const [draftWindowHours, setDraftWindowHours] = useState("72");
  const [draftRewardName, setDraftRewardName] = useState("");
  const [draftRewardVotes, setDraftRewardVotes] = useState("1000");
  const [draftRewardDelivery, setDraftRewardDelivery] = useState<"decide_at_close" | "inventory" | "market_svp">("decide_at_close");
  const [topic, setTopic] = useState("");
  const [tier, setTier] = useState(tierOptions[0]);
  const [category, setCategory] = useState(categoryOptions[0]);
  const [rankingState, setRankingState] = useState<DebateIssue["rankingState"] | "">("");
  const [flowFilter, setFlowFilter] = useState<FlowFilter>("all");

  const [discardedEntries, setDiscardedEntries] = useState<DiscardedRow[]>(initialDiscardedRows);
  const [discardedSearch, setDiscardedSearch] = useState("");
  const [discardedStatus, setDiscardedStatus] = useState<DiscardedStatus>("all");
  const imageUploadRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 280);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [flowFilter, topic, rankingState]);

  const issueQuery = useQuery({
    queryKey: ["feedback", page, search, topic, rankingState],
    queryFn: () => getFeedbackIssues({ page, pageSize: PAGE_SIZE, search, topic, rankingState }),
  });

  const reviewsQuery = useQuery({
    queryKey: ["feedback-reviews"],
    queryFn: getFeedbackReviews,
    enabled: tab === "reviews",
  });

  const verifyMutation = useMutation({
    mutationFn: verifyFeedbackIssue,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["feedback"] }),
  });

  const validateMutation = useMutation({
    mutationFn: validateFeedbackIssue,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["feedback"] }),
  });

  const visibleItems = useMemo(() => {
    const items = issueQuery.data?.items ?? [];
    if (flowFilter === "all") return items;
    return items.filter((item) => {
      if (flowFilter === "needs_verification") return !item.verificationPassed;
      if (flowFilter === "needs_validation") return item.verificationPassed && !item.validationPassed;
      if (flowFilter === "ready_for_ranking") return item.validationPassed && item.rankingEligible && item.rankingState === "ready";
      return item.rankingState === "voting";
    });
  }, [flowFilter, issueQuery.data?.items]);

  const readyRate = useMemo(() => {
    const rows = issueQuery.data?.items ?? [];
    if (!rows.length) return 0;
    const ready = rows.filter((item) => item.validationPassed).length;
    return Math.round((ready / rows.length) * 1000) / 10;
  }, [issueQuery.data?.items]);

  const totalPages = Math.max(1, Math.ceil((issueQuery.data?.total ?? 0) / PAGE_SIZE));

  const discardedVisible = useMemo(() => {
    return discardedEntries.filter((row) => {
      const bySearch = row.subject.toLowerCase().includes(discardedSearch.toLowerCase()) || row.reason.toLowerCase().includes(discardedSearch.toLowerCase());
      const byStatus = discardedStatus === "all" ? true : row.status === discardedStatus;
      return bySearch && byStatus;
    });
  }, [discardedEntries, discardedSearch, discardedStatus]);

  function handleReintegrate(rowId: string) {
    setDiscardedEntries((prev) => prev.map((row) => (row.id === rowId ? { ...row, status: "REINTEGRADO", reason: "Reintegrado para evaluacion en debate" } : row)));
    setFeedbackSection("debate");
  }

  function handleRequestReview(row: DiscardedRow) {
    setDiscardedEntries((prev) => prev.map((entry) => (entry.id === row.id ? { ...entry, status: "EN REVISION", reason: "Solicitud de revision enviada" } : entry)));
    setDraftSubject(row.subject);
    setDraftSummary(`Ajustar y reenviar a revision: ${row.reason}.`);
    setFeedbackSection("intake");
  }

  function handleImageUpload(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setDraftImageUrl(reader.result);
        setDraftImageName(file.name);
      }
    };
    reader.readAsDataURL(file);
  }

  const debateLaneCounts = useMemo(() => {
    const source = issueQuery.data?.items ?? [];
    return {
      ready: source.filter((item) => item.verificationPassed && item.validationPassed && item.rankingState === "ready").length,
      voting: source.filter((item) => item.rankingState === "voting").length,
      closed: source.filter((item) => item.rankingState === "closed").length,
    };
  }, [issueQuery.data?.items]);

  const laneItems = useMemo(() => {
    if (debateLane === "ready") {
      return visibleItems.filter((item) => item.verificationPassed && item.validationPassed && item.rankingState === "ready");
    }
    if (debateLane === "voting") {
      return visibleItems.filter((item) => item.rankingState === "voting");
    }
    return visibleItems.filter((item) => item.rankingState === "closed");
  }, [debateLane, visibleItems]);

  return (
    <ModuleLayout
      title="Feedback y Resenas"
      subtitle="Gestion de asuntos de consenso y devoluciones."
      titleHelpLabel="Ayuda de Feedback y Resenas"
      onTitleHelpClick={() => setHelpTopic(tab === "feedback" ? "overview" : "reviews")}
    >
      <section className="tl-surface flex flex-wrap items-start justify-between gap-3 p-3.5 sm:p-5 lg:p-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold tracking-[0.18em] text-[#f6d050]">CONSENSO GLOBAL</p>
          </div>
          <div className="flex gap-2">
            <Button variant={tab === "feedback" ? "primary" : "secondary"} onClick={() => setTab("feedback")}>Feedback</Button>
            <Button variant={tab === "reviews" ? "primary" : "secondary"} onClick={() => setTab("reviews")}>Resenas</Button>
          </div>
        </div>
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3">
          <p className="text-xs tracking-[0.16em] text-emerald-200">TASA GLOBAL</p>
          <p className="text-2xl font-bold text-emerald-300">{readyRate.toFixed(1)}%</p>
        </div>
      </section>

      <div className="space-y-3 sm:space-y-4 lg:space-y-5">
      {tab === "feedback" ? (
        <>
          <section className="tl-surface p-2">
            <div className="no-scrollbar flex overflow-x-auto" role="tablist" aria-label="Secciones de feedback">
              {[
                { key: "intake", label: "Captura y Seed" },
                { key: "debate", label: "Debate" },
                { key: "discarded", label: "Descartados" },
              ].map((section) => (
                <button
                  key={section.key}
                  type="button"
                  onClick={() => setFeedbackSection(section.key as FeedbackSection)}
                  role="tab"
                  aria-selected={feedbackSection === section.key}
                  aria-controls={`feedback-panel-${section.key}`}
                  className={`shrink-0 rounded-md px-3 py-2 text-sm font-medium transition ${
                    feedbackSection === section.key ? "bg-[#0052ff] text-white" : "text-slate-300 hover:bg-[#13213d]"
                  }`}
                >
                  {section.label}
                </button>
              ))}
            </div>
          </section>

          {feedbackSection === "intake" ? (
            <>
              <section id="feedback-panel-intake" role="tabpanel" className="tl-surface space-y-3 p-3.5 sm:p-4">
                <div className="flex items-start justify-between gap-3 rounded-md border border-sky-300/25 bg-sky-500/10 px-3 py-2 text-sm text-sky-200">
                  <p>Configura el asunto base antes de pasar a verificacion y validacion.</p>
                  <HelpIconButton label="Ayuda de captura y verificacion" onClick={() => setHelpTopic("intake")} />
                </div>

                <label className="block space-y-1 text-xs font-medium tracking-[0.1em] text-slate-400">
                  ASUNTO A DEBATIR
                  <TextField value={draftSubject} onChange={(event) => setDraftSubject(event.target.value)} placeholder="Ej: Provincia mas limpia" />
                </label>
                <label className="block space-y-1 text-xs font-medium tracking-[0.1em] text-slate-400">
                  RESUMEN DEL ASUNTO
                  <TextField value={draftSummary} onChange={(event) => setDraftSummary(event.target.value)} placeholder="Descripcion breve para la tarjeta del ranking" />
                </label>
                <label className="block space-y-1 text-xs font-medium tracking-[0.1em] text-slate-400">
                  IMAGEN DEL ASUNTO (URL)
                  <TextField
                    value={draftImageUrl}
                    onChange={(event) => setDraftImageUrl(event.target.value)}
                    placeholder="https://... imagen para la tarjeta de votacion"
                  />
                </label>
                <div className="rounded-md border border-white/10 bg-[#0d1a34] p-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="secondary" className="h-8 px-3" onClick={() => imageUploadRef.current?.click()}>
                      Subir imagen
                    </Button>
                    <input
                      ref={imageUploadRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      className="hidden"
                      onChange={(event) => handleImageUpload(event.target.files?.[0] ?? null)}
                    />
                    <span className="text-xs text-slate-400">{draftImageName || "Sin archivo seleccionado"}</span>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="space-y-1 text-xs font-medium tracking-[0.1em] text-slate-400">
                    TIPO DE RANKING
                    <SelectField value={draftRankingType} onChange={(event) => setDraftRankingType(event.target.value as "competitors" | "goal")}>
                      <option value="competitors">Competitivo</option>
                      <option value="goal">Acumulacion</option>
                    </SelectField>
                  </label>
                  <label className="space-y-1 text-xs font-medium tracking-[0.1em] text-slate-400">
                    VENTANA DE VOTACION (HORAS)
                    <TextField value={draftWindowHours} onChange={(event) => setDraftWindowHours(event.target.value)} placeholder="72" />
                  </label>
                </div>
                <label className="block space-y-1 text-xs font-medium tracking-[0.1em] text-slate-400">
                  OBJETO PREMIO PROPUESTO POR CREADOR
                  <TextField value={draftRewardName} onChange={(event) => setDraftRewardName(event.target.value)} placeholder="Ej: Objeto Guardian del Oceano" />
                </label>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="space-y-1 text-xs font-medium tracking-[0.1em] text-slate-400">
                    ESTRELLAS DEL TIER (RESULTADO)
                    <TextField value="Se asignan por votacion publica y puesto final." disabled />
                  </label>
                  <label className="space-y-1 text-xs font-medium tracking-[0.1em] text-slate-400">
                    CATEGORIA TIERLIST
                    <SelectField value={category} onChange={(event) => setCategory(event.target.value)}>
                      {categoryOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </SelectField>
                  </label>
                </div>
                <label className="block space-y-1 text-xs font-medium tracking-[0.1em] text-slate-400">
                  VOTOS MINIMOS PARA APROBAR OBJETO PREMIO
                  <TextField value={draftRewardVotes} onChange={(event) => setDraftRewardVotes(event.target.value)} placeholder="Ej: 5000" />
                </label>
                <label className="block space-y-1 text-xs font-medium tracking-[0.1em] text-slate-400">
                  DESTINO DEL OBJETO GANADOR
                  <SelectField value={draftRewardDelivery} onChange={(event) => setDraftRewardDelivery(event.target.value as "decide_at_close" | "inventory" | "market_svp")}>
                    <option value="decide_at_close">Elegir al cierre</option>
                    <option value="inventory">Enviar a inventario</option>
                    <option value="market_svp">Oferta por SVP al mayor postor</option>
                  </SelectField>
                </label>

                <article className="rounded-xl border border-white/10 bg-[#0c1630] p-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-[#8ad6ff]">Vista previa de tarjeta de ranking</p>
                  {draftImageUrl ? (
                    <div className="mt-2 h-28 overflow-hidden rounded-lg border border-white/10 bg-[#0a1630]">
                      <img src={draftImageUrl} alt="Previsualizacion del asunto" className="h-full w-full object-cover" />
                    </div>
                  ) : null}
                  <p className="mt-2 text-lg font-semibold text-slate-100">{draftSubject || "Asunto sin titulo"}</p>
                  <p className="mt-1 text-sm text-slate-300">{draftSummary || "Resumen para el asunto en votacion."}</p>
                  <p className="mt-2 text-xs text-slate-400">
                    Tipo: {draftRankingType === "competitors" ? "Competitivo" : "Acumulacion"} | Ventana: {draftWindowHours || "72"}h
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Objeto: {draftRewardName || "Por definir"} | Min. votos: {draftRewardVotes || "0"}
                  </p>
                </article>
              </section>

              <section className="tl-surface p-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-2xl font-bold tracking-[-0.03em] text-slate-100">Asuntos propuestos para debate global</h2>
                  <HelpIconButton label="Ayuda de asuntos seed" onClick={() => setHelpTopic("seed")} />
                </div>
                <div className="mt-4 grid gap-3 lg:grid-cols-3">
                  <article className="rounded-xl border border-white/10 bg-[#0c1630] p-3 text-sm text-slate-200">
                    <p className="text-xs uppercase tracking-[0.14em] text-[#8ad6ff]">TECNOLOGIA E IA</p>
                    <p className="mt-2">Regular IA generativa en medios de comunicacion</p>
                    <p className="mt-2">Lider tecnologico mas influyente de la decada</p>
                    <p className="mt-2">Impuesto global para Big Tech</p>
                  </article>
                  <article className="rounded-xl border border-white/10 bg-[#0c1630] p-3 text-sm text-slate-200">
                    <p className="text-xs uppercase tracking-[0.14em] text-[#8ad6ff]">ECONOMIA Y FINANZAS</p>
                    <p className="mt-2">Bitcoin como reserva de valor</p>
                    <p className="mt-2">Ingreso basico universal</p>
                    <p className="mt-2">Rol de bancos centrales en inflacion</p>
                  </article>
                  <article className="rounded-xl border border-white/10 bg-[#0c1630] p-3 text-sm text-slate-200">
                    <p className="text-xs uppercase tracking-[0.14em] text-[#8ad6ff]">CIENCIA Y AMBIENTE</p>
                    <p className="mt-2">Energia nuclear y cambio climatico</p>
                    <p className="mt-2">Deuda climatica de paises ricos</p>
                    <p className="mt-2">Geoingenieria a escala global</p>
                  </article>
                </div>
              </section>
            </>
          ) : null}

          {feedbackSection === "debate" ? (
            <section id="feedback-panel-debate" role="tabpanel" className="tl-surface space-y-3 p-4 sm:p-5">
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  {
                    label: "Pend. Verificacion",
                    value: (issueQuery.data?.items ?? []).filter((item) => !item.verificationPassed).length,
                    dot: "bg-amber-300",
                  },
                  {
                    label: "Pend. Validacion",
                    value: (issueQuery.data?.items ?? []).filter((item) => item.verificationPassed && !item.validationPassed).length,
                    dot: "bg-sky-300",
                  },
                  {
                    label: "Listos Ranking",
                    value: (issueQuery.data?.items ?? []).filter((item) => item.rankingState === "ready").length,
                    dot: "bg-violet-300",
                  },
                  {
                    label: "Votacion Activa",
                    value: (issueQuery.data?.items ?? []).filter((item) => item.rankingState === "voting").length,
                    dot: "bg-emerald-300",
                  },
                ].map((metric) => (
                  <article key={metric.label} className="tl-muted-surface flex items-center justify-between px-3 py-2.5">
                    <div>
                      <p className="text-xs tracking-[0.14em] text-slate-400 uppercase">{metric.label}</p>
                      <p className="mt-1 text-xl font-semibold text-slate-100">{metric.value}</p>
                    </div>
                    <span className={`h-2.5 w-2.5 rounded-full ${metric.dot}`} aria-hidden="true" />
                  </article>
                ))}
              </div>

              <div className="grid gap-2">
                <TextField value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Buscar asunto o auditor..." />
                <div className="grid gap-2 sm:grid-cols-2">
                  <SelectField value={tier} onChange={(event) => setTier(event.target.value)}>
                    {tierOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </SelectField>
                  <SelectField value={category} onChange={(event) => setCategory(event.target.value)}>
                    {categoryOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </SelectField>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <label className="space-y-1 text-sm text-slate-300 sm:col-span-2">
                    Tema
                    <SelectField value={topic} onChange={(event) => setTopic(event.target.value)}>
                      <option value="">Todos</option>
                      {topicOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </SelectField>
                  </label>
                  <label className="space-y-1 text-sm text-slate-300">
                    Flujo
                    <SelectField value={flowFilter} onChange={(event) => setFlowFilter(event.target.value as FlowFilter)}>
                      <option value="all">Todos</option>
                      <option value="needs_verification">Pendientes de verificacion</option>
                      <option value="needs_validation">Pendientes de validacion</option>
                      <option value="ready_for_ranking">Listos para ranking</option>
                      <option value="in_ranking">Con votacion activa</option>
                    </SelectField>
                  </label>
                </div>
                <label className="space-y-1 text-sm text-slate-300">
                  Estado para ranking
                  <SelectField value={rankingState} onChange={(event) => setRankingState(event.target.value as DebateIssue["rankingState"] | "")}>
                    {rankingStateOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </SelectField>
                </label>
              </div>

              <div className="flex flex-wrap items-end justify-between gap-2 border-t border-white/10 pt-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold tracking-[-0.03em] text-slate-100">Debates de seed y asuntos publicos</h2>
                    <HelpIconButton label="Ayuda de seccion Debate" onClick={() => setHelpTopic("debate")} />
                  </div>
                </div>
                <p className="text-xs tracking-[0.16em] text-slate-400">LISTOS PARA CICLO DEBATE A RANKING</p>
              </div>

              <section className="tl-muted-surface p-1.5" role="tablist" aria-label="Estados del debate">
                <div className="grid gap-1 sm:grid-cols-3">
                  {[
                    { key: "ready", label: "Verificados y validados", count: debateLaneCounts.ready },
                    { key: "voting", label: "En votacion", count: debateLaneCounts.voting },
                    { key: "closed", label: "Pasaron ranking", count: debateLaneCounts.closed },
                  ].map((lane) => (
                    <button
                      key={lane.key}
                      type="button"
                      role="tab"
                      aria-selected={debateLane === lane.key}
                      onClick={() => setDebateLane(lane.key as DebateLane)}
                      className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                        debateLane === lane.key ? "bg-[#0052ff] text-white" : "text-slate-300 hover:bg-[#13213d]"
                      }`}
                    >
                      {lane.label}
                      <span className="ml-2 rounded-md bg-black/30 px-1.5 py-0.5 text-xs">{lane.count}</span>
                    </button>
                  ))}
                </div>
              </section>

              {issueQuery.isLoading ? <p className="text-sm text-slate-400">Cargando asuntos...</p> : null}
              {issueQuery.isError ? <p className="text-sm text-rose-300">No fue posible cargar el listado en este momento.</p> : null}

              <div className="space-y-4">
                {laneItems.map((item, index) => (
                  <article key={item.id} className="rounded-xl border border-white/10 bg-[#0c1630] p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-slate-400">{issueCode((page - 1) * PAGE_SIZE + index)}</p>
                        <Link className="mt-1 block text-2xl font-bold tracking-[-0.03em] text-slate-100 hover:text-sky-300" to={`/feedback/${item.id}`}>
                          {item.title}
                        </Link>
                        <p className="mt-1 text-sm text-slate-300">{item.topic} - Tier S</p>
                      </div>
                      <div className="text-right">
                        <p className="inline-flex rounded-md bg-emerald-500/15 px-3 py-1 text-sm font-semibold text-emerald-300">Votos definidos por la comunidad</p>
                        <p className="mt-2 text-yellow-300">Estrellas segun puesto final en ranking</p>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-2 text-sm text-slate-300 lg:grid-cols-3">
                      <p>Objeto premio propuesto por creador y validado por votos del publico</p>
                      <p>Valor potencial del objeto: segun demanda y cantidad de votos</p>
                      <p>Destino objeto: inventario o oferta SVP al mayor postor</p>
                      <p>Limite: {item.rankingState === "closed" ? "votacion cerrada" : "sin limite"}</p>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <StatusBadge status={item.verificationPassed ? "ok" : "warn"}>{item.verificationPassed ? "Verificado" : "Pendiente"}</StatusBadge>
                      <StatusBadge status={item.validationPassed ? "ok" : "warn"}>{item.validationPassed ? "Validado" : "Sin validar"}</StatusBadge>
                      <StatusBadge status={item.rankingEligible ? "ok" : "warn"}>{rankingLabel(item)}</StatusBadge>
                      <p className="text-xs text-slate-400">Estado: {processLabel(item)}</p>
                    </div>

                    <div className="mt-3 h-1.5 w-full overflow-hidden rounded bg-slate-950">
                      <div className="h-full bg-[#2f8bff]" style={{ width: `${processStep(item) * 25}%` }} />
                    </div>

                    <div className="mt-3 flex flex-wrap justify-end gap-2">
                      <Button disabled={item.verificationPassed || verifyMutation.isPending} onClick={() => verifyMutation.mutate(item.id)} variant="secondary">
                        Verificar
                      </Button>
                      <Button disabled={!item.verificationPassed || item.validationPassed || validateMutation.isPending} onClick={() => validateMutation.mutate(item.id)}>
                        Validar
                      </Button>
                      {item.rankingEligible ? (
                        <Link to="/rankings">
                          <Button>Abrir Debate</Button>
                        </Link>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>

               {!issueQuery.isLoading && !laneItems.length ? <p className="text-sm text-slate-400">No hay asuntos para esta pestaña con los filtros actuales.</p> : null}

              <div className="flex items-center justify-between border-t border-white/10 pt-3">
                <p className="text-xs tracking-[0.16em] text-slate-400">PAGINA {page} DE {totalPages}</p>
                <div className="flex gap-2">
                  <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((prev) => prev - 1)}>Anterior</Button>
                  <Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage((prev) => prev + 1)}>Siguiente</Button>
                </div>
              </div>
            </section>
          ) : null}

          {feedbackSection === "discarded" ? (
            <section id="feedback-panel-discarded" role="tabpanel" className="tl-surface space-y-3 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-2xl font-bold tracking-[-0.03em] text-slate-100">Asuntos descartados o en revision</h2>
                <HelpIconButton label="Ayuda de descartados" onClick={() => setHelpTopic("discarded")} />
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <TextField value={discardedSearch} onChange={(event) => setDiscardedSearch(event.target.value)} placeholder="Buscar por asunto o motivo" />
                <SelectField value={discardedStatus} onChange={(event) => setDiscardedStatus(event.target.value as DiscardedStatus)}>
                  <option value="all">Todos los estados</option>
                  <option value="DESCARTADO">Descartado</option>
                  <option value="EN REVISION">En revision</option>
                  <option value="APROBADO CONDICIONAL">Aprobado condicional</option>
                  <option value="REINTEGRADO">Reintegrado</option>
                </SelectField>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-xs tracking-[0.14em] text-slate-400">
                      <th className="px-2 py-2">ID</th>
                      <th className="px-2 py-2">ASUNTO</th>
                      <th className="px-2 py-2">ESTADO</th>
                      <th className="px-2 py-2">MOTIVO</th>
                      <th className="px-2 py-2 text-right">ACCION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {discardedVisible.map((row) => (
                      <tr key={row.id} className="border-b border-white/5 text-slate-300">
                        <td className="px-2 py-2 font-semibold text-slate-100">{row.id}</td>
                        <td className="px-2 py-2">{row.subject}</td>
                        <td className="px-2 py-2">
                          <span className={`rounded-full px-2 py-0.5 text-xs ${discardedTone(row.status)}`}>{row.status}</span>
                        </td>
                        <td className="px-2 py-2">{row.reason}</td>
                        <td className="px-2 py-2">
                          <div className="flex justify-end gap-1.5">
                            {row.status === "DESCARTADO" ? (
                               <IconActionButton label="Solicitar revision" onClick={() => handleRequestReview(row)}>
                                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                                  <path d="M12 4v16M4 12h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                </svg>
                              </IconActionButton>
                            ) : null}
                            {row.status === "EN REVISION" || row.status === "APROBADO CONDICIONAL" ? (
                              <IconActionButton label="Integrar a debate" tone="primary" onClick={() => handleReintegrate(row.id)}>
                                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                                  <path d="m5 12 4 4 10-10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </IconActionButton>
                            ) : null}
                            {row.status === "REINTEGRADO" ? (
                              <IconActionButton label="Integrado" disabled>
                                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                                  <path d="m5 12 4 4 10-10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </IconActionButton>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!discardedVisible.length ? <p className="text-sm text-slate-400">No hay resultados para estos filtros.</p> : null}
            </section>
          ) : null}
        </>
      ) : (
        <div className="space-y-4">
          {reviewsQuery.isLoading ? <p className="text-sm text-slate-400">Cargando resenas...</p> : null}
          {reviewsQuery.isError ? <p className="text-sm text-rose-300">No fue posible cargar las resenas.</p> : null}
          {reviewsQuery.data?.map((review, index) => (
            <article key={review.id} className="tl-surface p-5 sm:p-6">
              <div className="h-16 w-16 rounded-full border border-[#3e86d9] bg-gradient-to-br from-[#215078] to-[#1e3554]" />
              <p className="mt-4 text-3xl font-bold tracking-[-0.03em] text-slate-100">{review.author}</p>
              <p className="text-sm font-semibold tracking-[0.12em] text-[#f0d45d]">{index === 0 ? "SENIOR AUDITOR" : "NETWORK ANALYST"}</p>
              <p className="text-sm text-emerald-300">{(review.score * 20).toFixed(1)}% Consenso</p>
              <h2 className="mt-3 text-4xl leading-tight font-bold tracking-[-0.03em] text-slate-100">{review.message}</h2>
              <blockquote className="mt-3 border-l-4 border-[#1860ff] pl-3 text-2xl text-slate-300">
                "La revision mantiene coherencia operativa sin romper el flujo principal."
              </blockquote>
              <div className="mt-4 flex flex-wrap gap-6 text-xl text-slate-300">
                <p>{review.score * 240} Acuerdos</p>
                <p>{review.score * 12} Replicas</p>
              </div>
              <p className="mt-3 text-sm text-slate-400">14 OCT 2024</p>
            </article>
          ))}
          <div className="tl-muted-surface flex items-center justify-between px-3 py-2 text-xs tracking-[0.16em] text-slate-400">
            <p>PAGINA 1 DE 1</p>
            <div className="flex gap-2">
              <Button variant="secondary" disabled>Anterior</Button>
              <Button variant="secondary" disabled>Siguiente</Button>
            </div>
          </div>
        </div>
      )}
      </div>

      <Modal
        title={
          helpTopic === "overview"
            ? "Ayuda del modulo Feedback"
            : helpTopic === "intake"
              ? "Ayuda de captura inicial"
              : helpTopic === "seed"
                ? "Ayuda de asuntos seed"
                : helpTopic === "debate"
                  ? "Ayuda de Debate"
                  : helpTopic === "discarded"
                    ? "Ayuda de descartados"
                    : "Ayuda de Resenas"
        }
        open={Boolean(helpTopic)}
        onClose={() => setHelpTopic(null)}
      >
        {helpTopic === "overview" ? (
          <div className="space-y-2 text-sm text-slate-200">
            <p>Centro operativo de debate formal y resenas.</p>
            <p>Feedback centraliza los asuntos para debate y sus validaciones previas. Resenas concentra devoluciones sobre la plataforma TierList.</p>
          </div>
        ) : null}

        {helpTopic === "intake" ? (
          <div className="space-y-3 text-sm text-slate-200">
            <p>Antes de abrir un debate publico, el asunto debe pasar por control de calidad operacional.</p>
            <p>Los votos y estrellas no se estiman manualmente: se definen por decision de la comunidad y posicion final.</p>
            <p>El objeto premio lo propone quien crea el debate y se valida solo si alcanza el minimo de votos configurado.</p>
            <ol className="space-y-1">
              <li>1. Verificacion inicial</li>
              <li>2. Validacion inicial</li>
              <li>3. Debate por consenso</li>
              <li>4. Checklist para ingreso a ranking</li>
              <li>5. Aprobacion para ingresar al ranking</li>
            </ol>
          </div>
        ) : null}

        {helpTopic === "seed" ? (
          <p className="text-sm text-slate-200">
            Este bloque muestra asuntos de preseleccion utilizados como base de arranque para nuevos debates formales.
          </p>
        ) : null}

        {helpTopic === "debate" ? (
          <p className="text-sm text-slate-200">
            Aqui se listan asuntos listos para ciclo debate a ranking. Puedes filtrar, verificar, validar y abrir debate por cada asunto.
          </p>
        ) : null}

        {helpTopic === "discarded" ? (
          <p className="text-sm text-slate-200">
            Esta seccion permite revisar casos descartados o en revision y reintegrarlos al debate cuando cumplan condiciones.
          </p>
        ) : null}

        {helpTopic === "reviews" ? (
          <p className="text-sm text-slate-200">
            Resenas muestra devoluciones de usuarios y auditores sobre experiencia, coherencia y funcionamiento de la plataforma.
          </p>
        ) : null}
      </Modal>
    </ModuleLayout>
  );
}

```
