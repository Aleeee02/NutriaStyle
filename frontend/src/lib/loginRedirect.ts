import type { CurrentUser } from "./types";

// Se guarda en sessionStorage (no en el state del router) porque el login con
// Google sale del sitio y vuelve por /auth/callback, perdiendo ese state.
const KEY = "nutria_destino_tras_login";

export function guardarDestinoTrasLogin(ruta: string) {
  try {
    sessionStorage.setItem(KEY, ruta);
  } catch {
    // sin sessionStorage (modo privado estricto): se usa el destino por defecto
  }
}

export function destinoTrasLogin(user: CurrentUser): string {
  let guardado: string | null = null;
  try {
    guardado = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
  } catch {
    // idem
  }
  // Solo rutas internas, para no convertir esto en una redireccion abierta.
  // Se rechazan "//otro-sitio.com" y "/\otro-sitio.com": el navegador trata
  // la barra invertida como barra normal y saldria del sitio.
  const interna = /^\/(?![/\\])/.test(guardado ?? "");
  if (guardado && interna) {
    return guardado;
  }
  return user.is_admin ? "/admin" : "/fidelizacion";
}
