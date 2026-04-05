import { motion } from "framer-motion";
import { Bell, Search, Settings, UserCircle2 } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { cn } from "../../utils/cn";

export function Brand({ title = "TierList", subtitle }: { title?: string; subtitle?: string }) {
  return (
    <Link to="/explore" className="inline-flex min-w-0 items-center gap-2.5">
      <div className="grid h-8 w-8 grid-cols-2 gap-1 rounded-sm bg-[#0052ff] p-1">
        <div className="rounded-[1px] bg-[#8fc0ff]" />
        <div className="rounded-[1px] bg-[#d5e6ff]" />
        <div className="rounded-[1px] bg-[#2a79ff]" />
        <div className="rounded-[1px] bg-[#0e3d99]" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[1.5rem] font-extrabold leading-none tracking-[-0.04em] text-slate-100 sm:text-[1.65rem]">{title}</p>
        {subtitle && <p className="text-xs uppercase tracking-[0.2em] text-[#2f8bff]">{subtitle}</p>}
      </div>
    </Link>
  );
}

export function NavItem({
  to,
  children,
  onClick,
  end,
}: {
  to: string;
  children: string;
  onClick?: () => void;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      end={end}
      className={({ isActive }) =>
        cn(
          "block w-full overflow-hidden text-ellipsis whitespace-nowrap border-b-2 border-transparent px-1.5 pb-2 text-center text-sm font-medium text-slate-300 hover:text-white md:text-base",
          isActive && "border-[#0052ff] text-[#2f8bff]",
        )
      }
    >
      {children}
    </NavLink>
  );
}

export function SearchField({ placeholder }: { placeholder: string }) {
  return (
    <label className="flex h-11 w-[clamp(12rem,23vw,20rem)] min-w-0 items-center gap-2 rounded-full border border-white/6 bg-[#131b2e] px-4 text-slate-400 focus-within:ring-2 focus-within:ring-[#0052ff]">
      <Search className="h-4 w-4" aria-hidden="true" />
      <input
        className="w-full bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </label>
  );
}

export function TierBadge({ tier }: { tier: string }) {
  const style = {
    S: "bg-[#ff4d4d] text-white",
    A: "bg-[#f8c45d] text-[#111827]",
    B: "bg-[#ecf16e] text-[#111827]",
    C: "bg-[#4edea3] text-[#052b1d]",
  }[tier] ?? "bg-slate-700 text-slate-100";
  return <span className={cn("rounded-md px-3 py-1 text-xs font-bold tracking-[0.1em]", style)}>TIER {tier}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "VERIFICADO"
      ? "bg-emerald-500/15 text-emerald-300"
      : status === "AUDITORIA" || status === "AUDITANDO" || status === "EN PROCESO" || status === "EN CURSO"
        ? "bg-amber-400/15 text-amber-300"
        : status === "FINALIZADO"
          ? "bg-cyan-400/15 text-cyan-300"
          : "bg-slate-500/20 text-slate-400";
  return <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", tone)}>{status}</span>;
}

export function MetricTile({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note?: string;
  tone: "blue" | "green" | "amber" | "slate";
}) {
  const border = {
    blue: "before:bg-[#0052ff]",
    green: "before:bg-[#4edea3]",
    amber: "before:bg-[#ffb95f]",
    slate: "before:bg-slate-300",
  }[tone];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn(
        "relative rounded-2xl border border-white/6 bg-[#161f33] p-5 before:absolute before:inset-y-0 before:left-0 before:w-1 before:rounded-l-2xl",
        border,
      )}
    >
      <p className="text-xs uppercase tracking-[0.15em] text-slate-400">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="text-4xl font-bold tracking-[-0.03em] text-white md:text-5xl">{value}</p>
        {note && <p className="text-sm font-semibold text-slate-300">{note}</p>}
      </div>
    </motion.div>
  );
}

export function SidebarQuickAccess() {
  const items = [
    { to: "/settings", label: "Configuracion", icon: Settings },
    { to: "/profile", label: "Perfil", icon: UserCircle2 },
    { to: "/notifications", label: "Notificaciones", icon: Bell },
  ];

  return (
    <div className="space-y-1.5 border-t border-white/8 pt-4">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-white/5 hover:text-slate-200",
              isActive && "bg-white/8 text-slate-100",
            )
          }
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </NavLink>
      ))}
    </div>
  );
}