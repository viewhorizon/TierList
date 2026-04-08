import { SimpleModulePage } from "@/pages/SimpleModulePage";

export function InventoryPage() {
  return (
    <SimpleModulePage
      title="Inventory"
      subtitle="Inventario operativo de asuntos, evidencias y estado de disponibilidad."
      body="Modulo listo para consumir inventario real desde VITE_API_URL con normalizacion de payloads en services."
    />
  );
}
