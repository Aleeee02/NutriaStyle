import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import type { Empleado } from "../../lib/types";

export default function AdminEmpleadoForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const editando = Boolean(id);

  const { data: empleado } = useQuery({
    queryKey: ["admin", "empleados", id],
    queryFn: () => api.get<Empleado>(`/admin/empleados/${id}`),
    enabled: editando,
  });

  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    descripcion: "",
    foto_url: "",
    activo: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (empleado) {
      setForm({
        nombre: empleado.nombre,
        apellido: empleado.apellido ?? "",
        telefono: empleado.telefono ?? "",
        descripcion: empleado.descripcion ?? "",
        foto_url: empleado.foto_url ?? "",
        activo: empleado.activo,
      });
    }
  }, [empleado]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const body = {
      nombre: form.nombre,
      apellido: form.apellido || null,
      telefono: form.telefono || null,
      descripcion: form.descripcion || null,
      foto_url: form.foto_url || null,
      activo: editando ? form.activo : undefined,
    };
    try {
      if (editando) {
        await api.put(`/admin/empleados/${id}`, body);
      } else {
        await api.post("/admin/empleados", body);
      }
      navigate("/admin/empleados");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl w-full mx-auto flex flex-col gap-space-lg">
      <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold">
        {editando ? "Editar Empleado" : "Nuevo Empleado"}
      </h1>

      <form className="flex flex-col gap-space-md bg-surface-container-low p-space-lg rounded-xl shadow-lg" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-space-sm">
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
            <label className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Apellido</label>
            <input
              className="w-full px-space-md py-space-sm rounded-lg bg-surface-container-high text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
              value={form.apellido}
              onChange={(e) => setForm((f) => ({ ...f, apellido: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex flex-col gap-space-2xs">
          <label className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Teléfono</label>
          <input
            className="w-full px-space-md py-space-sm rounded-lg bg-surface-container-high text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
            type="tel"
            value={form.telefono}
            onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
          />
        </div>

        <div className="flex flex-col gap-space-2xs">
          <label className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Descripción / Especialidad</label>
          <textarea
            className="w-full px-space-md py-space-sm rounded-lg bg-surface-container-high text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            rows={3}
            value={form.descripcion}
            onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
          />
        </div>

        <div className="flex flex-col gap-space-2xs">
          <label className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">URL de foto (opcional)</label>
          <input
            className="w-full px-space-md py-space-sm rounded-lg bg-surface-container-high text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
            value={form.foto_url}
            onChange={(e) => setForm((f) => ({ ...f, foto_url: e.target.value }))}
          />
        </div>

        {editando && (
          <label className="flex items-center gap-space-xs font-label-md text-label-md text-on-surface-variant">
            <input type="checkbox" checked={form.activo} onChange={(e) => setForm((f) => ({ ...f, activo: e.target.checked }))} />
            Empleado activo (visible en el sitio)
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
            onClick={() => navigate("/admin/empleados")}
            type="button"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
