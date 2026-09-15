import urllib.parse
from datetime import date
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse, RedirectResponse, Response

from app.admin import router as admin_router
from app.auth import (
    SESSION_COOKIE,
    get_current_user,
    is_admin_user,
    require_login,
    serialize_user,
)
from app.configuracion import get_configuracion
from app.constants import SELLOS_META
from app.disponibilidad import calcular_slots_disponibles, hora_fin_desde_inicio
from app.profiles import ensure_user_profile
from app.schemas import LoginBody, RegistroBody, ReservaCreateBody, SessionBody
from app.supabase_client import SUPABASE_URL, get_supabase, get_supabase_admin

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR.parent / "frontend"
DIST_DIR = FRONTEND_DIR / "dist"

app = FastAPI(title="NutriaSyle API")

app.include_router(admin_router)

SESSION_MAX_AGE = 60 * 60 * 24 * 7  # 7 dias


def _set_session_cookie(response: Response, access_token: str) -> None:
    response.set_cookie(
        SESSION_COOKIE,
        access_token,
        httponly=True,
        samesite="lax",
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
    return {**serialize_user(user), "is_admin": is_admin_user(user)}


@app.post("/api/auth/login")
def api_login(body: LoginBody):
    try:
        result = get_supabase().auth.sign_in_with_password({"email": body.email, "password": body.password})
    except Exception:
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos.")

    ensure_user_profile(result.user)

    response = JSONResponse({**serialize_user(result.user), "is_admin": is_admin_user(result.user)})
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

    ensure_user_profile(result.user, nombre=body.nombre, apellido=body.apellido, telefono=body.telefono)

    if result.session:
        response = JSONResponse({**serialize_user(result.user), "is_admin": False})
        _set_session_cookie(response, result.session.access_token)
        return response

    return {"pending_confirmation": True}


@app.post("/api/auth/logout")
def api_logout():
    response = JSONResponse({"ok": True})
    response.delete_cookie(SESSION_COOKIE)
    return response


@app.get("/login/google")
def login_google(request: Request):
    redirect_to = str(request.base_url).rstrip("/") + "/auth/callback"
    params = urllib.parse.urlencode({"provider": "google", "redirect_to": redirect_to})
    return RedirectResponse(url=f"{SUPABASE_URL}/auth/v1/authorize?{params}")


@app.post("/api/auth/session")
def api_auth_session(body: SessionBody):
    try:
        result = get_supabase().auth.get_user(body.access_token)
    except Exception:
        raise HTTPException(status_code=401, detail="Token inválido")

    ensure_user_profile(result.user)

    response = JSONResponse({**serialize_user(result.user), "is_admin": is_admin_user(result.user)})
    _set_session_cookie(response, body.access_token)
    return response


# ---------- Fidelizacion ----------


@app.get("/api/fidelizacion/me")
def api_fidelizacion_me(user=Depends(require_login)):
    admin = get_supabase_admin()

    tarjeta_rows = admin.table("tarjetas_fidelizacion").select("*").eq("usuario_id", user.id).limit(1).execute().data
    tarjeta = tarjeta_rows[0] if tarjeta_rows else None

    hoy = date.today().isoformat()
    proxima_rows = (
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
    )

    historial = (
        admin.table("reservas")
        .select("*, servicios(nombre, precio), empleados(nombre, apellido)")
        .eq("usuario_id", user.id)
        .order("fecha", desc=True)
        .order("hora_inicio", desc=True)
        .limit(10)
        .execute()
        .data
    )

    return {
        "tarjeta": tarjeta,
        "sellos_meta": SELLOS_META,
        "proxima_cita": proxima_rows[0] if proxima_rows else None,
        "historial": historial,
    }


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


# ---------- SPA (build de React) ----------

if DIST_DIR.exists():

    @app.get("/{full_path:path}")
    def spa_catch_all(full_path: str):
        candidate = DIST_DIR / full_path
        if full_path and candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(DIST_DIR / "index.html")
