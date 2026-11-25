import os
from pathlib import Path

import pytest
from dotenv import load_dotenv

# Real keys (if present) come from backend/.env. Without them, only unit tests run.
load_dotenv(Path(__file__).resolve().parents[1] / ".env")
_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
HAS_SUPABASE = bool(_key) and "your-" not in _key
RUN_WRITE_TESTS = os.getenv("RUN_WRITE_TESTS") == "1"

os.environ.setdefault("SUPABASE_URL", "https://placeholder.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "placeholder")

from fastapi.testclient import TestClient  # noqa: E402

from app.auth import require_admin  # noqa: E402
from app.db import get_db  # noqa: E402
from app.main import app  # noqa: E402

needs_supabase = pytest.mark.skipif(not HAS_SUPABASE, reason="needs real Supabase keys in backend/.env")


class FakeDB:
    """Stand-in for unit tests: any real database call fails loudly."""

    def __getattr__(self, name):
        raise AssertionError(f"Unit test unexpectedly touched the database ({name})")


@pytest.fixture
def unit_client():
    app.dependency_overrides[get_db] = lambda: FakeDB()
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def live_client():
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def live_admin_client():
    """Live database, admin check bypassed (auth itself is tested in test_auth.py)."""
    app.dependency_overrides[require_admin] = lambda: "test-admin@example.com"
    yield TestClient(app)
    app.dependency_overrides.clear()
