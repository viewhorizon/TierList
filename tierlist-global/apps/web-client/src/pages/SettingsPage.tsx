import { Link, useSearchParams } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { SidebarQuickAccess } from "../components/ui";
import { useAppContext } from "../context/AppContext";

export function SettingsPage() {
  const { can } = useAppContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSection = searchParams.get("section") ?? "general";

  return (
    <AppLayout
      leftSidebar={
        <div className="flex h-full flex-col justify-between rounded-2xl border border-white/6 bg-[#0f1829] p-4">
          <div>
            <h2 className="text-2xl font-bold tracking-[-0.03em]">Configuracion</h2>
            <p className="text-sm text-slate-400">Preferencias de cuenta y plataforma</p>
            <div className="mt-5 space-y-2">
              {[
                { key: "general", label: "General" },
                { key: "notifications", label: "Notificaciones" },
                { key: "security", label: "Seguridad" },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setSearchParams({ section: item.key })}
                  className={`sidebar-action w-full rounded-lg px-3 py-2 text-left text-sm ${activeSection === item.key ? "sidebar-action-active bg-[#0052ff]/20 text-[#7dbbff]" : "text-slate-300 hover:bg-white/5"}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <SidebarQuickAccess />
        </div>
      }
    >
      <section className="space-y-6">
        <header>
          <p className="text-sm uppercase tracking-[0.16em] text-slate-400">Panel de usuario</p>
          <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] md:text-5xl">Ajustes del Sistema</h1>
        </header>
        <div className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-white/6 bg-[#161f33] p-5">
            <h2 className="text-xl font-semibold">Idioma y region</h2>
            <p className="mt-2 text-slate-400">{activeSection === "general" ? "Castellano / UTC-3" : "Bloqueado por seccion"}</p>
            <Link to="/profile" className="mt-4 inline-block rounded-lg bg-white/10 px-4 py-2 text-sm">
              Cambiar
            </Link>
          </article>
          <article className="rounded-2xl border border-white/6 bg-[#161f33] p-5">
            <h2 className="text-xl font-semibold">Notificaciones</h2>
            <p className="mt-2 text-slate-400">{activeSection === "notifications" ? "Digest cada 30 min y alertas criticas activas." : "Resumen diario y eventos criticos activados."}</p>
            <Link to="/notifications" className="mt-4 inline-block rounded-lg bg-[#0052ff] px-4 py-2 text-sm font-semibold">
              Administrar
            </Link>
          </article>
          <article className="rounded-2xl border border-white/6 bg-[#161f33] p-5 lg:col-span-2">
            <h2 className="text-xl font-semibold">Acceso institucional</h2>
            <p className="mt-2 text-slate-400">
              {can("admin:read")
                ? "Su perfil tiene permisos de administracion para supervisar debates y validaciones."
                : "Su perfil no tiene permisos admin. Puede solicitar elevacion de rol al equipo de governance."}
            </p>
            {can("admin:read") ? (
              <Link to="/admin" className="mt-4 inline-block rounded-lg bg-[#0052ff] px-4 py-2 text-sm font-semibold">
                Ir al Panel Admin
              </Link>
            ) : (
              <Link to="/admin" className="mt-4 inline-block rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-slate-200">
                Revisar acceso admin
              </Link>
            )}
          </article>
        </div>
      </section>
    </AppLayout>
  );
}