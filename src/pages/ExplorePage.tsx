import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Globe, Map, Radio, RotateCcw } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { MetricTile, SidebarQuickAccess, StatusBadge } from "../components/ui";
import { fetchExploreData } from "../services/api";

const filters = [
  { key: "global", label: "Global Tiers", icon: Globe },
  { key: "regional", label: "Regional Tiers", icon: Map },
  { key: "emerging", label: "Emerging Tiers", icon: Radio },
  { key: "archived", label: "Archived Tiers", icon: RotateCcw },
];

export function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data } = useQuery({ queryKey: ["explore"], queryFn: fetchExploreData, retry: 2 });
  const activeFilter = searchParams.get("tier") ?? "global";
  const filteredDebates = (data?.debates ?? []).filter((debate) => {
    if (activeFilter === "global") return debate.status !== "BORRADOR";
    if (activeFilter === "regional") return debate.id.endsWith("005") || debate.id.endsWith("001");
    if (activeFilter === "emerging") return debate.status === "AUDITORIA" || debate.status === "VERIFICADO";
    if (activeFilter === "archived") return debate.status === "FINALIZADO" || debate.status === "BORRADOR";
    return true;
  });

  return (
    <AppLayout
      contextPanel={
        <div className="space-y-5 rounded-2xl border border-white/8 bg-[#10192c] p-4">
          <h3 className="text-lg font-bold tracking-[-0.02em]">Panel Explore</h3>
          <p className="text-sm text-slate-400">Accesos rapidos del modulo para busqueda, estado y sincronizacion.</p>
          <div className="space-y-2">
            <Link to="/notifications" className="block rounded-lg bg-white/6 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Ver notificaciones</Link>
            <Link to="/profile" className="block rounded-lg bg-white/6 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Ir a perfil</Link>
            <Link to="/settings" className="block rounded-lg bg-white/6 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Configuracion de cuenta</Link>
          </div>
        </div>
      }
      leftSidebar={
        <div className="flex h-full flex-col justify-between rounded-2xl border border-white/6 bg-[#0f1829] p-4">
          <div className="space-y-2">
            <p className="text-xl font-bold">Tier Filters</p>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Verified Audit Strata</p>
            <div className="space-y-2 pt-5">
              {filters.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setSearchParams({ tier: item.key })}
                  className={`sidebar-action flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left ${activeFilter === item.key ? "sidebar-action-active bg-[#0052ff]/20 text-[#50a2ff]" : "text-slate-300 hover:bg-white/5"}`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <Link
              to="/notifications"
              className="block w-full rounded-xl bg-[#0052ff] py-3 text-center font-semibold text-white focus-visible:ring-2 focus-visible:ring-[#7ca8ff]"
            >
              Sync Ledger
            </Link>
            <SidebarQuickAccess />
          </div>
        </div>
      }
    >
      <div className="space-y-6 lg:space-y-8">
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="overflow-hidden rounded-3xl border border-white/6 bg-[#0d1528]">
            <div
              className="bg-cover bg-center p-6 md:p-8 xl:p-10"
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgba(11,17,30,0.88), rgba(11,17,30,0.55)), url('https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?auto=format&fit=crop&w=1600&q=80')",
              }}
            >
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="inline-flex rounded-full bg-amber-300/20 px-3 py-1 text-xs font-semibold tracking-[0.12em] text-amber-200">
                LEDGER AUDITED: REAL-TIME
              </motion.p>
              <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mt-5 max-w-3xl text-3xl font-black tracking-[-0.04em] sm:text-4xl md:text-5xl xl:text-[3.75rem]">
                Arquitectura de Consenso: El Futuro del Protocolo Soberano.
              </motion.h1>
              <p className="mt-4 max-w-3xl text-base text-slate-300 md:text-lg">Unete al debate activo sobre redistribucion de nodos regionales en el estrato global. 1.2M votos verificados.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/debate" className="rounded-xl bg-[#0052ff] px-7 py-3 font-semibold">Votar Ahora</Link>
                <Link to="/rankings" className="rounded-xl bg-white/10 px-7 py-3 font-semibold">Ver Analisis</Link>
              </div>
            </div>
          </div>

          <article className="rounded-3xl border border-white/6 bg-[#161f33] p-6">
            <div className="mb-8 grid h-28 place-items-center rounded-2xl bg-white/5">
              <div className="flex items-end gap-2">
                <span className="h-9 w-7 rounded-t bg-slate-500/70" />
                <span className="h-14 w-7 rounded-t bg-[#0052ff]" />
                <span className="h-11 w-7 rounded-t bg-slate-600/60" />
              </div>
            </div>
            <h3 className="text-4xl font-bold tracking-[-0.03em]">Estado del Ledger</h3>
            <p className="mt-3 text-slate-400">Sincronizacion global alcanzada en Tier-1. Revision de Tier-2 en progreso.</p>
            <div className="mt-8 space-y-3">
              <div className="rounded-xl bg-white/5 px-3 py-2.5">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Bloque</p>
                <p className="text-lg font-semibold text-amber-300">#882,192,001</p>
              </div>
              <div className="rounded-xl bg-white/5 px-3 py-2.5">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Estado</p>
                <p className="text-lg font-semibold text-emerald-300">Finalizado</p>
              </div>
            </div>
          </article>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {data?.stats.map((item) => <MetricTile key={item.label} {...item} />)}
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-3xl font-bold tracking-[-0.03em] md:text-4xl">Muro de Debates Recientes</h2>
              <p className="text-slate-400">Ultima actualizacion: hace 4 minutos.</p>
            </div>
            <Link to="/debate" className="hidden text-sm font-semibold text-[#2f8bff] md:block">Ver Todos los Debates</Link>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredDebates.map((debate) => (
              <motion.article whileHover={{ y: -4 }} key={debate.id} className="rounded-2xl border border-white/6 bg-[#161f33] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.15em] text-slate-500">ID: {debate.id}</p>
                    <h3 className="mt-2 text-xl font-bold tracking-[-0.02em] sm:text-2xl">{debate.title}</h3>
                  </div>
                  <StatusBadge status={debate.status} />
                </div>
                <p className="mt-3 text-slate-300">{debate.description}</p>
                <div className="mt-5 flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-400">Participantes: {debate.participants > 999 ? `${Math.round(debate.participants / 1000)}k` : debate.participants}</span>
                  <div className="flex items-center gap-2">
                    <button className="rounded-lg bg-white/8 px-4 py-2 text-sm font-semibold text-slate-200">Abstencion</button>
                    <button className="rounded-lg bg-[#0052ff] px-4 py-2 text-sm font-semibold">Votar SI</button>
                  </div>
                </div>
              </motion.article>
            ))}
            {filteredDebates.length === 0 && (
              <p className="rounded-xl border border-white/8 bg-[#161f33] p-4 text-slate-400">No hay debates para el filtro seleccionado.</p>
            )}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}