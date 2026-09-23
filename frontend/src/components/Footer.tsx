import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { urlComoLlegar } from "../lib/mapa";
import type { Configuracion } from "../lib/types";

export function Footer() {
  const { data: config } = useQuery({
    queryKey: ["config"],
    queryFn: () => api.get<Configuracion>("/config"),
  });

  const nombre = config?.nombre_barberia ?? "Nutria Style";
  const comoLlegar = urlComoLlegar();

  return (
    <footer className="w-full bg-surface-container-lowest border-t border-outline-variant/30">
      <div className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop py-space-3xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-xl">
          <div className="flex flex-col gap-space-sm">
            <div className="flex items-center gap-space-xs">
              <img alt="Nutria Style Logo" className="h-9 w-9 rounded-full object-cover" src="/img/logo.jpeg" />
              <span className="font-headline-sm text-headline-sm text-primary">{nombre}</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              En el corazón de Iquitos, una barbería donde cada corte se trabaja sin apuro: tijera, navaja y el
              pulso de quien conoce su oficio. Entras con una idea y sales con un estilo que te representa.
            </p>
            <div className="flex items-center gap-space-xs text-primary">
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">
                Garantía de Servicio Artesanal
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-space-xs">
            <span className="font-headline-sm text-headline-sm text-primary">Horarios de Atención</span>
            <div className="flex flex-col gap-space-2xs text-on-surface-variant font-body-sm text-body-sm">
              {config?.horario ? (
                <span>{config.horario}</span>
              ) : (
                <span className="text-outline">Horario por confirmar</span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-space-xs">
            <span className="font-headline-sm text-headline-sm text-primary">Ubicación & Contacto</span>
            <div className="flex flex-col gap-space-xs text-on-surface-variant font-body-sm text-body-sm">
              <div className="flex items-start gap-space-xs">
                <span className="material-symbols-outlined text-secondary text-[20px] shrink-0">pin_drop</span>
                {config?.direccion ? (
                  <a className="hover:text-primary transition-colors underline-offset-2 hover:underline" href={comoLlegar} target="_blank" rel="noreferrer">
                    {config?.direccion}
                  </a>
                ) : (
                  <span>Dirección por confirmar</span>
                )}
              </div>
              {config?.telefono_whatsapp && (
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-secondary text-[20px] shrink-0">call</span>
                  <a
                    className="hover:text-primary transition-colors"
                    href={`https://wa.me/${config.telefono_whatsapp}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {config.telefono_whatsapp}
                  </a>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-space-xs">
            <span className="font-headline-sm text-headline-sm text-primary">Mundo {nombre}</span>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Mira los cortes del día, novedades y promociones en nuestras redes.
            </p>
            <div className="flex items-center gap-space-xs">
              {config?.tiktok_url && (
                <a
                  aria-label="TikTok"
                  className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-secondary border border-outline-variant/30 hover:border-primary hover:text-primary transition-colors"
                  href={config.tiktok_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 1 1-1.86-2.48V9.77a5.72 5.72 0 1 0 4.95 5.66V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.29 4.29 0 0 1-3.24-1.48z" />
                  </svg>
                </a>
              )}
              {config?.instagram_url && (
                <a
                  className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-secondary border border-outline-variant/30 hover:border-primary hover:text-primary transition-colors"
                  href={config.instagram_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                </a>
              )}
              {config?.facebook_url && (
                <a
                  className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-secondary border border-outline-variant/30 hover:border-primary hover:text-primary transition-colors"
                  href={config.facebook_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="material-symbols-outlined text-[20px]">thumb_up</span>
                </a>
              )}
              {config?.telefono_whatsapp && (
                <a
                  className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-secondary border border-outline-variant/30 hover:border-primary hover:text-primary transition-colors"
                  href={`https://wa.me/${config.telefono_whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="material-symbols-outlined text-[20px]">chat</span>
                </a>
              )}
              {!config?.tiktok_url && !config?.instagram_url && !config?.facebook_url && !config?.telefono_whatsapp && (
                <span className="font-body-sm text-body-sm text-outline">Próximamente</span>
              )}
            </div>
          </div>
        </div>
        <div className="mt-space-2xl pt-space-lg border-t border-outline-variant/20 flex flex-col md:flex-row items-center justify-between gap-space-md">
          <span className="font-body-sm text-body-sm text-outline">
            © {new Date().getFullYear()} {nombre}. Tradición secular, precisión vanguardista.
          </span>
          <div className="flex items-center gap-space-md">
            <Link className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant hover:text-primary transition-colors" to="/privacidad">
              Privacidad
            </Link>
            <Link className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant hover:text-primary transition-colors" to="/terminos">
              Términos y Condiciones
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
