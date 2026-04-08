import { useSession } from "@/context/SessionContext";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { Button } from "@/components/ui/Button";

export function ProfilePage() {
  const session = useSession();

  return (
    <ModuleLayout
      title="Profile"
      subtitle="Datos de sesion y permisos activos para operaciones del producto."
      actions={
        <>
          <Button className="w-full" variant="secondary">Actualizar perfil</Button>
          <Button className="w-full" variant="ghost">Revisar permisos</Button>
        </>
      }
    >
      <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-sm">
        <p className="text-slate-300">Usuario: <span className="font-medium text-slate-100">{session.displayName}</span></p>
        <p className="text-slate-300">Tenant: <span className="font-medium text-slate-100">{session.tenantId}</span></p>
        <div>
          <p className="mb-1 text-slate-300">Permisos activos</p>
          <ul className="space-y-1 text-slate-200">
            {session.permissions.map((permission) => (
              <li key={permission} className="rounded border border-slate-700 px-2 py-1">{permission}</li>
            ))}
          </ul>
        </div>
      </div>
    </ModuleLayout>
  );
}
