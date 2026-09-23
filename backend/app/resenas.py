"""Resenas propias del salon.

Google no permite publicar resenas desde fuera de Google (su API solo deja
leerlas), asi que las calificaciones del sitio se guardan aqui. Solo puede
opinar quien tuvo una cita completada, una resena por cita, y el salon las
aprueba antes de que se vean.
"""

from fastapi import HTTPException

from app.supabase_client import get_supabase_admin

# Mientras no exista la tabla en Supabase (se crea con un CREATE TABLE), la
# API responde vacio en vez de romper el sitio.
_TABLA_FALTANTE = ("does not exist", "PGRST205", "schema cache")


def _tabla_faltante(error: Exception) -> bool:
    texto = str(error)
    return any(p in texto for p in _TABLA_FALTANTE)


def _nombre_publico(usuario: dict | None) -> str:
    """'Miguel Salazar' -> 'Miguel S.' para no publicar el apellido completo."""
    if not usuario:
        return "Cliente"
    nombre = (usuario.get("nombre") or "Cliente").strip()
    apellido = (usuario.get("apellido") or "").strip()
    return f"{nombre} {apellido[0]}." if apellido else nombre


def listar_publicas() -> dict:
    try:
        filas = (
            get_supabase_admin()
            .table("resenas")
            .select("id, calificacion, comentario, created_at, usuarios(nombre, apellido), empleados(nombre)")
            .eq("aprobada", True)
            .order("created_at", desc=True)
            .limit(30)
            .execute()
            .data
        )
    except Exception as e:
        if _tabla_faltante(e):
            return {"promedio": None, "total": 0, "items": []}
        raise

    items = [
        {
            "id": f["id"],
            "autor": _nombre_publico(f.get("usuarios")),
            "calificacion": f["calificacion"],
            "comentario": f.get("comentario"),
            "fecha": (f.get("created_at") or "")[:10],
            "barbero": (f.get("empleados") or {}).get("nombre"),
        }
        for f in filas
    ]
    promedio = round(sum(i["calificacion"] for i in items) / len(items), 1) if items else None
    return {"promedio": promedio, "total": len(items), "items": items}


def citas_calificables(usuario_id: str) -> list[dict]:
    """Citas completadas del cliente que todavia no tienen resena."""
    admin = get_supabase_admin()
    reservas = (
        admin.table("reservas")
        .select("id, fecha, hora_inicio, servicios(nombre), empleados(nombre, apellido)")
        .eq("usuario_id", usuario_id)
        .eq("estado", "completada")
        .order("fecha", desc=True)
        .limit(5)
        .execute()
        .data
    )
    if not reservas:
        return []

    try:
        ya_calificadas = {
            r["reserva_id"]
            for r in admin.table("resenas").select("reserva_id").eq("usuario_id", usuario_id).execute().data
        }
    except Exception as e:
        if not _tabla_faltante(e):
            raise
        ya_calificadas = set()

    return [
        {
            "reserva_id": r["id"],
            "fecha": r["fecha"],
            "hora_inicio": r["hora_inicio"][:5],
            "servicio": (r.get("servicios") or {}).get("nombre"),
            "barbero": f"{(r.get('empleados') or {}).get('nombre', '')} {(r.get('empleados') or {}).get('apellido') or ''}".strip(),
        }
        for r in reservas
        if r["id"] not in ya_calificadas
    ]


def crear(usuario_id: str, reserva_id: str, calificacion: int, comentario: str | None) -> dict:
    if not 1 <= calificacion <= 5:
        raise HTTPException(status_code=400, detail="La calificación debe ser de 1 a 5 estrellas.")

    admin = get_supabase_admin()
    reserva = (
        admin.table("reservas")
        .select("id, empleado_id, estado")
        .eq("id", reserva_id)
        .eq("usuario_id", usuario_id)
        .limit(1)
        .execute()
        .data
    )
    if not reserva:
        raise HTTPException(status_code=404, detail="No encontramos esa cita en tu cuenta.")
    if reserva[0]["estado"] != "completada":
        raise HTTPException(status_code=400, detail="Solo puedes calificar una cita a la que hayas asistido.")

    texto = (comentario or "").strip()[:600] or None
    try:
        fila = (
            admin.table("resenas")
            .insert(
                {
                    "usuario_id": usuario_id,
                    "reserva_id": reserva_id,
                    "empleado_id": reserva[0]["empleado_id"],
                    "calificacion": calificacion,
                    "comentario": texto,
                    "aprobada": False,
                }
            )
            .execute()
            .data
        )
    except Exception as e:
        if "duplicate key" in str(e) or "resenas_reserva" in str(e):
            raise HTTPException(status_code=409, detail="Ya calificaste esa cita. ¡Gracias!")
        if _tabla_faltante(e):
            raise HTTPException(status_code=503, detail="Las reseñas todavía no están habilitadas. Inténtalo más tarde.")
        raise

    return {"ok": True, "pendiente_de_aprobacion": True, "resena": fila[0]}


# ---------- Panel ----------


def listar_para_admin() -> list[dict]:
    try:
        filas = (
            get_supabase_admin()
            .table("resenas")
            .select("*, usuarios(nombre, apellido, email), empleados(nombre, apellido)")
            .order("created_at", desc=True)
            .limit(200)
            .execute()
            .data
        )
    except Exception as e:
        if _tabla_faltante(e):
            return []
        raise
    return filas


def cambiar_aprobacion(resena_id: str, aprobada: bool) -> dict:
    filas = get_supabase_admin().table("resenas").update({"aprobada": aprobada}).eq("id", resena_id).execute().data
    if not filas:
        raise HTTPException(status_code=404, detail="Reseña no encontrada")
    return filas[0]


def eliminar(resena_id: str) -> dict:
    get_supabase_admin().table("resenas").delete().eq("id", resena_id).execute()
    return {"ok": True}
