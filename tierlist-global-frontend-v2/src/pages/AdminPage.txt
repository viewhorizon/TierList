import { SimpleModulePage } from "@/pages/SimpleModulePage";

export function AdminPage() {
  return (
    <SimpleModulePage
      title="Admin"
      subtitle="Control de configuracion institucional y politicas del tenant."
      body="Acciones preparadas para integrar permisos y reglas de merge/versionado definidas por backend."
    />
  );
}
