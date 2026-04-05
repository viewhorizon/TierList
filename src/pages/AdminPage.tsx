import { Bell, CheckCircle2, FileWarning, Gauge, Plus, Settings, Shield } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { SidebarQuickAccess, StatusBadge } from "../components/ui";

const rows = [
  {
    id: "#SL-982-AX",
    title: "Marco de Asignacion de Impuesto al Carbono",
    meta: "Iniciado por Nodo de Finanzas Mundiales - 1,240 Participantes",
    status: "CALCULO PENDIENTE",
    action: "Cerrar y Calcular",
    actionTone: "primary",
  },
  {
    id: "#SL-441-TQ",
    title: "Protocolo de Jurisdiccion de Asentamientos en Marte",
    meta: "Iniciado por Autoridad Aeroespacial - 890 Participantes",
    status: "ACTIVO",
    action: "En Progreso",
    actionTone: "muted",
  },
  {
    id: "#SL-009-BV",
    title: "Umbral de Distribucion de Renta Basica Universal",
    meta: "Iniciado por Consejo de Equidad Social - 5,600 Participantes",
    status: "VERIFICADO",
    action: "Ver Reporte",
    actionTone: "ghost",
  },
];

export function AdminPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSection = searchParams.get("section") ?? "settings";
  const visibleRows = rows.filter((row) => {
    if (activeSection === "debates") return row.status !== "VERIFICADO";
    if (activeSection === "market") return row.status === "VERIFICADO";
    return true;
  });

  return (
    <AppLayout
      leftSidebar={
        <div className="flex h-full flex-col justify-between rounded-2xl border border-white/6 bg-[#131b2e] p-4">
          <div>
            <div className="rounded-xl border border-white/8 bg-white/5 p-3">
              <p className="text-lg font-semibold">Auditor Nvl 42</p>
              <p className="text-sm text-slate-300">12,450 Puntos</p>
            </div>
            <div className="mt-5 space-y-2 text-slate-300">
                {[
                  { label: "Panel Principal", icon: Gauge, key: "overview" },
                  { label: "Debates Activos", icon: Bell, key: "debates" },
                  { label: "Mercado", icon: Shield, key: "market" },
                  { label: "Ajustes", icon: Settings, key: "settings" },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setSearchParams({ section: item.key })}
                  className={`sidebar-action flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left ${activeSection === item.key ? "sidebar-action-active bg-[#0052ff] text-white" : "hover:bg-white/5"}`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Link to="/debate" className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0052ff] py-3 font-semibold">
              <Plus className="h-4 w-4" /> Crear Debate
            </Link>
            <div className="mt-4">
              <SidebarQuickAccess />
            </div>
          </div>
        </div>
      }
      rightSidebar={
        <div className="space-y-4">
          <div className="rounded-2xl border border-emerald-400/30 bg-[#131c2f] p-4 text-emerald-300">
            <p className="text-sm uppercase tracking-[0.12em] text-slate-300">Despachador SVP</p>
            <p className="mt-1 text-xl font-semibold">Operacional - 14ms Latencia</p>
          </div>
          <div className="rounded-2xl border border-white/6 bg-[#161f33] p-5">
            <h3 className="text-sm uppercase tracking-[0.14em] text-slate-400">Motor de Politicas</h3>
            <p className="mt-2 text-3xl font-bold tracking-[-0.03em]">v2.4.8-Stable</p>
            <p className="text-sm text-slate-400">Actualizado: hace 2h</p>
            <div className="mt-5 space-y-2">
              <p className="flex justify-between"><span className="text-slate-400">Logica de Consenso</span><span className="text-emerald-300">Optimizado</span></p>
              <p className="flex justify-between"><span className="text-slate-400">Validacion de Nodo</span><span className="text-emerald-300">Activa</span></p>
              <p className="flex justify-between"><span className="text-slate-400">Umbral de Error</span><span className="text-amber-300">0.002%</span></p>
            </div>
            <Link to="/audit" className="mt-6 block w-full rounded-lg border border-white/20 py-3 text-center font-semibold">Buscar Actualizaciones</Link>
          </div>
        </div>
      }
    >
      <div className="space-y-7">
        <header>
          <p className="text-sm uppercase tracking-[0.14em] text-slate-400">Centro de Administracion Institucional</p>
          <h1 className="text-4xl font-black tracking-[-0.04em] md:text-5xl">Panel de Control Admin</h1>
        </header>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-3xl border border-white/6 bg-[#161f33] p-6">
            <h2 className="text-3xl font-bold tracking-[-0.03em]">Monitor de Ciclo de Vida del Debate</h2>
            <div className="mt-3 flex items-end gap-4">
              <p className="text-6xl font-black md:text-8xl">1,248</p>
              <p className="rounded-lg bg-emerald-500/15 px-3 py-2 text-emerald-300">+12%</p>
            </div>
            <p className="max-w-xl text-slate-300">Debates globales activos procesandose actualmente en todos los nodos institucionales.</p>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl bg-white/6 p-4">
                <p className="text-slate-400">Calculo pendiente</p>
                <p className="text-5xl font-black text-amber-300">42</p>
              </div>
              <div className="rounded-xl bg-white/6 p-4">
                <p className="text-slate-400">Esperando auditoria</p>
                <p className="text-5xl font-black">156</p>
              </div>
            </div>
          </div>
          <div className="hidden xl:block" />
        </section>

        <div className="flex items-center justify-between gap-3">
          <h2 className="text-3xl font-bold tracking-[-0.03em]">Control de Moderacion de Debates</h2>
          <p className="hidden text-sm uppercase tracking-[0.12em] text-emerald-300 md:block">Sincronizacion de Libro en Vivo</p>
        </div>

        <section className="overflow-hidden rounded-2xl border border-white/6 bg-[#161f33]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left">
              <thead className="bg-white/5 text-xs uppercase tracking-[0.13em] text-slate-400">
                <tr>
                  <th className="px-5 py-4">ID Debate</th>
                  <th>Titulo del Debate</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr key={row.id} className="border-t border-white/6">
                    <td className="px-5 py-5 font-semibold text-slate-300">{row.id}</td>
                    <td>
                      <p className="text-[1.45rem] font-bold tracking-[-0.03em]">{row.title}</p>
                      <p className="text-sm text-slate-400">{row.meta}</p>
                    </td>
                    <td><StatusBadge status={row.status} /></td>
                    <td>
                      <Link
                        to={row.id === "#SL-982-AX" ? "/feedback/SL-982-AX" : row.id === "#SL-441-TQ" ? "/feedback/SL-441-TQ" : "/feedback/SL-009-BV"}
                        className={`inline-block rounded-xl px-5 py-2 text-sm font-semibold ${
                          row.actionTone === "primary"
                            ? "bg-[#0052ff]"
                            : row.actionTone === "ghost"
                              ? "bg-white/12"
                              : "bg-slate-700/70 text-slate-300"
                        }`}
                      >
                        {row.action}
                      </Link>
                    </td>
                  </tr>
                ))}
                {visibleRows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                      Sin registros para la seccion seleccionada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-white/6 bg-[#161f33] p-5">
            <p className="flex items-center gap-2 text-amber-300"><CheckCircle2 className="h-4 w-4" /> Entradas Recientes del Libro</p>
            <p className="mt-3 text-slate-300">Ultima sincronizacion validada hace 14 segundos en nodo institucional primario.</p>
          </article>
          <article className="rounded-2xl border border-white/6 bg-[#161f33] p-5">
            <p className="flex items-center gap-2 text-rose-300"><FileWarning className="h-4 w-4" /> Registros de Eventos Fallidos</p>
            <p className="mt-3 text-slate-300">No se detectaron alertas criticas en esta ventana de auditoria.</p>
          </article>
        </section>
      </div>
    </AppLayout>
  );
}