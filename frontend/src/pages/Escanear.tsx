import jsQR from "jsqr";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { rutaDelQr } from "../lib/escaneo";

// Escaner de QR dentro de la web, para barberos y admin. Lee los dos QR que
// muestra el cliente (el de su cita y el de su corte gratis) y abre la
// pantalla que corresponde, sin depender de la app de camara del celular.

// Dominios propios: el QR guarda la direccion desde la que el cliente lo abrio.
const DOMINIOS_PROPIOS = [window.location.hostname, "nutria-style.vercel.app"];

type Estado = "iniciando" | "escaneando" | "sin-permiso" | "sin-camara" | "error";

export default function Escanear() {
  const navigate = useNavigate();
  const video = useRef<HTMLVideoElement>(null);
  const lienzo = useRef<HTMLCanvasElement | null>(null);
  const flujo = useRef<MediaStream | null>(null);
  const [estado, setEstado] = useState<Estado>("iniciando");
  const [aviso, setAviso] = useState<string | null>(null);

  const detener = useCallback(() => {
    flujo.current?.getTracks().forEach((t) => t.stop());
    flujo.current = null;
  }, []);

  useEffect(() => {
    let cancelado = false;
    let temporizador: number | undefined;
    let ultimoAviso = 0;

    async function iniciar() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setEstado("sin-camara");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelado) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        flujo.current = stream;
        if (video.current) {
          video.current.srcObject = stream;
          await video.current.play();
        }
        setEstado("escaneando");
        leer();
      } catch (err) {
        const nombre = (err as DOMException)?.name;
        setEstado(nombre === "NotAllowedError" ? "sin-permiso" : nombre === "NotFoundError" ? "sin-camara" : "error");
      }
    }

    // Se analiza un cuadro reducido varias veces por segundo: suficiente para
    // leer al instante sin gastar bateria del celular.
    function leer() {
      if (cancelado) return;
      const v = video.current;
      if (v && v.readyState >= 2 && v.videoWidth) {
        const escala = Math.min(1, 640 / Math.max(v.videoWidth, v.videoHeight));
        const ancho = Math.round(v.videoWidth * escala);
        const alto = Math.round(v.videoHeight * escala);
        const c = (lienzo.current ??= document.createElement("canvas"));
        c.width = ancho;
        c.height = alto;
        const ctx = c.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(v, 0, 0, ancho, alto);
          const resultado = jsQR(ctx.getImageData(0, 0, ancho, alto).data, ancho, alto, { inversionAttempts: "dontInvert" });
          if (resultado?.data) {
            const ruta = rutaDelQr(resultado.data, DOMINIOS_PROPIOS);
            if (ruta) {
              navigator.vibrate?.(80);
              detener();
              navigate(ruta);
              return;
            }
            if (Date.now() - ultimoAviso > 2500) {
              ultimoAviso = Date.now();
              setAviso("Ese QR no es de una cita ni de un corte gratis de Nutria Style.");
            }
          }
        }
      }
      temporizador = window.setTimeout(leer, 180);
    }

    iniciar();
    return () => {
      cancelado = true;
      window.clearTimeout(temporizador);
      detener();
    };
  }, [detener, navigate]);

  return (
    <main className="w-full pt-20 bg-background min-h-screen flex items-start justify-center px-margin-mobile">
      <div className="w-full max-w-md flex flex-col gap-space-md my-space-xl">
        <div className="flex flex-col gap-space-2xs text-center">
          <h1 className="font-headline-md text-headline-md text-on-surface font-bold">Escanear QR</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Apunta al QR del cliente: el de su cita o el de su corte gratis.
          </p>
        </div>

        <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-surface-container-lowest shadow-xl">
          <video ref={video} className="absolute inset-0 w-full h-full object-cover" muted playsInline />
          {estado === "escaneando" && (
            <div className="absolute inset-[15%] border-4 border-primary/80 rounded-xl pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
          )}
          {estado === "iniciando" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-space-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-primary text-[40px] animate-spin">progress_activity</span>
              <span className="font-body-sm text-body-sm">Abriendo la cámara…</span>
            </div>
          )}
          {(estado === "sin-permiso" || estado === "sin-camara" || estado === "error") && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-space-sm p-space-lg text-center">
              <span className="material-symbols-outlined text-error text-[40px]">no_photography</span>
              <p className="font-body-md text-body-md text-on-surface">
                {estado === "sin-permiso"
                  ? "No diste permiso para usar la cámara."
                  : estado === "sin-camara"
                    ? "Este dispositivo no tiene una cámara disponible."
                    : "No se pudo abrir la cámara."}
              </p>
              {estado === "sin-permiso" && (
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Toca el candado junto a la dirección de la página, permite la cámara y recarga.
                </p>
              )}
            </div>
          )}
        </div>

        {aviso && (
          <p className="font-body-sm text-body-sm text-error text-center" role="status">
            {aviso}
          </p>
        )}

        <p className="font-body-sm text-body-sm text-outline text-center">
          También puedes leerlo con la cámara normal del celular: abre la misma pantalla.
        </p>
      </div>
    </main>
  );
}
