import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { api, ApiError } from "../lib/api";
import { destinoTrasLogin } from "../lib/loginRedirect";
import type { CurrentUser } from "../lib/types";

export default function AuthCallback() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const accessToken = params.get("access_token");

    if (!accessToken) {
      setFailed(true);
      return;
    }

    api
      .post<CurrentUser>("/auth/session", { access_token: accessToken })
      .then((user) => {
        setUser(user);
        // El staff que llego escaneando un QR va directo al canje; completar
        // el perfil puede esperar a que no haya un cliente delante.
        const destino = destinoTrasLogin(user);
        if (!user.perfil_completo && !destino.startsWith("/canjear")) {
          navigate("/completar-perfil", { replace: true });
        } else {
          navigate(destino, { replace: true });
        }
      })
      .catch((err) => {
        console.error(err instanceof ApiError ? err.message : err);
        setFailed(true);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="w-full min-h-screen bg-background flex items-center justify-center px-margin-mobile">
      <div className="flex flex-col items-center gap-space-md text-center">
        {!failed ? (
          <>
            <span className="material-symbols-outlined text-primary text-[40px] animate-spin">progress_activity</span>
            <p className="font-body-md text-body-md text-on-surface-variant">Conectando tu cuenta de Google…</p>
          </>
        ) : (
          <>
            <p className="font-body-md text-body-md text-on-surface-variant">
              No se pudo completar el inicio de sesión con Google.
            </p>
            <Link className="font-label-md text-label-md uppercase tracking-wider text-primary hover:underline" to="/login">
              Volver a intentar
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
