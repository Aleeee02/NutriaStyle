// En produccion (Vercel), esto apunta al backend en Render.
// En local, queda vacio y las llamadas son relativas (el proxy de Vite las manda a localhost:8000).
export const BACKEND_ORIGIN = import.meta.env.VITE_BACKEND_ORIGIN ?? "";
