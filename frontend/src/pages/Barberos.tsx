import { useQuery } from "@tanstack/react-query";
import { Resenas } from "../components/Resenas";
import { EstadoCarga } from "../components/EstadoCarga";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import type { Empleado } from "../lib/types";

export default function Barberos() {
  const { data: empleados, isPending, isError, refetch } = useQuery({
    queryKey: ["empleados"],
    queryFn: () => api.get<Empleado[]>("/empleados"),
  });

  return (
    <main className="w-full pt-20 bg-background min-h-screen">
      <div className="flex flex-col w-full">
        <section className="relative w-full overflow-hidden py-space-3xl px-margin-mobile md:px-margin-desktop">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 -right-48 w-[500px] h-[500px] rounded-full bg-secondary/5 blur-[120px] pointer-events-none" />
          <div className="max-w-[1280px] mx-auto flex flex-col gap-space-2xl">
            <div className="flex flex-col gap-space-xs max-w-2xl">
              <div className="flex items-center gap-space-xs text-secondary">
                <span className="material-symbols-outlined text-[18px]">verified</span>
                <span className="font-label-sm text-label-sm uppercase tracking-widest">
                  Maestría Secular &amp; Excelencia Masculina
                </span>
              </div>
              <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">
                Nuestro Equipo de Barberos
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant mt-space-2xs">
                Cada barbero de Nutria Style encarna una devoción inquebrantable por el filo certero, la geometría
                clásica y el diálogo reposado.
              </p>
            </div>

            {(isPending || isError) && (
              <EstadoCarga cargando={isPending} error={isError} reintentar={refetch} texto="Cargando barberos…" />
            )}

            {!isPending && !isError && (!empleados || empleados.length === 0) && (
              <p className="font-body-md text-body-md text-on-surface-variant bg-surface-container-low p-space-lg rounded-xl">
                Todavía no hay barberos publicados.
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg">
              {empleados?.map((e) => (
                <article
                  key={e.id}
                  className="flex flex-col bg-surface-container-low rounded-xl overflow-hidden shadow-md transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl group"
                >
                  <div className="relative w-full h-80 overflow-hidden bg-surface-container-highest flex items-center justify-center">
                    {e.foto_url ? (
                      <img
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        src={e.foto_url}
                        alt={e.nombre}
                      />
                    ) : (
                      <span className="font-headline-xl text-headline-xl text-primary font-bold uppercase">
                        {e.nombre[0]}
                      </span>
                    )}
                    <div className="absolute bottom-space-md left-space-md right-space-md flex justify-between items-end">
                      <h3 className="font-headline-md text-headline-md text-on-surface">
                        {e.nombre} {e.apellido || ""}
                      </h3>
                    </div>
                  </div>
                  <div className="p-space-lg flex flex-col justify-between flex-grow gap-space-md">
                    {e.descripcion && (
                      <p className="font-body-md text-body-md text-on-surface-variant">{e.descripcion}</p>
                    )}
                    <div className="pt-space-sm flex items-center justify-end mt-auto">
                      <Link
                        className="px-space-md py-space-xs rounded-lg bg-primary text-on-primary font-label-md text-label-md uppercase tracking-wider hover:bg-primary-fixed-dim transition-all shadow-[0_0_12px_rgba(229,193,88,0.2)]"
                        to="/reservas"
                      >
                        Ver Disponibilidad
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <Resenas />

        <section className="w-full py-space-3xl px-margin-mobile md:px-margin-desktop bg-background relative">
          <div className="max-w-[1280px] mx-auto p-space-xl rounded-xl bg-surface-container-low shadow-xl flex flex-col md:flex-row items-center justify-between gap-space-lg">
            <div className="flex flex-col gap-space-2xs text-center md:text-left">
              <h3 className="font-headline-md text-headline-md text-primary">
                ¿Listo para ocupar tu lugar en la silla?
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Reserva previa recomendada. Elige barbero, servicio e infusión de bienvenida.
              </p>
            </div>
            <div className="flex items-center gap-space-md shrink-0">
              <Link
                className="px-space-xl py-space-sm rounded-lg bg-primary text-on-primary font-label-md text-label-md uppercase tracking-wider hover:bg-primary-fixed-dim transition-all shadow-[0_0_20px_rgba(229,193,88,0.3)]"
                to="/reservas"
              >
                Agendar Experiencia
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
