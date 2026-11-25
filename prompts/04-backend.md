# 04 — Backend (FastAPI + Supabase)

## What I needed
The real backend: database tables, demo data, every API endpoint from the architecture, admin JWT protection, product images, and tests.

## Decision made first
Backend before frontend. The API was already designed, so React can be built against real data instead of placeholders.

## Prompt
```
ROLE: You are a senior Python backend engineer who builds clean, secure FastAPI
services on Supabase.

CONTEXT:
- Design to follow exactly: docs/architecture.md (tables, functions, endpoints,
  auth flow, env vars, folder structure) and docs/requirements.md (FR/NFR IDs,
  business rules, validation rules, demo data plan).
- Supabase project already exists. Admin login uses Supabase Auth JWTs.
- Prices are whole PKR.

TASK: Build the backend in backend/.
1. supabase/schema.sql: tables, constraints, sequences, RLS on every table
   (no public policies), place_order() and update_order_status() functions,
   a public "product-images" storage bucket.
2. supabase/seed.sql: the fictional demo data from requirements.md section 5.
3. FastAPI app: every endpoint in the architecture API table, Pydantic
   validation, require_admin JWT check, CORS from env, clear error codes.
4. scripts/upload_images.py: download 12 free Unsplash/Pexels photos (one per
   product) and upload them to Storage, saving image_url and image_credit.
   Show me the photo list before uploading.
5. tests/: pytest tests for validation, stock rules, status transitions,
   auth (401/403), plus a check that the seeded data follows the demo data
   rules in requirements.md.

CONSTRAINTS:
- Secrets only from environment variables; create .env.example with placeholders.
- Never trust prices from the client; totals come from the database.
- No card fields, no real customer data.
- Keep the code simple and readable, with short comments only where needed.

OUTPUT FORMAT: The files above, then a short list of the exact steps I need to
do in Supabase and the commands to run the API and tests locally.
Stop after that and wait for my review before the frontend.
```

## Context engineering example
The demo-data rules and business rules in `docs/requirements.md` (12 products, 4 categories, price range, stock mix, shipping rule, status flow) were given to the AI as context. `tests/test_seed_data.py` then checks the **live Supabase data** against those same rules. So what the AI produced was verified against real application data, not taken on trust.

## Changes I made during the build
| My instruction | What changed |
|---|---|
| "No need to create a virtual environment" | Dependencies install into my existing Python 3.14, and package versions were raised to ones that support 3.14 |
| "Add this Legacy JWT secret… used only to verify JWTs" | `app/auth.py` now checks admin tokens locally (HS256 signature, expiry, `authenticated` audience) and falls back to Supabase Auth only for non-HS256 tokens. Added tests for real, expired, wrong-audience and forged tokens |
| Gave the new `sb_secret_…` key and asked if it is the service role key | Yes, it's Supabase's new secret-key format. Put it in `backend/.env` only (git-ignored) |
| "Where are the photos?" | Photos were downloaded to a local preview folder for review. See the problems below |

## Problems found and how they were fixed
- **Unsplash blocked automated search (403).** Switched to Openverse, a search engine for openly licensed images (CC0 / CC BY).
- **Wikimedia Commons refused connections.** That photo source was dropped.
- **Wrong credits.** The first list had guessed photographer page links and shortened titles. Fixed: links now use Flickr's official `photo.gne?id=` form, and titles are the originals, as CC BY requires.
- **Wrong photos.** The AI chose photos by title only. When the photos were actually looked at, 4 of 12 were wrong (the "earbuds" photo was a handwritten diagram, the "office chair" was a sofa armchair, the lamp was a blurry abstract shot, and the ring download was blocked). They are being replaced. Lesson: always check AI-picked content visually.
- **Admin login failed with "Email logins are disabled".** In Supabase the whole Email provider had been turned off instead of just "Allow new users to sign up". This is a settings fix in the dashboard, not a code change.

## Implementation mapping
| Area | Files |
|---|---|
| Database | `backend/supabase/schema.sql`, `backend/supabase/seed.sql` |
| API app | `backend/app/main.py`, `config.py`, `db.py`, `schemas.py`, `pricing.py` |
| Auth (JWT) | `backend/app/auth.py` |
| Endpoints | `backend/app/routers/products.py`, `orders.py`, `admin.py` |
| Images | `backend/scripts/upload_images.py`, `backend/scripts/images.json` |
| Tests | `backend/tests/` (validation, auth, seed data, business rules) |
| Deploy config | `render.yaml`, `.env.example`, `.gitignore` |

## Verification (run on 25 Nov 2026)
- `python -m pytest -q` → **27 passed, 1 skipped** (the skipped test writes a real order and only runs with `RUN_WRITE_TESTS=1`)
- API running locally: `/api/health` → ok. `/api/products?category=Audio` → 3 products with correct stock status. `/api/admin/stats` without a token → 401
- Real admin login (after re-enabling the Email provider): sign-in 200, token type ES256 (so the `auth.get_user` fallback path is used), `/admin/me` → 401 with no token, 401 with a bad token, 200 with the real token
- Photos: see [04b-product-images.md](04b-product-images.md)

## My check
-
