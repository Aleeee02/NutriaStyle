import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { urlComoLlegar } from "../lib/mapa";
import { soles } from "../lib/moneda";
import { COMBOS, DESCUENTO_FFAA_PNP, NOTA_NO_ACUMULABLE } from "../lib/promociones";
import type { Configuracion } from "../lib/types";

const FILL = { fontVariationSettings: "'FILL' 1" };

export default function Promociones() {
  const { data: config } = useQuery({ queryKey: ["config"], queryFn: () => api.get<Configuracion>("/config") });
  const comoLlegar = urlComoLlegar(config);

  return (
    <main className="w-full pt-20 bg-background min-h-screen">
      {/* Encabezado */}
      <section className="relative w-full overflow-hidden bg-surface-container-lowest px-margin-mobile md:px-margin-desktop py-space-3xl">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative max-w-[1280px] mx-auto">
          <div className="flex flex-col gap-space-sm max-w-2xl">
          <div className="flex items-center gap-space-xs text-secondary">
            <span className="material-symbols-outlined text-[18px]" style={FILL}>local_offer</span>
            <span className="font-label-sm text-label-sm uppercase tracking-widest">Promociones Vigentes</span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">
            Tu estilo <span className="text-primary">comienza aquí</span>
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Elige tu estilo, elige Nutria Style. Estilo que impacta, precio que sorprende y calidad que se nota.
          </p>
          </div>
        </div>
      </section>

      <div className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop py-space-2xl flex flex-col gap-space-2xl">
        {/* Combos */}
        <section className="flex flex-col gap-space-lg" aria-labelledby="titulo-combos">
          <div className="flex flex-col gap-space-2xs">
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">Para todos</span>
            <h2 id="titulo-combos" className="font-headline-lg text-headline-lg text-on-surface">Combos</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg">
            {COMBOS.map((combo) => (
              <article
                key={combo.id}
                className="relative flex flex-col gap-space-md p-space-lg md:p-space-xl rounded-xl bg-surface-container-low border border-primary/30 shadow-xl overflow-hidden"
              >
                <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
                <div className="relative flex items-start justify-between gap-space-md">
                  <div className="flex flex-col gap-space-2xs">
                    <span className="self-start font-label-sm text-label-sm uppercase tracking-widest bg-primary text-on-primary px-space-xs py-0.5 rounded">
                      {combo.nombre}
                    </span>
                    <h3 className="font-headline-md text-headline-md text-on-surface">{combo.titulo}</h3>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">A solo</span>
                    <span className="font-headline-xl text-headline-xl text-primary leading-none">{soles(combo.precio)}</span>
                  </div>
                </div>
                <ul className="relative flex flex-col gap-space-xs">
                  {combo.incluye.map((item) => (
                    <li key={item} className="flex items-center gap-space-xs font-body-md text-body-md text-on-surface">
                      <span className="material-symbols-outlined text-primary text-[20px]" style={FILL}>add_circle</span>
                      {item}
                    </li>
                  ))}
                  <li className="flex items-center gap-space-xs font-body-md text-body-md text-secondary">
                    <span className="material-symbols-outlined text-primary text-[20px]">local_bar</span>
                    {combo.cortesia}
                  </li>
                </ul>
                <p className="relative font-body-sm text-body-sm text-outline">Mismo precio para todos. No se aplican descuentos sobre el combo.</p>
                <Link
                  className="relative mt-auto inline-flex items-center justify-center gap-space-xs py-space-sm rounded-lg bg-primary text-on-primary font-label-md text-label-md uppercase tracking-wider hover:bg-primary-fixed-dim transition-colors"
                  to={`/reservas?servicio=${encodeURIComponent(combo.nombre)}`}
                >
                  <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                  Reservar {combo.nombre}
                </Link>
              </article>
            ))}
          </div>
        </section>

        {/* FF.AA. y PNP */}
        <section
          className="relative grid grid-cols-1 lg:grid-cols-12 gap-space-lg p-space-lg md:p-space-2xl rounded-2xl bg-gradient-to-br from-surface-container-lowest via-surface-container-low to-surface-container shadow-2xl overflow-hidden"
          aria-labelledby="titulo-ffaa"
        >
          <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-primary/10 blur-[90px] pointer-events-none" />
          <div className="relative lg:col-span-5 flex flex-col justify-center gap-space-sm">
            <div className="flex items-center gap-space-xs text-secondary">
              <span className="material-symbols-outlined text-[20px]" style={FILL}>military_tech</span>
              <span className="font-label-sm text-label-sm uppercase tracking-widest">FF.AA. y PNP</span>
            </div>
            <p className="font-headline-xl text-[4.5rem] md:text-[6rem] leading-none text-primary font-bold">
              {DESCUENTO_FFAA_PNP.porcentaje}%
            </p>
            <h2 id="titulo-ffaa" className="font-headline-lg text-headline-lg text-on-surface">{DESCUENTO_FFAA_PNP.titulo}</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant">{DESCUENTO_FFAA_PNP.mensaje}</p>
          </div>
          <div className="relative lg:col-span-7 flex flex-col gap-space-md">
            <div className="flex flex-wrap gap-space-xs">
              {DESCUENTO_FFAA_PNP.instituciones.map((inst) => (
                <span
                  key={inst}
                  className="font-label-sm text-label-sm uppercase tracking-wider bg-surface-container-highest text-on-surface px-space-sm py-space-2xs rounded-full"
                >
                  {inst}
                </span>
              ))}
            </div>
            <ul className="flex flex-col gap-space-sm">
              {DESCUENTO_FFAA_PNP.condiciones.map((c) => (
                <li key={c} className="flex items-start gap-space-xs font-body-md text-body-md text-on-surface-variant">
                  <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">check_circle</span>
                  {c}
                </li>
              ))}
            </ul>
            <div className="flex items-start gap-space-xs p-space-md rounded-lg bg-surface-container-highest/60 border border-outline-variant/30">
              <span className="material-symbols-outlined text-secondary text-[20px] shrink-0">info</span>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                El personal civil paga el precio normal. {NOTA_NO_ACUMULABLE}
              </p>
            </div>
          </div>
        </section>

        {/* Donde */}
        {config?.direccion && (
          <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md p-space-lg rounded-xl bg-surface-container-low">
            <div className="flex items-start gap-space-xs">
              <span className="material-symbols-outlined text-primary text-[24px] shrink-0">pin_drop</span>
              <div>
                <p className="font-headline-sm text-headline-sm text-on-surface">{config.direccion}</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Frente a la Corte Superior</p>
              </div>
            </div>
            {comoLlegar && (
              <a
                className="inline-flex items-center justify-center gap-space-xs px-space-lg py-space-sm rounded-lg bg-surface-container-high text-on-surface font-label-md text-label-md uppercase tracking-wider hover:bg-surface-container-highest transition-colors"
                href={comoLlegar}
                target="_blank"
                rel="noreferrer"
              >
                <span className="material-symbols-outlined text-[18px]">directions</span>
                Cómo llegar
              </a>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
