import threading
import time
from types import SimpleNamespace

import jwt
from fastapi import HTTPException, Request

from app.supabase_client import SUPABASE_URL, get_supabase

SESSION_COOKIE = "sb_access_token"

# Roles que atienden en el salon y pueden, por ejemplo, canjear QR de clientes.
STAFF_ROLES = ("admin", "barbero")

# El proyecto firma los tokens con claves asimetricas (ES256) publicadas en
# JWKS, asi que la firma se verifica aqui mismo sin preguntarle a Supabase en
# cada request (cada ida y vuelta a la base en Sao Paulo cuesta ~0.5-1 s).
# PyJWKClient guarda las claves en memoria y solo vuelve a pedirlas si llega
# un token firmado con una clave nueva.
_jwks_client = jwt.PyJWKClient(f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json", cache_keys=True, lifespan=3600)
_ISSUER = f"{SUPABASE_URL}/auth/v1"


def _usuario_desde_token_local(token: str):
    signing_key = _jwks_client.get_signing_key_from_jwt(token)
    claims = jwt.decode(
        token,
        signing_key.key,
        algorithms=["ES256", "RS256"],
        audience="authenticated",
        issuer=_ISSUER,
    )
    return SimpleNamespace(
        id=claims["sub"],
        email=claims.get("email"),
        user_metadata=claims.get("user_metadata") or {},
    )


def get_current_user(request: Request):
    """Devuelve el usuario autenticado en esta request, o None."""
    token = request.cookies.get(SESSION_COOKIE)
    if not token:
        return None

    try:
        return _usuario_desde_token_local(token)
    except jwt.ExpiredSignatureError:
        return None
    except Exception:
        # Token con otro formato (p. ej. firmado con el secreto HS256 antiguo,
        # sin kid en JWKS): se valida contra Supabase como antes.
        pass

    try:
        response = get_supabase().auth.get_user(token)
    except Exception:
        return None

    return response.user if response else None


# El rol se consulta en cada request de admin/staff. Cambia muy rara vez, asi
# que se recuerda unos segundos por proceso; al cambiarlo desde el panel se
# borra de la cache al instante.
_ROL_TTL_SEGUNDOS = 30
_rol_cache: dict[str, tuple[str, float]] = {}
_rol_lock = threading.Lock()


def get_user_role(user_id: str) -> str:
    """Rol de la fila usuarios (cliente/barbero/admin). Usa el cliente admin para saltarse RLS."""
    from app.supabase_client import get_supabase_admin

    ahora = time.monotonic()
    with _rol_lock:
        cacheado = _rol_cache.get(user_id)
    if cacheado and ahora - cacheado[1] < _ROL_TTL_SEGUNDOS:
        return cacheado[0]

    result = get_supabase_admin().table("usuarios").select("rol").eq("id", user_id).execute()
    rol = (result.data[0].get("rol") or "cliente") if result.data else "cliente"
    with _rol_lock:
        _rol_cache[user_id] = (rol, ahora)
    return rol


def olvidar_rol(user_id: str) -> None:
    with _rol_lock:
        _rol_cache.pop(user_id, None)


def is_admin_user(user) -> bool:
    return bool(user and get_user_role(user.id) == "admin")


def serialize_user(user) -> dict:
    """Datos del usuario para el frontend. El perfil sale de la tabla usuarios
    (fuente de verdad y editable), no de user_metadata de Auth."""
    from app.supabase_client import get_supabase_admin

    rows = (
        get_supabase_admin().table("usuarios").select("nombre, apellido, telefono, rol").eq("id", user.id).execute().data
    )
    perfil = rows[0] if rows else {}
    nombre = perfil.get("nombre") or ""
    apellido = perfil.get("apellido") or ""
    rol = perfil.get("rol") or "cliente"

    return {
        "id": user.id,
        "email": user.email,
        "user_metadata": user.user_metadata or {},
        "display_name": f"{nombre} {apellido}".strip() or user.email,
        "nombre": nombre,
        "apellido": apellido,
        "telefono": perfil.get("telefono") or "",
        "perfil_completo": bool(nombre and apellido and perfil.get("telefono")),
        "rol": rol,
        "is_admin": rol == "admin",
        "is_staff": rol in STAFF_ROLES,
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


def require_staff(request: Request):
    """Dependencia para endpoints JSON: admin o barbero, o 401/403."""
    user = require_login(request)
    if get_user_role(user.id) not in STAFF_ROLES:
        raise HTTPException(status_code=403, detail="No autorizado")
    return user
