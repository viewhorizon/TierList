import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/utils/cn";

const navItems = [
  { to: "/explore", label: "Explore" },
  { to: "/rankings", label: "Rankings" },
  { to: "/feedback", label: "Feedback" },
  { to: "/debate", label: "Debate Wall" },
  { to: "/inventory", label: "Inventario" },
  { to: "/notifications", label: "Avisos" },
  { to: "/audit", label: "Audit" },
  { to: "/transfer", label: "Transfer" },
  { to: "/admin", label: "Admin" },
];

function getActiveRoot(pathname: string) {
  const [segment] = pathname.split("/").filter(Boolean);
  return segment ? `/${segment}` : "/explore";
}

export function TopNav() {
  const location = useLocation();
  const activeRoot = getActiveRoot(location.pathname);

  return (
    <header className="sticky top-0 z-40 border-b border-[#1a2742] bg-[#071026]/95 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1700px] items-center gap-3 px-3 py-3 sm:px-4 lg:px-6">
        <button
          type="button"
          aria-label="Abrir menu"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-[#0f1c36] text-slate-300"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
        <div className="shrink-0">
          <p className="text-[1.7rem] font-extrabold tracking-[-0.03em] text-white">TierList</p>
        </div>
        <nav className="no-scrollbar flex-1 overflow-x-auto" aria-label="Navegacion principal">
          <div className="flex min-w-max gap-1.5 pb-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  "border-b-2 border-transparent px-3 py-2 text-sm font-medium whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f8bff]",
                  activeRoot === item.to
                    ? "border-[#0d67ff] text-[#4ea1ff]"
                    : "text-slate-300 hover:text-slate-100"
                )}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
        <div className="hidden items-center gap-2 sm:flex">
          <button type="button" aria-label="Idioma" className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-[#0f1c36] text-slate-300">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 12h16M12 4v16" />
              <circle cx="12" cy="12" r="8" />
            </svg>
          </button>
          <button type="button" aria-label="Tema" className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-[#0f1c36] text-slate-300">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 3a9 9 0 1 0 9 9c0-4.97-4.03-9-9-9Z" />
            </svg>
          </button>
          <button type="button" aria-label="Notificaciones" className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-[#0f1c36] text-slate-300">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M15 17H5l1.4-1.4A2 2 0 0 0 7 14.2V10a5 5 0 1 1 10 0v4.2a2 2 0 0 0 .6 1.4L19 17h-4Z" />
              <path d="M10 20a2 2 0 0 0 4 0" />
            </svg>
          </button>
          <button type="button" aria-label="Configuracion" className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-[#0f1c36] text-slate-300">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 8.5A3.5 3.5 0 1 0 12 15.5A3.5 3.5 0 1 0 12 8.5Z" />
              <path d="m19.4 15-.2.2.3 1.9-1.8 1-1.4-1.2h-.3l-1.4 1.2h-2.2l-1.4-1.2h-.3l-1.4 1.2-1.8-1 .3-1.9-.2-.2-1.7-.6v-2l1.7-.6.2-.2-.3-1.9 1.8-1 1.4 1.2h.3l1.4-1.2h2.2l1.4 1.2h.3l1.4-1.2 1.8 1-.3 1.9.2.2 1.7.6v2z" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}