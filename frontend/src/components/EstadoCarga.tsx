import { useEffect, useState } from "react";

// Pantalla intermedia mientras llegan datos del servidor, o si fallaron.
//
// Antes cada pagina mostraba directamente "No hay ..." mientras esperaba, y
// si la peticion fallaba se quedaba asi para siempre. En Render gratis el
// backend se duerme tras 15 min sin uso y tarda 30-60 s en despertar, asi que
// eso pasaba seguido: parecia que no habia datos o que "no terminaba de cargar".
//
// `cargando` debe ser `isPending` (todavia no hay datos), no `isLoading`: si la
// pestana queda en segundo plano o sin conexion, React Query PAUSA la peticion
// y ahi isLoading vale false sin que haya datos ni error.
export function EstadoCarga({
  cargando,
  error,
  reintentar,
  texto = "Cargando…",
}: {
  cargando: boolean;
  error: boolean;
  reintentar: () => void;
  texto?: string;
}) {
  const [lento, setLento] = useState(false);

  useEffect(() => {
    if (!cargando) {
      setLento(false);
      return;
    }
    const t = setTimeout(() => setLento(true), 6000);
    return () => clearTimeout(t);
  }, [cargando]);

  if (error && !cargando) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center gap-space-sm p-space-md rounded-xl bg-error-container/20 border border-error/40">
        <span className="flex-1 font-body-md text-body-md text-error">No se pudieron cargar los datos. Revisa tu conexión e inténtalo de nuevo.</span>
        <button
          className="self-start px-space-md py-space-xs rounded-lg bg-primary text-on-primary font-label-md text-label-md uppercase tracking-wider hover:bg-primary-fixed-dim transition-colors"
          onClick={reintentar}
          type="button"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-space-sm p-space-md rounded-xl bg-surface-container-low" role="status">
      <span className="material-symbols-outlined text-primary text-[24px] animate-spin shrink-0">progress_activity</span>
      <div className="flex flex-col">
        <span className="font-body-md text-body-md text-on-surface">{texto}</span>
        {lento && (
          <span className="font-body-sm text-body-sm text-on-surface-variant">
            El servidor se está activando; la primera carga puede tardar hasta un minuto.
          </span>
        )}
      </div>
    </div>
  );
}
