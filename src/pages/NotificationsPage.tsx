import { useQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { SidebarQuickAccess } from "../components/ui";
import { fetchNotifications } from "../services/api";

export function NotificationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data } = useQuery({ queryKey: ["notifications"], queryFn: fetchNotifications, retry: 2 });
  const activeSection = searchParams.get("section") ?? "all";
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const filteredItems = useMemo(() => {
    const source = data ?? [];
    if (activeSection === "all") {
      return source;
    }
    return source.filter((item) => item.category === activeSection);
  }, [activeSection, data]);

  const unreadCount = filteredItems.filter((item) => !dismissedIds.includes(item.id)).length;

  return (
    <AppLayout
      leftSidebar={
        <div className="flex h-full flex-col justify-between rounded-2xl border border-white/6 bg-[#0f1829] p-4">
          <div>
            <h2 className="text-2xl font-black tracking-[-0.03em]">Centro de Alertas</h2>
            <p className="text-xs uppercase tracking-[0.15em] text-[#2a7eff]">Eventos de Cuenta</p>
            <div className="mt-8 space-y-2">
              {[
                { label: "Todas", key: "all", to: "/notifications" },
                { label: "Sistema", key: "system", to: "/notifications?section=system" },
                { label: "Debates", key: "debates", to: "/notifications?section=debates" },
                { label: "Transferencias", key: "transfer", to: "/notifications?section=transfer" },
              ].map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={() => setSearchParams(item.key === "all" ? {} : { section: item.key })}
                  className={`sidebar-action block w-full rounded-xl px-4 py-3 text-left ${activeSection === item.key ? "sidebar-action-active bg-[#0052ff]/20 text-[#60abff]" : "text-slate-300 hover:bg-white/5"}`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <Link to="/transfer" className="block w-full rounded-xl bg-[#0052ff] py-3 text-center font-semibold">Ir a Transferencias</Link>
            <SidebarQuickAccess />
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        <header className="rounded-2xl border border-white/6 bg-[#161f33] p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-[-0.03em] md:text-4xl">Notificaciones</h1>
              <p className="mt-2 text-sm text-slate-300">Avisos recientes de debates, sistema y transferencias.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#0e1627] px-4 py-3 text-right">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Sin leer</p>
              <p className="text-2xl font-black text-white">{unreadCount}</p>
            </div>
          </div>
        </header>

        <section className="rounded-2xl border border-white/6 bg-[#161f33] p-6">
          <div className="mb-4 flex justify-between">
            <h3 className="text-2xl font-bold tracking-[-0.03em]">Actividad Reciente</h3>
            <button
              type="button"
              onClick={() => setDismissedIds(filteredItems.map((item) => item.id))}
              className="text-sm uppercase tracking-[0.12em] text-slate-300"
            >
              Marcar todas como leidas
            </button>
          </div>
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-between gap-3 rounded-xl p-4 ${dismissedIds.includes(item.id) ? "bg-[#1c2640]/45" : "bg-[#1c2640]"}`}
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                  <div>
                    <p className="text-base font-semibold md:text-lg">{item.label}</p>
                    <p className="text-xs text-slate-400">{item.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-emerald-300">{item.status}</p>
                  <p className="text-xs text-slate-400">{item.tx}</p>
                </div>
              </div>
            ))}
            {filteredItems.length === 0 && <p className="rounded-xl bg-[#1c2640] p-4 text-slate-400">No hay notificaciones en esta seccion.</p>}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}