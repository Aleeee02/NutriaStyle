import os
from pathlib import Path

from dotenv import load_dotenv
from supabase import Client, create_client

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

_client: Client | None = None
_admin_client: Client | None = None


def get_supabase() -> Client:
    """Cliente Supabase compartido por toda la app (usa la anon key, respeta RLS)."""
    global _client

    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise RuntimeError(
            "Faltan SUPABASE_URL y/o SUPABASE_ANON_KEY. "
            "Copia .env.example a .env y rellena tus credenciales."
        )

    if _client is None:
        _client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

    return _client


def get_supabase_admin() -> Client:
    """Cliente con la service_role key: solo para tareas de servidor que deben saltarse RLS."""
    global _admin_client

    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise RuntimeError(
            "Falta SUPABASE_SERVICE_ROLE_KEY en el .env para tareas de servidor."
        )

    if _admin_client is None:
        _admin_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    return _admin_client
