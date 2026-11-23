"""Sellos de la tarjeta de fidelizacion.

Un sello se suma por cada cita completada: al marcar "Asistio" con el QR o al
pasar la cita a "completada" desde el panel. Cada movimiento lleva la marca
"[cita <id>]" en su descripcion, asi la misma cita nunca suma dos veces y, si
el admin la saca de "completada" por error, se sabe que sello devolver.
"""

from fastapi import HTTPException

from app.constants import SELLOS_META
from app.supabase_client import get_supabase_admin


def _marca(reserva_id: str) -> str:
    return f"[cita {reserva_id}]"


def _tarjeta(usuario_id: str) -> dict | None:
    filas = (
        get_supabase_admin()
        .table("tarjetas_fidelizacion")
        .select("id, sellos")
        .eq("usuario_id", usuario_id)
        .limit(1)
        .execute()
        .data
    )
    return filas[0] if filas else None


def _mover(usuario_id: str, delta: int, tipo: str, descripcion: str) -> dict:
    """Suma o resta sellos y deja el movimiento. Devuelve {"sellos", "meta"}.

    El update exige que los sellos sigan siendo los leidos: con dos cambios a
    la vez (dos clics, o QR y panel) ninguno se pierde; se reintenta.
    """
    admin = get_supabase_admin()
    for _ in range(5):
        tarjeta = _tarjeta(usuario_id)
        if not tarjeta:
            if delta < 0:
                return {"sellos": 0, "meta": SELLOS_META}
            creada = admin.table("tarjetas_fidelizacion").insert({"usuario_id": usuario_id, "sellos": delta}).execute().data
            tarjeta_id, total = creada[0]["id"], delta
            break
        total = max(0, tarjeta["sellos"] + delta)
        if total == tarjeta["sellos"]:  # restar con la tarjeta ya en 0: nada que hacer
            return {"sellos": total, "meta": SELLOS_META}
        actualizado = (
            admin.table("tarjetas_fidelizacion")
            .update({"sellos": total})
            .eq("id", tarjeta["id"])
            .eq("sellos", tarjeta["sellos"])
            .execute()
            .data
        )
        if actualizado:
            tarjeta_id = tarjeta["id"]
            break
    else:
        raise HTTPException(status_code=409, detail="La tarjeta cambió mientras se sellaba. Inténtalo de nuevo.")

    admin.table("movimientos_fidelizacion").insert(
        {"tarjeta_id": tarjeta_id, "tipo": tipo, "cantidad": delta, "descripcion": descripcion}
    ).execute()
    return {"sellos": total, "meta": SELLOS_META}


def sumar_sello_manual(usuario_id: str) -> dict:
    """"+1 Sello" del panel: para quien se atendio sin reserva."""
    return _mover(usuario_id, 1, "ganancia", "Sello agregado por el salón")


def _sellos_de_la_cita(usuario_id: str, reserva_id: str) -> int:
    """Sellos netos ya dados por esta cita (1 si ya sumo, 0 si no o si se devolvio)."""
    tarjeta = _tarjeta(usuario_id)
    if not tarjeta:
        return 0
    movimientos = (
        get_supabase_admin()
        .table("movimientos_fidelizacion")
        .select("cantidad")
        .eq("tarjeta_id", tarjeta["id"])
        .like("descripcion", f"%{_marca(reserva_id)}%")
        .execute()
        .data
    )
    return sum(m["cantidad"] for m in movimientos)


def sellar_cita(reserva: dict) -> dict | None:
    """Suma el sello de una cita completada, si aun no lo sumo."""
    if _sellos_de_la_cita(reserva["usuario_id"], reserva["id"]) >= 1:
        return None
    return _mover(reserva["usuario_id"], 1, "ganancia", f"Sello por asistir a la cita {_marca(reserva['id'])}")


def devolver_sello_cita(reserva: dict, nuevo_estado: str) -> dict | None:
    """Quita el sello de una cita que deja de estar completada (correccion del admin)."""
    if _sellos_de_la_cita(reserva["usuario_id"], reserva["id"]) < 1:
        return None
    return _mover(
        reserva["usuario_id"],
        -1,
        "ajuste",
        f"Se quita el sello: la cita pasó a {nuevo_estado} {_marca(reserva['id'])}",
    )
