import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

export function TextField({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none ring-0 placeholder:text-slate-500 focus-visible:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-400/30",
        className
      )}
      {...props}
    />
  );
}

export function SelectField({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus-visible:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-400/30",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}