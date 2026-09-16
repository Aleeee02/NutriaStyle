import { useQuery } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { api } from "../lib/api";
import type { FidelizacionData } from "../lib/types";

export default function Fidelizacion() {
  const { user } = useAuth();
  const [modalAbierto, setModalAbierto] = useState(false);
  const { data } = useQuery({
    queryKey: ["fidelizacion", "me"],
    queryFn: () => api.get<FidelizacionData>("/fidelizacion/me"),
    // Con el QR en pantalla se consulta seguido: en cuanto el barbero lo
    // canjea, el codigo deja de existir y el modal pasa a "canjeado".
    refetchInterval: modalAbierto ? 4000 : false,
  });

  const codigo = data?.codigo_canje ?? null;
  const urlCanje = codigo ? `${window.location.origin}/canjear?c=${encodeURIComponent(codigo)}` : null;

  // Detecta el paso "tenia codigo" -> "ya no" con el modal abierto.
  const codigoMostrado = useRef<string | null>(null);
  const [canjeado, setCanjeado] = useState(false);
  useEffect(() => {
    if (!modalAbierto) return;
    if (codigo) codigoMostrado.current = codigo;
    else if (codigoMostrado.current) setCanjeado(true);
  }, [codigo, modalAbierto]);

  function cerrarModal() {
    setModalAbierto(false);
    setCanjeado(false);
    codigoMostrado.current = null;
  }

  const sellosMeta = data?.sellos_meta ?? 4;
  const sellosActuales = data?.tarjeta?.sellos ?? 0;
  const desbloqueado = sellosActuales >= sellosMeta && codigo !== null;
  const porcentaje = Math.min(100, Math.floor((sellosActuales / sellosMeta) * 100));
  const displayName = user?.display_name ?? user?.email ?? "";

  return (
    <main className="w-full pt-20 bg-background min-h-screen">
      <div className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop py-space-xl flex flex-col gap-space-2xl">
        {/* Bienvenida */}
        <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-lg bg-surface-container-low p-space-lg md:p-space-xl rounded-xl shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center gap-space-md">
            <div className="relative w-20 h-20 rounded-xl overflow-hidden shadow-md shrink-0 bg-surface-container-high flex items-center justify-center">
              <span className="font-headline-lg text-headline-lg text-primary font-bold uppercase">{displayName[0]}</span>
            </div>
            <div className="flex flex-col gap-space-2xs">
              <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary bg-surface-container-highest px-space-xs py-0.5 rounded w-fit">
                Socio Nutria Style
              </span>
              <h1 className="font-headline-md text-headline-md text-on-surface font-bold">
                Bienvenido de vuelta, <span className="text-primary">{displayName}</span>
              </h1>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Tu santuario capilar activo. Nivel actual de lealtad:{" "}
                <span className="text-secondary font-medium uppercase">{data?.tarjeta?.nivel ?? "básico"}</span>.
              </p>
            </div>
          </div>
        </section>

        {/* Tarjeta de sellos */}
        <section className="relative rounded-xl p-space-lg md:p-space-2xl bg-surface-container-lowest shadow-2xl overflow-hidden">
          <div className="relative z-10 flex flex-col gap-space-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
              <div className="flex flex-col gap-space-2xs">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-primary text-[24px]">workspace_premium</span>
                  <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-semibold">
                    Cartilla Exclusiva de Sellos Nutria Style
                  </span>
                </div>
                <h2 className="font-headline-lg text-headline-lg text-primary leading-tight">
                  {sellosMeta} Cortes y el Siguiente es de Cortesía
                </h2>
              </div>
              {desbloqueado && (
                <div className="shrink-0 flex items-center gap-space-sm bg-secondary-container px-space-md py-space-sm rounded-xl shadow-md">
                  <span className="material-symbols-outlined text-primary text-[28px]">redeem</span>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary font-bold">¡Recompensa Desbloqueada!</span>
                    <span className="font-headline-sm text-headline-sm text-on-secondary-container leading-none font-bold">Corte de Cortesía Listo</span>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-space-md">
              {Array.from({ length: sellosMeta }, (_, i) => i + 1).map((i) => {
                const conseguido = sellosActuales >= i;
                return (
                  <div
                    key={i}
                    className={`relative flex flex-col justify-between p-space-md rounded-xl min-h-[160px] ${
                      conseguido ? "bg-surface-container-high shadow-lg" : "bg-surface-container shadow-md opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-label-sm text-label-sm uppercase tracking-widest ${conseguido ? "text-primary font-bold" : "text-secondary"}`}>
                        Sello {String(i).padStart(2, "0")}
                      </span>
                      {conseguido && <span className="material-symbols-outlined text-[16px] text-primary">verified</span>}
                    </div>
                    <div className="my-space-sm flex flex-col items-center justify-center">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-inner ${conseguido ? "bg-primary/20 text-primary" : "bg-surface-container-lowest text-outline"}`}>
                        <span className="material-symbols-outlined text-[32px]">content_cut</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div
                className={`relative flex flex-col justify-between p-space-md rounded-xl min-h-[160px] ${
                  desbloqueado ? "bg-gradient-to-b from-primary to-secondary text-on-primary shadow-[0_0_30px_rgba(229,193,88,0.4)]" : "bg-surface-container opacity-60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-label-sm text-label-sm uppercase tracking-widest font-bold ${desbloqueado ? "text-on-primary" : "text-secondary"}`}>Premio</span>
                  {desbloqueado && <span className="material-symbols-outlined text-on-primary text-[20px] animate-bounce">stars</span>}
                </div>
                <div className="my-space-sm flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-surface-container-lowest flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[36px]">loyalty</span>
                  </div>
                </div>
                <div className="flex flex-col text-center">
                  <span className={`font-headline-sm text-[15px] font-bold uppercase leading-tight ${desbloqueado ? "text-on-primary" : "text-outline"}`}>Corte Gratis</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-lg pt-space-md bg-surface-container-low p-space-md rounded-xl">
              <div className="flex-1 flex flex-col gap-space-2xs">
                <div className="flex justify-between items-center">
                  <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface font-semibold">Progreso de Fidelidad</span>
                  <span className="font-headline-sm text-headline-sm text-primary font-bold">
                    {sellosActuales} / {sellosMeta} Asistencias ({porcentaje}%)
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-surface-container-highest overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-secondary via-primary to-primary-fixed rounded-full transition-all duration-700" style={{ width: `${porcentaje}%` }} />
                </div>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  {desbloqueado ? "Has completado el ciclo. Tu próximo servicio corre por cuenta de la casa." : `Te faltan ${sellosMeta - sellosActuales} sello(s) para tu corte de cortesía.`}
                </span>
              </div>
              <button
                className="shrink-0 px-space-xl py-space-sm rounded-lg bg-primary text-on-primary font-headline-sm text-[16px] font-bold uppercase tracking-wider hover:bg-primary-fixed-dim transition-all shadow-[0_0_20px_rgba(229,193,88,0.35)] flex items-center justify-center gap-space-xs disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                disabled={!desbloqueado}
                onClick={() => setModalAbierto(true)}
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">qr_code_2</span>
                {desbloqueado ? "Mostrar QR de Canje" : "Canjear Corte de Cortesía"}
              </button>
            </div>
          </div>
        </section>

        {/* Proxima cita y beneficios */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg items-start">
          <div className="flex flex-col gap-space-sm bg-surface-container-low p-space-lg rounded-xl shadow-lg">
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-semibold">Cita en Agenda</span>
            {data?.proxima_cita ? (
              <div className="flex items-start gap-space-md">
                <div className="w-14 h-14 rounded-lg bg-surface-container-highest flex flex-col items-center justify-center shrink-0">
                  <span className="font-label-sm text-[10px] uppercase text-secondary font-bold">
                    {data.proxima_cita.fecha.slice(5, 7)}/{data.proxima_cita.fecha.slice(8, 10)}
                  </span>
                  <span className="font-headline-sm text-headline-sm text-primary font-bold">{data.proxima_cita.hora_inicio.slice(0, 5)}</span>
                </div>
                <div className="flex flex-col">
                  <h4 className="font-headline-sm text-headline-sm text-on-surface">{data.proxima_cita.servicios?.nombre ?? "Servicio"}</h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {data.proxima_cita.fecha} · {data.proxima_cita.hora_inicio.slice(0, 5)}h
                    {data.proxima_cita.empleados && (
                      <>
                        {" "}con <strong className="text-secondary font-medium">{data.proxima_cita.empleados.nombre} {data.proxima_cita.empleados.apellido || ""}</strong>
                      </>
                    )}
                  </p>
                  <span className="font-label-sm text-[11px] uppercase tracking-wider text-primary mt-1">{data.proxima_cita.estado}</span>
                </div>
              </div>
            ) : (
              <>
                <p className="font-body-sm text-body-sm text-on-surface-variant">No tienes citas próximas agendadas.</p>
                <Link className="self-start px-space-md py-space-xs rounded-lg bg-primary text-on-primary font-label-md text-label-md uppercase tracking-wider hover:bg-primary-fixed-dim transition-colors" to="/reservas">
                  Reservar Cita
                </Link>
              </>
            )}
          </div>
          <div className="flex flex-col gap-space-md bg-surface-container-low p-space-lg rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-sm text-[18px] text-primary font-semibold">Beneficios Exclusivos del Club</h3>
              <span className="material-symbols-outlined text-secondary text-[20px]">military_tech</span>
            </div>
            <ul className="flex flex-col gap-space-sm text-body-sm text-on-surface-variant">
              <li className="flex items-start gap-space-xs">
                <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">local_bar</span>
                <span><strong className="text-on-surface font-medium">Barra de Cortesía:</strong> Degustación gratuita de whisky escocés de malta o café arábica de origen en cada visita.</span>
              </li>
              <li className="flex items-start gap-space-xs">
                <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">shopping_bag</span>
                <span><strong className="text-on-surface font-medium">Botica Nutria Style:</strong> 15% de descuento permanente en ceras, elixires botánicos y lociones post-afeitado.</span>
              </li>
              <li className="flex items-start gap-space-xs">
                <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">event_available</span>
                <span><strong className="text-on-surface font-medium">Acceso VIP Fin de Semana:</strong> Prioridad absoluta y bloqueo de franjas reservadas los viernes y sábados.</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Historial */}
        <section className="flex flex-col gap-space-md bg-surface-container-low p-space-lg md:p-space-xl rounded-xl shadow-lg">
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Historial de Reservas</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Tus últimas citas agendadas en Nutria Style.</p>
          </div>
          {!data?.historial || data.historial.length === 0 ? (
            <p className="font-body-md text-body-md text-on-surface-variant">Aún no tienes reservas registradas.</p>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container font-label-sm text-label-sm text-secondary uppercase tracking-widest">
                    <th className="py-space-sm px-space-md rounded-l-lg">Fecha</th>
                    <th className="py-space-sm px-space-md">Servicio</th>
                    <th className="py-space-sm px-space-md">Maestro Barbero</th>
                    <th className="py-space-sm px-space-md rounded-r-lg">Estado</th>
                  </tr>
                </thead>
                <tbody className="font-body-sm text-body-sm">
                  {data.historial.map((r) => (
                    <tr key={r.id} className="hover:bg-surface-container/50 transition-colors">
                      <td className="py-space-md px-space-md font-headline-sm text-[15px] text-on-surface">
                        {r.fecha} · {r.hora_inicio.slice(0, 5)}
                      </td>
                      <td className="py-space-md px-space-md text-on-surface font-medium">{r.servicios?.nombre ?? "-"}</td>
                      <td className="py-space-md px-space-md text-on-surface-variant">
                        {r.empleados ? `${r.empleados.nombre} ${r.empleados.apellido || ""}` : "-"}
                      </td>
                      <td className="py-space-md px-space-md">
                        <span className="inline-flex items-center gap-1 font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant bg-surface-container-highest px-2 py-0.5 rounded">
                          {r.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-space-md">
          <div className="relative w-full max-w-lg bg-surface-container-lowest p-space-xl rounded-xl shadow-2xl flex flex-col gap-space-lg">
            <button
              aria-label="Cerrar"
              className="absolute top-4 right-4 text-outline hover:text-on-surface transition-colors"
              onClick={cerrarModal}
              type="button"
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
            {canjeado ? (
              <div className="flex flex-col items-center text-center gap-space-xs">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-lg mb-space-2xs">
                  <span className="material-symbols-outlined text-[36px]">check_circle</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-primary font-bold">¡Corte Canjeado!</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Disfruta tu corte de cortesía. Tu tarjeta vuelve a empezar desde cero.
                </p>
              </div>
            ) : urlCanje ? (
              <div className="flex flex-col items-center text-center gap-space-sm">
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-bold">Bono Oficial de Fidelidad</span>
                <h3 className="font-headline-md text-headline-md text-primary font-bold">Tu Corte de Cortesía</h3>
                <div className="bg-white p-space-md rounded-xl shadow-lg">
                  <QRCodeSVG value={urlCanje} size={220} level="M" marginSize={0} />
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Muestra este código a tu barbero para que lo escanee. Es de un solo uso: al canjearlo, desaparece.
                </p>
              </div>
            ) : (
              <p className="font-body-md text-body-md text-on-surface-variant text-center py-space-lg">
                Aún no tienes un corte de cortesía disponible.
              </p>
            )}
            <button
              className="w-full py-space-sm rounded-lg bg-primary text-on-primary font-headline-sm text-[15px] font-bold uppercase tracking-wider hover:bg-primary-fixed-dim transition-colors"
              onClick={cerrarModal}
              type="button"
            >
              {canjeado ? "¡Genial!" : "Cerrar"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
