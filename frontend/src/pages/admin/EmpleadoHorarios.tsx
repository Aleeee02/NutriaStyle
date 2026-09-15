import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import { DIAS_SEMANA, type Empleado, type Horario } from "../../lib/types";

export default function AdminEmpleadoHorarios() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: empleado } = useQuery({ queryKey: ["admin", "empleados", id], queryFn: () => api.get<Empleado>(`/admin/empleados/${id}`) });
  const { data: horarios } = useQuery({
    queryKey: ["admin", "empleados", id, "horarios"],
    queryFn: () => api.get<Horario[]>(`/admin/empleados/${id}/horarios`),
  });

  const [diaSemana, setDiaSemana] = useState(0);
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin", "empleados", id, "horarios"] });
  }

  async function agregar(e: React.FormEvent) {
    e.preventDefault();
    await api.post(`/admin/empleados/${id}/horarios`, { dia_semana: diaSemana, hora_inicio: horaInicio, hora_fin: horaFin });
    setHoraInicio("");
    setHoraFin("");
    invalidate();
  }

  async function eliminar(horarioId: string) {
    await api.del(`/admin/empleados/${id}/horarios/${horarioId}`);
    invalidate();
  }

  const diasPorId = new Map(DIAS_SEMANA);

  return (
    <div className="max-w-2xl w-full mx-auto flex flex-col gap-space-lg">
      <div>
        <Link className="font-label-sm text-label-sm uppercase tracking-wider text-outline hover:text-primary" to="/admin/empleados">
          &larr; Empleados
        </Link>
        <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold mt-space-2xs">
          Horario de {empleado?.nombre} {empleado?.apellido || ""}
        </h1>
      </div>

      {!horarios || horarios.length === 0 ? (
        <p className="font-body-md text-body-md text-on-surface-variant">Todavía no tiene horarios cargados.</p>
      ) : (
        <div className="flex flex-col gap-space-xs">
          {horarios.map((h) => (
            <div key={h.id} className="flex items-center justify-between bg-surface-container-low p-space-md rounded-xl shadow-md">
              <span className="font-headline-sm text-[16px] text-on-surface">{diasPorId.get(h.dia_semana)}</span>
              <span className="font-body-sm text-body-sm text-secondary">
                {h.hora_inicio} — {h.hora_fin}
              </span>
              <button className="text-outline hover:text-error font-label-sm text-label-sm uppercase tracking-wider" onClick={() => eliminar(h.id)} type="button">
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}

      <form className="flex flex-col gap-space-md bg-surface-container-low p-space-lg rounded-xl shadow-lg" onSubmit={agregar}>
        <h2 className="font-headline-sm text-headline-sm text-primary">Agregar horario</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm">
          <div className="flex flex-col gap-space-2xs">
            <label className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Día</label>
            <select
              className="w-full px-space-md py-space-sm rounded-lg bg-surface-container-high text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
              value={diaSemana}
              onChange={(e) => setDiaSemana(Number(e.target.value))}
            >
              {DIAS_SEMANA.map(([valor, nombre]) => (
                <option key={valor} value={valor}>
                  {nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-space-2xs">
            <label className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Hora inicio</label>
            <input
              className="w-full px-space-md py-space-sm rounded-lg bg-surface-container-high text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
              type="time"
              required
              value={horaInicio}
              onChange={(e) => setHoraInicio(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-space-2xs">
            <label className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Hora fin</label>
            <input
              className="w-full px-space-md py-space-sm rounded-lg bg-surface-container-high text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
              type="time"
              required
              value={horaFin}
              onChange={(e) => setHoraFin(e.target.value)}
            />
          </div>
        </div>
        <button
          className="self-start px-space-lg py-space-sm rounded-lg bg-primary text-on-primary font-headline-sm text-[15px] font-bold uppercase tracking-wider hover:bg-primary-fixed-dim transition-colors"
          type="submit"
        >
          Agregar
        </button>
      </form>
    </div>
  );
}
