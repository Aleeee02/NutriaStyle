import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { api, ApiError } from "../lib/api";
import type { Configuracion, Categoria, Empleado, Servicio } from "../lib/types";
import { urlComoLlegar } from "../lib/mapa";

const STEP_LABELS = ["Servicio", "Maestro", "Fecha y Hora", "Confirmación"];

export default function Reservas() {
  const queryClient = useQueryClient();
  const { data: categorias } = useQuery({ queryKey: ["categorias"], queryFn: () => api.get<Categoria[]>("/categorias") });
  const { data: servicios } = useQuery({ queryKey: ["servicios"], queryFn: () => api.get<Servicio[]>("/servicios") });
  const { data: empleados } = useQuery({ queryKey: ["empleados"], queryFn: () => api.get<Empleado[]>("/empleados") });
  const { data: config } = useQuery({ queryKey: ["config"], queryFn: () => api.get<Configuracion>("/config") });
  const comoLlegar = urlComoLlegar(config);

  const [step, setStep] = useState(1);
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("all");
  const [servicioId, setServicioId] = useState<string | null>(null);
  const [empleadoId, setEmpleadoId] = useState<string | null>(null);
  const [fecha, setFecha] = useState<string>("");
  const [horaInicio, setHoraInicio] = useState<string>("");
  const [observaciones, setObservaciones] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmada, setConfirmada] = useState(false);

  const servicio = useMemo(() => servicios?.find((s) => s.id === servicioId) ?? null, [servicios, servicioId]);
  const empleado = useMemo(() => empleados?.find((e) => e.id === empleadoId) ?? null, [empleados, empleadoId]);
  const hoy = new Date().toISOString().slice(0, 10);

  const { data: slotsData, isFetching: buscandoSlots } = useQuery({
    queryKey: ["disponibilidad", empleadoId, fecha, servicio?.duracion_minutos],
    queryFn: () =>
      api.get<{ slots: string[] }>(
        `/disponibilidad?empleado_id=${empleadoId}&fecha=${fecha}&duracion_minutos=${servicio?.duracion_minutos}`
      ),
    enabled: Boolean(empleadoId && fecha && servicio),
  });
  const slots = slotsData?.slots ?? [];

  function selectServicio(id: string) {
    setServicioId(id);
    setHoraInicio("");
  }
  function selectEmpleado(id: string) {
    setEmpleadoId(id);
    setHoraInicio("");
  }
  function onFechaChange(value: string) {
    setFecha(value);
    setHoraInicio("");
  }

  const listoParaConfirmar = Boolean(servicioId && empleadoId && fecha && horaInicio);

  async function confirmarReserva() {
    if (!servicioId || !empleadoId) return;
    setConfirmando(true);
    setError(null);
    try {
      await api.post("/reservas", {
        servicio_id: servicioId,
        empleado_id: empleadoId,
        fecha,
        hora_inicio: horaInicio,
        observaciones: observaciones || null,
      });
      setConfirmada(true);
      setHoraInicio("");
      queryClient.invalidateQueries({ queryKey: ["disponibilidad"] });
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 409
          ? err.message
          : "No se pudo reservar ese horario, alguien más lo tomó justo antes. Elige otro."
      );
    } finally {
      setConfirmando(false);
    }
  }

  const serviciosFiltrados = servicios?.filter((s) => categoriaFiltro === "all" || s.categoria_id === categoriaFiltro) ?? [];

  return (
    <main className="w-full pt-24 pb-space-3xl bg-background min-h-screen">
      <div className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop flex flex-col gap-space-xl">
        {confirmada && (
          <div className="bg-secondary-container/40 border border-secondary/40 text-secondary p-space-md rounded-xl font-body-md text-body-md">
            ¡Reserva registrada con éxito! Queda en estado <strong>pendiente</strong> hasta que el salón la confirme.
            {comoLlegar && (
              <a className="ml-space-xs inline-flex items-center gap-1 font-medium text-primary hover:underline" href={comoLlegar} target="_blank" rel="noreferrer">
                <span className="material-symbols-outlined text-[18px]">directions</span>Cómo llegar
              </a>
            )}
          </div>
        )}
        {error && (
          <div className="bg-error-container/20 border border-error/40 text-error p-space-md rounded-xl font-body-md text-body-md">
            {error}
          </div>
        )}

        <div className="w-full bg-surface-container-low rounded-xl p-space-md shadow-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-space-md">
            <div className="flex items-center gap-space-sm">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-[22px]">calendar_month</span>
              </div>
              <div>
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary block">Nutria Style Concierge</span>
                <span className="font-headline-sm text-headline-sm text-on-surface">Agendamiento Artesanal</span>
              </div>
            </div>
            <div className="flex items-center gap-space-xs sm:gap-space-sm overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
              {STEP_LABELS.map((label, i) => {
                const n = i + 1;
                const active = n <= step;
                return (
                  <div key={label} className="flex items-center gap-space-xs">
                    <div
                      className={`flex items-center gap-space-xs shrink-0 cursor-pointer ${active ? "" : "opacity-60"}`}
                      onClick={() => setStep(n)}
                    >
                      <span
                        className={`w-7 h-7 rounded-full font-label-sm text-label-sm flex items-center justify-center font-bold ${
                          active ? "bg-primary text-on-primary shadow-[0_0_12px_rgba(229,193,88,0.35)]" : "bg-surface-container-high text-on-surface-variant"
                        }`}
                      >
                        {n}
                      </span>
                      <span className={`font-label-sm text-label-sm uppercase tracking-wider ${active ? "text-primary" : "text-on-surface-variant"}`}>
                        {label}
                      </span>
                    </div>
                    {n < STEP_LABELS.length && <div className="w-5 h-[2px] bg-outline-variant/60 shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
          <div className="lg:col-span-8 flex flex-col gap-space-xl">
            {/* Paso 1: Servicio */}
            <section className="flex flex-col gap-space-lg">
              <div>
                <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest block">Paso 1 de 4</span>
                <h1 className="font-headline-md text-headline-md text-on-surface">Selección de Servicio</h1>
              </div>
              {categorias && categorias.length > 0 && (
                <div className="flex items-center gap-space-xs overflow-x-auto pb-space-xs">
                  <button
                    className={`px-space-md py-space-xs rounded-full font-label-sm text-label-sm uppercase tracking-wider transition-all ${
                      categoriaFiltro === "all" ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant hover:text-primary"
                    }`}
                    onClick={() => setCategoriaFiltro("all")}
                    type="button"
                  >
                    Todos
                  </button>
                  {categorias.map((c) => (
                    <button
                      key={c.id}
                      className={`px-space-md py-space-xs rounded-full font-label-sm text-label-sm uppercase tracking-wider transition-all ${
                        categoriaFiltro === c.id ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant hover:text-primary"
                      }`}
                      onClick={() => setCategoriaFiltro(c.id)}
                      type="button"
                    >
                      {c.nombre}
                    </button>
                  ))}
                </div>
              )}
              {serviciosFiltrados.length === 0 ? (
                <p className="font-body-md text-body-md text-on-surface-variant bg-surface-container-low p-space-lg rounded-xl">
                  Todavía no hay servicios publicados.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                  {serviciosFiltrados.map((s) => {
                    const selected = s.id === servicioId;
                    return (
                      <div
                        key={s.id}
                        className={`cursor-pointer rounded-xl p-space-md flex flex-col justify-between shadow-md transition-all ${
                          selected ? "bg-surface-container" : "bg-surface-container-low hover:bg-surface-container"
                        }`}
                        onClick={() => selectServicio(s.id)}
                      >
                        <div className="flex flex-col gap-space-xs">
                          <div className="flex items-start justify-between gap-space-xs">
                            <h2 className="font-headline-sm text-headline-sm text-on-surface">{s.nombre}</h2>
                            <span className="font-headline-sm text-headline-sm text-primary shrink-0">{Math.round(s.precio)}€</span>
                          </div>
                          {s.descripcion && <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{s.descripcion}</p>}
                        </div>
                        <div className="flex items-center justify-between mt-space-md pt-space-xs">
                          <div className="flex items-center gap-space-2xs text-outline font-label-sm text-label-sm uppercase">
                            <span className="material-symbols-outlined text-[16px] text-secondary">schedule</span>
                            <span>{s.duracion_minutos} minutos</span>
                          </div>
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                              selected ? "bg-primary text-on-primary shadow-[0_0_10px_rgba(229,193,88,0.4)]" : "bg-surface-container-high text-outline"
                            }`}
                          >
                            <span className="material-symbols-outlined text-[18px]">{selected ? "check" : "add"}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Paso 2: Barbero */}
            <section className="flex flex-col gap-space-md pt-space-md">
              <div>
                <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest block">Paso 2 de 4</span>
                <h2 className="font-headline-md text-headline-md text-on-surface">Selecciona a tu Barbero</h2>
              </div>
              {!empleados || empleados.length === 0 ? (
                <p className="font-body-md text-body-md text-on-surface-variant bg-surface-container-low p-space-lg rounded-xl">
                  Todavía no hay barberos publicados.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
                  {empleados.map((e) => {
                    const selected = e.id === empleadoId;
                    return (
                      <div
                        key={e.id}
                        className={`cursor-pointer rounded-xl p-space-md flex flex-col items-center text-center transition-all ${
                          selected ? "bg-surface-container" : "bg-surface-container-low hover:bg-surface-container"
                        }`}
                        onClick={() => selectEmpleado(e.id)}
                      >
                        <div className="relative mb-space-sm">
                          {e.foto_url ? (
                            <img className="w-20 h-20 rounded-full object-cover shadow-lg" src={e.foto_url} alt={e.nombre} />
                          ) : (
                            <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center text-primary font-headline-md text-headline-md font-bold uppercase shadow-lg">
                              {e.nombre[0]}
                            </div>
                          )}
                          {selected && (
                            <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-primary flex items-center justify-center text-on-primary">
                              <span className="material-symbols-outlined text-[12px] font-bold">check</span>
                            </span>
                          )}
                        </div>
                        <h3 className="font-headline-sm text-headline-sm text-on-surface">
                          {e.nombre} {e.apellido || ""}
                        </h3>
                        {e.descripcion && <p className="font-body-sm text-body-sm text-outline mt-2 leading-tight">{e.descripcion}</p>}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Paso 3: Fecha y hora */}
            <section className="flex flex-col gap-space-lg pt-space-md">
              <div>
                <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest block">Paso 3 de 4</span>
                <h2 className="font-headline-md text-headline-md text-on-surface">Fecha &amp; Horario Deseado</h2>
              </div>
              <div className="bg-surface-container-low p-space-md rounded-xl shadow-lg flex flex-col gap-space-md">
                <div className="flex flex-col gap-space-2xs max-w-xs">
                  <label className="font-label-sm text-label-sm uppercase tracking-wider text-secondary" htmlFor="fecha-input">Fecha</label>
                  <input
                    className="w-full px-space-md py-space-sm rounded-lg bg-surface-container-high text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
                    id="fecha-input"
                    type="date"
                    min={hoy}
                    value={fecha}
                    onChange={(e) => onFechaChange(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-space-sm">
                  {!servicioId || !empleadoId || !fecha ? (
                    <p className="font-body-sm text-body-sm text-outline">
                      Elige un servicio, un barbero y una fecha para ver los horarios disponibles.
                    </p>
                  ) : buscandoSlots ? (
                    <p className="font-body-sm text-body-sm text-outline">Buscando horarios disponibles…</p>
                  ) : slots.length === 0 ? (
                    <p className="font-body-sm text-body-sm text-error">Ese barbero no tiene horarios libres ese día. Prueba otra fecha.</p>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-space-xs">
                      {slots.map((hora) => (
                        <button
                          key={hora}
                          type="button"
                          className={`py-space-xs rounded-lg font-label-md text-label-md transition-all ${
                            hora === horaInicio ? "bg-primary text-on-primary font-bold shadow-[0_0_12px_rgba(229,193,88,0.3)]" : "bg-surface-container hover:bg-surface-bright text-on-surface"
                          }`}
                          onClick={() => setHoraInicio(hora)}
                        >
                          {hora}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Paso 4: Confirmacion */}
            <section className="flex flex-col gap-space-md pt-space-md">
              <div>
                <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest block">Paso 4 de 4</span>
                <h2 className="font-headline-md text-headline-md text-on-surface">Confirmación</h2>
              </div>
              <div className="bg-surface-container-low p-space-lg rounded-xl shadow-lg flex flex-col gap-space-md">
                <div className="flex flex-col gap-space-2xs">
                  <label className="font-label-sm text-label-sm uppercase tracking-wider text-secondary" htmlFor="observaciones">
                    Preferencias especiales (opcional)
                  </label>
                  <textarea
                    className="w-full bg-surface-container text-on-surface px-space-md py-space-xs rounded-lg focus:outline-none focus:bg-surface-container-high transition-colors font-body-md text-body-md resize-none"
                    id="observaciones"
                    placeholder="Ej: piel sensible, referencia de corte anterior..."
                    rows={3}
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Resumen lateral */}
          <div className="lg:col-span-4 lg:sticky lg:top-28">
            <div className="bg-surface-container rounded-xl p-space-lg shadow-2xl flex flex-col gap-space-md">
              <div className="flex items-center justify-between pb-space-sm border-b border-outline-variant/30">
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">Resumen de Cita</span>
                  <h2 className="font-headline-sm text-headline-sm text-primary">Nutria Style</h2>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[24px]">content_cut</span>
                </div>
              </div>
              <div className="flex flex-col gap-space-sm py-space-2xs">
                <div className="flex items-start justify-between gap-space-xs">
                  <div className="flex items-start gap-space-xs">
                    <span className="material-symbols-outlined text-secondary text-[20px] mt-0.5">brush</span>
                    <div>
                      <span className="font-label-sm text-label-sm uppercase text-outline block">Servicio</span>
                      <span className="font-headline-sm text-[17px] text-on-surface leading-tight font-semibold">
                        {servicio?.nombre ?? "Sin elegir"}
                      </span>
                      <span className="font-body-sm text-body-sm text-secondary block mt-0.5">
                        {servicio ? `${servicio.duracion_minutos} minutos` : "-"}
                      </span>
                    </div>
                  </div>
                  <span className="font-headline-sm text-headline-sm text-primary">{servicio ? `${Math.round(servicio.precio)}€` : "-"}</span>
                </div>
                <div className="flex items-start gap-space-xs pt-space-xs border-t border-outline-variant/20">
                  <span className="material-symbols-outlined text-secondary text-[20px] mt-0.5">person</span>
                  <div>
                    <span className="font-label-sm text-label-sm uppercase text-outline block">Maestro Asignado</span>
                    <span className="font-headline-sm text-[16px] text-on-surface font-semibold">
                      {empleado ? `${empleado.nombre} ${empleado.apellido || ""}` : "Sin elegir"}
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-space-xs pt-space-xs border-t border-outline-variant/20">
                  <span className="material-symbols-outlined text-secondary text-[20px] mt-0.5">schedule</span>
                  <div>
                    <span className="font-label-sm text-label-sm uppercase text-outline block">Fecha &amp; Horario</span>
                    <span className="font-headline-sm text-[16px] text-primary font-semibold">
                      {fecha && horaInicio ? `${fecha} • ${horaInicio} h` : "Sin elegir"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-space-md rounded-xl flex flex-col gap-space-2xs">
                <div className="flex justify-between items-baseline">
                  <span className="font-headline-sm text-headline-sm text-on-surface font-bold">Total a Pagar</span>
                  <span className="font-headline-md text-headline-md text-primary font-bold">
                    {servicio ? `${Math.round(servicio.precio)}€` : "-"}
                  </span>
                </div>
              </div>
              <button
                className="w-full py-space-md px-space-md rounded-lg bg-primary hover:bg-primary-fixed-dim text-on-primary font-headline-sm text-[17px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-space-xs shadow-[0_0_24px_rgba(229,193,88,0.3)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                disabled={!listoParaConfirmar || confirmando}
                onClick={confirmarReserva}
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                <span>{confirmando ? "Reservando…" : "Confirmar Reserva"}</span>
              </button>
              <div className="flex items-center gap-space-xs text-on-surface-variant px-space-xs">
                <span className="material-symbols-outlined text-secondary text-[18px]">verified_user</span>
                <span className="font-body-sm text-[13px] text-outline">Tu cita queda pendiente de confirmación del salón</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
