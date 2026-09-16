import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { guardarDestinoTrasLogin } from "../lib/loginRedirect";

function LoadingScreen() {
  return (
    <div className="w-full min-h-screen bg-background flex items-center justify-center">
      <span className="material-symbols-outlined text-primary text-[40px] animate-spin">progress_activity</span>
    </div>
  );
}

// Manda al login recordando la pagina pedida (p. ej. el enlace de un QR
// escaneado), para volver ahi despues de iniciar sesion.
function IrALogin() {
  const location = useLocation();
  guardarDestinoTrasLogin(location.pathname + location.search);
  return <Navigate to="/login" replace />;
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <IrALogin />;
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <IrALogin />;
  if (!user.is_admin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export function RequireStaff({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <IrALogin />;
  if (!user.is_staff) return <Navigate to="/" replace />;
  return <>{children}</>;
}
