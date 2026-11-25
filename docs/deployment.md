# Deployment

## How it is hosted
| Part | Platform | Notes |
|---|---|---|
| Frontend (React + Vite) | **Vercel** | static build from `frontend/`; `frontend/vercel.json` sends every route to `index.html` so links like `/product/…` and `/admin` work on refresh |
| Backend (FastAPI) | **Render** free web service | set up by `render.yaml` (Blueprint) |
| Database, photo storage, admin login | **Supabase** | already set up (schema + seed run, 12 photos uploaded) |

```
Browser ──► Vercel (React)  ──► Render (FastAPI /api) ──► Supabase Postgres + Storage
   └──── admin login ────────────────────────────────────► Supabase Auth (publishable key)
```

Secrets are only typed into the Render and Vercel dashboards. Nothing secret is in the repo (`.env` files are git-ignored; `.env.example` has placeholders).

## 1. Backend on Render
1. Log in to [render.com](https://render.com) with GitHub.
2. **New → Blueprint**, pick the GitHub repo. Render reads `render.yaml`:
   - root directory `backend`
   - build `pip install -r requirements.txt`
   - start `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - health check `/api/health`, Python 3.12.7, free plan
3. Render asks for the values marked `sync: false`. Copy them from your local `backend/.env`:

| Name | Value |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase **secret** key (`sb_secret_…`). Only here, never in the frontend |
| `SUPABASE_JWT_SECRET` | legacy JWT secret (optional; without it the backend checks tokens with Supabase) |
| `ADMIN_EMAILS` | the admin email (comma-separated if more than one) |
| `CORS_ORIGINS` | for now `http://localhost:5173`; changed to the Vercel URL in step 3 |

4. **Apply** and wait for the deploy to show "Live".
5. Open `https://<your-service>.onrender.com/api/health`. It should return `{"status":"ok"}`. `/docs` shows the API.

(Without a Blueprint: **New → Web Service**, pick the repo, and type the same root directory, commands and env vars by hand.)

## 2. Frontend on Vercel
1. Log in to [vercel.com](https://vercel.com) with GitHub → **Add New → Project** → import the repo.
2. **Root Directory: `frontend`**. Framework preset: **Vite**. Build `npm run build`, output `dist` (defaults).
3. Environment variables (all public values, they end up in the browser):

| Name | Value |
|---|---|
| `VITE_API_URL` | `https://<your-service>.onrender.com/api` |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase **publishable** key (`sb_publishable_…`) |

4. **Deploy**. Note the URL, e.g. `https://<project>.vercel.app`.

## 3. Connect them (CORS)
The backend only accepts requests from the websites listed in `CORS_ORIGINS`.
1. Render → service → **Environment** → set `CORS_ORIGINS` to
   `https://<project>.vercel.app,http://localhost:5173` (no trailing slash).
2. Save. Render redeploys by itself.

Vercel preview URLs (a different URL for each branch) are not on the list. Use the main production URL.

## 4. Supabase
- Admin login uses email + password only (no email links), so no redirect URLs are needed. Optionally set **Authentication → URL Configuration → Site URL** to the Vercel URL.
- Sign-ups stay **off**. Only the account in `ADMIN_EMAILS` can use the CRM.

## Free-tier note (cold start)
Render's free service goes to sleep after about 15 minutes without traffic. The first request after that can take up to a minute. The frontend shows "Waking up the server…" while it waits. Open the site once before a demo.

## Verification checklist after deploying
- [ ] `/api/health` on Render returns ok
- [ ] Vercel home page shows categories and product photos
- [ ] Refreshing `/shop` or `/product/…` doesn't give a 404
- [ ] Add to cart → checkout (Cash on Delivery) → confirmation page with an order ID
- [ ] `/admin/login` → log in → the new order is in Orders → change its status
- [ ] No CORS errors in the browser console

## Attempt log
| Step | Result |
|---|---|
| Code pushed to GitHub | (to fill after deploying) |
| Render deploy | (to fill after deploying) |
| Backend URL | (to fill after deploying) |
| Vercel deploy | (to fill after deploying) |
| Frontend URL | (to fill after deploying) |
| CORS updated + full flow checked on the live site | (to fill after deploying) |
| Problems hit and how they were fixed | (to fill after deploying) |

## Run locally instead
See the [README](../README.md#run-it-locally).
