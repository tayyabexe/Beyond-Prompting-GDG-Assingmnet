from functools import lru_cache

from supabase import Client, create_client

from .config import get_settings


@lru_cache
def get_db() -> Client:
    """Supabase client using the service_role key. Server-side only — never sent to the browser."""
    s = get_settings()
    return create_client(s.supabase_url, s.supabase_service_role_key)
