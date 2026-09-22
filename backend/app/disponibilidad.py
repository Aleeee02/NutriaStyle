from datetime import datetime

from app.supabase_client import get_supabase_admin
from app.tiempo import ahora as ahora_local

SLOT_STEP_MINUTES = 15


def _dia_semana_postgres(fecha_iso: str) -> int:
    """0=Domingo .. 6=Sabado, igual que EXTRACT(DOW) en Postgres."""
    fecha = datetime.strptime(fecha_iso, "%Y-%m-%d").date()
    return (fecha.weekday() + 1) % 7


def hhmm_a_minutos(hhmm: str) -> int:
    h, m, *_ = hhmm.split(":")
    return int(h) * 60 + int(m)


def minutos_a_hhmm(minutos: int) -> str:
    return f"{minutos // 60:02d}:{minutos % 60:02d}"


def hora_fin_desde_inicio(hora_inicio: str, duracion_minutos: int) -> str:
    return minutos_a_hhmm(hhmm_a_minutos(hora_inicio) + duracion_minutos) + ":00"


def calcular_slots_disponibles(empleado_id: str, fecha_iso: str, duracion_minutos: int) -> list[str]:
    admin = get_supabase_admin()
    dia_semana = _dia_semana_postgres(fecha_iso)

    bloques = (
        admin.table("horarios_empleado")
        .select("hora_inicio, hora_fin")
        .eq("empleado_id", empleado_id)
        .eq("dia_semana", dia_semana)
        .eq("activo", True)
        .execute()
        .data
    )
    if not bloques:
        return []

    reservas_existentes = (
        admin.table("reservas")
        .select("hora_inicio, hora_fin")
        .eq("empleado_id", empleado_id)
        .eq("fecha", fecha_iso)
        .neq("estado", "cancelada")
        .execute()
        .data
    )
    ocupados = [
        (hhmm_a_minutos(r["hora_inicio"]), hhmm_a_minutos(r["hora_fin"])) for r in reservas_existentes
    ]

    # Hora del salon (Iquitos), no la del servidor, que corre en UTC.
    ahora = ahora_local()
    es_hoy = fecha_iso == ahora.strftime("%Y-%m-%d")
    minuto_actual = ahora.hour * 60 + ahora.minute

    slots: list[str] = []
    for bloque in bloques:
        inicio = hhmm_a_minutos(bloque["hora_inicio"])
        fin = hhmm_a_minutos(bloque["hora_fin"])
        cursor = inicio
        while cursor + duracion_minutos <= fin:
            fin_slot = cursor + duracion_minutos
            en_el_pasado = es_hoy and cursor <= minuto_actual
            se_solapa = any(cursor < o_fin and fin_slot > o_inicio for o_inicio, o_fin in ocupados)
            if not en_el_pasado and not se_solapa:
                slots.append(minutos_a_hhmm(cursor))
            cursor += SLOT_STEP_MINUTES

    return slots
