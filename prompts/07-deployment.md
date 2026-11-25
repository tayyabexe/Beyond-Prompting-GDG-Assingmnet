# 07 — Deployment (GitHub, Render, Vercel)

## What I needed
Push the code to my GitHub repo and put the site online: frontend on Vercel, backend on Render, database already on Supabase.

> "we have to push to this , we have to do the deployment, now and the pushing the code"

> "deploy multiple agents, do it fast"

So deployment prep ran in parallel with testing: one agent on deployment config and docs, another on testing.

## Prompt
```
Role: deployment engineer for a React + FastAPI + Supabase student project.
Context: render.yaml, backend/app/config.py, backend/requirements.txt,
frontend/vercel.json, both .env.example files. Repo on GitHub. No CLI for
Render or Vercel, so I do those steps in the dashboards.
Task:
1. Check render.yaml: root dir backend, build/start commands, Python version
   with wheels for every dependency, health check, secrets as sync: false.
2. Check CORS accepts the Vercel URL.
3. Write docs/deployment.md with exact dashboard steps, env var names (no
   values), the CORS step, the cold-start note, a checklist and an attempt log.
4. Write the README: problem, features, stack, layout, setup commands, tests,
   security notes, links to prompts and screenshots.
Constraints: never write secret values; don't invent live URLs or results;
the Supabase secret key never goes to the frontend.
```

## Context given
- `render.yaml`, `backend/app/config.py` (env var names, comma-separated `CORS_ORIGINS`), `backend/app/main.py` (CORS middleware, `/api/health`)
- `frontend/vercel.json` (rewrite every route to `index.html`), `frontend/.env.example`
- `docs/planning.md` for the problem statement in the README

## What the check found
| Item | Result |
|---|---|
| Root dir, build and start commands | Already correct in `render.yaml` |
| Python version | 3.12.7 pinned with `PYTHON_VERSION` (local is 3.14, but 3.12 has ready-made wheels for every dependency, so the free-tier build is faster and safer) |
| Health check | `/api/health` exists and is set as `healthCheckPath` |
| Secrets | All five env vars are `sync: false`, so they are typed into the dashboard |
| CORS | `CORS_ORIGINS` takes a comma-separated list, so the Vercel URL is added there. No code change needed. Preview URLs are not allowed on purpose |
| SPA routes on Vercel | `vercel.json` rewrite already in place |

No config changes were needed.

## Steps (full detail in [docs/deployment.md](../docs/deployment.md))
1. Push the code to GitHub
2. Render → New → Blueprint → repo → enter `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `ADMIN_EMAILS`, `CORS_ORIGINS`
3. Vercel → import repo → root `frontend` → `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
4. Put the Vercel URL into `CORS_ORIGINS` on Render
5. Run the checklist on the live site

## Implementation mapping
| What | Where |
|---|---|
| Backend hosting config | `render.yaml` |
| SPA routing on Vercel | `frontend/vercel.json` |
| Deployment guide + attempt log | `docs/deployment.md` |
| Project overview and setup | `README.md` |

## Verification
- Config reviewed against the code (env names match `config.py`, health route exists).
- Live URLs and the live-site checklist will be added here and in `docs/deployment.md` once Render and Vercel finish deploying.

## My check
-
