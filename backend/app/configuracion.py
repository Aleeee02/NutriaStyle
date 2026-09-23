from app.supabase_client import get_supabase_admin

_DEFAULTS = {
    "nombre_barberia": "Nutria Style",
    "telefono_whatsapp": None,
    "direccion": None,
    "horario": None,
    "instagram_url": None,
    "facebook_url": None,
    "tiktok_url": None,
}


def get_configuracion() -> dict:
    """Fila unica de configuracion del negocio. Se llama desde las plantillas."""
    rows = get_supabase_admin().table("configuracion").select("*").eq("activo", True).limit(1).execute().data
    if not rows:
        return dict(_DEFAULTS)
    row = dict(_DEFAULTS)
    row.update(rows[0])
    return row
