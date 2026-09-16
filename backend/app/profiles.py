from app.supabase_client import get_supabase_admin


def nombre_apellido_desde_metadata(user) -> tuple[str, str | None]:
    """Nombre y apellido a partir de los datos de Supabase Auth.

    El registro por email guarda "nombre"/"apellido" en user_metadata, pero
    Google solo manda el nombre completo ("full_name"/"name"). En ese caso la
    primera palabra es el nombre y el resto el apellido; el cliente lo puede
    corregir despues en "Completa tu perfil".
    """
    metadata = user.user_metadata or {}
    if metadata.get("nombre"):
        return metadata["nombre"], metadata.get("apellido")

    completo = (metadata.get("full_name") or metadata.get("name") or "").strip()
    if completo:
        partes = completo.split(maxsplit=1)
        return partes[0], partes[1] if len(partes) > 1 else None

    return (user.email or "").split("@")[0], None


def ensure_user_profile(user, nombre: str | None = None, apellido: str | None = None, telefono: str | None = None) -> None:
    """Crea la fila en usuarios/tarjetas_fidelizacion si a este usuario de auth aun le faltan.

    Si la fila ya existe, solo rellena huecos (apellido vacio, o un nombre que
    en realidad es el email): nunca pisa datos que el cliente ya escribio.
    """
    admin = get_supabase_admin()
    meta_nombre, meta_apellido = nombre_apellido_desde_metadata(user)

    existing = admin.table("usuarios").select("nombre, apellido, telefono").eq("id", user.id).execute()
    if not existing.data:
        admin.table("usuarios").insert(
            {
                "id": user.id,
                "nombre": nombre or meta_nombre,
                "apellido": apellido or meta_apellido,
                "email": user.email,
                "telefono": telefono or (user.user_metadata or {}).get("telefono"),
            }
        ).execute()
    else:
        fila = existing.data[0]
        cambios = {}
        if not fila.get("nombre") or fila.get("nombre") == user.email:
            cambios["nombre"] = meta_nombre
        if not fila.get("apellido") and meta_apellido:
            cambios["apellido"] = meta_apellido
        if cambios:
            admin.table("usuarios").update(cambios).eq("id", user.id).execute()

    tarjeta = admin.table("tarjetas_fidelizacion").select("id").eq("usuario_id", user.id).execute()
    if not tarjeta.data:
        admin.table("tarjetas_fidelizacion").insert({"usuario_id": user.id}).execute()
