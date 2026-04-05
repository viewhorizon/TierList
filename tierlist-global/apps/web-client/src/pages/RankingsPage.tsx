import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { SidebarQuickAccess, StatusBadge, TierBadge } from "../components/ui";
import { fetchDebateLifecycle, fetchRankingsData } from "../services/api";

const stageLabelMap = {
  VERIFICACION_INICIAL: "Verificacion inicial",
  VALIDACION_INICIAL: "Validacion inicial",
  DEBATE_FORMAL: "Debate formal",
  VERIFICACION_RESULTADO_DEBATE: "Verificacion de resultados",
  VALIDACION_RESULTADO_DEBATE: "Validacion de resultados",
  VOTACION_RANKING: "Votacion en ranking",
  VERIFICACION_VOTOS: "Verificacion de votos",
  VALIDACION_VOTOS: "Validacion de votos",
  ENTREGA_LOGROS: "Entrega de premios",
  REGISTRO_RESULTADOS: "Registro final en base de datos",
} as const;

export function RankingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data } = useQuery({ queryKey: ["rankings"], queryFn: fetchRankingsData, retry: 2 });
  const { data: rankingVoting } = useQuery({
    queryKey: ["ranking-voting-metrics"],
    queryFn: () => fetchDebateLifecycle("sl-982-ax"),
    retry: 1,
  });
  const activeTier = searchParams.get("tier") ?? "tier-s";
  const filteredAssets = (data?.list ?? []).filter((asset) => {
    if (activeTier === "tier-s") return asset.tier === "S" || asset.tier === "A";
    if (activeTier === "tier-a") return asset.tier === "A";
    if (activeTier === "tier-b") return asset.tier === "B";
    if (activeTier === "tier-c") return asset.tier === "C";
    return true;
  });

  return (
    <AppLayout
      contextPanel={
        <div className="space-y-5 rounded-2xl border border-white/8 bg-[#10192c] p-4">
          <h3 className="text-lg font-bold tracking-[-0.02em]">Controles Ranking</h3>
          <div className="space-y-2">
            <button type="button" className="w-full rounded-lg bg-white/6 px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/10">Aplicar filtros</button>
            <button type="button" className="w-full rounded-lg bg-white/6 px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/10">Ordenar por impacto</button>
              <Link to="/feedback" className="block rounded-lg bg-[#0052ff] px-3 py-2 text-center text-sm font-semibold">Nuevo debate</Link>
          </div>
        </div>
      }
      leftSidebar={
        <div className="h-full rounded-2xl border border-white/6 bg-[#0f1829] p-4">
          <h2 className="text-3xl font-bold tracking-[-0.03em]">El Registro</h2>
          <p className="text-slate-500">Pulso Institucional</p>
          <div className="mt-8 space-y-2">
            {(["Tier-S", "Tier-A", "Tier-B", "Tier-C"] as const).map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => setSearchParams({ tier: label.toLowerCase() })}
                className={`sidebar-action w-full rounded-xl px-4 py-3 text-left ${activeTier === label.toLowerCase() ? "sidebar-action-active bg-[#0052ff]/20 text-[#59a7ff]" : "text-slate-300 hover:bg-white/5"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <Link to="/feedback" className="mt-8 block w-full rounded-xl bg-[#0052ff] py-3 text-center font-semibold">Nuevo Debate</Link>
          <div className="mt-4">
            <SidebarQuickAccess />
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-4xl font-black tracking-[-0.04em] md:text-5xl xl:text-[4rem]">TierList | Rankings Globales</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <span className="rounded-full bg-amber-300/15 px-3 py-1 font-semibold tracking-[0.12em] text-amber-200">AUDITADO EN VIVO</span>
              <span className="text-slate-400">Ultima sincronizacion: hace 12 segundos</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to={`/rankings?tier=${activeTier}`} className="rounded-xl bg-white/5 px-4 py-3">Filtros</Link>
            <Link to="/rankings?tier=tier-s" className="rounded-xl bg-white/5 px-4 py-3">Impacto</Link>
          </div>
        </div>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <article
            className="rounded-3xl border border-white/6 bg-cover bg-center p-6"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(11,17,30,0.9), rgba(11,17,30,0.6)), url('https://images.unsplash.com/photo-1621761191319-c6fb62004040?auto=format&fit=crop&w=1400&q=80')",
            }}
          >
            <div className="flex gap-2">
              <span className="rounded-full bg-[#ff4d4d] px-4 py-1 text-xs font-bold tracking-[0.15em] text-white">TIER-S</span>
              <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-sm font-semibold text-emerald-300">{data?.hero.consensus}% Consenso</span>
            </div>
            <h2 className="mt-6 text-4xl font-black tracking-[-0.04em] md:text-5xl xl:text-[4.25rem]">{data?.hero.name}</h2>
            <p className="mt-4 max-w-2xl text-base text-slate-300 md:text-lg">La base del valor programable. Lider indiscutible en descentralizacion y seguridad a nivel global.</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Votos activos</p>
                <p className="text-3xl font-bold">{data?.hero.participants} Participantes</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Estado de auditoria</p>
                <p className="text-3xl font-bold text-emerald-300">Verificado</p>
              </div>
            </div>
          </article>
          <article className="rounded-3xl border border-white/6 bg-[#161f33] p-6">
            <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Top #02</p>
            <h3 className="mt-3 text-3xl font-bold tracking-[-0.03em] sm:text-4xl">Chainlink Oracle</h3>
            <p className="mt-4 text-slate-300">Puente de datos critico para conectividad cross-chain y ejecucion de contratos inteligentes.</p>
            <div className="mt-10 flex items-center justify-between">
              <p className="text-5xl font-black text-emerald-300">94.8%</p>
              <Link to="/feedback/sl-982-ax" className="rounded-2xl bg-white/10 p-3" aria-label="Ver ciclo de debate del activo">
                <ArrowRight />
              </Link>
            </div>
          </article>
        </section>

        {rankingVoting?.voting && (
          <section className="grid gap-3 sm:grid-cols-3">
            {rankingVoting.voting.map((option) => (
              <article key={option.label} className="rounded-2xl border border-white/8 bg-[#141d31] px-4 py-4">
                <p className="text-sm text-slate-300">{option.label}</p>
                <p className="mt-2 text-3xl font-black" style={{ color: option.color }}>
                  {option.value}%
                </p>
              </article>
            ))}
          </section>
        )}

        <section className="rounded-2xl border border-white/8 bg-[#141d31] p-4 md:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Herramientas de votacion de ranking</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {[
              "Ventana de votacion activa",
              "Verificacion en tiempo real",
              "Validacion al cierre",
              "Registro final en base de datos",
            ].map((item) => (
              <div key={item} className="rounded-lg border border-white/8 bg-[#0f1627] px-3 py-2 text-xs uppercase tracking-[0.1em] text-slate-300">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-white/6 bg-[#161f33]">
          <div className="overflow-x-auto">
          <table className="min-w-[860px] w-full text-left">
            <thead className="bg-white/3 text-xs uppercase tracking-[0.14em] text-slate-400">
              <tr>
                <th className="px-5 py-4">Tier</th>
                <th>Activo institucional</th>
                <th>Porcentaje de consenso</th>
                <th>Validacion</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset) => (
                <tr key={asset.id} className="border-t border-white/6">
                  <td className="px-5 py-4"><TierBadge tier={asset.tier} /></td>
                  <td>
                    <p className="text-xl font-bold tracking-[-0.03em] md:text-2xl">{asset.name}</p>
                    <p className="text-sm uppercase tracking-[0.12em] text-slate-400">{asset.category}</p>
                  </td>
                  <td>
                    <p className="mb-2 text-sm font-semibold text-slate-300">{asset.consensus}%</p>
                    <div className="h-2 w-56 rounded-full bg-slate-700">
                      <div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500" style={{ width: `${asset.consensus}%` }} />
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={asset.validation} />
                      <Link
                        to={`/feedback/${asset.debateId}?asset=${asset.id}`}
                        className="rounded-lg bg-white/8 px-3 py-2 text-xs font-semibold"
                        aria-label={`Abrir ciclo de debate de ${asset.name}`}
                      >
                        &gt;
                      </Link>
                    </div>
                    <p className="mt-2 text-[11px] uppercase tracking-[0.12em] text-slate-500">Fase: {stageLabelMap[asset.debateStage]}</p>
                  </td>
                </tr>
              ))}
              {filteredAssets.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                    No hay activos para el tier seleccionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
          <div className="flex items-center justify-between border-t border-white/6 px-5 py-4 text-xs uppercase tracking-[0.14em] text-slate-400">
            <p>PAGINA 1 DE 48 | MOSTRANDO 1-10 DE 482 ACTIVOS</p>
            <div className="flex items-center gap-2">
              <Link to="/rankings" className="rounded-lg bg-white/5 px-3 py-2 text-slate-200">1</Link>
              <Link to="/rankings?page=2" className="rounded-lg bg-transparent px-3 py-2 text-slate-400">2</Link>
              <Link to="/rankings?page=3" className="rounded-lg bg-transparent px-3 py-2 text-slate-400">3</Link>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}