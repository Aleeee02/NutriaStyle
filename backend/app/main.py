import os
import urllib.parse
from datetime import date

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse, Response

from app.admin import router as admin_router
from app.auth import (
    SESSION_COOKIE,
    get_current_user,
    require_login,
    require_staff,
    serialize_user,
)
from app.canjes import canjear_codigo, generar_codigo, vista_previa
from app.concurrencia import en_paralelo
from app.configuracion import get_configuracion
from app.constants import SELLOS_META
from app.disponibilidad import calcular_slots_disponibles, hora_fin_desde_inicio
from app.profiles import ensure_user_profile
from app.schemas import CanjeBody, LoginBody, PerfilBody, RegistroBody, ReservaCreateBody, SessionBody
from app.supabase_client import SUPABASE_URL, get_supabase, get_supabase_admin

# URL del frontend (React en Vercel). En local, el proxy de Vite hace que
# todo sea "same-origin" y esto no se usa para las llamadas normales, pero
# sigue haciendo falta para saber a donde mandar de vuelta el login de Google.
#
# Se admite una lista separada por comas y se limpia la barra final: el header
# "Origin" del navegador nunca la lleva, asi que un valor como
# "https://mi-app.vercel.app/" jamas haria match y romperia todo el CORS.
def _parse_origins(raw: str) -> list[str]:
    return [o.strip().rstrip("/") for o in raw.split(",") if o.strip()]


_ORIGINS = _parse_origins(os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173"))

# Origen principal: a donde se vuelve tras el login de Google.
FRONTEND_ORIGIN = _ORIGINS[0] if _ORIGINS else "http://localhost:5173"
_SECURE_COOKIE = FRONTEND_ORIGIN.startswith("https://")

# Los deploys de preview de Vercel usan subdominios generados
# (nutria-style-git-rama-usuario.vercel.app). Se aceptan tambien para no tener
# que registrar cada uno a mano, junto con localhost para desarrollo.
CORS_ORIGIN_REGEX = r"https://nutria-?style[a-z0-9\-]*\.vercel\.app|http://localhost:\d+"

app = FastAPI(title="Nutria Style API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_ORIGINS,
    allow_origin_regex=CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(admin_router)

SESSION_MAX_AGE = 60 * 60 * 24 * 7  # 7 dias


def _set_session_cookie(response: Response, access_token: str) -> None:
    response.set_cookie(
        SESSION_COOKIE,
        access_token,
        httponly=True,
        # Vercel reenvia /api/* a Render, asi que para el navegador la cookie
        # es del mismo dominio que la pagina: Lax basta y protege de CSRF.
        # (Con dominios distintos, Safari/iPhone la bloquea como de terceros.)
        samesite="lax",
        secure=_SECURE_COOKIE,
        max_age=SESSION_MAX_AGE,
    )


# ---------- Publico ----------


@app.get("/api/config")
def api_config():
    return get_configuracion()


@app.get("/api/categorias")
def api_categorias():
    admin = get_supabase_admin()
    return admin.table("categorias_servicio").select("*").eq("activo", True).order("nombre").execute().data


@app.get("/api/servicios")
def api_servicios():
    admin = get_supabase_admin()
    return admin.table("servicios").select("*").eq("activo", True).order("nombre").execute().data


@app.get("/api/empleados")
def api_empleados():
    admin = get_supabase_admin()
    return admin.table("empleados").select("*").eq("activo", True).order("nombre").execute().data


@app.get("/api/disponibilidad")
def api_disponibilidad(empleado_id: str, fecha: str, duracion_minutos: int):
    return {"slots": calcular_slots_disponibles(empleado_id, fecha, duracion_minutos)}


# ---------- Auth ----------


@app.get("/api/auth/me")
def api_auth_me(request: Request):
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="No autenticado")
    return serialize_user(user)


@app.post("/api/auth/login")
def api_login(body: LoginBody):
    try:
        result = get_supabase().auth.sign_in_with_password({"email": body.email, "password": body.password})
    except Exception:
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos.")

    ensure_user_profile(result.user)

    response = JSONResponse(serialize_user(result.user))
    _set_session_cookie(response, result.session.access_token)
    return response


@app.post("/api/auth/registro")
def api_registro(body: RegistroBody):
    try:
        result = get_supabase().auth.sign_up(
            {
                "email": body.email,
                "password": body.password,
                "options": {"data": {"nombre": body.nombre, "apellido": body.apellido}},
            }
        )
    except Exception:
        raise HTTPException(
            status_code=400, detail="No se pudo crear la cuenta. Comprueba los datos o prueba con otro email."
        )

    # Supabase nunca crea una segunda cuenta con el mismo email, pero tampoco
    # da error: devuelve un usuario ficticio sin identidades (para no revelar
    # que el email existe). Sin este chequeo se intentaba crear el perfil de
    # ese id inexistente y el registro fallaba con un 500.
    if result.user is None or not result.user.identities:
        raise HTTPException(
            status_code=409,
            detail="Ya existe una cuenta con este email. Inicia sesión o entra con Google.",
        )

    ensure_user_profile(result.user, nombre=body.nombre, apellido=body.apellido, telefono=body.telefono)

    if result.session:
        response = JSONResponse(serialize_user(result.user))
        _set_session_cookie(response, result.session.access_token)
        return response

    return {"pending_confirmation": True}


@app.put("/api/auth/perfil")
def api_auth_perfil(body: PerfilBody, user=Depends(require_login)):
    nombre = body.nombre.strip()
    apellido = body.apellido.strip()
    telefono = body.telefono.strip()
    digitos = "".join(c for c in telefono if c.isdigit())

    if not nombre or not apellido:
        raise HTTPException(status_code=400, detail="Nombre y apellido son obligatorios.")
    if not 7 <= len(digitos) <= 15 or any(c not in "0123456789+ -()" for c in telefono):
        raise HTTPException(status_code=400, detail="Escribe un teléfono válido (solo números, puede empezar con +).")

    get_supabase_admin().table("usuarios").update(
        {"nombre": nombre, "apellido": apellido, "telefono": telefono}
    ).eq("id", user.id).execute()

    return serialize_user(user)


@app.post("/api/auth/logout")
def api_logout():
    response = JSONResponse({"ok": True})
    response.delete_cookie(
        SESSION_COOKIE,
        samesite="lax",
        secure=_SECURE_COOKIE,
    )
    return response


@app.get("/login/google")
def login_google():
    redirect_to = f"{FRONTEND_ORIGIN}/auth/callback"
    params = urllib.parse.urlencode({"provider": "google", "redirect_to": redirect_to})
    return RedirectResponse(url=f"{SUPABASE_URL}/auth/v1/authorize?{params}")


@app.post("/api/auth/session")
def api_auth_session(body: SessionBody):
    try:
        result = get_supabase().auth.get_user(body.access_token)
    except Exception:
        raise HTTPException(status_code=401, detail="Token inválido")

    ensure_user_profile(result.user)

    response = JSONResponse(serialize_user(result.user))
    _set_session_cookie(response, body.access_token)
    return response


# ---------- Fidelizacion ----------


@app.get("/api/fidelizacion/me")
def api_fidelizacion_me(user=Depends(require_login)):
    admin = get_supabase_admin()
    hoy = date.today().isoformat()

    tarjeta_rows, proxima_rows, historial = en_paralelo(
        lambda: admin.table("tarjetas_fidelizacion").select("*").eq("usuario_id", user.id).limit(1).execute().data,
        lambda: (
            admin.table("reservas")
            .select("*, servicios(nombre), empleados(nombre, apellido)")
            .eq("usuario_id", user.id)
            .gte("fecha", hoy)
            .in_("estado", ["pendiente", "confirmada"])
            .order("fecha")
            .order("hora_inicio")
            .limit(1)
            .execute()
            .data
        ),
        lambda: (
            admin.table("reservas")
            .select("*, servicios(nombre, precio), empleados(nombre, apellido)")
            .eq("usuario_id", user.id)
            .order("fecha", desc=True)
            .order("hora_inicio", desc=True)
            .limit(10)
            .execute()
            .data
        ),
    )
    tarjeta = tarjeta_rows[0] if tarjeta_rows else None

    return {
        "tarjeta": tarjeta,
        "sellos_meta": SELLOS_META,
        "proxima_cita": proxima_rows[0] if proxima_rows else None,
        "historial": historial,
        "codigo_canje": generar_codigo(tarjeta),
    }


@app.get("/api/fidelizacion/codigo")
def api_fidelizacion_codigo(user=Depends(require_login)):
    """Version liviana para consultar seguido mientras el QR esta en pantalla."""
    rows = (
        get_supabase_admin()
        .table("tarjetas_fidelizacion")
        .select("id, sellos")
        .eq("usuario_id", user.id)
        .limit(1)
        .execute()
        .data
    )
    tarjeta = rows[0] if rows else None
    return {"sellos": tarjeta["sellos"] if tarjeta else 0, "codigo_canje": generar_codigo(tarjeta)}


# ---------- Canje con QR (admin o barbero) ----------


@app.get("/api/canje")
def api_canje_vista_previa(codigo: str, user=Depends(require_staff)):
    return vista_previa(codigo)


@app.post("/api/canje")
def api_canje_confirmar(body: CanjeBody, user=Depends(require_staff)):
    staff = serialize_user(user)
    return canjear_codigo(body.codigo, f"{staff['display_name']} ({staff['rol']})")


# ---------- Reservas ----------


@app.post("/api/reservas")
def api_reservas_crear(body: ReservaCreateBody, user=Depends(require_login)):
    admin = get_supabase_admin()
    servicio = admin.table("servicios").select("duracion_minutos").eq("id", body.servicio_id).single().execute().data
    duracion_minutos = servicio["duracion_minutos"]

    slots_libres = calcular_slots_disponibles(body.empleado_id, body.fecha, duracion_minutos)
    if body.hora_inicio not in slots_libres:
        raise HTTPException(status_code=409, detail="Ese horario ya no está disponible. Elige otro.")

    fila = (
        admin.table("reservas")
        .insert(
            {
                "usuario_id": user.id,
                "empleado_id": body.empleado_id,
                "servicio_id": body.servicio_id,
                "fecha": body.fecha,
                "hora_inicio": body.hora_inicio + ":00",
                "hora_fin": hora_fin_desde_inicio(body.hora_inicio, duracion_minutos),
                "estado": "pendiente",
                "observaciones": body.observaciones,
            }
        )
        .execute()
        .data
    )
    return fila[0]


@app.get("/")
def health_check():
    # Se incluyen los origenes permitidos para poder diagnosticar problemas de
    # CORS en produccion sin tener que entrar al panel de Render. Son URLs
    # publicas, no hay nada sensible aqui.
    return {
        "status": "ok",
        "service": "Nutria Style API",
        "cors_origins": _ORIGINS,
    }
