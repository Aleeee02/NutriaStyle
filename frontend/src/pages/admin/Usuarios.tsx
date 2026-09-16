import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type { UsuarioAdmin } from "../../lib/types";

export default function AdminUsuarios() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "usuarios"],
    queryFn: () => api.get<{ usuarios: UsuarioAdmin[]; sellos_meta: number }>("/admin/usuarios"),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin", "usuarios"] });
  }

  async function agregarSello(id: string) {
    await api.post(`/admin/usuarios/${id}/sello`);
    invalidate();
  }

  async function canjear(id: string) {
    await api.post(`/admin/usuarios/${id}/canjear`);
    invalidate();
  }

  async function cambiarRol(id: string, rol: string) {
    await api.put(`/admin/usuarios/${id}/rol`, { rol });
    invalidate();
  }

  // Los admin se muestran como etiqueta fija: ese rol solo se cambia en Supabase.
  function RolControl({ u }: { u: UsuarioAdmin }) {
    if (u.rol === "admin") {
      return (
        <span className="shrink-0 font-label-sm text-[11px] uppercase tracking-wider px-2 py-0.5 rounded bg-primary text-on-primary">admin</span>
      );
    }
    return (
      <select
        aria-label={`Rol de ${u.nombre}`}
        className="shrink-0 bg-surface-container-highest text-on-surface-variant font-label-sm text-[11px] uppercase tracking-wider px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-primary"
        onChange={(e) => cambiarRol(u.id, e.target.value)}
        value={u.rol}
      >
        <option value="cliente">Cliente</option>
        <option value="barbero">Barbero</option>
      </select>
    );
  }

  return (
    <>
      <div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold">Usuarios</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Clientes registrados y su progreso en la tarjeta de fidelización ({data?.sellos_meta ?? 4} sellos para el corte de cortesía).
        </p>
      </div>

      {isLoading ? (
        <p className="font-body-md text-body-md text-on-surface-variant">Cargando usuarios…</p>
      ) : isError ? (
        <p className="font-body-md text-body-md text-error">No se pudieron cargar los usuarios. Recarga la página.</p>
      ) : !data || data.usuarios.length === 0 ? (
        <p className="font-body-md text-body-md text-on-surface-variant">Todavía no hay usuarios registrados.</p>
      ) : (
        <>
        {/* Movil: tarjetas, para que "+1 Sello" quede siempre a mano. */}
        <ul className="sm:hidden flex flex-col gap-space-sm">
          {data.usuarios.map((u) => (
            <li key={u.id} className="bg-surface-container-low rounded-xl shadow-lg p-space-md flex flex-col gap-space-sm">
              <div className="flex items-start justify-between gap-space-sm">
                <div className="min-w-0">
                  <p className="font-body-md text-body-md text-on-surface font-medium">
                    {u.nombre} {u.apellido || ""}
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant break-all">{u.email || "-"}</p>
                </div>
                <RolControl u={u} />
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                <span className="text-primary font-semibold">{u.sellos}</span> sellos ·{" "}
                {u.listo_para_canjear ? <span className="text-primary">¡Listo para canjear!</span> : <>faltan {u.faltan}</>}
              </p>
              <div className="flex gap-space-sm">
                <button
                  className="flex-1 border border-outline-variant rounded-lg py-2 text-secondary font-label-sm text-label-sm uppercase tracking-wider"
                  onClick={() => agregarSello(u.id)}
                  type="button"
                >
                  +1 Sello
                </button>
                {u.listo_para_canjear && (
                  <button
                    className="flex-1 bg-primary text-on-primary rounded-lg py-2 font-label-sm text-label-sm uppercase tracking-wider font-bold"
                    onClick={() => canjear(u.id)}
                    type="button"
                  >
                    Canjear
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
        <div className="hidden sm:block w-full overflow-x-auto bg-surface-container-low rounded-xl shadow-lg">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container font-label-sm text-label-sm text-secondary uppercase tracking-widest">
                <th className="py-space-sm px-space-md">Nombre</th>
                <th className="py-space-sm px-space-md">Email</th>
                <th className="py-space-sm px-space-md">Rol</th>
                <th className="py-space-sm px-space-md">Sellos</th>
                <th className="py-space-sm px-space-md">Faltan p/ Canjear</th>
                <th className="py-space-sm px-space-md text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-body-sm">
              {data.usuarios.map((u) => (
                <tr key={u.id} className="border-t border-outline-variant/20">
                  <td className="py-space-sm px-space-md text-on-surface font-medium">
                    {u.nombre} {u.apellido || ""}
                  </td>
                  <td className="py-space-sm px-space-md text-on-surface-variant">{u.email || "-"}</td>
                  <td className="py-space-sm px-space-md">
                    <RolControl u={u} />
                  </td>
                  <td className="py-space-sm px-space-md text-primary font-semibold">{u.sellos}</td>
                  <td className="py-space-sm px-space-md">
                    {u.listo_para_canjear ? (
                      <span className="font-label-sm text-[11px] uppercase tracking-wider text-primary">¡Listo para canjear!</span>
                    ) : (
                      <span className="text-on-surface-variant">{u.faltan}</span>
                    )}
                  </td>
                  <td className="py-space-sm px-space-md text-right whitespace-nowrap">
                    <button className="text-secondary hover:text-primary font-label-sm text-label-sm uppercase tracking-wider" onClick={() => agregarSello(u.id)} type="button">
                      +1 Sello
                    </button>
                    {u.listo_para_canjear && (
                      <button
                        className="ml-space-sm text-primary hover:text-primary-fixed-dim font-label-sm text-label-sm uppercase tracking-wider font-bold"
                        onClick={() => canjear(u.id)}
                        type="button"
                      >
                        Canjear
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </>
  );
}
