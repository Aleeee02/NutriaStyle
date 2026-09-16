import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

// "Reservar Cita" no va aqui: ya es el boton dorado de la derecha.
const NAV_LINKS = [
  { to: "/", label: "Inicio" },
  { to: "/tarifas", label: "Servicios" },
  { to: "/promociones", label: "Promociones" },
  { to: "/barberos", label: "Equipo" },
];

export function Header() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-surface-container-lowest/85 backdrop-blur-xl border-b border-outline-variant/30 shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
      <div className="h-20 max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop flex items-center justify-between gap-space-md">
        <div className="flex items-center gap-space-sm shrink-0">
          <img alt="Nutria Style Logo" className="h-11 w-11 rounded-full object-cover" src="/img/logo.jpeg" />
          <span className="font-headline-sm text-headline-sm text-primary tracking-wide hidden sm:inline-block">
            Nutria Style
          </span>
        </div>
        <nav className="hidden lg:flex items-center gap-space-lg">
          {NAV_LINKS.map((link) => {
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={
                  active
                    ? "whitespace-nowrap font-label-md text-label-md uppercase tracking-wider transition-colors text-primary font-bold"
                    : "whitespace-nowrap font-label-md text-label-md uppercase tracking-wider text-on-surface-variant hover:text-primary transition-colors"
                }
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-space-md">
          <Link
            className="inline-flex items-center justify-center px-space-md py-space-xs rounded-lg bg-primary text-on-primary font-label-md text-label-md uppercase tracking-wider hover:bg-primary-fixed-dim hover:text-on-primary-fixed transition-all shadow-[0_0_16px_rgba(229,193,88,0.25)]"
            to="/reservas"
          >
            Reservar Cita
          </Link>
          {user ? (
            <div className="flex items-center gap-space-xs pl-space-xs border-l border-outline-variant/40">
              {user.is_admin && (
                <Link
                  className="font-label-md text-label-md uppercase tracking-wider text-primary hover:text-primary-fixed-dim transition-colors font-bold"
                  to="/admin"
                >
                  Panel Admin
                </Link>
              )}
              <Link
                className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant hover:text-primary transition-colors"
                to="/fidelizacion"
              >
                Mi Cuenta
              </Link>
              <button
                className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant hover:text-primary transition-colors"
                onClick={() => logout()}
                type="button"
              >
                Salir
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-space-xs pl-space-xs border-l border-outline-variant/40">
              <Link
                className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant hover:text-primary transition-colors"
                to="/login"
              >
                Iniciar Sesión
              </Link>
              <Link
                className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant hover:text-primary transition-colors"
                to="/registro"
              >
                Registrarme
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
