import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { soles } from "../../lib/moneda";
import type { Servicio } from "../../lib/types";

export default function AdminServicios() {
  const queryClient = useQueryClient();
  const { data: servicios } = useQuery({
    queryKey: ["admin", "servicios"],
    queryFn: () => api.get<Servicio[]>("/admin/servicios"),
  });

  async function toggleActivo(id: string) {
    await api.post(`/admin/servicios/${id}/toggle-activo`);
    queryClient.invalidateQueries({ queryKey: ["admin", "servicios"] });
  }

  return (
    <>
      <div className="flex items-center justify-between gap-space-md">
        <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold">Servicios</h1>
        <Link
          className="px-space-md py-space-xs rounded-lg bg-primary text-on-primary font-label-md text-label-md uppercase tracking-wider hover:bg-primary-fixed-dim transition-colors"
          to="/admin/servicios/nuevo"
        >
          + Nuevo Servicio
        </Link>
      </div>

      {!servicios || servicios.length === 0 ? (
        <p className="font-body-md text-body-md text-on-surface-variant">Todavía no hay servicios cargados.</p>
      ) : (
        <div className="w-full overflow-x-auto bg-surface-container-low rounded-xl shadow-lg">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container font-label-sm text-label-sm text-secondary uppercase tracking-widest">
                <th className="py-space-sm px-space-md">Nombre</th>
                <th className="py-space-sm px-space-md">Categoría</th>
                <th className="py-space-sm px-space-md">Precio</th>
                <th className="py-space-sm px-space-md">Duración</th>
                <th className="py-space-sm px-space-md">Estado</th>
                <th className="py-space-sm px-space-md text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-body-sm">
              {servicios.map((s) => (
                <tr key={s.id} className="border-t border-outline-variant/20">
                  <td className="py-space-sm px-space-md text-on-surface font-medium">{s.nombre}</td>
                  <td className="py-space-sm px-space-md text-on-surface-variant">{s.categorias_servicio?.nombre ?? "-"}</td>
                  <td className="py-space-sm px-space-md text-secondary">{soles(s.precio)}</td>
                  <td className="py-space-sm px-space-md text-on-surface-variant">{s.duracion_minutos} min</td>
                  <td className="py-space-sm px-space-md">
                    {s.activo ? (
                      <span className="font-label-sm text-[11px] uppercase tracking-wider text-primary bg-primary-container/10 px-2 py-0.5 rounded">Activo</span>
                    ) : (
                      <span className="font-label-sm text-[11px] uppercase tracking-wider text-outline bg-surface-container-highest px-2 py-0.5 rounded">Inactivo</span>
                    )}
                  </td>
                  <td className="py-space-sm px-space-md text-right whitespace-nowrap">
                    <Link className="text-secondary hover:text-primary font-label-sm text-label-sm uppercase tracking-wider" to={`/admin/servicios/${s.id}/editar`}>
                      Editar
                    </Link>
                    <button
                      className="ml-space-sm text-outline hover:text-error font-label-sm text-label-sm uppercase tracking-wider"
                      onClick={() => toggleActivo(s.id)}
                      type="button"
                    >
                      {s.activo ? "Desactivar" : "Activar"}
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
