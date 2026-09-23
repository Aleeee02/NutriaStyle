import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { EstadoCarga } from "../../components/EstadoCarga";
import { Estrellas } from "../../components/Estrellas";
import { api, ApiError } from "../../lib/api";
import type { ResenaAdmin } from "../../lib/types";

const CLAVE = ["admin", "resenas"];

export default function AdminResenas() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: CLAVE,
    queryFn: () => api.get<ResenaAdmin[]>("/admin/resenas"),
  });

  async function ejecutar(peticion: () => Promise<unknown>, mensaje: string) {
    setError(null);
    try {
      await peticion();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : mensaje);
    } finally {
      queryClient.invalidateQueries({ queryKey: CLAVE });
    }
  }

  const cambiarAprobacion = (id: string, aprobada: boolean) =>
    ejecutar(() => api.post(`/admin/resenas/${id}/aprobacion`, { aprobada }), "No se pudo cambiar la reseña.");

  function eliminar(id: string) {
    if (!window.confirm("¿Eliminar esta reseña? No se puede deshacer.")) return;
    ejecutar(() => api.del(`/admin/resenas/${id}`), "No se pudo eliminar la reseña.");
  }

  const pendientes = data?.filter((r) => !r.aprobada).length ?? 0;

  return (
    <>
      <div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold">Reseñas</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Las reseñas de tus clientes se publican solo cuando las apruebas.
          {pendientes > 0 && <strong className="text-primary"> Tienes {pendientes} por revisar.</strong>}
        </p>
      </div>

      {error && (
        <div className="p-space-sm rounded-lg bg-error-container/20 border border-error/40 text-error font-body-sm text-body-sm">
          {error}
        </div>
      )}

      {isPending || isError ? (
        <EstadoCarga cargando={isPending} error={isError} reintentar={refetch} texto="Cargando reseñas…" />
      ) : !data || data.length === 0 ? (
        <p className="font-body-md text-body-md text-on-surface-variant">Todavía no hay reseñas de clientes.</p>
      ) : (
        <ul className="flex flex-col gap-space-sm">
          {data.map((r) => (
            <li key={r.id} className="flex flex-col gap-space-sm bg-surface-container-low rounded-xl shadow-lg p-space-md">
              <div className="flex flex-wrap items-start justify-between gap-space-sm">
                <div className="flex flex-col gap-space-2xs min-w-0">
                  <Estrellas valor={r.calificacion} tamano={18} />
                  <p className="font-body-md text-body-md text-on-surface">
                    {r.usuarios ? `${r.usuarios.nombre} ${r.usuarios.apellido || ""}` : "Cliente"}
                    <span className="text-outline"> · {r.created_at?.slice(0, 10)}</span>
                    {r.empleados && <span className="text-outline"> · con {r.empleados.nombre}</span>}
                  </p>
                </div>
                <span
                  className={`shrink-0 font-label-sm text-[11px] uppercase tracking-wider px-2 py-0.5 rounded ${
                    r.aprobada ? "bg-primary text-on-primary" : "bg-surface-container-highest text-on-surface-variant"
                  }`}
                >
                  {r.aprobada ? "publicada" : "por revisar"}
                </span>
              </div>
              {r.comentario && <p className="font-body-md text-body-md text-on-surface-variant">“{r.comentario}”</p>}
              <div className="flex flex-wrap gap-space-sm">
                <button
                  className="px-space-md py-space-xs rounded-lg bg-primary text-on-primary font-label-sm text-label-sm uppercase tracking-wider hover:bg-primary-fixed-dim transition-colors"
                  onClick={() => cambiarAprobacion(r.id, !r.aprobada)}
                  type="button"
                >
                  {r.aprobada ? "Ocultar" : "Publicar"}
                </button>
                <button
                  className="px-space-md py-space-xs rounded-lg border border-outline-variant text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider hover:text-error hover:border-error transition-colors"
                  onClick={() => eliminar(r.id)}
                  type="button"
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
