import { useQuery, useQueryClient } from "@tanstack/react-query";
import { EstadoCarga } from "../../components/EstadoCarga";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import type { Empleado } from "../../lib/types";

export default function AdminEmpleados() {
  const queryClient = useQueryClient();
  const { data: empleados, isPending, isError, refetch } = useQuery({
    queryKey: ["admin", "empleados"],
    queryFn: () => api.get<Empleado[]>("/admin/empleados"),
  });

  async function toggleActivo(id: string) {
    await api.post(`/admin/empleados/${id}/toggle-activo`);
    queryClient.invalidateQueries({ queryKey: ["admin", "empleados"] });
  }

  return (
    <>
      <div className="flex items-center justify-between gap-space-md">
        <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold">Empleados</h1>
        <Link
          className="px-space-md py-space-xs rounded-lg bg-primary text-on-primary font-label-md text-label-md uppercase tracking-wider hover:bg-primary-fixed-dim transition-colors"
          to="/admin/empleados/nuevo"
        >
          + Nuevo Empleado
        </Link>
      </div>

      {isPending || isError ? (
        <EstadoCarga cargando={isPending} error={isError} reintentar={refetch} texto="Cargando empleados…" />
      ) : !empleados || empleados.length === 0 ? (
        <p className="font-body-md text-body-md text-on-surface-variant">Todavía no hay empleados cargados.</p>
      ) : (
        <div className="w-full overflow-x-auto bg-surface-container-low rounded-xl shadow-lg">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container font-label-sm text-label-sm text-secondary uppercase tracking-widest">
                <th className="py-space-sm px-space-md">Nombre</th>
                <th className="py-space-sm px-space-md">Teléfono</th>
                <th className="py-space-sm px-space-md">Estado</th>
                <th className="py-space-sm px-space-md text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-body-sm">
              {empleados.map((e) => (
                <tr key={e.id} className="border-t border-outline-variant/20">
                  <td className="py-space-sm px-space-md text-on-surface font-medium">
                    {e.nombre} {e.apellido || ""}
                  </td>
                  <td className="py-space-sm px-space-md text-on-surface-variant">{e.telefono || "-"}</td>
                  <td className="py-space-sm px-space-md">
                    {e.activo ? (
                      <span className="font-label-sm text-[11px] uppercase tracking-wider text-primary bg-primary-container/10 px-2 py-0.5 rounded">Activo</span>
                    ) : (
                      <span className="font-label-sm text-[11px] uppercase tracking-wider text-outline bg-surface-container-highest px-2 py-0.5 rounded">Inactivo</span>
                    )}
                  </td>
                  <td className="py-space-sm px-space-md text-right whitespace-nowrap">
                    <Link className="text-secondary hover:text-primary font-label-sm text-label-sm uppercase tracking-wider" to={`/admin/empleados/${e.id}/horarios`}>
                      Horarios
                    </Link>
                    <Link className="ml-space-sm text-secondary hover:text-primary font-label-sm text-label-sm uppercase tracking-wider" to={`/admin/empleados/${e.id}/editar`}>
                      Editar
                    </Link>
                    <button
                      className="ml-space-sm text-outline hover:text-error font-label-sm text-label-sm uppercase tracking-wider"
                      onClick={() => toggleActivo(e.id)}
                      type="button"
                    >
                      {e.activo ? "Desactivar" : "Activar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
