"""Unit tests: admin routes need a valid Supabase JWT from an allowed email."""

import time

import jwt
import pytest

import app.auth as auth
from app.config import get_settings

TEST_SECRET = "unit-test-secret-that-is-long-enough-for-hs256"


def make_token(email="admin@example.com", aud="authenticated", exp_in=3600, secret=TEST_SECRET):
    return jwt.encode({"email": email, "aud": aud, "exp": int(time.time()) + exp_in,
                       "role": "authenticated"}, secret, algorithm="HS256")


@pytest.fixture
def jwt_admin(monkeypatch):
    s = get_settings()
    monkeypatch.setattr(s, "supabase_jwt_secret", TEST_SECRET)
    monkeypatch.setattr(s, "admin_emails", "admin@example.com")


def test_real_hs256_token_is_accepted(unit_client, jwt_admin):
    res = unit_client.get("/api/admin/me", headers={"Authorization": f"Bearer {make_token()}"})
    assert res.status_code == 200 and res.json() == {"email": "admin@example.com"}


@pytest.mark.parametrize("token_kwargs", [
    {"exp_in": -10},                  # expired
    {"aud": "anon"},                  # wrong audience
    {"secret": "a-different-secret-that-is-also-long-enough"},  # forged signature
])
def test_bad_tokens_are_rejected(unit_client, jwt_admin, token_kwargs):
    res = unit_client.get("/api/admin/me", headers={"Authorization": f"Bearer {make_token(**token_kwargs)}"})
    assert res.status_code == 401


def test_no_token_gives_401(unit_client):
    assert unit_client.get("/api/admin/stats").status_code == 401


def test_invalid_token_gives_401(unit_client, monkeypatch):
    monkeypatch.setattr(auth, "verify_token", lambda token: None)
    res = unit_client.get("/api/admin/me", headers={"Authorization": "Bearer garbage"})
    assert res.status_code == 401


def test_valid_token_but_not_admin_gives_403(unit_client, monkeypatch):
    monkeypatch.setattr(get_settings(), "admin_emails", "admin@example.com")
    monkeypatch.setattr(auth, "verify_token", lambda token: "stranger@example.com")
    res = unit_client.get("/api/admin/me", headers={"Authorization": "Bearer some.jwt.token"})
    assert res.status_code == 403


def test_admin_token_is_accepted(unit_client, monkeypatch):
    monkeypatch.setattr(get_settings(), "admin_emails", "Admin@Example.com")
    monkeypatch.setattr(auth, "verify_token", lambda token: "admin@example.com")
    res = unit_client.get("/api/admin/me", headers={"Authorization": "Bearer some.jwt.token"})
    assert res.status_code == 200
    assert res.json() == {"email": "admin@example.com"}
