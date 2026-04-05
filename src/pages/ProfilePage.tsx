import { Link, useSearchParams } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { SidebarQuickAccess } from "../components/ui";

export function ProfilePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSection = searchParams.get("section") ?? "overview";

  return (
    <AppLayout
      leftSidebar={
        <div className="flex h-full flex-col justify-between rounded-2xl border border-white/6 bg-[#0f1829] p-4">
          <div>
            <h2 className="text-2xl font-bold tracking-[-0.03em]">Perfil</h2>
            <p className="text-sm text-slate-400">Datos institucionales y permisos</p>
            <div className="mt-5 space-y-2">
              {[
                { key: "overview", label: "Resumen" },
                { key: "permissions", label: "Permisos" },
                { key: "activity", label: "Actividad" },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setSearchParams({ section: item.key })}
                  className={`sidebar-action w-full rounded-lg px-3 py-2 text-left text-sm ${activeSection === item.key ? "sidebar-action-active bg-[#0052ff]/20 text-[#79b9ff]" : "text-slate-300 hover:bg-white/5"}`}
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
          <p className="text-sm uppercase tracking-[0.16em] text-slate-400">Cuenta institucional</p>
          <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] md:text-5xl">Auditor Nvl 42</h1>
          <p className="mt-2 text-slate-300">
            Rol: {activeSection === "permissions" ? "Auditor Senior + Moderador" : "Auditor Senior"} | Tenant: TierList Global
          </p>
        </header>
        <div className="rounded-2xl border border-white/6 bg-[#161f33] p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Correo</p>
              <p className="mt-1 text-lg">auditor42@tierlist.global</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Estado</p>
              <p className="mt-1 text-lg text-emerald-300">Activo y verificado</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Puntos SVP</p>
              <p className="mt-1 text-lg">12,450</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Ultimo acceso</p>
              <p className="mt-1 text-lg">Hoy, 09:42 UTC</p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2 border-t border-white/6 pt-4">
            <Link to="/settings?section=security" className="rounded-lg bg-white/10 px-4 py-2 text-sm">
              Revisar seguridad
            </Link>
            <Link to="/audit" className="rounded-lg bg-[#0052ff] px-4 py-2 text-sm font-semibold">
              Ver auditoria personal
            </Link>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}