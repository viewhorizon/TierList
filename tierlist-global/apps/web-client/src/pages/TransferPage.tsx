import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { SidebarQuickAccess } from "../components/ui";
import { fetchNotifications } from "../services/api";

export function TransferPage() {
  const { data } = useQuery({ queryKey: ["notifications"], queryFn: fetchNotifications, retry: 2 });
  const location = useLocation();

  return (
    <AppLayout
      leftSidebar={
        <div className="flex h-full flex-col justify-between rounded-2xl border border-white/6 bg-[#0f1829] p-4">
          <div>
            <h2 className="text-4xl font-black tracking-[-0.04em]">TierList</h2>
            <p className="text-xs uppercase tracking-[0.15em] text-[#2a7eff]">Institutional Ledger</p>
            <div className="mt-8 space-y-2">
              {[
                { label: "Explorar", to: "/explore", key: "explore" },
                { label: "Rankings", to: "/rankings", key: "rankings" },
                { label: "Muro de Debate", to: "/debate", key: "debate" },
                { label: "Feedback", to: "/feedback", key: "feedback" },
              ].map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className={`sidebar-action block w-full rounded-xl px-4 py-3 text-left ${location.pathname === item.to ? "sidebar-action-active bg-[#0052ff]/20 text-[#60abff]" : "text-slate-300 hover:bg-white/5"}`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <Link to="/debate" className="block w-full rounded-xl bg-[#0052ff] py-3 text-center font-semibold">Crear TierList</Link>
            <SidebarQuickAccess />
          </div>
        </div>
      }
      rightSidebar={
        <div className="space-y-4">
          <div className="rounded-2xl border border-amber-400/35 bg-[#161f33] p-5">
            <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Estado de red</p>
            <h3 className="mt-2 text-5xl font-black tracking-[-0.04em] text-amber-300">Procesando</h3>
            <p className="mt-3 text-slate-300">Validando bloques de seguridad en TierList Ledger. Tiempo estimado: 4 min.</p>
            <div className="mt-4 h-2 rounded-full bg-slate-700"><div className="h-full w-3/4 rounded-full bg-amber-300" /></div>
          </div>
          <div className="rounded-2xl border border-white/6 bg-[#161f33] p-5">
            <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Puntos SVP TierList</p>
            <p className="mt-4 text-5xl font-black">2,040 SVP</p>
            <p className="mt-2 text-emerald-300">Actividad de auditoria +1,250</p>
          </div>
          <div className="rounded-2xl border border-white/6 bg-[#161f33] p-5 text-sm text-slate-300">
            <p className="mb-3 text-xs uppercase tracking-[0.15em] text-slate-400">Detalles de auditoria</p>
            <p>Hash: TL_9901_AUDIT_OBJ_EXPORT</p>
            <p className="mt-1">Destino: 0x4B1...C9E2</p>
            <p className="mt-1 text-emerald-300">Coste de verificacion bonificado</p>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        <header>
          <h1 className="text-4xl font-black tracking-[-0.04em] md:text-5xl xl:text-6xl">Transferencia de Activos</h1>
          <p className="mt-3 max-w-3xl text-base text-slate-300 md:text-xl">Mueve tus recompensas unicas auditadas por TierList al inventario externo de la red institucional.</p>
        </header>

        <section className="rounded-3xl border border-white/6 bg-[#161f33] p-8 text-center">
          <div className="mx-auto h-64 w-64 rounded-2xl bg-cover bg-center md:h-80 md:w-80" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1642052502250-5f51af6f2b56?auto=format&fit=crop&w=800&q=80')" }} />
          <p className="mx-auto mt-6 inline-flex rounded-full border border-amber-300/40 bg-amber-300/10 px-4 py-1 text-xs font-semibold tracking-[0.15em] text-amber-200">FIRMA DE AUDITORIA TIERLIST: 0X882...F92A</p>
          <h2 className="mt-5 text-4xl font-black tracking-[-0.04em] md:text-5xl">Vanguardista Supremo 2024</h2>
          <p className="mx-auto mt-3 max-w-2xl text-base text-slate-300 md:text-xl">Recompensa de alto valor por completar ciclo de auditoria institucional del primer cuatrimestre.</p>
          <Link to="/inventory" className="mt-8 inline-block rounded-2xl bg-[#c7d3ff] px-10 py-4 text-lg font-bold text-[#111f45]">Exportar a Inventario</Link>
        </section>

        <section className="rounded-2xl border border-white/6 bg-[#161f33] p-6">
          <div className="mb-4 flex justify-between">
            <h3 className="text-4xl font-bold tracking-[-0.03em]">Sincronizacion del Ledger</h3>
            <Link to="/audit" className="text-sm uppercase tracking-[0.12em] text-slate-300">Explorar historial</Link>
          </div>
          <div className="space-y-3">
            {data?.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl bg-[#1c2640] p-4">
                <div>
                  <p className="text-xl font-semibold">{item.label}</p>
                  <p className="text-sm text-slate-400">Auditado - {item.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-emerald-300">{item.status}</p>
                  <p className="text-sm text-slate-400">{item.tx}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}