import os
import threading
from pathlib import Path

import httpx
from dotenv import load_dotenv
from supabase import Client, ClientOptions, create_client

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

_client: Client | None = None
_admin_client: Client | None = None
_lock = threading.Lock()


def _crear_cliente(key: str) -> Client:
    """create_client con un cliente HTTP/1.1 propio.

    supabase-py crea sus clientes httpx con http2=True. La implementacion
    HTTP/2 de httpcore corta requests con "Server disconnected" cuando hay
    varias a la vez (hilos del servidor + consultas en paralelo), y ademas el
    error queda pegado a la conexion. Con HTTP/1.1 el pool de httpx es seguro
    entre hilos y reutiliza conexiones igual. Desde la 2.2x la libreria acepta
    el cliente por ClientOptions(httpx_client=...), sin tocar sus internos.

    Funciona con las claves nuevas (sb_publishable_... / sb_secret_...) y con
    las antiguas tipo JWT.
    """
    http = httpx.Client(timeout=httpx.Timeout(30.0), follow_redirects=True, http2=False)
    opciones = ClientOptions(
        httpx_client=http,
        # Es un servidor: la sesion de cada usuario viaja en su cookie, no se
        # guarda ni se refresca en este cliente compartido.
        persist_session=False,
        auto_refresh_token=False,
    )
    return create_client(SUPABASE_URL, key, options=opciones)


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
