import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import type { CanjeVistaPrevia } from "../lib/types";

// Destino del QR del cliente. Lo abre el admin o un barbero al escanear con
// la camara del celular: muestra de quien es el codigo y pide confirmar.
export default function Canjear() {
  const [params] = useSearchParams();
  const codigo = params.get("c") ?? "";
  const [estado, setEstado] = useState<"pendiente" | "canjeando" | "canjeado">("pendiente");
  const [errorCanje, setErrorCanje] = useState<string | null>(null);

  const { data, error, isPending } = useQuery({
    queryKey: ["canje", codigo],
    queryFn: () => api.get<CanjeVistaPrevia>(`/canje?codigo=${encodeURIComponent(codigo)}`),
    enabled: codigo !== "" && estado === "pendiente",
  });

  async function confirmar() {
    setEstado("canjeando");
    setErrorCanje(null);
    try {
      await api.post("/canje", { codigo });
      setEstado("canjeado");
    } catch (err) {
      setErrorCanje(err instanceof ApiError ? err.message : "No se pudo canjear el código.");
      setEstado("pendiente");
    }
  }

  const invalido = !codigo ? "Este enlace no contiene ningún código." : error instanceof ApiError ? error.message : error ? "No se pudo validar el código." : null;
  const nombreCliente = data?.cliente ? `${data.cliente.nombre} ${data.cliente.apellido ?? ""}`.trim() : "Cliente";

  return (
    <main className="w-full pt-20 bg-background min-h-screen flex items-center justify-center px-margin-mobile">
      <div className="w-full max-w-md bg-surface-container-low p-space-xl rounded-xl shadow-lg my-space-3xl flex flex-col items-center text-center gap-space-md">
        {estado === "canjeado" ? (
          <>
            <Icono nombre="check_circle" clase="bg-primary text-on-primary" />
            <h1 className="font-headline-md text-headline-md text-on-surface font-bold">¡Corte canjeado!</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              El corte de cortesía de <strong className="text-primary">{nombreCliente}</strong> quedó registrado. Su tarjeta vuelve a empezar y este QR ya no sirve.
            </p>
          </>
        ) : codigo && isPending ? (
          <span className="material-symbols-outlined text-primary text-[40px] animate-spin">progress_activity</span>
        ) : invalido ? (
          <>
            <Icono nombre="block" clase="bg-error-container/30 text-error" />
            <h1 className="font-headline-md text-headline-md text-on-surface font-bold">Código no válido</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">{invalido}</p>
            <p className="font-body-sm text-body-sm text-outline">No apliques el corte gratis con este código.</p>
          </>
        ) : (
          data && (
            <>
              <Icono nombre="redeem" clase="bg-primary text-on-primary" />
              <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-bold">Corte de cortesía válido</span>
              <h1 className="font-headline-md text-headline-md text-on-surface font-bold">{nombreCliente}</h1>
              {data.cliente?.email && <p className="font-body-sm text-body-sm text-on-surface-variant -mt-space-sm">{data.cliente.email}</p>}
              <p className="font-body-md text-body-md text-on-surface-variant">
                Tiene <strong className="text-primary">{data.sellos} de {data.sellos_meta}</strong> sellos. Confirma solo cuando vayas a aplicar el corte gratis.
              </p>
              {errorCanje && (
                <div className="w-full p-space-sm rounded-lg bg-error-container/20 border border-error/40 text-error font-body-sm text-body-sm">
                  {errorCanje}
                </div>
              )}
              <button
                className="w-full py-space-sm rounded-lg bg-primary text-on-primary font-headline-sm text-[15px] font-bold uppercase tracking-wider hover:bg-primary-fixed-dim transition-colors disabled:opacity-50"
                disabled={estado === "canjeando"}
                onClick={confirmar}
                type="button"
              >
                {estado === "canjeando" ? "Canjeando…" : "Confirmar Canje"}
              </button>
            </>
          )
        )}
        <Link className="font-label-sm text-label-sm uppercase tracking-wider text-outline hover:text-primary" to="/">
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}

function Icono({ nombre, clase }: { nombre: string; clase: string }) {
  return (
    <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg ${clase}`}>
      <span className="material-symbols-outlined text-[36px]">{nombre}</span>
    </div>
  );
}
