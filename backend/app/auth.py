import jwt
from fastapi import Header, HTTPException, status

from .config import get_settings
from .db import get_db


def verify_token(token: str) -> str | None:
    """Return the email inside a valid Supabase access token, or None.

    HS256 tokens are checked locally with the project's JWT secret (signature, expiry,
    audience). Any other algorithm falls back to asking Supabase Auth directly.
    """
    secret = get_settings().supabase_jwt_secret
    try:
        alg = jwt.get_unverified_header(token).get("alg")
    except jwt.PyJWTError:
        return None

    if secret and alg == "HS256":
        try:
            claims = jwt.decode(token, secret, algorithms=["HS256"], audience="authenticated")
        except jwt.PyJWTError:
            return None
        return (claims.get("email") or "").lower() or None

    try:
        res = get_db().auth.get_user(token)
    except Exception:
        return None
    user = getattr(res, "user", None)
    return (user.email or "").lower() if user else None


def require_admin(authorization: str | None = Header(default=None)) -> str:
    """FastAPI dependency for every /api/admin route."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing admin token. Please log in.")

    email = verify_token(authorization.split(" ", 1)[1].strip())
    if not email:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Session expired or invalid. Please log in again.")

    if email not in get_settings().admin_email_set:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "This account is not an admin.")
    return email
