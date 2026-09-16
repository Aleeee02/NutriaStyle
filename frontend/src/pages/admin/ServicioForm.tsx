import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import type { Categoria, Servicio } from "../../lib/types";

export default function AdminServicioForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const editando = Boolean(id);

  const { data: categorias } = useQuery({ queryKey: ["categorias"], queryFn: () => api.get<Categoria[]>("/categorias") });
  const { data: servicio } = useQuery({
    queryKey: ["admin", "servicios", id],
    queryFn: () => api.get<Servicio>(`/admin/servicios/${id}`),
    enabled: editando,
  });

  const [form, setForm] = useState({
    nombre: "",
    categoria_id: "",
    descripcion: "",
    precio: "",
    duracion_minutos: "",
    imagen_url: "",
    activo: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (servicio) {
      setForm({
        nombre: servicio.nombre,
        categoria_id: servicio.categoria_id,
        descripcion: servicio.descripcion ?? "",
        precio: String(servicio.precio),
        duracion_minutos: String(servicio.duracion_minutos),
        imagen_url: servicio.imagen_url ?? "",
        activo: servicio.activo,
      });
    } else if (categorias && categorias.length > 0 && !form.categoria_id) {
      setForm((f) => ({ ...f, categoria_id: categorias[0].id }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servicio, categorias]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const body = {
      nombre: form.nombre,
      categoria_id: form.categoria_id,
      descripcion: form.descripcion || null,
      precio: parseFloat(form.precio),
      duracion_minutos: parseInt(form.duracion_minutos, 10),
      imagen_url: form.imagen_url || null,
      activo: editando ? form.activo : undefined,
    };
    try {
      if (editando) {
        await api.put(`/admin/servicios/${id}`, body);
      } else {
        await api.post("/admin/servicios", body);
      }
      navigate("/admin/servicios");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl w-full mx-auto flex flex-col gap-space-lg">
      <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold">
        {editando ? "Editar Servicio" : "Nuevo Servicio"}
      </h1>

      <form className="flex flex-col gap-space-md bg-surface-container-low p-space-lg rounded-xl shadow-lg" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-space-2xs">
          <label className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Nombre</label>
          <input
            className="w-full px-space-md py-space-sm rounded-lg bg-surface-container-high text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
            required
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
          />
        </div>

        <div className="flex flex-col gap-space-2xs">
          <label className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Categoría</label>
          <select
            className="w-full px-space-md py-space-sm rounded-lg bg-surface-container-high text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
            required
            value={form.categoria_id}
            onChange={(e) => setForm((f) => ({ ...f, categoria_id: e.target.value }))}
          >
            {categorias?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-space-2xs">
          <label className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Descripción</label>
          <textarea
            className="w-full px-space-md py-space-sm rounded-lg bg-surface-container-high text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            rows={3}
            value={form.descripcion}
            onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-space-sm">
          <div className="flex flex-col gap-space-2xs">
            <label className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Precio (S/)</label>
            <input
              className="w-full px-space-md py-space-sm rounded-lg bg-surface-container-high text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
              type="number"
              min={0}
              step="0.01"
              required
              value={form.precio}
              onChange={(e) => setForm((f) => ({ ...f, precio: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-space-2xs">
            <label className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Duración (min)</label>
            <input
              className="w-full px-space-md py-space-sm rounded-lg bg-surface-container-high text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
              type="number"
              min={1}
              step="1"
              required
              value={form.duracion_minutos}
              onChange={(e) => setForm((f) => ({ ...f, duracion_minutos: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex flex-col gap-space-2xs">
          <label className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">URL de imagen (opcional)</label>
          <input
            className="w-full px-space-md py-space-sm rounded-lg bg-surface-container-high text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
            value={form.imagen_url}
            onChange={(e) => setForm((f) => ({ ...f, imagen_url: e.target.value }))}
          />
        </div>

        {editando && (
          <label className="flex items-center gap-space-xs font-label-md text-label-md text-on-surface-variant">
            <input type="checkbox" checked={form.activo} onChange={(e) => setForm((f) => ({ ...f, activo: e.target.checked }))} />
            Servicio activo (visible en el sitio)
          </label>
        )}

        <div className="flex items-center gap-space-sm mt-space-xs">
          <button
            className="px-space-lg py-space-sm rounded-lg bg-primary text-on-primary font-headline-sm text-[15px] font-bold uppercase tracking-wider hover:bg-primary-fixed-dim transition-colors disabled:opacity-50"
            disabled={saving}
            type="submit"
          >
            Guardar
          </button>
          <button
            className="font-label-md text-label-md uppercase tracking-wider text-outline hover:text-primary transition-colors"
            onClick={() => navigate("/admin/servicios")}
            type="button"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
