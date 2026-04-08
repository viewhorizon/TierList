import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { cn } from "@/utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ children, className, variant = "primary", ...props }: PropsWithChildren<ButtonProps>) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f8bff] disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" && "border-[#2f8bff] bg-[#0052ff] text-white hover:bg-[#1f66ff]",
        variant === "secondary" && "border-white/12 bg-[#0f1729] text-slate-100 hover:border-white/20 hover:bg-[#15213a]",
        variant === "ghost" && "border-transparent bg-transparent text-slate-300 hover:bg-[#0f1729]",
        variant === "danger" && "border-rose-400/40 bg-rose-500/20 text-rose-200 hover:bg-rose-500/30",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}