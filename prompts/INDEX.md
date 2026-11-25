# Prompt log index

Each file records the real prompt(s) I used, the context I gave, what I changed, and what came out.

| # | Phase / feature | Prompt log | Resulting files |
|---|---|---|---|
| 00 | Kickoff and working rules | [00-kickoff.md](00-kickoff.md) | folder layout, `docs/assignment/` |
| 01 | Planning | [01-planning.md](01-planning.md) | [docs/planning.md](../docs/planning.md) |
| 02 | Requirements (FR / NFR) | [02-requirements.md](02-requirements.md) | [docs/requirements.md](../docs/requirements.md) |
| 03 | Architecture & design | [03-architecture.md](03-architecture.md) | [docs/architecture.md](../docs/architecture.md), [docs/diagrams/architecture.drawio](../docs/diagrams/architecture.drawio) |
| 04 | Backend (FastAPI + Supabase) | [04-backend.md](04-backend.md) | `backend/` |
| 04b | Product photos (search, visual check, upload) | [04b-product-images.md](04b-product-images.md) | `backend/scripts/images.json`, `upload_images.py` |
| 05 | Frontend (React) — design research + build | [05-frontend.md](05-frontend.md) | `frontend/` |
| 06 | Testing | *later* | `docs/testing.md`, `screenshots/` |
| 07 | Deployment | *later* | `docs/deployment.md`, `render.yaml` |

**Context-engineering example:** [04-backend.md](04-backend.md#context-engineering-example). The requirements' data rules were given as context, then checked against live Supabase data by `backend/tests/test_seed_data.py`.
