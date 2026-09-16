import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { urlComoLlegar, urlMapaEmbebido } from "../lib/mapa";
import { soles } from "../lib/moneda";
import { COMBOS, DESCUENTO_FFAA_PNP } from "../lib/promociones";
import type { Configuracion } from "../lib/types";

const FILL = { fontVariationSettings: "'FILL' 1" };

export default function Home() {
  const { data: config } = useQuery({ queryKey: ["config"], queryFn: () => api.get<Configuracion>("/config") });
  const comoLlegar = urlComoLlegar(config);
  const mapa = urlMapaEmbebido(config);

  return (
    <main className="w-full pt-20 bg-background min-h-screen">
      <div className="flex flex-col w-full">
        {/* Hero */}
        <section className="relative w-full overflow-hidden bg-surface-container-lowest py-space-3xl lg:py-[6rem]">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-[30rem] h-[30rem] rounded-full bg-secondary/10 blur-[140px] pointer-events-none" />
          <div className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl lg:gap-space-2xl items-center">
              <div className="lg:col-span-7 flex flex-col items-start space-y-space-md">
                <div className="inline-flex items-center gap-space-xs px-space-sm py-space-2xs rounded-full bg-surface-container-high text-secondary">
                  <span className="material-symbols-outlined text-primary text-[18px]" style={FILL}>
                    workspace_premium
                  </span>
                  <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary">
                    Santuario Masculino en Iquitos
                  </span>
                </div>
                <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">
                  El Arte Tradicional de la{" "}
                  <span className="text-primary italic font-body-lg text-[1.1em] font-normal inline-block ml-1">
                    Barbería Clásica
                  </span>
                </h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl">
                  Cuidado impecable, ritual de toalla caliente y maestría artesanal para el caballero contemporáneo.
                  Una pausa sin prisas entre cuero envejecido, navajas de acero templado y elixires botánicos.
                </p>
                <div className="flex flex-wrap items-center gap-space-md pt-space-xs">
                  <Link
                    className="inline-flex items-center gap-space-xs px-space-lg py-space-sm rounded-lg bg-primary text-on-primary font-headline-sm text-headline-sm uppercase tracking-wider hover:bg-primary-fixed-dim transition-all shadow-[0_0_24px_rgba(229,193,88,0.3)]"
                    to="/reservas"
                  >
                    <span>Reservar Cita Ahora</span>
                    <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                  </Link>
                  <Link
                    className="inline-flex items-center gap-space-xs px-space-lg py-space-sm rounded-lg bg-surface-container-high text-on-surface font-label-md text-label-md uppercase tracking-wider hover:bg-surface-container-highest transition-colors"
                    to="/tarifas"
                  >
                    <span>Ver Servicios &amp; Tarifas</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </Link>
                </div>
                <div className="pt-space-lg w-full flex flex-wrap items-center gap-space-lg">
                  <div className="flex items-center gap-space-xs">
                    <div className="flex text-primary">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="material-symbols-outlined text-[20px]" style={FILL}>
                          star
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-headline-sm text-headline-sm leading-none text-on-surface">4.9 / 5</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                        +800 valoraciones verificadas
                      </span>
                    </div>
                  </div>
                  <div className="h-8 w-px bg-surface-container-high hidden sm:block" />
                  <div className="flex items-center gap-space-xs">
                    <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-secondary">
                      <span className="material-symbols-outlined text-[22px]">content_cut</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-headline-sm text-headline-sm leading-none text-on-surface">100%</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                        Barberos Titulados &amp; Maestros
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-5 relative flex justify-center items-center">
                <div className="relative w-full max-w-[420px] aspect-square rounded-2xl bg-surface-container-low p-space-md shadow-2xl flex flex-col justify-between overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-surface-container-lowest via-transparent to-primary/10 opacity-70" />
                  <div className="relative z-10 flex justify-between items-start">
                    <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary bg-surface-container-lowest/80 px-space-xs py-space-2xs rounded backdrop-blur-md">
                      Est. MMXVI
                    </span>
                    <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">verified</span>
                    </div>
                  </div>
                  <div className="relative z-10 bg-surface-container-high/90 backdrop-blur-md p-space-md rounded-xl shadow-lg -mt-4">
                    <p className="font-body-md text-body-md text-on-surface italic leading-snug">
                      "La precisión no admite atajos. Cada pasada con navaja es un ritual consagrado a la excelencia
                      individual."
                    </p>
                    <div className="mt-space-xs flex items-center justify-between">
                      <span className="font-label-sm text-label-sm uppercase text-secondary">Maestro Mateo Galván</span>
                      <span className="font-label-sm text-label-sm text-outline">Navaja de Oro 2022</span>
                    </div>
                  </div>
                  <div className="relative z-10 flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm pt-space-xs">
                    <span>Iquitos, Perú</span>
                    <span className="text-primary flex items-center gap-1 font-label-sm text-label-sm uppercase">
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse inline-block" /> Sala Activa Hoy
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mision y Vision */}
        <section className="w-full bg-surface-container py-space-2xl">
          <div className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg">
              <div className="relative p-space-xl rounded-xl bg-surface-container-low shadow-md overflow-hidden flex flex-col justify-between group hover:bg-surface-container-high transition-all">
                <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-primary/5 group-hover:scale-125 transition-transform duration-500" />
                <div className="flex items-center gap-space-sm mb-space-md">
                  <div className="w-12 h-12 rounded-lg bg-surface-container-high text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[26px]">spa</span>
                  </div>
                  <div>
                    <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest block">
                      Propósito Esencial
                    </span>
                    <h2 className="font-headline-md text-headline-md text-on-surface">Nuestra Misión</h2>
                  </div>
                </div>
                <p className="font-body-lg text-body-lg text-on-surface-variant relative z-10 leading-relaxed">
                  {config?.mision ||
                    "Ofrecer una experiencia de bienestar, precisión y desconexión donde cada corte y afeitado sea un ritual artesanal único."}
                </p>
              </div>
              <div className="relative p-space-xl rounded-xl bg-surface-container-low shadow-md overflow-hidden flex flex-col justify-between group hover:bg-surface-container-high transition-all">
                <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-secondary/5 group-hover:scale-125 transition-transform duration-500" />
                <div className="flex items-center gap-space-sm mb-space-md">
                  <div className="w-12 h-12 rounded-lg bg-surface-container-high text-secondary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[26px]">all_inclusive</span>
                  </div>
                  <div>
                    <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest block">
                      Horizontes de Estilo
                    </span>
                    <h2 className="font-headline-md text-headline-md text-on-surface">Nuestra Visión</h2>
                  </div>
                </div>
                <p className="font-body-lg text-body-lg text-on-surface-variant relative z-10 leading-relaxed">
                  {config?.vision ||
                    "Ser el templo de referencia del cuidado masculino, combinando técnicas tradicionales con las últimas tendencias."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Promociones */}
        <section className="w-full bg-background pt-space-3xl">
          <div className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop flex flex-col gap-space-lg">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-space-sm">
              <div className="flex flex-col gap-space-2xs">
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">Promociones Vigentes</span>
                <h2 className="font-headline-lg text-headline-lg text-on-surface">El día que tu estilo cuesta menos</h2>
              </div>
              <Link className="font-label-md text-label-md uppercase tracking-wider text-primary hover:underline" to="/promociones">
                Ver condiciones
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-space-md">
              {COMBOS.map((combo) => (
                <Link
                  key={combo.id}
                  className="flex flex-col gap-space-xs p-space-lg rounded-xl bg-surface-container-low border border-primary/20 hover:border-primary/60 transition-colors"
                  to="/promociones"
                >
                  <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">{combo.nombre}</span>
                  <span className="font-headline-sm text-headline-sm text-on-surface">{combo.titulo}</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    {combo.incluye.slice(1).map((i) => `+ ${i}`).join(" ")} + bebida
                  </span>
                  <span className="mt-auto font-headline-lg text-headline-lg text-primary">{soles(combo.precio)}</span>
                </Link>
              ))}
              <Link
                className="flex flex-col gap-space-xs p-space-lg rounded-xl bg-primary text-on-primary sm:col-span-2 lg:col-span-1 hover:bg-primary-fixed-dim transition-colors"
                to="/promociones"
              >
                <span className="font-label-sm text-label-sm uppercase tracking-widest">FF.AA. y PNP</span>
                <span className="font-headline-xl text-headline-xl leading-none">{DESCUENTO_FFAA_PNP.porcentaje}% dcto.</span>
                <span className="font-body-sm text-body-sm">En servicios individuales, mostrando tu carnet y/o CIP.</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Ubicacion */}
        {mapa && (
          <section className="w-full bg-background pt-space-3xl" id="ubicacion">
            <div className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-stretch">
                <div className="lg:col-span-4 flex flex-col justify-center gap-space-md">
                  <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">Visítanos</span>
                  <h2 className="font-headline-lg text-headline-lg text-on-surface">Dónde Encontrarnos</h2>
                  <div className="flex items-start gap-space-xs text-on-surface-variant font-body-md text-body-md">
                    <span className="material-symbols-outlined text-primary text-[22px] shrink-0">pin_drop</span>
                    <span>{config?.direccion}</span>
                  </div>
                  {config?.horario && (
                    <div className="flex items-start gap-space-xs text-on-surface-variant font-body-md text-body-md">
                      <span className="material-symbols-outlined text-primary text-[22px] shrink-0">schedule</span>
                      <span>{config.horario}</span>
                    </div>
                  )}
                  {comoLlegar && (
                    <a
                      className="self-start inline-flex items-center gap-space-xs px-space-lg py-space-sm rounded-lg bg-primary text-on-primary font-label-md text-label-md uppercase tracking-wider hover:bg-primary-fixed-dim transition-colors"
                      href={comoLlegar}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span className="material-symbols-outlined text-[18px]">directions</span>
                      Cómo Llegar
                    </a>
                  )}
                </div>
                <div className="lg:col-span-8 rounded-xl overflow-hidden shadow-2xl bg-surface-container min-h-[320px]">
                  <iframe
                    className="w-full h-full min-h-[320px] border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    src={mapa}
                    title={`Mapa de ubicación de ${config?.nombre_barberia ?? "la barbería"}`}
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* CTA Final */}
        <section className="w-full bg-background py-space-3xl relative">
          <div className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop">
            <div className="relative rounded-2xl bg-gradient-to-r from-surface-container-lowest via-surface-container-low to-surface-container p-space-xl md:p-space-3xl overflow-hidden shadow-2xl">
              <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-primary/10 blur-[90px] pointer-events-none" />
              <div className="relative z-10 max-w-2xl space-y-space-md">
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  Agenda Abierta para Esta Semana
                </span>
                <h2 className="font-headline-xl text-headline-xl text-on-surface">
                  Reclame su Momento de{" "}
                  <span className="text-primary italic font-body-lg text-[1.1em] font-normal">Pausa &amp; Maestría</span>
                </h2>
                <p className="font-body-lg text-body-lg text-on-surface-variant">
                  Elija a su maestro barbero de confianza, seleccione el ritual que su jornada merece y reserve su
                  asiento con confirmación instantánea.
                </p>
                <div className="pt-space-sm flex flex-wrap items-center gap-space-md">
                  <Link
                    className="inline-flex items-center gap-space-xs px-space-xl py-space-sm rounded-lg bg-primary text-on-primary font-headline-sm text-headline-sm uppercase tracking-wider hover:bg-primary-fixed-dim transition-all shadow-[0_0_20px_rgba(229,193,88,0.3)]"
                    to="/reservas"
                  >
                    <span>Agendar Cita en Línea</span>
                    <span className="material-symbols-outlined text-[20px]">calendar_today</span>
                  </Link>
                  {config?.telefono_whatsapp && (
                    <a
                      className="inline-flex items-center gap-space-xs px-space-lg py-space-sm rounded-lg bg-surface-container-high text-on-surface font-label-md text-label-md uppercase tracking-wider hover:bg-surface-container-highest transition-colors"
                      href={`https://wa.me/${config.telefono_whatsapp}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span className="material-symbols-outlined text-[18px]">call</span>
                      <span>{config.telefono_whatsapp}</span>
                    </a>
                  )}
                </div>
                <div className="pt-space-xs flex items-center gap-space-md text-outline font-body-sm text-body-sm">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-secondary">check</span> Cancelación
                    flexible
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-secondary">check</span> Parking
                    concertado
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
