import { useParams } from "react-router-dom";
import { SimpleModulePage } from "@/pages/SimpleModulePage";

export function DebateDetailPage() {
  const { id = "" } = useParams();

  return (
    <SimpleModulePage
      title="Detalle tecnico de Debate Wall"
      subtitle="Vista de transicion para trazabilidad de mensajes y configuracion del muro."
      body={`Detalle de debate wall ${id}. Usa este espacio para conectar anotaciones tecnicas de backend por id.`}
    />
  );
}
