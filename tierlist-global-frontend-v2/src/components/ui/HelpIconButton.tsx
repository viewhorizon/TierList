import type { MouseEventHandler } from "react";

interface HelpIconButtonProps {
  label: string;
  onClick: MouseEventHandler<HTMLButtonElement>;
  className?: string;
}

export function HelpIconButton({ label, onClick, className = "" }: HelpIconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-sky-300/35 bg-sky-500/10 text-sky-200 transition hover:bg-sky-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 16v-4" />
        <circle cx="12" cy="8" r="1" fill="currentColor" stroke="none" />
      </svg>
    </button>
  );
}