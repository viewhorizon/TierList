import { Link } from "react-router-dom";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { Button } from "@/components/ui/Button";

export function ExplorePage() {
  return (
    <ModuleLayout
      title="Explore"
      subtitle="Vista general del estado de debate formal, muro y ranking para coordinacion operativa."
      actions={
        <>
          <Link to="/feedback">
            <Button className="w-full">Abrir Feedback</Button>
          </Link>
          <Link to="/rankings">
            <Button className="w-full" variant="secondary">
              Ir a Rankings
            </Button>
          </Link>
          <Link to="/audit">
            <Button className="w-full" variant="secondary">
              Revisar Audit
            </Button>
          </Link>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Feedback</h2>
          <p className="mt-2 text-sm text-slate-300">
            Centro formal de debate con verificacion y validacion previa para habilitar ingreso a ranking.
          </p>
        </section>
        <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Debate Wall</h2>
          <p className="mt-2 text-sm text-slate-300">
            Muro paralelo para opiniones y etiquetado contextual de usuarios seleccionados en grilla.
          </p>
        </section>
        <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Rankings</h2>
          <p className="mt-2 text-sm text-slate-300">Solo votacion de podio para asuntos formalmente debatidos y validados.</p>
        </section>
        <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Audit</h2>
          <p className="mt-2 text-sm text-slate-300">Control transversal del ciclo completo con trazabilidad SVP externa.</p>
        </section>
      </div>
    </ModuleLayout>
  );
}