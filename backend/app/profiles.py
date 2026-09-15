from app.supabase_client import get_supabase_admin


def ensure_user_profile(user, nombre: str | None = None, apellido: str | None = None, telefono: str | None = None) -> None:
    """Crea la fila en usuarios/tarjetas_fidelizacion si a este usuario de auth aun le faltan."""
    admin = get_supabase_admin()

    existing = admin.table("usuarios").select("id").eq("id", user.id).execute()
    if not existing.data:
        metadata = user.user_metadata or {}
        admin.table("usuarios").insert(
            {
                "id": user.id,
                "nombre": nombre or metadata.get("nombre") or user.email,
                "apellido": apellido or metadata.get("apellido"),
                "email": user.email,
                "telefono": telefono or metadata.get("telefono"),
            }
        ).execute()

    tarjeta = admin.table("tarjetas_fidelizacion").select("id").eq("usuario_id", user.id).execute()
    if not tarjeta.data:
        admin.table("tarjetas_fidelizacion").insert({"usuario_id": user.id}).execute()
