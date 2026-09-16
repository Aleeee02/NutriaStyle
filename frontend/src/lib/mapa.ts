// Ubicacion del local en Google Maps.
//
// No se arma una busqueda con el texto de la direccion: en el celular la app
// de Google Maps busca ese texto cerca de donde esta la persona y puede mandar
// a otra "Av. Mariscal Caceres" de otra ciudad. Ademas, el nombre guardado en
// Configuracion ("NutriaStyle") no coincide con el de la ficha de Google
// ("Nutria Style"), asi que la busqueda ni siquiera encontraba el negocio.
//
// Si el local se muda: en Google Maps, abrir la ficha del negocio > Compartir,
// y reemplazar ENLACE_FICHA y FICHA_GOOGLE por los nuevos.

/** Enlace compartido desde la ficha del negocio: abre exactamente ese lugar. */
const ENLACE_FICHA = "https://maps.app.goo.gl/YtWV6NQ9nLE4d3k2A";

/** Titulo y direccion tal como figuran en la ficha de Google (sin tilde). */
const FICHA_GOOGLE = "Nutria Style, Av. Mariscal Caceres 540, Iquitos 16001";

/** Abre Google Maps (en el celular, la app) en la ficha del negocio. */
export function urlComoLlegar(): string {
  return ENLACE_FICHA;
}

/** Mapa embebible en un iframe (no requiere API key). */
export function urlMapaEmbebido(): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(FICHA_GOOGLE)}&z=17&output=embed`;
}
