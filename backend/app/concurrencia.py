"""Consultas a Supabase en paralelo.

Cada consulta es una ida y vuelta por red de ~0.5-1 s (la base esta en Sao
Paulo), asi que las que no dependen entre si se lanzan juntas.
"""

from concurrent.futures import ThreadPoolExecutor
from typing import Any, Callable

_executor = ThreadPoolExecutor(max_workers=8, thread_name_prefix="supabase")


def en_paralelo(*funciones: Callable[[], Any]) -> list[Any]:
    """Ejecuta las funciones a la vez y devuelve sus resultados en orden."""
    futuros = [_executor.submit(f) for f in funciones]
    return [f.result() for f in futuros]

