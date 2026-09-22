"""Fecha y hora del salon (Iquitos, Peru).

El servidor de Render corre en UTC: usar datetime.now() hacia que a las 19:00
de Iquitos el sistema ya creyera que era el dia siguiente.
"""

from datetime import datetime
from zoneinfo import ZoneInfo

ZONA = ZoneInfo("America/Lima")


def ahora() -> datetime:
    return datetime.now(ZONA)


def hoy_iso() -> str:
    return ahora().date().isoformat()
