import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, BarChart3, Clock3, MessageSquareText, PencilLine, Rocket, ShieldCheck, Star } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { SidebarQuickAccess } from "../components/ui";
import { fetchAuditEvents, fetchDebateLifecycle } from "../services/api";

const debateStageOrder = [
  "VERIFICACION_INICIAL",
  "VALIDACION_INICIAL",
  "DEBATE_FORMAL",
  "VERIFICACION_RESULTADO_DEBATE",
  "VALIDACION_RESULTADO_DEBATE",
  "VOTACION_RANKING",
  "VERIFICACION_VOTOS",
  "VALIDACION_VOTOS",
  "ENTREGA_LOGROS",
  "REGISTRO_RESULTADOS",
] as const;

export function AuditPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data } = useQuery({ queryKey: ["audit"], queryFn: fetchAuditEvents, retry: 2 });
  const debateId = searchParams.get("debate") ?? "sl-982-ax";
  const { data: lifecycle } = useQuery({
    queryKey: ["audit-lifecycle", debateId],
    queryFn: () => fetchDebateLifecycle(debateId),
    retry: 1,
  });
  const activeTier = searchParams.get("tier") ?? "tier s";
  const toneMap = {
    blue: "#0052ff",
    amber: "#ffb95f",
    green: "#4edea3",
    slate: "#64748b",
  } as const;
  const filteredEvents = (data ?? []).filter((event) => {
    if (activeTier === "tier s") return event.tone === "blue";
    if (activeTier === "tier a") return event.tone === "amber";
    if (activeTier === "tier b") return event.tone === "green";
    if (activeTier === "tier c") return event.tone === "slate";
    return true;
  });
  const svpMetrics = [
    { label: "Horas plataforma enviadas a SVP", value: 1420, tone: "bg-[#2f8bff]" },
    { label: "Horas usuarios enviadas a SVP", value: 986, tone: "bg-emerald-400" },
    { label: "Eventos sincronizados", value: 3240, tone: "bg-amber-300" },
  ];
  const maxMetric = Math.max(...svpMetrics.map((metric) => metric.value));
  const timelineMap = new Map((lifecycle?.timeline ?? []).map((item) => [item.key, item]));

  return (
    <AppLayout
      leftSidebar={
        <div className="flex h-full flex-col justify-between rounded-2xl border border-white/6 bg-[#161f33] p-4">
          <div>
            <h2 className="text-4xl font-black tracking-[-0.04em]">The Sovereign Ledger</h2>
            <div className="mt-5 rounded-xl bg-white/5 p-3">
              <p className="text-2xl font-bold">Institutional Core</p>
              <p className="text-xs uppercase tracking-[0.14em] text-amber-300">Ledger Verified</p>
            </div>
            <div className="mt-8 space-y-2 text-slate-300">
              {"Tier S,Tier A,Tier B,Tier C".split(",").map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setSearchParams({ tier: item.toLowerCase() })}
                  className={`sidebar-action w-full rounded-xl px-4 py-3 text-left text-xl ${activeTier === item.toLowerCase() ? "sidebar-action-active bg-[#0052ff]/20 text-[#60aaff]" : "hover:bg-white/5"}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Link to="/debate" className="block w-full rounded-xl bg-[#0052ff] py-3 text-center font-semibold">Enviar Propuesta</Link>
            <div className="mt-4">
              <SidebarQuickAccess />
            </div>
          </div>
        </div>
      }
      rightSidebar={
        <div className="rounded-2xl border border-white/6 bg-[#161f33] p-5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-3xl font-black tracking-[-0.04em]">Centro Global de Comentarios</h3>
            <MessageSquareText className="mt-1 h-5 w-5 text-[#2f8bff]" />
          </div>
          <p className="mt-3 text-slate-300">Comentarios de gobernanza para entradas del libro.</p>
          <div className="mt-5 rounded-xl border border-[#0052ff]/30 bg-[#1f2940] p-4">
            <p className="flex items-center gap-2 text-sm uppercase tracking-[0.14em]"><PencilLine className="h-3.5 w-3.5" /> Enviar evaluacion</p>
            <p className="mt-2 flex text-amber-300" aria-hidden="true">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} className="h-4 w-4 fill-current" />
              ))}
            </p>
            <textarea className="mt-3 h-28 w-full rounded-lg bg-[#0b1120] p-3 outline-none ring-1 ring-white/10 focus:ring-[#0052ff]" placeholder="Proporcione comentarios detallados..." />
            <Link to="/feedback" className="mt-3 block w-full rounded-lg bg-[#0052ff] py-3 text-center font-semibold">Publicar Entrada</Link>
          </div>
          <div className="mt-6 space-y-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Evaluaciones Recientes</p>
            {["Admin_Vance", "Council_Sarah", "Dev_Kael"].map((name) => (
              <article key={name} className="border-t border-white/6 pt-3">
                <p className="flex items-center justify-between gap-2 font-semibold">
                  <span>{name}</span>
                  <span className="text-xs text-slate-500">ID: #4922</span>
                </p>
                <p className="mt-1 flex text-amber-300" aria-hidden="true">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className="h-4 w-4 fill-current" />
                  ))}
                </p>
                <p className="mt-2 text-slate-400">Comentarios a nivel de gobernanza para entradas individuales del libro.</p>
              </article>
            ))}
          </div>
        </div>
      }
    >
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-amber-300">Monitor de Integridad del Sistema</p>
        <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] md:text-5xl">Historial de Auditoria de Votos</h1>
        <p className="mt-4 max-w-4xl text-base text-slate-300 md:text-xl">Registro inmutable en tiempo real de transiciones de nivel, revaluaciones y despachos criptograficos firmados con HMAC-DB.</p>
        <section className="mt-6 rounded-2xl border border-white/8 bg-[#101b30] p-4 md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-100">Auditoria Transversal</p>
              <p className="text-sm text-slate-400">Control de horas de actividad de TierList y usuarios enviadas al SVP externo.</p>
            </div>
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">EN MONITOREO</span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {svpMetrics.map((metric) => (
              <article key={metric.label} className="rounded-xl border border-white/8 bg-[#0b1324] p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-400">{metric.label}</p>
                <p className="mt-2 text-2xl font-bold">{metric.value.toLocaleString()}</p>
                <div className="mt-3 h-2 rounded-full bg-white/10">
                  <div className={`h-full rounded-full ${metric.tone}`} style={{ width: `${(metric.value / maxMetric) * 100}%` }} />
                </div>
              </article>
            ))}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <article className="rounded-xl border border-white/8 bg-[#0b1324] p-3">
              <p className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-slate-400"><Clock3 className="h-3.5 w-3.5" /> Ventana de transmision</p>
              <p className="mt-2 text-sm text-slate-300">Sincronizacion cada 15 minutos con comprobacion de hash y consistencia de lote.</p>
            </article>
            <article className="rounded-xl border border-white/8 bg-[#0b1324] p-3">
              <p className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-slate-400"><BarChart3 className="h-3.5 w-3.5" /> Estado de envio</p>
              <p className="mt-2 text-sm text-slate-300">99.2% de paquetes auditados llegaron integros al SVP externo en el ultimo ciclo.</p>
            </article>
          </div>
        </section>
          <section className="mt-6 rounded-2xl border border-white/8 bg-[#101b30] p-4 md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
                <p className="text-sm font-semibold text-slate-100">Secuencia Debate - Ranking</p>
                <p className="text-sm text-slate-400">Mapeo institucional del debate {debateId.toUpperCase()} desde verificacion inicial hasta registro final.</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {["sl-982-ax", "sl-441-tq", "sl-009-bv"].map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    const next = new URLSearchParams(searchParams);
                    next.set("debate", id);
                    setSearchParams(next);
                  }}
                  className={`rounded-full px-3 py-1.5 font-semibold uppercase tracking-[0.08em] ${debateId === id ? "bg-[#0052ff] text-white" : "bg-white/8 text-slate-300"}`}
                >
                  {id.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
            {debateStageOrder.map((key) => {
              const step = timelineMap.get(key);
              const isDone = step?.state === "done";
              const isCurrent = step?.state === "current";
              return (
                <article
                  key={key}
                  className={`rounded-xl border px-3 py-2 ${isDone ? "border-emerald-400/35 bg-emerald-500/10" : isCurrent ? "border-[#2f8bff]/40 bg-[#2f8bff]/12" : "border-white/8 bg-[#0b1324]"}`}
                >
                    <p className="text-[11px] uppercase tracking-[0.1em] text-slate-400">{step?.label ?? key.replace(/_/g, " ")}</p>
                  <p className="mt-1 text-sm font-semibold">{isDone ? "Completado" : isCurrent ? "En curso" : "Pendiente"}</p>
                </article>
              );
            })}
          </div>
        </section>
        <div className="mt-6 space-y-4">
          {filteredEvents.map((event) => (
            <article
              key={event.id}
              className="rounded-2xl border border-white/6 bg-[#161f33] p-5"
              style={{ borderLeftColor: toneMap[event.tone], borderLeftWidth: "4px" }}
            >
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#0b1120]">
                    {event.tone === "blue" && <ShieldCheck className="h-5 w-5 text-[#2f8bff]" />}
                    {event.tone === "amber" && <BadgeCheck className="h-5 w-5 text-amber-300" />}
                    {event.tone === "green" && <Rocket className="h-5 w-5 text-emerald-300" />}
                    {event.tone === "slate" && <ShieldCheck className="h-5 w-5 text-slate-300" />}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-4xl font-black tracking-[-0.04em]">{event.title}</h2>
                    <p className="mt-1 text-slate-400">{event.timestamp}    UUID: {event.uuid}</p>
                    <p className="mt-2 max-w-xl rounded-lg bg-[#0b1120] px-3 py-2 text-sm text-amber-300">HMAC-DB: {event.hash}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">VERIFICADO</span>
                  <Link to={`/feedback/${event.id}`} className="rounded-xl bg-white/12 px-6 py-4 font-semibold">Ver Detalles</Link>
                </div>
              </div>
            </article>
          ))}
          {filteredEvents.length === 0 && (
            <p className="rounded-xl border border-white/8 bg-[#161f33] p-4 text-slate-400">No hay eventos para este filtro.</p>
          )}
        </div>
      </div>
    </AppLayout>
  );
}