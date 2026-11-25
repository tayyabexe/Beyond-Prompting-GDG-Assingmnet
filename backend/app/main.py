from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import get_settings
from .routers import admin, orders, products

app = FastAPI(
    title="NEXUS-COMMERCE API",
    version="1.0.0",
    description="Storefront + mini CRM API. Admin routes need a Supabase Auth JWT (Bearer).",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origin_list,
    allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.exception_handler(RequestValidationError)
async def field_errors(_: Request, exc: RequestValidationError):
    """Turn Pydantic errors into {"detail": {"field_errors": {"email": "..."}}} for the forms."""
    errors: dict[str, str] = {}
    for e in exc.errors():
        loc = [str(p) for p in e["loc"] if p not in ("body", "query", "path")]
        field = ".".join(loc) or "body"
        errors.setdefault(field, e["msg"].removeprefix("Value error, "))
    return JSONResponse(status_code=422, content={"detail": {"field_errors": errors}})


app.include_router(products.router, prefix="/api")
app.include_router(orders.router, prefix="/api")
app.include_router(admin.router, prefix="/api")


@app.get("/", include_in_schema=False)
def root():
    return {"name": "NEXUS-COMMERCE API", "docs": "/docs", "health": "/api/health"}
