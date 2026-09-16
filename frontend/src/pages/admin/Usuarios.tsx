import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { api, ApiError } from "../../lib/api";
import type { UsuarioAdmin } from "../../lib/types";

type UsuariosData = { usuarios: UsuarioAdmin[]; sellos_meta: number };
const USUARIOS_KEY = ["admin", "usuarios"];

export default function AdminUsuarios() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const { data, isLoading, isError } = useQuery({
    queryKey: USUARIOS_KEY,
    queryFn: () => api.get<UsuariosData>("/admin/usuarios"),
  });

  // Cada accion se refleja en pantalla al instante y la peticion corre por
  // detras (el servidor tarda ~1-2 s). Si falla, se recarga la lista real.
  // Solo se vuelve a pedir la lista cuando no queda ninguna accion en curso:
  // con varios clics seguidos, recargar a mitad haria "saltar" el contador.
  const pendientes = useRef(0);

  function editarLocal(id: string, cambio: (u: UsuarioAdmin, meta: number) => Partial<UsuarioAdmin>) {
    queryClient.setQueryData<UsuariosData>(USUARIOS_KEY, (prev) =>
      prev && {
        ...prev,
        usuarios: prev.usuarios.map((u) => {
          if (u.id !== id) return u;
          const actualizado = { ...u, ...cambio(u, prev.sellos_meta) };
          actualizado.faltan = Math.max(0, prev.sellos_meta - actualizado.sellos);
          actualizado.listo_para_canjear = actualizado.sellos >= prev.sellos_meta;
          return actualizado;
        }),
      }
    );
  }

  async function ejecutar(cambioLocal: () => void, peticion: () => Promise<unknown>, mensajeError: string) {
    setError(null);
    pendientes.current += 1;
    // Primero se cancela cualquier recarga en vuelo (si llegara despues,
    // pisaria el cambio optimista) y recien entonces se aplica el cambio.
    await queryClient.cancelQueries({ queryKey: USUARIOS_KEY });
    cambioLocal();
    try {
      await peticion();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : mensajeError);
    } finally {
      pendientes.current -= 1;
      if (pendientes.current === 0) {
        queryClient.invalidateQueries({ queryKey: USUARIOS_KEY });
      }
    }
  }

  function agregarSello(id: string) {
    ejecutar(
      () => editarLocal(id, (u) => ({ sellos: u.sellos + 1 })),
      () => api.post(`/admin/usuarios/${id}/sello`),
      "No se pudo agregar el sello."
    );
  }

  function canjear(id: string) {
    ejecutar(
      () => editarLocal(id, (u, meta) => ({ sellos: Math.max(0, u.sellos - meta) })),
      () => api.post(`/admin/usuarios/${id}/canjear`),
      "No se pudo canjear."
    );
  }

  function cambiarRol(id: string, rol: string) {
    ejecutar(
      () => editarLocal(id, () => ({ rol })),
      () => api.put(`/admin/usuarios/${id}/rol`, { rol }),
      "No se pudo cambiar el rol."
    );
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

      {error && (
        <div className="p-space-sm rounded-lg bg-error-container/20 border border-error/40 text-error font-body-sm text-body-sm">
          {error} Se recargaron los datos reales.
        </div>
      )}

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
