import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { api, ApiError } from "../lib/api";
import type { CurrentUser } from "../lib/types";

export default function Login() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user = await api.post<CurrentUser>("/auth/login", { email, password });
      setUser(user);
      navigate("/fidelizacion");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Email o contraseña incorrectos.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="w-full pt-20 bg-background min-h-screen flex items-center justify-center px-margin-mobile">
      <div className="w-full max-w-md bg-surface-container-low p-space-xl rounded-xl shadow-lg my-space-3xl">
        <div className="flex flex-col gap-space-2xs mb-space-lg text-center">
          <h1 className="font-headline-md text-headline-md text-on-surface font-bold">Iniciar Sesión</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">Accede a tu cuenta de socio Nutria Style.</p>
        </div>

        {error && (
          <div className="mb-space-md p-space-sm rounded-lg bg-error-container/20 border border-error/40 text-error font-body-sm text-body-sm">
            {error}
          </div>
        )}

        <form className="flex flex-col gap-space-md" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-space-2xs">
            <label className="font-label-sm text-label-sm uppercase tracking-wider text-secondary" htmlFor="email">
              Email
            </label>
            <input
              className="w-full px-space-md py-space-sm rounded-lg bg-surface-container-high text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-space-2xs">
            <label className="font-label-sm text-label-sm uppercase tracking-wider text-secondary" htmlFor="password">
              Contraseña
            </label>
            <input
              className="w-full px-space-md py-space-sm rounded-lg bg-surface-container-high text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            className="mt-space-xs w-full py-space-sm rounded-lg bg-primary text-on-primary font-headline-sm text-[15px] font-bold uppercase tracking-wider hover:bg-primary-fixed-dim transition-colors disabled:opacity-50"
            disabled={submitting}
            type="submit"
          >
            {submitting ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <div className="flex items-center gap-space-sm my-space-lg">
          <div className="flex-1 h-px bg-outline-variant/30" />
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">o</span>
          <div className="flex-1 h-px bg-outline-variant/30" />
        </div>

        <a
          className="w-full flex items-center justify-center gap-space-xs py-space-sm rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface font-label-md text-label-md uppercase tracking-wider transition-colors"
          href="/login/google"
        >
          <svg className="w-5 h-5" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M43.6 20.5h-1.9V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
              fill="#FFC107"
            />
            <path
              d="M6.3 14.7l6.6 4.8C14.6 16 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4c-7.4 0-13.8 4.1-17.1 10.1z"
              fill="#FF3D00"
            />
            <path
              d="M24 44c5.5 0 10.4-2.1 14.1-5.5l-6.5-5.5c-2 1.4-4.6 2.3-7.6 2.3-5.2 0-9.6-3.3-11.3-7.9l-6.6 5.1C9.9 39.6 16.4 44 24 44z"
              fill="#4CAF50"
            />
            <path
              d="M43.6 20.5h-1.9V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.5 5.5C39.9 37 44 31 44 24c0-1.3-.1-2.7-.4-3.5z"
              fill="#1976D2"
            />
          </svg>
          Continuar con Google
        </a>

        <p className="mt-space-lg text-center font-body-sm text-body-sm text-on-surface-variant">
          ¿Aún no tienes cuenta? <Link className="text-primary hover:underline font-medium" to="/registro">Regístrate</Link>
        </p>
      </div>
    </main>
  );
}
