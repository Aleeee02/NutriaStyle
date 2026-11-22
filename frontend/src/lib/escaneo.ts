// Rutas que puede abrir un QR del salon. Cualquier otro QR se ignora.
const RUTAS_VALIDAS = ["/asistencia", "/canjear"];

/**
 * Convierte el texto leido de un QR en la ruta interna a abrir, o null si no
 * es un QR del salon (de otro sitio, de otra pagina o sin codigo).
 * `dominios` son los dominios propios: el QR guarda la direccion desde la que
 * el cliente lo abrio.
 */
export function rutaDelQr(texto: string, dominios: string[]): string | null {
  try {
    const url = new URL(texto);
    if (!dominios.includes(url.hostname)) return null;
    const codigo = url.searchParams.get("c");
    if (!RUTAS_VALIDAS.includes(url.pathname) || !codigo) return null;
    return `${url.pathname}?c=${encodeURIComponent(codigo)}`;
  } catch {
    return null;
  }
}
