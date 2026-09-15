from fastapi import HTTPException, Request

from app.supabase_client import get_supabase

SESSION_COOKIE = "sb_access_token"


def get_current_user(request: Request):
    """Devuelve el usuario de Supabase autenticado en esta request, o None."""
    token = request.cookies.get(SESSION_COOKIE)
    if not token:
        return None

    try:
        response = get_supabase().auth.get_user(token)
    except Exception:
        return None

    return response.user if response else None


def get_user_role(user_id: str) -> str:
    """Rol de la fila usuarios (cliente/barbero/admin). Usa el cliente admin para saltarse RLS."""
    from app.supabase_client import get_supabase_admin

    result = get_supabase_admin().table("usuarios").select("rol").eq("id", user_id).execute()
    if result.data:
        return result.data[0].get("rol") or "cliente"
    return "cliente"


def is_admin_user(user) -> bool:
    return bool(user and get_user_role(user.id) == "admin")


def get_display_name(user) -> str:
    metadata = user.user_metadata or {}
    nombre = metadata.get("nombre")
    apellido = metadata.get("apellido")
    if nombre:
        return f"{nombre} {apellido}".strip() if apellido else nombre
    return user.email


def serialize_user(user) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "user_metadata": user.user_metadata or {},
        "display_name": get_display_name(user),
    }


def require_login(request: Request):
    """Dependencia para endpoints JSON: usuario autenticado o 401."""
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="No autenticado")
    return user


def require_admin(request: Request):
    """Dependencia para endpoints JSON: usuario con rol admin o 401/403."""
    user = require_login(request)
    if get_user_role(user.id) != "admin":
        raise HTTPException(status_code=403, detail="No autorizado")
    return user
