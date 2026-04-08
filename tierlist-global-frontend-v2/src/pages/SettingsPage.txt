import { SimpleModulePage } from "@/pages/SimpleModulePage";

export function SettingsPage() {
  return (
    <SimpleModulePage
      title="Settings"
      subtitle="Preferencias del espacio institucional para flujo, idioma y accesibilidad base."
      body="Configuraciones desacopladas para soportar perfiles y politicas por tenant."
    />
  );
}
