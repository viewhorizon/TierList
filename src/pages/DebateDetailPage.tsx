import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { StatusBadge } from "../components/ui";
import { fetchDebateLifecycle } from "../services/api";

const stageLabelMap = {
  VERIFICACION_INICIAL: "Verificacion inicial",
  VALIDACION_INICIAL: "Validacion inicial",
  DEBATE_FORMAL: "Debate formal",
  VERIFICACION_RESULTADO_DEBATE: "Verificacion de resultados del debate",
  VALIDACION_RESULTADO_DEBATE: "Validacion de resultados del debate",
  VOTACION_RANKING: "Votacion en ranking",
  VERIFICACION_VOTOS: "Verificacion de votos",
  VALIDACION_VOTOS: "Validacion de votos",
  ENTREGA_LOGROS: "Entrega de premios por logro",
  REGISTRO_RESULTADOS: "Registro final en base de datos",
} as const;

const stageToStatus = {
  VERIFICACION_INICIAL: "AUDITORIA",
  VALIDACION_INICIAL: "AUDITORIA",
  DEBATE_FORMAL: "VERIFICADO",
  VERIFICACION_RESULTADO_DEBATE: "AUDITORIA",
  VALIDACION_RESULTADO_DEBATE: "AUDITORIA",
  VOTACION_RANKING: "EN CURSO",
  VERIFICACION_VOTOS: "AUDITORIA",
  VALIDACION_VOTOS: "AUDITORIA",
  ENTREGA_LOGROS: "FINALIZADO",
  REGISTRO_RESULTADOS: "FINALIZADO",
} as const;

export function DebateDetailPage() {
  const { id = "SL-2024-001" } = useParams();
  const { data } = useQuery({ queryKey: ["debate-lifecycle", id], queryFn: () => fetchDebateLifecycle(id.toLowerCase()), retry: 2 });

  const currentStep = data?.timeline.find((item) => item.state === "current");
  const nextStep = data?.timeline.find((item) => item.state === "pending");

  if (!data) {
    return (
      <AppLayout>
        <section className="rounded-3xl border border-white/6 bg-[#161f33] p-6 text-slate-300">Cargando ciclo del debate...</section>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-3xl border border-white/6 bg-[#161f33] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Debate {data.debateId.toUpperCase()}</p>
              <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] md:text-5xl">Ciclo Institucional TierList</h1>
            </div>
            <StatusBadge status={stageToStatus[data.stage]} />
          </div>
          <p className="mt-4 max-w-4xl text-base text-slate-300 md:text-xl">{data.assetName}. {data.summary}</p>

          <div className="mt-6 grid gap-3 rounded-xl border border-white/8 bg-[#101b30] p-4 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Etapa actual</p>
              <p className="mt-2 text-lg font-semibold">{currentStep ? stageLabelMap[currentStep.key] : stageLabelMap[data.stage]}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Siguiente etapa</p>
              <p className="mt-2 text-lg font-semibold">{nextStep ? stageLabelMap[nextStep.key] : "Ciclo completado"}</p>
            </div>
          </div>

          {data.stage === "VOTACION_RANKING" && data.voting ? (
            <div className="mt-8 space-y-5">
              {data.voting.map((option) => (
                <div key={option.label}>
                  <div className="mb-2 flex justify-between text-sm font-semibold">
                    <span>{option.label}</span>
                    <span>{option.value}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-700">
                    <div className="h-full rounded-full" style={{ width: `${option.value}%`, backgroundColor: option.color }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-xl border border-white/8 bg-[#101b30] p-4 text-sm text-slate-300">
              Esta propuesta no esta en etapa de votacion de ranking. Las barras de voto se habilitan solo durante esa etapa.
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-white/6 bg-[#131c2f] p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Meta</p>
            <p className="mt-3 text-5xl font-black">{data.participants}</p>
            <p className="text-slate-400">Participantes en el ciclo institucional.</p>
          </div>
          <div className="rounded-2xl border border-white/6 bg-[#131c2f] p-5">
            <h2 className="text-3xl font-bold">Acciones</h2>
            <div className="mt-4 space-y-2">
              <Link to="/debate" className="block w-full rounded-xl bg-[#0052ff] py-3 text-center font-semibold">Ir al Muro de Debate</Link>
              <Link to={`/audit?debate=${data.debateId}`} className="block w-full rounded-xl bg-white/10 py-3 text-center font-semibold">Ver Auditoria</Link>
            </div>
          </div>
        </aside>
      </div>
    </AppLayout>
  );
}