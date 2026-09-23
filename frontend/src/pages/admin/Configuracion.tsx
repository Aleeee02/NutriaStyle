import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import type { Configuracion } from "../../lib/types";

const EMPTY: Configuracion = {
  nombre_barberia: "",
  telefono_whatsapp: "",
  direccion: "",
  horario: "",
  instagram_url: "",
  facebook_url: "",
  tiktok_url: "",
  mision: "",
  vision: "",
};

export default function AdminConfiguracion() {
  const queryClient = useQueryClient();
  const { data: config } = useQuery({ queryKey: ["admin", "configuracion"], queryFn: () => api.get<Configuracion | null>("/admin/configuracion") });
  const [form, setForm] = useState<Configuracion>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (config) {
      setForm({
        nombre_barberia: config.nombre_barberia ?? "",
        telefono_whatsapp: config.telefono_whatsapp ?? "",
        direccion: config.direccion ?? "",
        horario: config.horario ?? "",
        instagram_url: config.instagram_url ?? "",
        facebook_url: config.facebook_url ?? "",
        tiktok_url: config.tiktok_url ?? "",
        mision: config.mision ?? "",
        vision: config.vision ?? "",
      });
    }
  }, [config]);

  function update(field: keyof Configuracion) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await api.put("/admin/configuracion", form);
      setSaved(true);
      queryClient.invalidateQueries({ queryKey: ["config"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "configuracion"] });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl w-full mx-auto flex flex-col gap-space-lg">
      <div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold">Configuración del Negocio</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Estos datos alimentan el pie de página y los enlaces de contacto en todo el sitio.
        </p>
      </div>

      {saved && (
        <div className="p-space-sm rounded-lg bg-secondary-container/40 border border-secondary/40 text-secondary font-body-sm text-body-sm">
          Guardado correctamente.
        </div>
      )}

      <form className="flex flex-col gap-space-md bg-surface-container-low p-space-lg rounded-xl shadow-lg" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-space-2xs">
          <label className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Nombre de la barbería</label>
          <input
            className="w-full px-space-md py-space-sm rounded-lg bg-surface-container-high text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
            required
            value={form.nombre_barberia}
            onChange={update("nombre_barberia")}
          />
        </div>

        <div className="flex flex-col gap-space-2xs">
          <label className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">WhatsApp (con código de país, solo números)</label>
          <input
            className="w-full px-space-md py-space-sm rounded-lg bg-surface-container-high text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="51999999999"
            value={form.telefono_whatsapp ?? ""}
            onChange={update("telefono_whatsapp")}
          />
        </div>

        <div className="flex flex-col gap-space-2xs">
          <label className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Dirección</label>
          <input
            className="w-full px-space-md py-space-sm rounded-lg bg-surface-container-high text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
            value={form.direccion ?? ""}
            onChange={update("direccion")}
          />
        </div>

        <div className="flex flex-col gap-space-2xs">
          <label className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Horario de atención</label>
          <input
            className="w-full px-space-md py-space-sm rounded-lg bg-surface-container-high text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Lunes a Sábado, 09:00 - 20:00"
            value={form.horario ?? ""}
            onChange={update("horario")}
          />
        </div>

        <div className="flex flex-col gap-space-2xs">
          <label className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">TikTok (URL)</label>
          <input
            className="w-full px-space-md py-space-sm rounded-lg bg-surface-container-high text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="https://www.tiktok.com/@tu_barberia"
            value={form.tiktok_url ?? ""}
            onChange={update("tiktok_url")}
          />
        </div>

        <div className="grid grid-cols-2 gap-space-sm">
          <div className="flex flex-col gap-space-2xs">
            <label className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Instagram (URL)</label>
            <input
              className="w-full px-space-md py-space-sm rounded-lg bg-surface-container-high text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="https://instagram.com/tu_barberia"
              value={form.instagram_url ?? ""}
              onChange={update("instagram_url")}
            />
          </div>
          <div className="flex flex-col gap-space-2xs">
            <label className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Facebook (URL)</label>
            <input
              className="w-full px-space-md py-space-sm rounded-lg bg-surface-container-high text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="https://facebook.com/tu_barberia"
              value={form.facebook_url ?? ""}
              onChange={update("facebook_url")}
            />
          </div>
        </div>

        <div className="flex flex-col gap-space-2xs">
          <label className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Misión (opcional)</label>
          <textarea
            className="w-full px-space-md py-space-sm rounded-lg bg-surface-container-high text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            rows={2}
            value={form.mision ?? ""}
            onChange={update("mision")}
          />
        </div>
        <div className="flex flex-col gap-space-2xs">
          <label className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Visión (opcional)</label>
          <textarea
            className="w-full px-space-md py-space-sm rounded-lg bg-surface-container-high text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            rows={2}
            value={form.vision ?? ""}
            onChange={update("vision")}
          />
        </div>

        <button
          className="self-start px-space-lg py-space-sm rounded-lg bg-primary text-on-primary font-headline-sm text-[15px] font-bold uppercase tracking-wider hover:bg-primary-fixed-dim transition-colors disabled:opacity-50"
          disabled={saving}
          type="submit"
        >
          Guardar
        </button>
      </form>
    </div>
  );
}
