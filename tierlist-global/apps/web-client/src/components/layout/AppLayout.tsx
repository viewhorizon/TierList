import { Bell, Languages, Menu, Moon, Settings, UserCircle2, X } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import { Brand, NavItem, SearchField } from "../ui";

interface AppLayoutProps {
  leftSidebar?: ReactNode;
  rightSidebar?: ReactNode;
  contextPanel?: ReactNode;
  children: ReactNode;
}

export function AppLayout({ leftSidebar, rightSidebar, contextPanel, children }: AppLayoutProps) {
  const { can } = useAppContext();
  const [mobileLeftOpen, setMobileLeftOpen] = useState(false);
  const [mobileRightOpen, setMobileRightOpen] = useState(false);
  const [mobileContextOpen, setMobileContextOpen] = useState(false);

  const mobileNavItems = useMemo(
    () => {
      const baseItems = [
        { to: "/explore", label: "Explore" },
        { to: "/rankings", label: "Rankings" },
        { to: "/feedback", label: "Feedback" },
        { to: "/debate", label: "Debate Wall" },
        { to: "/inventory", label: "Inventario" },
        { to: "/notifications", label: "Avisos" },
        { to: "/audit", label: "Audit" },
      ];
      return can("admin:read") ? [...baseItems, { to: "/admin", label: "Admin" }] : baseItems;
    },
    [can],
  );

  return (
    <div className="min-h-screen w-full overflow-x-clip bg-[#0b1220] text-slate-100">
      <header className="sticky top-0 z-40 border-b border-white/6 bg-[#0b1220]/95 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1700px] items-center justify-between gap-3 px-4 py-3 lg:px-6">
          <div className="flex min-w-0 items-center gap-3 lg:gap-7">
            {leftSidebar && (
              <button
                type="button"
                className="inline-flex rounded-lg border border-white/10 p-2 text-slate-300 lg:hidden"
                onClick={() => setMobileLeftOpen(true)}
                aria-label="Abrir panel lateral"
              >
                <Menu className="h-4 w-4" />
              </button>
            )}
            <Brand />
            <nav className="hidden items-center gap-6 lg:flex" aria-label="Navegacion principal">
              <NavItem to="/explore" end>Explore</NavItem>
              <NavItem to="/rankings" end>Rankings</NavItem>
              <NavItem to="/feedback">Feedback</NavItem>
              <NavItem to="/debate" end>Debate Wall</NavItem>
            </nav>
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            <SearchField placeholder="Buscar registros..." />
            <button className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-slate-300 hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-[#0052ff]">
              <Languages className="h-4 w-4" /> ES
            </button>
            <button className="rounded-lg p-2 hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-[#0052ff]" aria-label="Modo oscuro">
              <Moon className="h-4 w-4" />
            </button>
            <Link
              to="/notifications"
              className="rounded-lg p-2 hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-[#0052ff]"
              aria-label="Notificaciones"
            >
              <Bell className="h-4 w-4" />
            </Link>
            <Link to="/settings" className="rounded-lg p-2 hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-[#0052ff]" aria-label="Configuracion">
              <Settings className="h-4 w-4" />
            </Link>
            <Link
              to="/profile"
              className="rounded-full border border-white/10 p-1 hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-[#0052ff]"
              aria-label="Perfil"
            >
              <UserCircle2 className="h-6 w-6" />
            </Link>
            {(rightSidebar || contextPanel) && (
              <button
                type="button"
                className={`rounded-lg border border-white/10 p-2 text-slate-300 ${rightSidebar ? "xl:hidden" : ""}`}
                onClick={() => {
                  if (rightSidebar) {
                    setMobileRightOpen(true);
                    return;
                  }
                  setMobileContextOpen(true);
                }}
                aria-label="Abrir panel contextual"
              >
                <Menu className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="hidden items-center gap-2 sm:flex lg:hidden">
            <button className="rounded-lg border border-white/10 p-2" aria-label="Cambiar idioma">
              <Languages className="h-4 w-4" />
            </button>
            <button className="rounded-lg border border-white/10 p-2" aria-label="Modo oscuro">
              <Moon className="h-4 w-4" />
            </button>
            <Link to="/notifications" className="rounded-lg border border-white/10 p-2" aria-label="Notificaciones">
              <Bell className="h-4 w-4" />
            </Link>
            <Link to="/settings" className="rounded-lg border border-white/10 p-2" aria-label="Configuracion">
              <Settings className="h-4 w-4" />
            </Link>
            {(rightSidebar || contextPanel) && (
              <button
                type="button"
                className="rounded-lg border border-white/10 p-2"
                onClick={() => {
                  if (rightSidebar) {
                    setMobileRightOpen(true);
                    return;
                  }
                  setMobileContextOpen(true);
                }}
                aria-label="Abrir panel contextual"
              >
                <Menu className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 sm:hidden">
            {(rightSidebar || contextPanel) && (
              <button
                type="button"
                className="rounded-lg border border-white/10 p-2"
                onClick={() => {
                  if (rightSidebar) {
                    setMobileRightOpen(true);
                    return;
                  }
                  setMobileContextOpen(true);
                }}
                aria-label="Abrir panel contextual"
              >
                <Menu className="h-4 w-4" />
              </button>
            )}
            <Link to="/notifications" className="rounded-lg border border-white/10 p-2" aria-label="Notificaciones">
              <Bell className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <nav className="mx-auto w-full max-w-[1700px] px-4 pb-2 lg:hidden" aria-label="Navegacion movil">
          <div className="no-scrollbar overflow-x-auto">
            <div className="flex min-w-max items-center gap-2 pr-4">
              {mobileNavItems.map((item) => (
                <div key={item.to} className="w-[7.5rem] shrink-0">
                  <NavItem
                    to={item.to}
                    end={item.to === "/explore" || item.to === "/rankings" || item.to === "/debate"}
                    onClick={() => {
                      setMobileLeftOpen(false);
                      setMobileRightOpen(false);
                      setMobileContextOpen(false);
                    }}
                  >
                    {item.label}
                  </NavItem>
                </div>
              ))}
            </div>
          </div>
        </nav>
      </header>

      <main className="mx-auto grid w-full max-w-[1700px] gap-5 px-4 py-5 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)_340px] lg:px-6">
        {leftSidebar && <aside className="sticky top-[102px] hidden h-[calc(100vh-122px)] lg:block">{leftSidebar}</aside>}
        <section className="min-w-0">{children}</section>
        {rightSidebar && <aside className="sticky top-[102px] hidden h-[calc(100vh-122px)] xl:block">{rightSidebar}</aside>}
      </main>

      {mobileLeftOpen && leftSidebar && (
        <div className="fixed inset-0 z-50 bg-black/60 lg:hidden" onClick={() => setMobileLeftOpen(false)}>
          <aside className="h-full w-[84%] max-w-[320px] bg-[#0b1220] p-4" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
              <p className="text-sm uppercase tracking-[0.16em] text-slate-400">Panel</p>
              <button type="button" onClick={() => setMobileLeftOpen(false)} className="rounded-md border border-white/15 p-2" aria-label="Cerrar panel">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="h-[calc(100vh-96px)] overflow-y-auto">{leftSidebar}</div>
          </aside>
        </div>
      )}

      {mobileRightOpen && rightSidebar && (
        <div className="fixed inset-0 z-50 bg-black/60 xl:hidden" onClick={() => setMobileRightOpen(false)}>
          <aside className="ml-auto h-full w-[84%] max-w-[340px] bg-[#0b1220] p-4" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
              <p className="text-sm uppercase tracking-[0.16em] text-slate-400">Resumen</p>
              <button type="button" onClick={() => setMobileRightOpen(false)} className="rounded-md border border-white/15 p-2" aria-label="Cerrar panel derecho">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="h-[calc(100vh-96px)] overflow-y-auto">{rightSidebar}</div>
          </aside>
        </div>
      )}

      {mobileContextOpen && contextPanel && (
        <div className="fixed inset-0 z-50 bg-black/60 xl:hidden" onClick={() => setMobileContextOpen(false)}>
          <aside className="ml-auto h-full w-[84%] max-w-[340px] bg-[#0b1220] p-4" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
              <p className="text-sm uppercase tracking-[0.16em] text-slate-400">Atajos</p>
              <button type="button" onClick={() => setMobileContextOpen(false)} className="rounded-md border border-white/15 p-2" aria-label="Cerrar panel contextual">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="h-[calc(100vh-96px)] overflow-y-auto">{contextPanel}</div>
          </aside>
        </div>
      )}
    </div>
  );
}