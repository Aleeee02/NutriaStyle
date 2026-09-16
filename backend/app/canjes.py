"""Codigos QR de un solo uso para canjear el corte de cortesia.

No se guarda el codigo en ninguna tabla: es una firma HMAC del estado actual
de la tarjeta (sellos + cantidad de movimientos). Al canjear se inserta un
movimiento y bajan los sellos, asi que la firma deja de coincidir y el mismo
QR ya no sirve nunca mas. El siguiente ciclo genera un codigo distinto.
"""

import hashlib
import hmac

from fastapi import HTTPException

from app.constants import SELLOS_META
from app.supabase_client import SUPABASE_SERVICE_ROLE_KEY, get_supabase_admin

CODIGO_INVALIDO = "Este código ya fue canjeado o ya no es válido."


def _clave() -> bytes:
    # Derivada de la service_role key (ya es secreta y existe en Render), para
    # no exigir otra variable de entorno. Si se rota la key, los QR pendientes
    # simplemente se regeneran al abrir la tarjeta.
    return hashlib.sha256(f"nutria-style-canje:{SUPABASE_SERVICE_ROLE_KEY}".encode()).digest()


def _version(tarjeta: dict) -> str:
    movimientos = (
        get_supabase_admin()
        .table("movimientos_fidelizacion")
        .select("id", count="exact")
        .eq("tarjeta_id", tarjeta["id"])
        .limit(1)
        .execute()
        .count
    )
    return f"{tarjeta['sellos']}:{movimientos or 0}"


def _firma(tarjeta: dict) -> str:
    mensaje = f"{tarjeta['id']}:{_version(tarjeta)}".encode()
    return hmac.new(_clave(), mensaje, hashlib.sha256).hexdigest()[:32]


def generar_codigo(tarjeta: dict | None) -> str | None:
    """Codigo para el QR del cliente, o None si aun no puede canjear."""
    if not tarjeta or tarjeta.get("sellos", 0) < SELLOS_META:
        return None
    return f"{tarjeta['id']}.{_firma(tarjeta)}"


def _tarjeta_desde_codigo(codigo: str) -> dict:
    tarjeta_id, _, firma = codigo.strip().partition(".")
    if not tarjeta_id or not firma:
        raise HTTPException(status_code=410, detail=CODIGO_INVALIDO)

    try:
        rows = get_supabase_admin().table("tarjetas_fidelizacion").select("*").eq("id", tarjeta_id).limit(1).execute().data
    except Exception:
        # Un id que no es UUID hace fallar la consulta: es un codigo invalido.
        rows = []
    if not rows or rows[0]["sellos"] < SELLOS_META or not hmac.compare_digest(firma, _firma(rows[0])):
        raise HTTPException(status_code=410, detail=CODIGO_INVALIDO)
    return rows[0]


def vista_previa(codigo: str) -> dict:
    """Datos que ve el barbero/admin antes de confirmar el canje."""
    tarjeta = _tarjeta_desde_codigo(codigo)
    cliente = (
        get_supabase_admin()
        .table("usuarios")
        .select("nombre, apellido, email")
        .eq("id", tarjeta["usuario_id"])
        .limit(1)
        .execute()
        .data
    )
    return {"cliente": cliente[0] if cliente else None, "sellos": tarjeta["sellos"], "sellos_meta": SELLOS_META}


def canjear_tarjeta(tarjeta: dict, descripcion: str) -> int:
    """Descuenta SELLOS_META y deja el movimiento. Devuelve los sellos restantes.

    El update exige que los sellos sigan siendo los leidos: si dos personas
    escanean a la vez, solo el primero canjea y el segundo recibe el error.
    """
    admin = get_supabase_admin()
    nuevo_total = tarjeta["sellos"] - SELLOS_META
    actualizado = (
        admin.table("tarjetas_fidelizacion")
        .update({"sellos": nuevo_total})
        .eq("id", tarjeta["id"])
        .eq("sellos", tarjeta["sellos"])
        .execute()
        .data
    )
    if not actualizado:
        raise HTTPException(status_code=410, detail=CODIGO_INVALIDO)

    admin.table("movimientos_fidelizacion").insert(
        {"tarjeta_id": tarjeta["id"], "tipo": "uso", "cantidad": -SELLOS_META, "descripcion": descripcion}
    ).execute()
    return nuevo_total


def canjear_codigo(codigo: str, canjeado_por: str) -> dict:
    tarjeta = _tarjeta_desde_codigo(codigo)
    restantes = canjear_tarjeta(tarjeta, f"Corte de cortesía canjeado con QR por {canjeado_por}")
    return {"ok": True, "sellos": restantes}
