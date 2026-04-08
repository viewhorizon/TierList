import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getFeedbackIssueById } from "@/services/feedbackService";

export function FeedbackDetailPage() {
  const { id = "" } = useParams();
  const issueQuery = useQuery({ queryKey: ["feedback-detail", id], queryFn: () => getFeedbackIssueById(id) });

  const issue = issueQuery.data;

  return (
    <ModuleLayout
      title="Detalle de Feedback"
      subtitle="Profundiza en el debate formal y su habilitacion para ranking."
      actions={
        <>
          <Link to="/feedback">
            <Button className="w-full" variant="secondary">
              Volver a Feedback
            </Button>
          </Link>
          {issue?.rankingEligible ? (
            <Link to="/rankings">
              <Button className="w-full">Ir a votacion</Button>
            </Link>
          ) : null}
        </>
      }
    >
      {!issue ? (
        <p className="text-sm text-slate-400">No se encontro el debate solicitado.</p>
      ) : (
        <div className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-xl font-semibold text-slate-100">{issue.title}</h2>
          <p className="text-sm text-slate-300">{issue.summary}</p>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={issue.verificationPassed ? "ok" : "warn"}>{issue.verificationPassed ? "Verificacion lista" : "Falta verificar"}</StatusBadge>
            <StatusBadge status={issue.validationPassed ? "ok" : "warn"}>{issue.validationPassed ? "Validacion lista" : "Falta validar"}</StatusBadge>
          </div>
        </div>
      )}
    </ModuleLayout>
  );
}
