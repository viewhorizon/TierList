import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { SidebarQuickAccess, StatusBadge, TierBadge } from "../components/ui";
import { fetchFeedbackEntries } from "../services/api";

const platformReviews = [
  { id: "r1", author: "@eco_tier", title: "Flujo de votacion claro", message: "La plataforma es estable y el seguimiento por etapas se entiende mejor.", rating: 5, status: "APROBADA" },
  { id: "r2", author: "@ledger_beta", title: "Mejorar busqueda", message: "La busqueda de debates antiguos podria traer mas filtros por fecha.", rating: 4, status: "EN REVISION" },
  { id: "r3", author: "@audit_north", title: "Buen rendimiento movil", message: "La experiencia movil mejoro, pero faltan atajos de teclado en desktop.", rating: 4, status: "APROBADA" },
];

const debateTopicsByCategory = [
  {
    category: "Tecnologia e IA",
    topics: [
      "Regular IA generativa en medios de comunicacion",
      "Lider tecnologico mas influyente de la decada",
      "Impuesto global para Big Tech",
    ],
  },
  {
    category: "Economia y Finanzas",
    topics: [
      "Bitcoin como reserva de valor",
      "Ingreso basico universal",
      "Rol de bancos centrales en inflacion",
    ],
  },
  {
    category: "Ciencia y Ambiente",
    topics: [
      "Energia nuclear y cambio climatico",
      "Deuda climatica de paises ricos",
      "Geoingenieria a escala global",
    ],
  },
];

const seedDebates = [
  {
    id: "TL-001",
    title: "Lideres tecnologicos globales",
    predictedVotes: 95000,
    stars: 5,
    category: "Tecnologia e Innovacion",
    tier: "Tier-S",
    svpReward: "50,000 SVP",
    prize: "Badge Arquitecto del Futuro",
    limit: "Sin limite, revision anual",
    rule: "Producto lanzado con mas de 1M de usuarios",
  },
  {
    id: "TL-002",
    title: "Activistas ambientales",
    predictedVotes: 88000,
    stars: 4,
    category: "Ecologia y Sustentabilidad",
    tier: "Tier-A",
    svpReward: "32,000 SVP",
    prize: "Token Guardian de la Tierra + NFT",
    limit: "6 meses",
    rule: "Impacto documentado en hectareas o CO2",
  },
  {
    id: "TL-003",
    title: "Cientificos con mayor impacto humano",
    predictedVotes: 97000,
    stars: 5,
    category: "Ciencia y Salud",
    tier: "Tier-S",
    svpReward: "60,000 SVP",
    prize: "Insignia Nobel del Pueblo",
    limit: "Sin limite, actualizacion bianual",
    rule: "Investigacion con aplicacion probada",
  },
  {
    id: "TL-010",
    title: "Regular IA generativa en medios",
    predictedVotes: 82000,
    stars: 4,
    category: "Tecnologia y Gobernanza",
    tier: "Tier-A",
    svpReward: "21,000 SVP",
    prize: "Badge Guardian del Discurso",
    limit: "90 dias",
    rule: "Completar modulo de alfabetizacion mediatica",
  },
  {
    id: "TL-011",
    title: "Energia nuclear y cambio climatico",
    predictedVotes: 91000,
    stars: 5,
    category: "Ciencia y Medio Ambiente",
    tier: "Tier-S",
    svpReward: "44,000 SVP",
    prize: "Objeto Reactor Soberano",
    limit: "180 dias",
    rule: "Participacion previa en 3 debates de categoria",
  },
];

const reviewQueue = [
  { id: "TL-X01", topic: "Ganador de proximas elecciones", status: "DESCARTADO", reason: "Prediccion politica activa" },
  { id: "TL-X02", topic: "Accionar militar en conflicto activo", status: "EN REVISION", reason: "Alta sensibilidad geopolitica" },
  { id: "TL-X03", topic: "Legalizacion global de cannabis", status: "EN REVISION", reason: "Depende de marco legal por region" },
  { id: "TL-X05", topic: "Ranking personas mas ricas", status: "DESCARTADO", reason: "Dato factual, no debate" },
  { id: "TL-X06", topic: "Messi vs Ronaldo", status: "APROBADO CONDICIONAL", reason: "Requiere categoria y limite definido" },
];

export function FeedbackPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data } = useQuery({ queryKey: ["feedback"], queryFn: fetchFeedbackEntries, retry: 2 });
  const activeFilter = searchParams.get("tier") ?? "global";
  const tab = searchParams.get("tab") ?? "feedback";
  const seedPage = Number(searchParams.get("seedPage") ?? "1");
  const entriesPage = Number(searchParams.get("entriesPage") ?? "1");
  const seedPageSize = 3;
  const entriesPageSize = 2;

  const updateParams = (next: Record<string, string>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(next).forEach(([key, value]) => params.set(key, value));
    setSearchParams(params);
  };

  const filteredEntries = (data ?? []).filter((entry) => {
    if (activeFilter === "global") return entry.tier === "S" || entry.tier === "A";
    if (activeFilter === "regional") return entry.tier === "A" || entry.tier === "B";
    if (activeFilter === "emerging") return entry.tier === "B";
    if (activeFilter === "archived") return entry.tier === "C";
    return true;
  });

  const seedPages = Math.max(1, Math.ceil(seedDebates.length / seedPageSize));
  const safeSeedPage = Math.min(Math.max(seedPage, 1), seedPages);
  const visibleSeedDebates = useMemo(
    () => seedDebates.slice((safeSeedPage - 1) * seedPageSize, safeSeedPage * seedPageSize),
    [safeSeedPage],
  );

  const entriesPages = Math.max(1, Math.ceil(filteredEntries.length / entriesPageSize));
  const safeEntriesPage = Math.min(Math.max(entriesPage, 1), entriesPages);
  const visibleEntries = useMemo(
    () => filteredEntries.slice((safeEntriesPage - 1) * entriesPageSize, safeEntriesPage * entriesPageSize),
    [filteredEntries, safeEntriesPage],
  );

  return (
    <AppLayout
      leftSidebar={
        <div className="flex h-full flex-col justify-between rounded-2xl border border-white/6 bg-[#0f1829] p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Debate Filters</p>
            <div className="mt-5 space-y-2 text-slate-300">
              {"Global Tiers,Regional Tiers,Emerging Tiers,Archived Tiers".split(",").map((label) => (
                <button
                  key={label}
                  type="button"
                    onClick={() =>
                      updateParams({
                        tier: label.split(" ")[0].toLowerCase(),
                        tab,
                        entriesPage: "1",
                      })
                    }
                  className={`sidebar-action w-full rounded-xl px-4 py-3 text-left text-sm font-medium ${activeFilter === label.split(" ")[0].toLowerCase() ? "sidebar-action-active bg-[#0052ff]/20 text-[#61abff] ring-1 ring-[#0052ff]/50" : "hover:bg-white/5"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3 pt-4">
            <Link to="/notifications" className="block w-full rounded-xl bg-[#0052ff] py-3 text-center text-sm font-semibold">Sync Ledger</Link>
            <SidebarQuickAccess />
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-amber-300">Consenso Global</p>
            <h1 className="text-4xl font-black tracking-[-0.04em] md:text-5xl xl:text-[4rem]">Feedback y Resenas</h1>
            <p className="mt-3 max-w-3xl text-base text-slate-300 md:text-xl">
              Feedback centraliza los asuntos para debate y sus validaciones previas. Resenas concentra devoluciones sobre la plataforma TierList.
            </p>
          </div>
          <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-emerald-300">
            <p className="text-xs uppercase tracking-[0.15em] text-emerald-200/80">Tasa Global</p>
            <p className="text-2xl font-bold">94.2%</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => updateParams({ tier: activeFilter, tab: "feedback", seedPage: "1", entriesPage: "1" })}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === "feedback" ? "bg-[#0052ff] text-white" : "bg-white/10 text-slate-200"}`}
          >
            Feedback
          </button>
          <button
            type="button"
            onClick={() => updateParams({ tier: activeFilter, tab: "resenas" })}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === "resenas" ? "bg-[#0052ff] text-white" : "bg-white/10 text-slate-200"}`}
          >
            Resenas
          </button>
        </div>

        {tab === "feedback" ? (
          <>
            <section className="rounded-2xl border border-white/8 bg-[#141d31] p-4 md:p-5">
              <div className="mb-4 rounded-xl border border-cyan-400/25 bg-cyan-500/10 p-3 text-sm text-cyan-100">
                Crear debate publica el asunto en revision. La apertura oficial ocurre solo tras verificacion y validacion por administradores o agente de IA.
              </div>
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_220px_220px]">
                <label className="text-xs uppercase tracking-[0.12em] text-slate-400">
                  Asunto a debatir
                  <input className="mt-2 h-11 w-full rounded-lg bg-[#0f1627] px-3 text-sm text-slate-200 outline-none ring-1 ring-white/10 focus:ring-[#0052ff]" placeholder="Ej: Provincia mas limpia" />
                </label>
                <label className="text-xs uppercase tracking-[0.12em] text-slate-400">
                  Puntos estimados (votos)
                  <input className="mt-2 h-11 w-full rounded-lg bg-[#0f1627] px-3 text-sm text-slate-200 outline-none ring-1 ring-white/10 focus:ring-[#0052ff]" placeholder="Ej: 54000" />
                </label>
                <label className="text-xs uppercase tracking-[0.12em] text-slate-400">
                  Valor en estrellas
                  <select className="mt-2 h-11 w-full rounded-lg bg-[#0f1627] px-3 text-sm text-slate-200 outline-none ring-1 ring-white/10 focus:ring-[#0052ff]">
                    <option>5 estrellas</option>
                    <option>4 estrellas</option>
                    <option>3 estrellas</option>
                    <option>2 estrellas</option>
                    <option>1 estrella</option>
                  </select>
                </label>
                <label className="text-xs uppercase tracking-[0.12em] text-slate-400">
                  Categoria TierList
                  <select className="mt-2 h-11 w-full rounded-lg bg-[#0f1627] px-3 text-sm text-slate-200 outline-none ring-1 ring-white/10 focus:ring-[#0052ff]">
                    <option>Ecologia</option>
                    <option>Gobernanza</option>
                    <option>Servicios</option>
                  </select>
                </label>
                <label className="text-xs uppercase tracking-[0.12em] text-slate-400">
                  Premio SVP por logro
                  <input className="mt-2 h-11 w-full rounded-lg bg-[#0f1627] px-3 text-sm text-slate-200 outline-none ring-1 ring-white/10 focus:ring-[#0052ff]" placeholder="Ej: 10000 SVP" />
                </label>
              </div>
              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                <label className="text-xs uppercase tracking-[0.12em] text-slate-400">
                  Premio simbolico (objeto o insignia)
                  <input className="mt-2 h-11 w-full rounded-lg bg-[#0f1627] px-3 text-sm text-slate-200 outline-none ring-1 ring-white/10 focus:ring-[#0052ff]" placeholder="Ej: Objeto Ecologista S-Tier" />
                </label>
                <label className="text-xs uppercase tracking-[0.12em] text-slate-400">
                  Limite de votacion
                  <select className="mt-2 h-11 w-full rounded-lg bg-[#0f1627] px-3 text-sm text-slate-200 outline-none ring-1 ring-white/10 focus:ring-[#0052ff]">
                    <option>Con tiempo limite</option>
                    <option>Sin tiempo limite</option>
                  </select>
                </label>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                {[
                  "Verificacion inicial",
                  "Validacion inicial",
                  "Debate por consenso",
                  "Checklist para ingreso a ranking",
                  "Aprobacion para votar podio",
                ].map((item) => (
                  <div key={item} className="rounded-lg border border-white/8 bg-[#0f1627] px-3 py-2 text-xs uppercase tracking-[0.1em] text-slate-300">
                    {item}
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-white/8 bg-[#141d31] p-4 md:p-5">
              <h2 className="text-2xl font-bold tracking-[-0.03em]">Asuntos propuestos para debate global</h2>
              <p className="mt-2 text-sm text-slate-300">Contenido integrado desde FeedBack.txt como base de preseleccion de asuntos.</p>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                {debateTopicsByCategory.map((group) => (
                  <div key={group.category} className="rounded-xl border border-white/10 bg-[#0f1627] p-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-cyan-200">{group.category}</p>
                    <ul className="mt-2 space-y-2 text-sm text-slate-200">
                      {group.topics.map((topic) => (
                        <li key={topic} className="leading-snug">{topic}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-white/8 bg-[#141d31] p-4 md:p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-2xl font-bold tracking-[-0.03em]">Debates de seed y asuntos publicos</h2>
                <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Listos para ciclo Debate a Ranking</p>
              </div>
              <p className="mt-2 text-sm text-slate-300">
                Puntos representa votos estimados del asunto. El valor en estrellas define prioridad y visibilidad del debate.
              </p>
              <div className="mt-4 space-y-3">
                {visibleSeedDebates.map((debate) => (
                  <article key={debate.id} className="rounded-xl border border-white/10 bg-[#0f1627] p-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-400">{debate.id}</p>
                        <h3 className="mt-1 text-lg font-semibold">{debate.title}</h3>
                        <p className="mt-1 text-sm text-slate-300">{debate.category} · {debate.tier}</p>
                      </div>
                      <div className="text-right">
                        <p className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-sm font-semibold text-emerald-300">{debate.predictedVotes.toLocaleString("es-AR")} votos</p>
                        <p className="mt-1 text-amber-200">{"★".repeat(debate.stars)}</p>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-slate-300 md:grid-cols-3">
                      <p><span className="text-slate-500">Premio simbolico:</span> {debate.prize}</p>
                      <p><span className="text-slate-500">Premio SVP:</span> {debate.svpReward}</p>
                      <p><span className="text-slate-500">Regla:</span> {debate.rule}</p>
                      <p><span className="text-slate-500">Limite:</span> {debate.limit}</p>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Estado: Listo para verificacion y validacion inicial</p>
                      <Link to="/feedback/sl-982-ax" className="rounded-lg bg-[#0052ff] px-3 py-2 text-sm font-semibold">Abrir Debate</Link>
                    </div>
                  </article>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-3 text-xs uppercase tracking-[0.14em] text-slate-400">
                <p>Pagina {safeSeedPage} de {seedPages}</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-lg bg-white/8 px-3 py-2 disabled:opacity-40"
                    onClick={() => updateParams({ seedPage: String(Math.max(1, safeSeedPage - 1)) })}
                    disabled={safeSeedPage === 1}
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    className="rounded-lg bg-white/8 px-3 py-2 disabled:opacity-40"
                    onClick={() => updateParams({ seedPage: String(Math.min(seedPages, safeSeedPage + 1)) })}
                    disabled={safeSeedPage === seedPages}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-white/8 bg-[#141d31] p-4 md:p-5">
              <h2 className="text-2xl font-bold tracking-[-0.03em]">Asuntos descartados o en revision</h2>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="text-xs uppercase tracking-[0.14em] text-slate-400">
                    <tr>
                      <th className="px-2 py-2 text-left">ID</th>
                      <th className="px-2 py-2 text-left">Asunto</th>
                      <th className="px-2 py-2 text-left">Estado</th>
                      <th className="px-2 py-2 text-left">Motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviewQueue.map((row) => (
                      <tr key={row.id} className="border-t border-white/8">
                        <td className="px-2 py-3 font-semibold text-slate-200">{row.id}</td>
                        <td className="px-2 py-3 text-slate-300">{row.topic}</td>
                        <td className="px-2 py-3">
                          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${row.status === "DESCARTADO" ? "bg-red-500/15 text-red-200" : row.status === "EN REVISION" ? "bg-amber-500/15 text-amber-200" : "bg-emerald-500/15 text-emerald-200"}`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="px-2 py-3 text-slate-400">{row.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_260px]">
              <input
                className="h-12 rounded-xl bg-[#161f33] px-4 outline-none ring-1 ring-white/10 focus:ring-[#0052ff]"
                placeholder="Buscar asunto o auditor..."
                aria-label="Buscar asunto o auditor"
              />
              <select className="h-12 rounded-xl bg-[#161f33] px-4 outline-none ring-1 ring-white/10 focus:ring-[#0052ff]">
                <option>Todos los Tiers</option>
              </select>
              <select className="h-12 rounded-xl bg-[#161f33] px-4 outline-none ring-1 ring-white/10 focus:ring-[#0052ff]">
                <option>Todas las Categorias</option>
              </select>
            </div>

            <div className="space-y-4">
              {visibleEntries.map((entry) => (
                <article key={entry.id} className="rounded-2xl border border-white/6 bg-[#161f33] p-5 md:p-6">
                  <div className="grid gap-5 lg:grid-cols-[190px_minmax(0,1fr)_130px]">
                    <div className="min-w-0">
                      <div className="h-20 w-20 rounded-full border border-cyan-300/20 bg-gradient-to-br from-cyan-400/30 to-[#2a3550]" />
                      <p className="mt-3 text-2xl font-bold tracking-[-0.03em]">{entry.author}</p>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-300">{entry.role}</p>
                      <p className="mt-1 text-sm text-emerald-300">{(entry.likes / 5).toFixed(1)}% Consenso</p>
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <TierBadge tier={entry.tier} />
                        <p className="text-sm text-slate-400">Asunto #{entry.id.toUpperCase()}</p>
                      </div>
                      <h3 className="mt-2 text-3xl font-black tracking-[-0.04em] md:text-[2.25rem]">{entry.title}</h3>
                      <blockquote className="mt-4 border-l-[3px] border-[#0052ff] pl-4 text-lg italic text-slate-300 md:text-xl">"{entry.quote}"</blockquote>
                      <div className="mt-5 flex flex-wrap gap-6 text-slate-300">
                        <span>{entry.likes} Acuerdos</span>
                        <span>{entry.replies} Replicas</span>
                      </div>
                    </div>
                    <div className="flex items-start justify-between gap-3 lg:flex-col lg:items-end">
                      <p className="text-right text-xs text-slate-400">14 OCT 2024</p>
                      <StatusBadge status={entry.status} />
                    </div>
                  </div>
                </article>
              ))}
              {filteredEntries.length === 0 && <p className="rounded-xl bg-[#161f33] p-4 text-slate-400">No hay debates para este filtro.</p>}
            </div>

            {filteredEntries.length > 0 && (
              <div className="flex items-center justify-between rounded-xl border border-white/8 bg-[#141d31] px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-400">
                <p>Pagina {safeEntriesPage} de {entriesPages}</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-lg bg-white/8 px-3 py-2 disabled:opacity-40"
                    onClick={() => updateParams({ entriesPage: String(Math.max(1, safeEntriesPage - 1)) })}
                    disabled={safeEntriesPage === 1}
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    className="rounded-lg bg-white/8 px-3 py-2 disabled:opacity-40"
                    onClick={() => updateParams({ entriesPage: String(Math.min(entriesPages, safeEntriesPage + 1)) })}
                    disabled={safeEntriesPage === entriesPages}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-3">
            {platformReviews.map((review) => (
              <article key={review.id} className="rounded-2xl border border-white/6 bg-[#161f33] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm uppercase tracking-[0.12em] text-slate-400">{review.author}</p>
                    <h3 className="mt-1 text-2xl font-bold tracking-[-0.03em]">{review.title}</h3>
                    <p className="mt-2 max-w-3xl text-slate-300">{review.message}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-amber-300">{"★".repeat(review.rating)}</p>
                    <p className="mt-2 rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.1em] text-slate-200">{review.status}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-white/8 pt-6 text-xs uppercase tracking-[0.16em] text-slate-400">
          <p>2024 TierList Ledger</p>
          <p>Consensus Protocol v8.4.1</p>
          <p>Audit Latency: 4ms</p>
        </footer>
      </div>
    </AppLayout>
  );
}