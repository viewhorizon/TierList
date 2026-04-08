import type { CycleStageStatus } from "@/types/contracts";
import { cn } from "@/utils/cn";

interface StatusBadgeProps {
  status: CycleStageStatus | "ok" | "warn";
  children: string;
}

export function StatusBadge({ status, children }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-2 py-1 text-xs font-medium",
        status === "complete" && "border-emerald-400/40 bg-emerald-500/10 text-emerald-300",
        status === "active" && "border-sky-400/40 bg-sky-500/10 text-sky-300",
        status === "pending" && "border-slate-600 bg-slate-900 text-slate-300",
        status === "blocked" && "border-rose-400/40 bg-rose-500/10 text-rose-300",
        status === "ok" && "border-emerald-400/40 bg-emerald-500/10 text-emerald-300",
        status === "warn" && "border-amber-400/40 bg-amber-500/10 text-amber-300"
      )}
    >
      {children}
    </span>
  );
}