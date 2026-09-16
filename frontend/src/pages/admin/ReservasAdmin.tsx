import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api, ApiError } from "../../lib/api";
import { ESTADOS_RESERVA, type Reserva } from "../../lib/types";

export default function AdminReservas() {
  const queryClient = useQueryClient();
  const [estadoFiltro, setEstadoFiltro] = useState("");

  const { data: reservas } = useQuery({
    queryKey: ["admin", "reservas", estadoFiltro],
    queryFn: () => api.get<Reserva[]>(`/admin/reservas${estadoFiltro ? `?estado=${estadoFiltro}` : ""}`),
  });

  const [error, setError] = useState<string | null>(null);

  // El nuevo estado se ve al instante; la peticion va por detras y, al
  // terminar (bien o mal), se recarga la lista para quedar en sintonia.
  async function cambiarEstado(id: string, estado: string) {
    setError(null);
    const key = ["admin", "reservas", estadoFiltro];
    await queryClient.cancelQueries({ queryKey: ["admin", "reservas"] });
    queryClient.setQueryData<Reserva[]>(key, (prev) => prev?.map((r) => (r.id === id ? { ...r, estado } : r)));
    try {
      await api.post(`/admin/reservas/${id}/estado`, { estado });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cambiar el estado.");
    } finally {
      queryClient.invalidateQueries({ queryKey: ["admin", "reservas"] });
    }
  }

  return (
    <>
      <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold">Reservas</h1>
      {error && (
        <div className="p-space-sm rounded-lg bg-error-container/20 border border-error/40 text-error font-body-sm text-body-sm">
          {error}
        </div>
      )}

      <div className="flex items-center gap-space-xs overflow-x-auto pb-space-xs">
        <button
          className={`px-space-md py-space-xs rounded-full font-label-sm text-label-sm uppercase tracking-wider transition-all ${
            !estadoFiltro ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant hover:text-primary"
          }`}
          onClick={() => setEstadoFiltro("")}
          type="button"
        >
          Todas
        </button>
        {ESTADOS_RESERVA.map((e) => (
          <button
            key={e}
            className={`px-space-md py-space-xs rounded-full font-label-sm text-label-sm uppercase tracking-wider transition-all ${
              estadoFiltro === e ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant hover:text-primary"
            }`}
            onClick={() => setEstadoFiltro(e)}
            type="button"
          >
            {e}
          </button>
        ))}
      </div>

      {!reservas || reservas.length === 0 ? (
        <p className="font-body-md text-body-md text-on-surface-variant">No hay reservas para mostrar.</p>
      ) : (
        <div className="w-full overflow-x-auto bg-surface-container-low rounded-xl shadow-lg">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container font-label-sm text-label-sm text-secondary uppercase tracking-widest">
                <th className="py-space-sm px-space-md">Fecha</th>
                <th className="py-space-sm px-space-md">Cliente</th>
                <th className="py-space-sm px-space-md">Servicio</th>
                <th className="py-space-sm px-space-md">Barbero</th>
                <th className="py-space-sm px-space-md">Estado</th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-body-sm">
              {reservas.map((r) => (
                <tr key={r.id} className="border-t border-outline-variant/20">
                  <td className="py-space-sm px-space-md text-on-surface font-medium whitespace-nowrap">
                    {r.fecha} · {r.hora_inicio.slice(0, 5)}
                  </td>
                  <td className="py-space-sm px-space-md text-on-surface-variant">
                    {r.usuarios ? (
                      <>
                        {r.usuarios.nombre} {r.usuarios.apellido || ""}
                        <br />
                        <span className="text-outline">{r.usuarios.email}</span>
                      </>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="py-space-sm px-space-md text-on-surface-variant">{r.servicios?.nombre ?? "-"}</td>
                  <td className="py-space-sm px-space-md text-on-surface-variant">
                    {r.empleados ? `${r.empleados.nombre} ${r.empleados.apellido || ""}` : "-"}
                  </td>
                  <td className="py-space-sm px-space-md">
                    <select
                      className="px-space-xs py-space-2xs rounded-lg bg-surface-container-high text-on-surface font-label-sm text-label-sm uppercase"
                      value={r.estado}
                      onChange={(e) => cambiarEstado(r.id, e.target.value)}
                    >
                      {ESTADOS_RESERVA.map((e) => (
                        <option key={e} value={e}>
                          {e}
                        </option>
                      ))}
                    </select>
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
