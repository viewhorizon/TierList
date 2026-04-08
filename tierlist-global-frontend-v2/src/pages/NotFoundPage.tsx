import { Link } from "react-router-dom";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { Button } from "@/components/ui/Button";

export function NotFoundPage() {
  return (
    <ModuleLayout
      title="Ruta no disponible"
      subtitle="La vista solicitada no existe o fue movida."
      actions={
        <Link to="/explore">
          <Button className="w-full">Volver a Explore</Button>
        </Link>
      }
    >
      <p className="text-sm text-slate-300">Revisa el menu principal para continuar en un modulo valido.</p>
    </ModuleLayout>
  );
}
