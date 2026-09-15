import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const ADMIN_LINKS = [
  { to: "/admin/servicios", label: "Servicios" },
  { to: "/admin/empleados", label: "Empleados" },
  { to: "/admin/reservas", label: "Reservas" },
  { to: "/admin/usuarios", label: "Usuarios" },
  { to: "/admin/configuracion", label: "Configuración" },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const { logout } = useAuth();

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-50 bg-surface-container-lowest/90 backdrop-blur-xl border-b border-outline-variant/30 shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
        <div className="h-16 max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop flex items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-md">
            <Link className="font-headline-sm text-headline-sm text-primary tracking-wide" to="/admin">
              NutriaSyle · Admin
            </Link>
            <nav className="hidden sm:flex items-center gap-space-md">
              {ADMIN_LINKS.map((link) => (
                <Link
                  key={link.to}
                  className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant hover:text-primary transition-colors"
                  to={link.to}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-space-md">
            <Link className="font-label-sm text-label-sm uppercase tracking-wider text-outline hover:text-primary transition-colors" to="/">
              Ver sitio
            </Link>
            <button
              className="font-label-sm text-label-sm uppercase tracking-wider text-outline hover:text-primary transition-colors"
              onClick={() => logout()}
              type="button"
            >
              Salir
            </button>
          </div>
        </div>
      </header>
      <main className="w-full pt-24 pb-space-3xl bg-background min-h-screen">
        <div className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop flex flex-col gap-space-lg">
          {children}
        </div>
      </main>
    </>
  );
}
