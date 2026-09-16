import os
import threading
from pathlib import Path

import httpx
from dotenv import load_dotenv
from supabase import Client, create_client

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

_client: Client | None = None
_admin_client: Client | None = None
_lock = threading.Lock()


def _crear_cliente(key: str) -> Client:
    """create_client, pero con HTTP/1.1 en vez de HTTP/2.

    supabase-py 2.11 fija http2=True en sus clientes httpx. La implementacion
    HTTP/2 de httpcore corta requests con "Server disconnected" cuando hay
    varias a la vez (hilos del servidor + consultas en paralelo), y ademas el
    error queda pegado a la conexion. Con HTTP/1.1 el pool de httpx es seguro
    entre hilos y reutiliza conexiones igual.
    """
    client = create_client(SUPABASE_URL, key)

    pg = client.postgrest
    anterior = pg.session
    pg.session = httpx.Client(
        base_url=anterior.base_url,
        headers=anterior.headers,
        timeout=anterior.timeout,
        follow_redirects=True,
        http2=False,
    )
    anterior.close()

    # auth y auth.admin comparten el mismo cliente httpx: se cambian los dos.
    auth_http = client.auth._http_client
    nuevo_auth_http = httpx.Client(timeout=auth_http.timeout, follow_redirects=True, http2=False)
    client.auth._http_client = nuevo_auth_http
    client.auth.admin._http_client = nuevo_auth_http
    auth_http.close()
    return client


def get_supabase() -> Client:
    """Cliente Supabase compartido por toda la app (usa la anon key, respeta RLS)."""
    global _client

    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise RuntimeError(
            "Faltan SUPABASE_URL y/o SUPABASE_ANON_KEY. "
            "Copia .env.example a .env y rellena tus credenciales."
        )

    with _lock:
        if _client is None:
            _client = _crear_cliente(SUPABASE_ANON_KEY)
    return _client


def get_supabase_admin() -> Client:
    """Cliente con la service_role key: solo para tareas de servidor que deben saltarse RLS."""
    global _admin_client

    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise RuntimeError(
            "Falta SUPABASE_SERVICE_ROLE_KEY en el .env para tareas de servidor."
        )

    with _lock:
        if _admin_client is None:
            _admin_client = _crear_cliente(SUPABASE_SERVICE_ROLE_KEY)
    return _admin_client
