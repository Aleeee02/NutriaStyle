import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { api, ApiError } from "../lib/api";
import { urlComoLlegar } from "../lib/mapa";
import type { CitaCalificable, Configuracion, ResenasPublicas } from "../lib/types";
import { Estrellas, EstrellasInput } from "./Estrellas";

// Resenas propias del sitio. Google no permite publicar resenas desde fuera
// de Google, asi que ademas se invita a dejarla tambien alla.
export function Resenas() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [calificacion, setCalificacion] = useState(0);
  const [comentario, setComentario] = useState("");
  const [citaId, setCitaId] = useState<string | null>(null);

  const { data } = useQuery({ queryKey: ["resenas"], queryFn: () => api.get<ResenasPublicas>("/resenas") });
  const { data: config } = useQuery({ queryKey: ["config"], queryFn: () => api.get<Configuracion>("/config") });
  const { data: calificables } = useQuery({
    queryKey: ["resenas", "calificables"],
    queryFn: () => api.get<CitaCalificable[]>("/resenas/calificables"),
    enabled: Boolean(user),
  });

  const cita = calificables?.find((c) => c.reserva_id === citaId) ?? calificables?.[0] ?? null;
  const urlGoogle = config?.resenas_google_url || urlComoLlegar();

  async function enviar() {
    if (!cita || calificacion === 0) return;
    setEnviando(true);
    setError(null);
    try {
      await api.post("/resenas", { reserva_id: cita.reserva_id, calificacion, comentario });
      setEnviado(true);
      setCalificacion(0);
      setComentario("");
      queryClient.invalidateQueries({ queryKey: ["resenas"] });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo enviar tu reseña.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="w-full py-space-3xl px-margin-mobile md:px-margin-desktop bg-surface-container-lowest" id="resenas">
      <div className="max-w-[1280px] mx-auto flex flex-col gap-space-xl">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-space-md">
          <div className="flex flex-col gap-space-2xs">
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">Lo que dicen</span>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Reseñas de Clientes</h2>
            {data?.promedio != null && (
              <div className="flex items-center gap-space-xs">
                <Estrellas valor={data.promedio} />
                <span className="font-headline-sm text-headline-sm text-primary">{data.promedio}</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  ({data.total} {data.total === 1 ? "reseña" : "reseñas"})
                </span>
              </div>
            )}
          </div>
          {urlGoogle && (
            <a
              className="self-start inline-flex items-center gap-space-xs px-space-lg py-space-sm rounded-lg bg-surface-container-high text-on-surface font-label-md text-label-md uppercase tracking-wider hover:bg-surface-container-highest transition-colors"
              href={urlGoogle}
              target="_blank"
              rel="noreferrer"
            >
              <span className="material-symbols-outlined text-[18px]">reviews</span>
              Reseñar en Google
            </a>
          )}
        </div>

        {/* Formulario: solo para quien ya asistio a una cita */}
        {enviado ? (
          <div className="flex items-start gap-space-xs p-space-md rounded-xl bg-secondary-container/40 border border-secondary/40">
            <span className="material-symbols-outlined text-primary text-[22px] shrink-0">check_circle</span>
            <p className="font-body-md text-body-md text-secondary">
              ¡Gracias por tu reseña! La publicamos apenas el salón la revise.
              {urlGoogle && (
                <>
                  {" "}
                  Si quieres, déjala también{" "}
                  <a className="text-primary hover:underline" href={urlGoogle} target="_blank" rel="noreferrer">
                    en Google
                  </a>
                  .
                </>
              )}
            </p>
          </div>
        ) : cita ? (
          <div className="flex flex-col gap-space-md p-space-lg rounded-xl bg-surface-container-low shadow-lg">
            <div className="flex flex-col gap-space-2xs">
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Califica tu última visita</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {cita.servicio} · {cita.fecha}
                {cita.barbero && <> con {cita.barbero}</>}
              </p>
              {calificables && calificables.length > 1 && (
                <select
                  aria-label="Elige la cita que quieres calificar"
                  className="mt-space-2xs self-start bg-surface-container-high text-on-surface font-body-sm text-body-sm px-space-sm py-space-2xs rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  onChange={(e) => setCitaId(e.target.value)}
                  value={cita.reserva_id}
                >
                  {calificables.map((c) => (
                    <option key={c.reserva_id} value={c.reserva_id}>
                      {c.fecha} · {c.servicio}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <EstrellasInput valor={calificacion} onChange={setCalificacion} />
            <textarea
              className="w-full px-space-md py-space-sm rounded-lg bg-surface-container-high text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
              maxLength={600}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Cuéntanos cómo te fue (opcional)"
              rows={3}
              value={comentario}
            />
            {error && <p className="font-body-sm text-body-sm text-error">{error}</p>}
            <button
              className="self-start px-space-xl py-space-sm rounded-lg bg-primary text-on-primary font-label-md text-label-md uppercase tracking-wider hover:bg-primary-fixed-dim transition-colors disabled:opacity-40"
              disabled={calificacion === 0 || enviando}
              onClick={enviar}
              type="button"
            >
              {enviando ? "Enviando…" : "Enviar reseña"}
            </button>
          </div>
        ) : (
          <p className="font-body-sm text-body-sm text-outline">
            {user
              ? "Podrás dejar tu reseña después de tu próxima visita."
              : "¿Ya te atendiste con nosotros? "}
            {!user && (
              <Link className="text-primary hover:underline" to="/login">
                Inicia sesión para dejar tu reseña
              </Link>
            )}
          </p>
        )}

        {/* Resenas publicadas */}
        {data && data.items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
            {data.items.map((r) => (
              <article key={r.id} className="flex flex-col gap-space-xs p-space-lg rounded-xl bg-surface-container-low shadow-md">
                <Estrellas valor={r.calificacion} tamano={18} />
                {r.comentario && <p className="font-body-md text-body-md text-on-surface">“{r.comentario}”</p>}
                <p className="mt-auto font-body-sm text-body-sm text-on-surface-variant">
                  <strong className="text-secondary font-medium">{r.autor}</strong> · {r.fecha}
                  {r.barbero && <> · con {r.barbero}</>}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="font-body-md text-body-md text-on-surface-variant bg-surface-container-low p-space-lg rounded-xl">
            Todavía no hay reseñas publicadas. ¡Sé el primero en dejar la tuya!
          </p>
        )}
      </div>
    </section>
  );
}
