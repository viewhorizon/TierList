import { useQuery } from "@tanstack/react-query";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getAuditSummary } from "@/services/auditService";

function ratio(value: number, total: number) {
  if (!total) {
    return 0;
  }
  return Math.round((value / total) * 100);
}

export function AuditPage() {
  const auditQuery = useQuery({ queryKey: ["audit"], queryFn: getAuditSummary });
  const cycle = auditQuery.data?.cycle ?? [];
  const completed = cycle.filter((stage) => stage.status === "complete").length;
  const active = cycle.filter((stage) => stage.status === "active").length;
  const blocked = cycle.filter((stage) => stage.status === "blocked").length;
  const completion = ratio(completed, cycle.length);

  return (
    <ModuleLayout
      title="Audit"
      subtitle="Control operativo y trazabilidad del ciclo oficial completo."
      actions={
        <>
          <Button className="w-full" variant="secondary">Exportar trazabilidad SVP</Button>
          <Button className="w-full" variant="ghost">Marcar observacion externa</Button>
        </>
      }
    >
      {auditQuery.isLoading ? <p className="text-sm text-slate-400">Cargando estado de auditoria...</p> : null}
      {auditQuery.isError ? <p className="text-sm text-rose-300">No fue posible cargar la auditoria.</p> : null}

      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-300">Progreso del ciclo oficial</p>
          <p className="text-sm font-semibold text-slate-100">{completion}%</p>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded bg-slate-800">
          <div className="h-full bg-sky-400" style={{ width: `${completion}%` }} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
          <p className="text-xs uppercase text-slate-400">Debates trazados</p>
          <p className="mt-1 text-2xl font-semibold text-slate-100">{auditQuery.data?.trackedDebates ?? 0}</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
          <p className="text-xs uppercase text-slate-400">Alertas abiertas</p>
          <p className="mt-1 text-2xl font-semibold text-amber-300">{auditQuery.data?.openAlerts ?? 0}</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
          <p className="text-xs uppercase text-slate-400">Trazabilidad SVP</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-300">{auditQuery.data?.svpTraceability ?? 0}%</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-300">
          Pasos completados
          <p className="mt-1 text-xl font-semibold text-emerald-300">{completed}</p>
        </div>
        <div className="rounded-md border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-300">
          Pasos activos
          <p className="mt-1 text-xl font-semibold text-sky-300">{active}</p>
        </div>
        <div className="rounded-md border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-300">
          Pasos bloqueados
          <p className="mt-1 text-xl font-semibold text-rose-300">{blocked}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-900 text-left text-slate-300">
            <tr>
              <th className="px-3 py-2">Paso</th>
              <th className="px-3 py-2">Responsable</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2">Ultima actualizacion</th>
            </tr>
          </thead>
          <tbody>
            {cycle.map((stage, index) => (
              <tr key={stage.key} className="border-t border-slate-800">
                <td className="px-3 py-2 text-slate-200">{index + 1}. {stage.label}</td>
                <td className="px-3 py-2 text-slate-300">{stage.owner}</td>
                <td className="px-3 py-2"><StatusBadge status={stage.status}>{stage.status}</StatusBadge></td>
                <td className="px-3 py-2 text-slate-400">{new Date(stage.updatedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ModuleLayout>
  );
}
