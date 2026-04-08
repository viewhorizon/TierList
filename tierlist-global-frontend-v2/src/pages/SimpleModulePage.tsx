import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { Button } from "@/components/ui/Button";

interface SimpleModulePageProps {
  title: string;
  subtitle: string;
  body: string;
}

export function SimpleModulePage({ title, subtitle, body }: SimpleModulePageProps) {
  return (
    <ModuleLayout
      title={title}
      subtitle={subtitle}
      actions={
        <>
          <Button className="w-full" variant="secondary">Actualizar modulo</Button>
          <Button className="w-full" variant="ghost">Exportar estado</Button>
        </>
      }
    >
      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">{body}</div>
    </ModuleLayout>
  );
}