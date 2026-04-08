```tsx
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { Button } from "@/components/ui/Button";
import { SelectField, TextField } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useSession } from "@/context/SessionContext";
import {
  getRankings,
  submitCompetitiveTierlist,
  submitGoalVote,
  submitRankingVote,
} from "@/services/rankingsService";
import { emitSvpEvent } from "@/services/svpEventsService";
import type { RankingCompetitor, RankingItem } from "@/types/contracts";

type RankingStateFilter = "all" | "ready" | "voting" | "closed";
type RankingTab = "competitors" | "goal";
type TierValue = 1 | 2 | 3 | 4 | 5;

const pageSize = 4;
const tierRows: Array<{ value: TierValue; label: string; tone: string }> = [
  { value: 1, label: "Tier S", tone: "bg-emerald-500/20 text-emerald-200" },
  { value: 2, label: "Tier A", tone: "bg-sky-500/20 text-sky-200" },
  { value: 3, label: "Tier B", tone: "bg-violet-500/20 text-violet-200" },
  { value: 4, label: "Tier C", tone: "bg-amber-500/20 text-amber-200" },
  { value: 5, label: "Tier D", tone: "bg-rose-500/20 text-rose-200" },
];

function stateCopy(state: "ready" | "voting" | "closed") {
  if (state === "voting") return "Votacion activa";
  if (state === "ready") return "En verificacion";
  return "Cerrado";
}

function stateTone(state: "ready" | "voting" | "closed") {
  if (state === "voting") return "active" as const;
  if (state === "ready") return "pending" as const;
  return "warn" as const;
}

function consensusPct(item: RankingItem) {
  const total = item.votes.first + item.votes.second + item.votes.third;
  if (!total) return 0;
  return Number(((item.votes.first / total) * 100).toFixed(1));
}

function totalVotes(item: RankingItem) {
  return item.votes.first + item.votes.second + item.votes.third;
}

function newClientId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getSourceEnv(): "dev" | "staging" | "prod" {
  const mode = import.meta.env.MODE;
  if (mode === "production") return "prod";
  if (mode === "staging") return "staging";
  return "dev";
}

function makePlacements(competitors: RankingCompetitor[] = []) {
  return competitors.reduce<Record<string, TierValue | null>>((acc, competitor) => {
    acc[competitor.id] = competitor.tier ?? null;
    return acc;
  }, {});
}

function clampPage(page: number, totalPages: number) {
  if (totalPages <= 0) return 1;
  return Math.min(Math.max(page, 1), totalPages);
}

export function RankingsPage() {
  const session = useSession();
  const queryClient = useQueryClient();

  const [helpOpen, setHelpOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<RankingTab>("competitors");
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState<RankingStateFilter>("all");
  const [competitorsPage, setCompetitorsPage] = useState(1);
  const [goalPage, setGoalPage] = useState(1);
  const [voteIssueId, setVoteIssueId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [tierPlacements, setTierPlacements] = useState<Record<string, TierValue | null>>({});
  const [goalStars, setGoalStars] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [goalAction, setGoalAction] = useState<"vote" | "congrats">("vote");
  const [notice, setNotice] = useState<string | null>(null);
  const [goalCardStars, setGoalCardStars] = useState<Record<string, 1 | 2 | 3 | 4 | 5>>({});

  const tabOptions: Array<{ key: RankingTab; label: string; icon: "competition" | "accumulation" }> = [
    { key: "competitors", label: "Competicion", icon: "competition" },
    { key: "goal", label: "Acumulacion", icon: "accumulation" },
  ];

  const rankingsQuery = useQuery({ queryKey: ["rankings"], queryFn: getRankings });

  const relaySvp = async (item: RankingItem, score: number, metadata: Record<string, string | number | boolean>) => {
    const eventId = newClientId();
    await emitSvpEvent({
      idempotencyKey: `rank-vote-${eventId}`,
      hmacSignature: import.meta.env.VITE_SVP_HMAC_SIGNATURE,
      payload: {
        eventId,
        sourceApp: "tierlist-global",
        sourceEnv: getSourceEnv(),
        userId: session.userId,
        activityType: "vote_result",
        activityId: `${item.issueId}:${item.voteMode ?? "competitors"}`,
        score,
        unit: "vote",
        metadata,
        occurredAt: new Date().toISOString(),
      },
    });
  };

  const podiumMutation = useMutation({
    mutationFn: ({ issueId, position }: { issueId: string; position: 1 | 2 | 3 }) => submitRankingVote(issueId, position),
    onMutate: () => setNotice(null),
    onSuccess: async (item, variables) => {
      queryClient.invalidateQueries({ queryKey: ["rankings"] });
      try {
        await relaySvp(item, variables.position === 1 ? 100 : variables.position === 2 ? 70 : 40, {
          rank: variables.position,
          voteMode: item.voteMode ?? "competitors",
        });
      } catch {
        setNotice("El voto se registro. La sincronizacion externa se reintentara.");
      }
    },
  });

  const goalMutation = useMutation({
    mutationFn: ({ issueId, stars }: { issueId: string; stars: 1 | 2 | 3 | 4 | 5; action: "vote" | "congrats" }) =>
      submitGoalVote(issueId, stars),
    onMutate: () => setNotice(null),
    onSuccess: async (item, variables) => {
      queryClient.invalidateQueries({ queryKey: ["rankings"] });
      setVoteIssueId(null);
      setNotice(variables.action === "congrats" ? "Felicitacion registrada." : "Voto a favor registrado.");
      try {
        await relaySvp(item, variables.stars * 20, {
          stars: variables.stars,
          voteMode: "goal",
          support: true,
          action: variables.action,
        });
      } catch {
        setNotice("El voto se registro. La sincronizacion externa se reintentara.");
      }
    },
  });

  const tierlistMutation = useMutation({
    mutationFn: ({ issueId, placements }: { issueId: string; placements: Record<string, TierValue | null> }) =>
      submitCompetitiveTierlist(issueId, placements),
    onMutate: () => setNotice(null),
    onSuccess: async (item, variables) => {
      queryClient.invalidateQueries({ queryKey: ["rankings"] });
      setVoteIssueId(null);
      try {
        const assigned = Object.values(variables.placements).filter(Boolean).length;
        await relaySvp(item, Math.min(100, assigned * 20), {
          assigned,
          voteMode: "competitors",
          competitors: item.competitors?.length ?? 0,
        });
      } catch {
        setNotice("Tu ranking se guardo. La sincronizacion externa se reintentara.");
      }
    },
  });

  const filteredItems = useMemo(() => {
    const items = rankingsQuery.data ?? [];
    return items.filter((item) => {
      const bySearch = item.title.toLowerCase().includes(search.toLowerCase()) || item.topic.toLowerCase().includes(search.toLowerCase());
      const byState = stateFilter === "all" ? true : item.rankingState === stateFilter;
      return bySearch && byState;
    });
  }, [rankingsQuery.data, search, stateFilter]);

  const competitorsItems = filteredItems.filter((item) => (item.voteMode ?? "competitors") === "competitors");
  const goalItems = filteredItems.filter((item) => (item.voteMode ?? "competitors") === "goal");

  const competitorsTotalPages = Math.max(1, Math.ceil(competitorsItems.length / pageSize));
  const goalTotalPages = Math.max(1, Math.ceil(goalItems.length / pageSize));
  const safeCompetitorsPage = clampPage(competitorsPage, competitorsTotalPages);
  const safeGoalPage = clampPage(goalPage, goalTotalPages);

  const competitorsPageItems = competitorsItems.slice((safeCompetitorsPage - 1) * pageSize, safeCompetitorsPage * pageSize);
  const goalPageItems = goalItems.slice((safeGoalPage - 1) * pageSize, safeGoalPage * pageSize);

  const voteIssue = filteredItems.find((item) => item.issueId === voteIssueId) ?? null;
  const competitiveRows = voteIssue?.competitors ?? [];

  const openVoteWindow = (item: RankingItem) => {
    setVoteIssueId(item.issueId);
    setGoalStars(item.myGoalStars ?? null);
    setGoalAction("vote");
    setTierPlacements(makePlacements(item.competitors));
    setDraggedId(null);
  };

  const placeCompetitor = (competitorId: string, tier: TierValue | null) => {
    setTierPlacements((prev) => ({ ...prev, [competitorId]: tier }));
  };

  const renderCompetitorChip = (competitor: RankingCompetitor) => (
    <button
      key={competitor.id}
      type="button"
      draggable
      onDragStart={() => setDraggedId(competitor.id)}
      onDragEnd={() => setDraggedId(null)}
      className="inline-flex w-full items-center justify-between rounded-lg border border-white/10 bg-[#111f3f] px-2 py-1.5 text-left text-xs text-slate-200"
    >
      <span className="truncate font-semibold">{competitor.name}</span>
      <span className="ml-2 text-[10px] text-slate-400">{competitor.team ?? "Competidor"}</span>
    </button>
  );

  const renderItemCard = (item: RankingItem) => {
    const mode = item.voteMode ?? "competitors";
    const votes = totalVotes(item);
    const goal = item.voteGoal ?? 1;
    const progress = Math.min(100, (votes / goal) * 100);
    const canVote = item.rankingState === "voting";

    return (
      <article key={item.issueId} className="tl-surface overflow-hidden p-3 sm:p-4">
        <div className="relative mb-3 h-36 overflow-hidden rounded-lg border border-white/10 bg-[#0c1a35] sm:h-44">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={`Referencia de ${item.title}`} className="h-full w-full object-cover opacity-75" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-[#07142b] via-[#07142b]/70 to-transparent" />
          <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-200">{mode === "competitors" ? "Competicion" : "Acumulacion"}</p>
            <StatusBadge status={stateTone(item.rankingState)}>{stateCopy(item.rankingState)}</StatusBadge>
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-100 sm:text-xl">{item.title}</h3>
          <p className="text-sm text-slate-300">{item.summary || item.topic}</p>
          <p className="text-xs text-slate-400">Tema: {item.topic} | Ventana: {item.voteWindowHours ?? 72} horas</p>
          {item.rewardObjectName ? (
            <p className="text-xs text-slate-400">
              Objeto en juego: {item.rewardObjectName} ({(item.rewardApprovalVotes ?? 0).toLocaleString()} votos de validacion)
            </p>
          ) : null}
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <div className="tl-muted-surface p-2.5">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Consenso</p>
            <p className="text-2xl font-bold text-emerald-300">{consensusPct(item)}%</p>
          </div>
          <div className="tl-muted-surface p-2.5">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Votos</p>
            <p className="text-2xl font-bold text-slate-100">{votes.toLocaleString()}</p>
          </div>
          <div className="tl-muted-surface p-2.5">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Objetivo</p>
            <p className="text-2xl font-bold text-slate-100">{mode === "goal" ? goal.toLocaleString() : `${item.competitors?.length ?? 0} items`}</p>
          </div>
        </div>

        {mode === "goal" ? (
          <div className="mt-3 space-y-2">
            <div className="h-2 rounded bg-slate-700">
              <div className="h-2 rounded bg-[#2f8bff]" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-slate-400">{votes.toLocaleString()} / {goal.toLocaleString()} votos de validacion.</p>
              <p className="text-xs text-slate-300">{item.myGoalStars ? `Tu voto: ${item.myGoalStars} estrellas` : "Sin voto de estrellas"}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#0d1a34] p-2.5">
              <p className="mb-2 text-xs text-slate-300">Felicitar este asunto (1 a 5 estrellas)</p>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => {
                  const current = goalCardStars[item.issueId] ?? item.myGoalStars ?? 0;
                  const selected = current >= star;
                  return (
                    <button
                      key={`${item.issueId}-card-star-${star}`}
                      type="button"
                      className={`rounded px-1.5 py-0.5 text-base ${selected ? "text-amber-300" : "text-slate-500"}`}
                      onClick={() =>
                        setGoalCardStars((prev) => ({
                          ...prev,
                          [item.issueId]: star as 1 | 2 | 3 | 4 | 5,
                        }))
                      }
                      aria-label={`Seleccionar ${star} estrellas para ${item.title}`}
                    >
                      ★
                    </button>
                  );
                })}
                <Button
                  variant="secondary"
                  className="ml-2 h-8 px-3"
                  disabled={!canVote || goalMutation.isPending || !goalCardStars[item.issueId]}
                  onClick={() => {
                    const stars = goalCardStars[item.issueId];
                    if (!stars) return;
                    goalMutation.mutate({ issueId: item.issueId, stars, action: "congrats" });
                  }}
                >
                  Felicitar
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-xs text-slate-400">Ordena los competidores en 5 niveles para decidir la posicion final.</p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button className="h-8 px-3" disabled={!canVote} onClick={() => openVoteWindow(item)}>
            {mode === "competitors" ? "Ventana de votacion competitiva" : "Ventana de voto por acumulacion"}
          </Button>
          {item.myVote ? <p className="text-xs text-slate-300">Tu podio rapido: #{item.myVote}</p> : null}
        </div>
      </article>
    );
  };

  return (
    <ModuleLayout
      title="TierList | Rankings Globales"
      subtitle=""
      titleHelpLabel="Ayuda de Rankings"
      onTitleHelpClick={() => setHelpOpen(true)}
    >
      <div className="space-y-3 sm:space-y-5">
        <section className="tl-surface flex flex-wrap items-start justify-between gap-3 p-3 sm:p-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-[0.18em] text-[#f6d050]">RANKING GLOBAL</p>
            <h2 className="text-2xl font-black tracking-[-0.02em] text-slate-100 sm:text-3xl">Panel de votacion</h2>
          </div>
          <Button variant={filtersOpen ? "primary" : "secondary"} onClick={() => setFiltersOpen((prev) => !prev)}>
            Filtros
          </Button>
        </section>

        {filtersOpen ? (
          <section className="tl-surface grid gap-2.5 p-3 sm:grid-cols-2 sm:p-4">
            <label className="space-y-1 text-sm text-slate-300">
              Buscar asunto
              <TextField value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Titulo o tema" />
            </label>
            <label className="space-y-1 text-sm text-slate-300">
              Estado
              <SelectField value={stateFilter} onChange={(event) => setStateFilter(event.target.value as RankingStateFilter)}>
                <option value="all">Todos</option>
                <option value="voting">Votacion habilitada</option>
                <option value="ready">Pendiente de apertura</option>
                <option value="closed">Finalizados</option>
              </SelectField>
            </label>
          </section>
        ) : null}

        <section className="space-y-3">
          <section className="tl-surface p-2">
            <div className="no-scrollbar flex gap-1 overflow-x-auto" role="tablist" aria-label="Secciones de ranking">
              {tabOptions.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.key}
                  onClick={() => setActiveTab(tab.key as RankingTab)}
                  className={`shrink-0 rounded-md px-3 py-2 text-sm font-medium transition ${
                    activeTab === tab.key ? "bg-[#0052ff] text-white" : "text-slate-300 hover:bg-[#13213d]"
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    {tab.icon === "competition" ? (
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                        <path d="M7 5h10v3a5 5 0 0 1-10 0V5Z" stroke="currentColor" strokeWidth="1.8" />
                        <path d="M9 18h6M12 13v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        <path d="M5 7h2M17 7h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                        <path d="M4 15.5 12 5l8 10.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M8 13.5h8M9.5 17h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                    )}
                    {tab.label}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {activeTab === "competitors" ? (
            <div className="space-y-3">
              {competitorsPageItems.map(renderItemCard)}
              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-[#0b1831] px-3 py-2">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                  Pagina {safeCompetitorsPage} de {competitorsTotalPages}
                </p>
                <div className="flex gap-2">
                  <Button variant="ghost" className="h-8 px-3" disabled={safeCompetitorsPage <= 1} onClick={() => setCompetitorsPage((p) => p - 1)}>
                    Anterior
                  </Button>
                  <Button
                    variant="ghost"
                    className="h-8 px-3"
                    disabled={safeCompetitorsPage >= competitorsTotalPages}
                    onClick={() => setCompetitorsPage((p) => p + 1)}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {goalPageItems.map(renderItemCard)}
              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-[#0b1831] px-3 py-2">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                  Pagina {safeGoalPage} de {goalTotalPages}
                </p>
                <div className="flex gap-2">
                  <Button variant="ghost" className="h-8 px-3" disabled={safeGoalPage <= 1} onClick={() => setGoalPage((p) => p - 1)}>
                    Anterior
                  </Button>
                  <Button variant="ghost" className="h-8 px-3" disabled={safeGoalPage >= goalTotalPages} onClick={() => setGoalPage((p) => p + 1)}>
                    Siguiente
                  </Button>
                </div>
              </div>
            </div>
          )}
        </section>

        {rankingsQuery.isLoading ? <p className="text-sm text-slate-400">Cargando ranking...</p> : null}
        {rankingsQuery.isError ? <p className="text-sm text-rose-300">No fue posible cargar la votacion.</p> : null}
        {!rankingsQuery.isLoading && !filteredItems.length ? <p className="text-sm text-slate-400">No hay asuntos para el filtro actual.</p> : null}
        {notice ? <p className="text-sm text-emerald-200">{notice}</p> : null}
      </div>

      <Modal title="Ayuda de Rankings" open={helpOpen} onClose={() => setHelpOpen(false)}>
        <div className="space-y-2 text-sm text-slate-200">
          <p>Este modulo opera dos tipos de votacion.</p>
          <p>Competicion: ordenas competidores en una tier list de 5 niveles.</p>
          <p>Acumulacion: votas a favor y asignas de 1 a 5 estrellas.</p>
        </div>
      </Modal>

      <Modal title="Ventana de votacion" open={Boolean(voteIssue)} onClose={() => setVoteIssueId(null)}>
        {voteIssue ? (
          <div className="space-y-3 text-sm text-slate-200">
            <div>
              <p className="text-base font-semibold text-slate-100">{voteIssue.title}</p>
              <p className="text-xs text-slate-400">{voteIssue.topic}</p>
            </div>

            {(voteIssue.voteMode ?? "competitors") === "goal" ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const selected = (goalStars ?? 0) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        className={`rounded-md px-2 py-1 text-lg ${selected ? "bg-amber-300 text-slate-900" : "bg-white/10 text-slate-200"}`}
                        onClick={() => setGoalStars(star as 1 | 2 | 3 | 4 | 5)}
                      >
                        ★
                      </button>
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    disabled={!goalStars || goalMutation.isPending}
                    onClick={() => {
                      if (!goalStars) return;
                      setGoalAction("vote");
                      goalMutation.mutate({ issueId: voteIssue.issueId, stars: goalStars, action: "vote" });
                    }}
                  >
                    Votar a favor
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={!goalStars || goalMutation.isPending}
                    onClick={() => {
                      if (!goalStars) return;
                      setGoalAction("congrats");
                      goalMutation.mutate({ issueId: voteIssue.issueId, stars: goalStars, action: "congrats" });
                    }}
                  >
                    Felicitar con estrellas
                  </Button>
                  <Button variant="secondary" onClick={() => setVoteIssueId(null)}>
                    No votar
                  </Button>
                </div>
                <p className="text-xs text-slate-400">{goalAction === "congrats" ? "Enviaras una felicitacion publica." : "Tu voto suma al objetivo del asunto."}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div
                  className="rounded-xl border border-white/10 bg-[#0a1630]/80 p-2.5"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (draggedId) placeCompetitor(draggedId, null);
                    setDraggedId(null);
                  }}
                >
                  <p className="mb-2 text-xs uppercase tracking-[0.16em] text-slate-400">Sin asignar</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {competitiveRows
                      .filter((competitor) => !tierPlacements[competitor.id])
                      .map((competitor) => renderCompetitorChip(competitor))}
                  </div>
                </div>

                <div className="space-y-2">
                  {tierRows.map((tier) => (
                    <div
                      key={tier.value}
                      className="rounded-xl border border-white/10 bg-[#0a1630] p-2.5"
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => {
                        if (draggedId) placeCompetitor(draggedId, tier.value);
                        setDraggedId(null);
                      }}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${tier.tone}`}>{tier.label}</span>
                        <span className="text-xs text-slate-400">
                          {competitiveRows.filter((competitor) => tierPlacements[competitor.id] === tier.value).length} asignados
                        </span>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {competitiveRows
                          .filter((competitor) => tierPlacements[competitor.id] === tier.value)
                          .map((competitor) => renderCompetitorChip(competitor))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    disabled={tierlistMutation.isPending}
                    onClick={() => tierlistMutation.mutate({ issueId: voteIssue.issueId, placements: tierPlacements })}
                  >
                    Guardar ranking competitivo
                  </Button>
                  <Button variant="secondary" onClick={() => setVoteIssueId(null)}>
                    Cerrar
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={podiumMutation.isPending}
                    onClick={() => podiumMutation.mutate({ issueId: voteIssue.issueId, position: 1 })}
                  >
                    Voto rapido al #1
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </ModuleLayout>
  );
}
```
