"""QR de la cita: el cliente lo muestra y el salon marca si asistio o no.

Igual que el QR del corte de cortesia, el codigo es una firma HMAC del estado
actual de la reserva, no una fila guardada. Al marcar la asistencia el estado
cambia y la firma deja de coincidir, asi que el mismo QR no sirve dos veces.
"""

import hashlib
import hmac
from datetime import timedelta

from fastapi import HTTPException

from app.supabase_client import SUPABASE_SERVICE_ROLE_KEY, get_supabase_admin
from app.tiempo import ahora

CODIGO_INVALIDO = "Esta cita ya fue registrada o el código no es válido."

# Estados desde los que todavia se puede registrar la llegada del cliente.
ESTADOS_ABIERTOS = ("pendiente", "confirmada")

# Estado final segun lo que haya pasado con la cita.
ESTADO_ASISTIO = "completada"
ESTADO_NO_ASISTIO = "no_asistio"
ESTADO_CANCELADA = "cancelada"

# Margen tras la hora de fin antes de dar la cita por perdida.
MARGEN_NO_ASISTIO = timedelta(minutes=30)


def _clave() -> bytes:
    return hashlib.sha256(f"nutria-style-asistencia:{SUPABASE_SERVICE_ROLE_KEY}".encode()).digest()


def _firma(reserva: dict) -> str:
    mensaje = f"{reserva['id']}:{reserva['estado']}:{reserva['fecha']}:{reserva['hora_inicio']}".encode()
    return hmac.new(_clave(), mensaje, hashlib.sha256).hexdigest()[:32]


def generar_codigo(reserva: dict | None) -> str | None:
    """Codigo para el QR de la cita, o None si ya no se puede registrar."""
    if not reserva or reserva.get("estado") not in ESTADOS_ABIERTOS:
        return None
    return f"{reserva['id']}.{_firma(reserva)}"


def _reserva_desde_codigo(codigo: str) -> dict:
    reserva_id, _, firma = codigo.strip().partition(".")
    if not reserva_id or not firma:
        raise HTTPException(status_code=410, detail=CODIGO_INVALIDO)

    try:
        rows = (
            get_supabase_admin()
            .table("reservas")
            .select("*, usuarios(nombre, apellido, email), servicios(nombre, precio), empleados(nombre, apellido)")
            .eq("id", reserva_id)
            .limit(1)
            .execute()
            .data
        )
    except Exception:
        rows = []  # id que no es UUID: codigo invalido
    if not rows or rows[0]["estado"] not in ESTADOS_ABIERTOS or not hmac.compare_digest(firma, _firma(rows[0])):
        raise HTTPException(status_code=410, detail=CODIGO_INVALIDO)
    return rows[0]


def _resumen(reserva: dict) -> dict:
    cliente = reserva.get("usuarios") or {}
    tarjeta = (
        get_supabase_admin()
        .table("tarjetas_fidelizacion")
        .select("sellos")
        .eq("usuario_id", reserva["usuario_id"])
        .limit(1)
        .execute()
        .data
    )
    return {
        "reserva_id": reserva["id"],
        "cliente": f"{cliente.get('nombre', '')} {cliente.get('apellido') or ''}".strip() or "Cliente",
        "email": cliente.get("email"),
        "usuario_id": reserva["usuario_id"],
        "servicio": (reserva.get("servicios") or {}).get("nombre"),
        "precio": (reserva.get("servicios") or {}).get("precio"),
        "barbero": f"{(reserva.get('empleados') or {}).get('nombre', '')} {(reserva.get('empleados') or {}).get('apellido') or ''}".strip(),
        "fecha": reserva["fecha"],
        "hora_inicio": reserva["hora_inicio"][:5],
        "estado": reserva["estado"],
        "sellos": tarjeta[0]["sellos"] if tarjeta else 0,
    }


def vista_previa(codigo: str) -> dict:
    """Datos de la cita que ve el barbero/admin antes de registrar la llegada."""
    return _resumen(_reserva_desde_codigo(codigo))


def registrar(codigo: str, asistio: bool) -> dict:
    """Marca la cita como completada o como no_asistio.

    El update exige que el estado siga siendo el leido: si dos personas
    escanean el mismo QR a la vez, solo la primera lo registra.
    """
    reserva = _reserva_desde_codigo(codigo)
    nuevo_estado = ESTADO_ASISTIO if asistio else ESTADO_NO_ASISTIO

    actualizada = (
        get_supabase_admin()
        .table("reservas")
        .update({"estado": nuevo_estado})
        .eq("id", reserva["id"])
        .eq("estado", reserva["estado"])
        .execute()
        .data
    )
    if not actualizada:
        raise HTTPException(status_code=410, detail=CODIGO_INVALIDO)

    return {**_resumen({**reserva, "estado": nuevo_estado}), "estado": nuevo_estado}


def cancelar_reserva(reserva_id: str, usuario_id: str) -> dict:
    """Cancelacion hecha por el propio cliente desde su cuenta."""
    admin = get_supabase_admin()
    rows = admin.table("reservas").select("*").eq("id", reserva_id).eq("usuario_id", usuario_id).limit(1).execute().data
    if not rows:
        raise HTTPException(status_code=404, detail="No encontramos esa cita en tu cuenta.")

    reserva = rows[0]
    if reserva["estado"] not in ESTADOS_ABIERTOS:
        raise HTTPException(status_code=400, detail=f"Esta cita ya está {reserva['estado']}.")

    cancelada = (
        admin.table("reservas")
        .update({"estado": ESTADO_CANCELADA})
        .eq("id", reserva_id)
        .eq("estado", reserva["estado"])
        .execute()
        .data
    )
    if not cancelada:
        raise HTTPException(status_code=409, detail="La cita cambió mientras la cancelabas. Vuelve a intentarlo.")
    return cancelada[0]


def marcar_no_asistidas() -> int:
    """Pasa a no_asistio las citas cuya hora ya paso sin registrarse.

    Se llama al abrir la agenda del panel y la tarjeta del cliente: asi la
    lista queda al dia sin necesitar una tarea programada aparte.
    """
    limite = ahora() - MARGEN_NO_ASISTIO
    fecha = limite.date().isoformat()
    hora = limite.strftime("%H:%M:%S")

    actualizadas = (
        get_supabase_admin()
        .table("reservas")
        .update({"estado": ESTADO_NO_ASISTIO})
        .in_("estado", list(ESTADOS_ABIERTOS))
        .or_(f"fecha.lt.{fecha},and(fecha.eq.{fecha},hora_fin.lt.{hora})")
        .execute()
        .data
    )
    return len(actualizadas)
