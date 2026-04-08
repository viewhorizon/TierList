import { SimpleModulePage } from "@/pages/SimpleModulePage";

export function NotificationsPage() {
  return (
    <SimpleModulePage
      title="Notifications"
      subtitle="Bandeja operativa de alertas sobre debates, votaciones y observaciones de auditoria."
      body="Modulo preparado para integrar reglas de prioridad y lectura segun permisos del tenant."
    />
  );
}
