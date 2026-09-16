import type { Configuracion } from "./types";

// Todo sale de nombre + direccion de Configuracion: si el admin cambia la
// direccion, el mapa y los botones "Como llegar" se actualizan solos.
// Buscar "Nutria Style, <direccion>" hace que Google abra la ficha del negocio
// (con fotos y resenas) en vez de solo un pin en la calle.
function consulta(config: Configuracion | undefined): string | null {
  if (!config?.direccion) return null;
  return `${config.nombre_barberia}, ${config.direccion}`;
}

/** Abre Google Maps (en el celular, la app) con la ubicacion del negocio. */
export function urlComoLlegar(config: Configuracion | undefined): string | null {
  const q = consulta(config);
  return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : null;
}

/** Mapa embebible en un iframe (no requiere API key). */
export function urlMapaEmbebido(config: Configuracion | undefined): string | null {
  const q = consulta(config);
  return q ? `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed` : null;
}
