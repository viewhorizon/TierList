import type { PropsWithChildren, ReactNode } from "react";
import { HelpIconButton } from "@/components/ui/HelpIconButton";

interface ModuleLayoutProps extends PropsWithChildren {
  title: string;
  subtitle: string;
  actions?: ReactNode;
  titleHelpLabel?: string;
  onTitleHelpClick?: () => void;
}

export function ModuleLayout({ title, subtitle, actions, titleHelpLabel, onTitleHelpClick, children }: ModuleLayoutProps) {
  return (
    <section
      className={`mx-auto grid w-full max-w-[1700px] grid-cols-1 gap-4 px-3 py-4 sm:px-4 lg:gap-6 lg:px-6 lg:py-6 ${
        actions ? "lg:grid-cols-[minmax(0,1fr)_280px]" : "lg:grid-cols-1"
      }`}
    >
      <div className="space-y-4">
        <header className="tl-surface space-y-1 p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black tracking-[-0.03em] text-slate-100">{title}</h1>
            {onTitleHelpClick ? <HelpIconButton label={titleHelpLabel ?? `Ayuda de ${title}`} onClick={onTitleHelpClick} /> : null}
          </div>
          {subtitle ? <p className="text-sm text-slate-300">{subtitle}</p> : null}
        </header>
        {children}
      </div>
      {actions ? (
        <aside className="space-y-3 lg:pt-1">
          <section className="tl-surface p-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-400">Acciones</h2>
            <div className="mt-3 space-y-2">{actions}</div>
          </section>
        </aside>
      ) : null}
    </section>
  );
}