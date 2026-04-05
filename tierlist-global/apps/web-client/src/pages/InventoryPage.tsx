import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { SidebarQuickAccess } from "../components/ui";
import { fetchInventoryItems } from "../services/api";

export function InventoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data } = useQuery({ queryKey: ["inventory"], queryFn: fetchInventoryItems, retry: 2 });
  const activeTier = searchParams.get("tier") ?? "s-tier";
  const [viewMode, setViewMode] = useState<"grid" | "compact">("grid");
  const filteredItems = (data ?? []).filter((item) => {
    if (activeTier === "s-tier") return item.rarity === "S-TIER RARE";
    if (activeTier === "a-tier") return item.rarity === "LEGENDARY";
    if (activeTier === "b-tier") return item.rarity === "UNIQUE";
    if (activeTier === "multimedia") return true;
    if (activeTier === "c-tier") return item.rarity === "UNIQUE";
    return true;
  });

  return (
    <AppLayout
      leftSidebar={
        <div className="flex h-full flex-col justify-between rounded-2xl border border-white/6 bg-[#0f1829] p-4">
          <div>
            <h2 className="text-3xl font-black tracking-[-0.03em]">The Sovereign Ledger</h2>
            <p className="text-sm uppercase tracking-[0.16em] text-slate-500">Filtros de Ledger</p>
            <div className="mt-6 space-y-2 text-slate-300">
              {"S-Tier,A-Tier,B-Tier,C-Tier,Multimedia".split(",").map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setSearchParams({ tier: item.toLowerCase() })}
                  className={`sidebar-action w-full rounded-lg px-4 py-3 text-left text-lg ${activeTier === item.toLowerCase() ? "sidebar-action-active bg-[#0052ff]/15 text-[#69b1ff] ring-1 ring-[#0052ff]/45" : "hover:bg-white/5"}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3 pt-4">
            <Link to="/debate" className="block w-full rounded-xl bg-[#0052ff] py-3 text-center font-semibold">Validar Votos</Link>
            <SidebarQuickAccess />
          </div>
        </div>
      }
      rightSidebar={
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#0052ff]/40 bg-[#101a2c] p-5">
            <h3 className="text-4xl font-bold tracking-[-0.03em]">Actividad en Ledger</h3>
            <div className="mt-5 space-y-2 text-lg">
              <p className="flex justify-between"><span className="text-slate-400">Actividad de Votante</span>142h</p>
              <p className="flex justify-between"><span className="text-slate-400">Votos Verificados</span>3,204</p>
              <p className="flex justify-between"><span className="text-slate-400">Estado de Rol</span><span className="text-emerald-300">Activo</span></p>
            </div>
            <p className="mt-5 text-xs uppercase tracking-[0.2em] text-slate-500">Saldo Externo SVP</p>
            <p className="mt-1 text-5xl font-bold tracking-[-0.03em]">454,968 <span className="text-2xl text-slate-400">SVP</span></p>
            <Link to="/transfer" className="mt-5 block w-full rounded-xl bg-white/10 py-3 text-center">Convertir a Tokens</Link>
          </div>
          <div className="rounded-2xl border border-white/6 bg-[#161f33] p-5">
            <h3 className="text-4xl font-bold tracking-[-0.03em]">Estado de Transferencia</h3>
            <div className="mt-4 space-y-4">
              <div>
                <p className="font-semibold text-emerald-300">Emblema Consenso - COMPLETADO</p>
                <div className="mt-2 h-2 rounded-full bg-slate-700"><div className="h-full w-full rounded-full bg-emerald-300" /></div>
              </div>
              <div>
                <p className="font-semibold text-amber-300">Orbe de Auditoria - EN PROCESO</p>
                <div className="mt-2 h-2 rounded-full bg-slate-700"><div className="h-full w-2/3 rounded-full bg-amber-300" /></div>
              </div>
              <div>
                <p className="font-semibold text-slate-400">Llave del Ledger - PENDIENTE</p>
                <div className="mt-2 h-2 rounded-full bg-slate-700"><div className="h-full w-1/4 rounded-full bg-slate-500" /></div>
              </div>
            </div>
            <Link to="/audit" className="mt-6 inline-block text-sm font-semibold uppercase tracking-[0.12em] text-slate-200">Ver Historial Completo</Link>
          </div>
        </div>
      }
    >
      <section>
        <h1 className="text-sm uppercase tracking-[0.2em] text-slate-400">Protocolo de Recompensas</h1>
        <h2 className="mt-2 text-4xl font-black tracking-[-0.04em] md:text-5xl xl:text-[4.4rem]">Mis Logros y Recompensas</h2>
        <p className="mt-3 max-w-4xl text-base text-slate-300 md:text-[1.7rem] md:leading-[1.2]">
          Visualiza y gestiona los artefactos de autoridad emitidos por el Ledger. Estos objetos son validos en el ecosistema externo auditado por los Validadores.
        </p>

        <div className="mt-6 rounded-3xl border border-white/6 bg-[#161f33] p-4 md:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-4xl font-bold tracking-[-0.03em]">Galeria Sovereign</h3>
              <p className="text-slate-400">Objetos unicos desbloqueados por votantes</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`h-10 w-10 rounded-xl ${viewMode === "grid" ? "bg-[#0052ff]" : "bg-white/10"}`}
                aria-label="Vista de grilla"
              />
              <button
                type="button"
                onClick={() => setViewMode("compact")}
                className={`h-10 w-10 rounded-xl ${viewMode === "compact" ? "bg-[#0052ff]" : "bg-white/10"}`}
                aria-label="Vista compacta"
              />
            </div>
          </div>

          <div className={`grid gap-4 ${viewMode === "grid" ? "md:grid-cols-2" : "md:grid-cols-1"}`}>
          {filteredItems.map((item) => (
            <article key={item.id} className="rounded-2xl bg-[#202b41] p-4">
              <div className="h-52 rounded-xl bg-gradient-to-br from-[#00113d] via-[#06142f] to-[#040a19]" />
              <p
                className={`mt-3 inline-block rounded-full border px-3 py-1 text-xs font-semibold ${
                  item.rarity === "LEGENDARY"
                    ? "border-amber-500/35 text-amber-300"
                    : item.rarity === "UNIQUE"
                      ? "border-emerald-400/35 text-emerald-300"
                      : "border-cyan-400/35 text-cyan-300"
                }`}
              >
                {item.rarity}
              </p>
              <h3 className="mt-3 text-4xl font-bold tracking-[-0.03em]">{item.name}</h3>
              <p className="mt-2 text-slate-400">{item.description}</p>
              <div className="mt-6 flex items-end justify-between border-t border-white/6 pt-4">
                <p className="text-sm uppercase tracking-[0.13em] text-slate-400">Valor estimado</p>
                <p className="text-4xl font-bold tracking-[-0.03em]">{item.value}</p>
              </div>
            </article>
          ))}
          {filteredItems.length === 0 && (
            <article className="flex min-h-[240px] items-center justify-center rounded-2xl border border-white/10 text-slate-400">
              Sin objetos para el filtro seleccionado.
            </article>
          )}
          <article className="flex min-h-[380px] items-center justify-center rounded-2xl border border-dashed border-white/15 text-center text-slate-500">
            <div>
              <p className="text-4xl font-bold tracking-[-0.03em]">Espacio Bloqueado</p>
              <p>Alcanza nivel A-Tier para desbloquear.</p>
            </div>
          </article>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}