# NEXUS-COMMERCE

An online store with a small CRM for the seller. Built for the GDGoC CUI Wah "Beyond Prompting" capstone, with every phase planned and built through recorded prompts.

**Live site:** (added after deployment) · **API:** (added after deployment)

## The problem
Small online sellers keep product listings, customer inquiries, carts and orders in different places, so things get lost. Buyers need a simple way to find a product and check out. Sellers need one place to see customers, track each order and reply to questions. NEXUS-COMMERCE connects a customer storefront and a merchant mini-CRM to the same database.

## Features
**Storefront**
- Home page with hero, categories and featured products
- Catalog with search, category filter and sort (filters stay in the URL)
- Product page with real stock status, image credit and an "ask a question" link
- Cart (add, remove, change quantity) that survives a refresh. Prices and totals always come from the server
- Simulated checkout: Cash on Delivery or a demo payment that can be set to decline. No card fields, no real payments
- Order confirmation, contact form, friendly 404 and empty states, inline form errors
- Works on phones and desktop

**Merchant CRM** (`/admin`, login required)
- Dashboard: total orders, revenue, pending orders, open inquiries, latest orders, low stock
- Orders: filter by status, details drawer, status changes with history (cancelling puts stock back)
- Customers: searchable list with order count and total spent
- Inquiries: status changes and internal notes

## Stack
| Part | Tech |
|---|---|
| Frontend | React 19, Vite 7, React Router 7, plain CSS |
| Backend | FastAPI (Python), Pydantic |
| Database / storage / auth | Supabase (Postgres with RLS, Storage, Auth) |
| Hosting | Vercel (frontend), Render (backend) |

## Repository layout
```
backend/      FastAPI app, tests, Supabase schema + seed, image upload script
frontend/     React app
docs/         planning, requirements, architecture (+ diagram), testing, deployment
prompts/      prompt log for every phase (start at prompts/INDEX.md)
screenshots/  screenshots of the running app
render.yaml   Render Blueprint for the backend
.env.example  placeholders for every environment variable
```

## Run it locally
**Prerequisites:** Python 3.12+, Node.js 20+, a free Supabase project.

**1. Database (Supabase → SQL Editor)**
Run `backend/supabase/schema.sql`, then `backend/supabase/seed.sql`.
In Authentication, create the admin user and turn sign-ups off.

**2. Backend**
```bash
cd backend
pip install -r requirements.txt
# create backend/.env from the backend part of ../.env.example and fill in your values
python scripts/upload_images.py        # uploads the 12 product photos to Supabase Storage
python -m uvicorn app.main:app --reload --port 8000
```
API docs: http://localhost:8000/docs

**3. Frontend**
```bash
cd frontend
npm install
# create frontend/.env from frontend/.env.example (API URL, Supabase URL, publishable key)
npm run dev
```
Store: http://localhost:5173 · CRM: http://localhost:5173/admin

**Tests**
```bash
cd backend
python -m pytest            # read-only tests
RUN_WRITE_TESTS=1 python -m pytest   # also places and cancels a real test order (PowerShell: $env:RUN_WRITE_TESTS=1)
```
Test results: [docs/testing.md](docs/testing.md)

## Screenshots
See the [screenshots/](screenshots/) folder.

## How it was built
- Planning → requirements → architecture → backend → frontend → testing → deployment, with each phase in `docs/`
- Prompt logs for each phase, with the exact prompts, context and iterations: [prompts/INDEX.md](prompts/INDEX.md)
- Deployment steps and attempt log: [docs/deployment.md](docs/deployment.md)

## Security and data
- No secrets in the repo. `.env` files are git-ignored; `.env.example` has placeholders only
- The Supabase secret key is only used by the backend. The browser only gets the publishable key
- Row Level Security is on for every table with no public policies, so only the backend can read or write data
- Admin routes check the Supabase login token and an email allowlist
- All customers, orders and inquiries are fictional demo data. No real payments or card numbers

## Image credits
Product photos are openly licensed (CC0 / CC BY) from Openverse/Flickr. Each photo's author and licence is in [backend/scripts/images.json](backend/scripts/images.json) and shown on its product page.
