import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { api, ApiError } from "../lib/api";
import type { CurrentUser } from "../lib/types";

const INPUT_CLASS =
  "w-full px-space-md py-space-sm rounded-lg bg-surface-container-high text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary";
const LABEL_CLASS = "font-label-sm text-label-sm uppercase tracking-wider text-secondary";

// Se muestra tras entrar con Google: Google da el nombre completo pero nunca
// el telefono, asi que se confirma nombre/apellido y se pide el telefono.
export default function CompletarPerfil() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombre: user?.nombre ?? "",
    apellido: user?.apellido ?? "",
    telefono: user?.telefono ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const destino = user?.is_admin ? "/admin" : "/fidelizacion";

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const updated = await api.put<CurrentUser>("/auth/perfil", form);
      setUser(updated);
      navigate(destino, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar tu perfil.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="w-full pt-20 bg-background min-h-screen flex items-center justify-center px-margin-mobile">
      <div className="w-full max-w-md bg-surface-container-low p-space-xl rounded-xl shadow-lg my-space-3xl">
        <div className="flex flex-col gap-space-2xs mb-space-lg text-center">
          <h1 className="font-headline-md text-headline-md text-on-surface font-bold">Completa tu Perfil</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Confirma tus datos para que podamos avisarte de tus citas.
          </p>
        </div>

        {error && (
          <div className="mb-space-md p-space-sm rounded-lg bg-error-container/20 border border-error/40 text-error font-body-sm text-body-sm">
            {error}
          </div>
        )}

        <form className="flex flex-col gap-space-md" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-space-sm">
            <div className="flex flex-col gap-space-2xs">
              <label className={LABEL_CLASS} htmlFor="nombre">Nombre</label>
              <input className={INPUT_CLASS} id="nombre" required value={form.nombre} onChange={update("nombre")} />
            </div>
            <div className="flex flex-col gap-space-2xs">
              <label className={LABEL_CLASS} htmlFor="apellido">Apellido</label>
              <input className={INPUT_CLASS} id="apellido" required value={form.apellido} onChange={update("apellido")} />
            </div>
          </div>
          <div className="flex flex-col gap-space-2xs">
            <label className={LABEL_CLASS} htmlFor="telefono">Teléfono</label>
            <input
              className={INPUT_CLASS}
              id="telefono"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+51 999 999 999"
              required
              value={form.telefono}
              onChange={update("telefono")}
            />
          </div>
          <button
            className="mt-space-xs w-full py-space-sm rounded-lg bg-primary text-on-primary font-headline-sm text-[15px] font-bold uppercase tracking-wider hover:bg-primary-fixed-dim transition-colors disabled:opacity-50"
            disabled={submitting}
            type="submit"
          >
            {submitting ? "Guardando…" : "Guardar y Continuar"}
          </button>
        </form>

        <p className="mt-space-lg text-center font-body-sm text-body-sm text-on-surface-variant">
          <Link className="text-outline hover:text-primary hover:underline" to={destino} replace>
            Completar más tarde
          </Link>
        </p>
      </div>
    </main>
  );
}
