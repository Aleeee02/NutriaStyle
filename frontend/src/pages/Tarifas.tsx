import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { soles } from "../lib/moneda";
import type { Categoria, Configuracion, Servicio } from "../lib/types";

export default function Tarifas() {
  const { data: categorias } = useQuery({ queryKey: ["categorias"], queryFn: () => api.get<Categoria[]>("/categorias") });
  const { data: servicios } = useQuery({ queryKey: ["servicios"], queryFn: () => api.get<Servicio[]>("/servicios") });
  const { data: config } = useQuery({ queryKey: ["config"], queryFn: () => api.get<Configuracion>("/config") });
  const [filtro, setFiltro] = useState<string>("todos");

  const grupos = useMemo(() => {
    if (!categorias || !servicios) return [];
    return categorias
      .map((c) => ({ categoria: c, servicios: servicios.filter((s) => s.categoria_id === c.id) }))
      .filter((g) => g.servicios.length > 0);
  }, [categorias, servicios]);

  return (
    <main className="w-full pt-20 bg-background min-h-screen">
      <div className="flex flex-col w-full">
        <section className="relative w-full overflow-hidden bg-surface-container-lowest px-margin-mobile md:px-margin-desktop py-space-3xl">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="relative max-w-[1280px] mx-auto flex flex-col md:flex-row md:items-end justify-between gap-space-xl">
            <div className="flex flex-col gap-space-sm max-w-2xl">
              <div className="flex items-center gap-space-xs text-secondary">
                <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
                <span className="font-label-sm text-label-sm uppercase tracking-widest">Maestría &amp; Artesanía Capilar</span>
              </div>
              <h1 className="font-headline-xl text-headline-xl text-primary tracking-tight">Carta de Servicios &amp; Rituales</h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant">
                Descubre nuestra selección de tratamientos diseñados para un aspecto impecable, precisión anatómica y un momento de relax absoluto.
              </p>
            </div>
            <div className="flex items-center gap-space-md p-space-md rounded-xl bg-surface-container-low shadow-xl">
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm text-primary">{servicios?.length ?? 0}</span>
                <span className="font-label-sm text-label-sm uppercase text-secondary">Servicios Disponibles</span>
              </div>
              <div className="w-px h-8 bg-outline-variant/40" />
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm text-primary">100%</span>
                <span className="font-label-sm text-label-sm uppercase text-secondary">Navaja Tradicional</span>
              </div>
            </div>
          </div>
        </section>

        <div className="w-full px-margin-mobile md:px-margin-desktop pt-space-lg">
          <Link
            className="max-w-[1280px] mx-auto flex flex-col sm:flex-row sm:items-center gap-space-sm p-space-md rounded-xl bg-surface-container-low border border-primary/30 hover:border-primary/60 transition-colors"
            to="/promociones"
          >
            <span className="material-symbols-outlined text-primary text-[28px]">military_tech</span>
            <span className="flex-1 font-body-md text-body-md text-on-surface">
              <strong className="text-primary">20% de descuento para FF.AA. y PNP</strong> en servicios individuales, mostrando tu carnet y/o CIP.
              <span className="text-on-surface-variant"> No aplica en combos.</span>
            </span>
            <span className="font-label-md text-label-md uppercase tracking-wider text-primary">Ver promociones →</span>
          </Link>
        </div>

        {grupos.length === 0 ? (
          <section className="w-full px-margin-mobile md:px-margin-desktop py-space-3xl">
            <p className="max-w-[1280px] mx-auto font-body-md text-body-md text-on-surface-variant">
              Todavía no hay servicios publicados. Vuelve pronto.
            </p>
          </section>
        ) : (
          <>
            <section className="sticky top-20 z-40 w-full bg-surface-container-lowest/90 backdrop-blur-md px-margin-mobile md:px-margin-desktop py-space-sm shadow-md">
              <div className="max-w-[1280px] mx-auto flex items-center gap-space-md overflow-x-auto">
                <div className="flex items-center gap-space-xs p-1 rounded-lg bg-surface-container-low">
                  <button
                    className={`px-space-md py-space-2xs rounded font-label-md text-label-md uppercase tracking-wider transition-all shadow-sm ${
                      filtro === "todos" ? "bg-primary text-on-primary" : "bg-transparent text-on-surface-variant"
                    }`}
                    onClick={() => setFiltro("todos")}
                    type="button"
                  >
                    Todos los Rituales
                  </button>
                  {grupos.map((g) => (
                    <button
                      key={g.categoria.id}
                      className={`px-space-md py-space-2xs rounded font-label-md text-label-md uppercase tracking-wider transition-all ${
                        filtro === g.categoria.id
                          ? "bg-primary text-on-primary"
                          : "bg-transparent text-on-surface-variant hover:text-primary"
                      }`}
                      onClick={() => setFiltro(g.categoria.id)}
                      type="button"
                    >
                      {g.categoria.nombre}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="w-full px-margin-mobile md:px-margin-desktop py-space-2xl">
              <div className="max-w-[1280px] mx-auto flex flex-col gap-space-3xl">
                {grupos
                  .filter((g) => filtro === "todos" || filtro === g.categoria.id)
                  .map((g, idx) => (
                    <div key={g.categoria.id} className="flex flex-col gap-space-lg">
                      <div className="flex items-center gap-space-sm">
                        <span className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-primary font-headline-sm text-label-md">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <div className="flex flex-col">
                          <h2 className="font-headline-md text-headline-md text-primary">{g.categoria.nombre}</h2>
                          {g.categoria.descripcion && (
                            <span className="font-body-sm text-body-sm text-on-surface-variant">{g.categoria.descripcion}</span>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg">
                        {g.servicios.map((s) => (
                          <div
                            key={s.id}
                            className="flex flex-col justify-between p-space-xl rounded-xl bg-surface-container-low hover:bg-surface-container transition-all shadow-md group"
                          >
                            <div className="flex flex-col gap-space-sm">
                              <div className="flex items-start justify-between gap-space-md">
                                <h3 className="font-headline-sm text-headline-sm text-on-surface group-hover:text-primary transition-colors">
                                  {s.nombre}
                                </h3>
                                <span className="font-headline-md text-headline-md text-primary shrink-0">
                                  {soles(s.precio)}
                                </span>
                              </div>
                              {s.descripcion && (
                                <p className="font-body-md text-body-md text-on-surface-variant">{s.descripcion}</p>
                              )}
                              <div className="flex items-center gap-space-md pt-space-xs text-secondary font-label-sm text-label-sm uppercase">
                                <span className="flex items-center gap-space-2xs">
                                  <span className="material-symbols-outlined text-[16px]">schedule</span> {s.duracion_minutos} min
                                </span>
                              </div>
                            </div>
                            <div className="pt-space-lg mt-space-md flex items-center justify-end">
                              <Link
                                className="inline-flex items-center gap-space-2xs px-space-md py-space-xs rounded bg-primary text-on-primary font-label-md text-label-md uppercase tracking-wider hover:bg-primary-fixed-dim transition-all shadow-sm"
                                to="/reservas"
                              >
                                <span>Agendar</span>
                                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          </>
        )}

        <section className="w-full px-margin-mobile md:px-margin-desktop py-space-3xl">
          <div className="max-w-[960px] mx-auto flex flex-col gap-space-2xl">
            <div className="text-center flex flex-col items-center gap-space-xs">
              <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">Atención &amp; Respuestas</span>
              <h2 className="font-headline-lg text-headline-lg text-primary">Preguntas Frecuentes</h2>
            </div>
            <div className="p-space-xl rounded-xl bg-surface-container flex flex-col md:flex-row items-center justify-between gap-space-md shadow-lg">
              <div className="flex items-center gap-space-md">
                <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-[24px]">support_agent</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-headline-sm text-headline-sm text-on-surface">¿Dudas sobre tu próximo tratamiento?</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Escríbenos y te respondemos a la brevedad.</span>
                </div>
              </div>
              {config?.telefono_whatsapp && (
                <a
                  className="px-space-lg py-space-xs rounded bg-surface-container-high text-primary hover:bg-primary hover:text-on-primary font-label-md text-label-md uppercase tracking-wider transition-all whitespace-nowrap"
                  href={`https://wa.me/${config.telefono_whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Contactar por WhatsApp
                </a>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
