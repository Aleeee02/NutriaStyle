import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import { soles } from "../lib/moneda";
import type { AsistenciaVistaPrevia } from "../lib/types";

// Destino del QR de la cita. Lo abre el admin o un barbero al escanearlo con
// la camara: muestra de quien es la cita y registra si llego o no.
export default function Asistencia() {
  const [params] = useSearchParams();
  const codigo = params.get("c") ?? "";
  const [registrado, setRegistrado] = useState<"completada" | "no_asistio" | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

  const { data, error, isPending } = useQuery({
    queryKey: ["asistencia", codigo],
    queryFn: () => api.get<AsistenciaVistaPrevia>(`/asistencia?codigo=${encodeURIComponent(codigo)}`),
    enabled: codigo !== "" && registrado === null,
  });

  async function registrar(asistio: boolean) {
    setEnviando(true);
    setErrorEnvio(null);
    try {
      const r = await api.post<AsistenciaVistaPrevia>("/asistencia", { codigo, asistio });
      setRegistrado(r.estado === "completada" ? "completada" : "no_asistio");
    } catch (err) {
      setErrorEnvio(err instanceof ApiError ? err.message : "No se pudo registrar la asistencia.");
    } finally {
      setEnviando(false);
    }
  }

  const invalido = !codigo
    ? "Este enlace no contiene ningún código."
    : error instanceof ApiError
      ? error.message
      : error
        ? "No se pudo validar el código."
        : null;

  return (
    <main className="w-full pt-20 bg-background min-h-screen flex items-center justify-center px-margin-mobile">
      <div className="w-full max-w-md bg-surface-container-low p-space-xl rounded-xl shadow-lg my-space-3xl flex flex-col items-center text-center gap-space-md">
        {registrado ? (
          <>
            <Icono
              nombre={registrado === "completada" ? "check_circle" : "event_busy"}
              clase={registrado === "completada" ? "bg-primary text-on-primary" : "bg-surface-container-highest text-on-surface-variant"}
            />
            <h1 className="font-headline-md text-headline-md text-on-surface font-bold">
              {registrado === "completada" ? "¡Asistencia registrada!" : "Marcada como no asistió"}
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              La cita de <strong className="text-primary">{data?.cliente}</strong> quedó como{" "}
              <strong>{registrado === "completada" ? "completada" : "no asistió"}</strong> en la agenda. Este QR ya no sirve.
            </p>
            {registrado === "completada" && (
              <p className="font-body-sm text-body-sm text-outline">
                Recuerda marcar su sello de fidelización en Usuarios si le corresponde.
              </p>
            )}
          </>
        ) : codigo && isPending ? (
          <span className="material-symbols-outlined text-primary text-[40px] animate-spin">progress_activity</span>
        ) : invalido ? (
          <>
            <Icono nombre="block" clase="bg-error-container/30 text-error" />
            <h1 className="font-headline-md text-headline-md text-on-surface font-bold">Código no válido</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">{invalido}</p>
            <p className="font-body-sm text-body-sm text-outline">Puedes cambiar el estado a mano desde Reservas.</p>
          </>
        ) : (
          data && (
            <>
              <Icono nombre="event_available" clase="bg-primary text-on-primary" />
              <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-bold">Cita de hoy</span>
              <h1 className="font-headline-md text-headline-md text-on-surface font-bold">{data.cliente}</h1>
              <div className="w-full flex flex-col gap-space-2xs text-left bg-surface-container rounded-xl p-space-md font-body-sm text-body-sm text-on-surface-variant">
                <Dato icono="content_cut" texto={`${data.servicio ?? "Servicio"}${data.precio != null ? ` · ${soles(data.precio)}` : ""}`} />
                <Dato icono="schedule" texto={`${data.fecha} · ${data.hora_inicio} h`} />
                {data.barbero && <Dato icono="person" texto={data.barbero} />}
                <Dato icono="workspace_premium" texto={`${data.sellos} sellos en su tarjeta`} />
              </div>
              {errorEnvio && (
                <div className="w-full p-space-sm rounded-lg bg-error-container/20 border border-error/40 text-error font-body-sm text-body-sm">
                  {errorEnvio}
                </div>
              )}
              <div className="w-full flex flex-col gap-space-xs">
                <button
                  className="w-full py-space-sm rounded-lg bg-primary text-on-primary font-headline-sm text-[15px] font-bold uppercase tracking-wider hover:bg-primary-fixed-dim transition-colors disabled:opacity-50"
                  disabled={enviando}
                  onClick={() => registrar(true)}
                  type="button"
                >
                  {enviando ? "Registrando…" : "Asistió"}
                </button>
                <button
                  className="w-full py-space-sm rounded-lg border border-outline-variant text-on-surface-variant font-label-md text-label-md uppercase tracking-wider hover:text-error hover:border-error transition-colors disabled:opacity-50"
                  disabled={enviando}
                  onClick={() => registrar(false)}
                  type="button"
                >
                  No asistió
                </button>
              </div>
            </>
          )
        )}
        <Link className="font-label-sm text-label-sm uppercase tracking-wider text-outline hover:text-primary" to="/admin/reservas">
          Ver agenda
        </Link>
      </div>
    </main>
  );
}

function Dato({ icono, texto }: { icono: string; texto: string }) {
  return (
    <span className="flex items-center gap-space-xs">
      <span className="material-symbols-outlined text-primary text-[18px]">{icono}</span>
      {texto}
    </span>
  );
}

function Icono({ nombre, clase }: { nombre: string; clase: string }) {
  return (
    <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg ${clase}`}>
      <span className="material-symbols-outlined text-[36px]">{nombre}</span>
    </div>
  );
}
