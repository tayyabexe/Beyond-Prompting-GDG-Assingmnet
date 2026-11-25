# Phase 3 — Architecture & Design

Diagram: [diagrams/architecture.drawio](diagrams/architecture.drawio). Open it at [app.diagrams.net](https://app.diagrams.net) or with the VS Code "Draw.io Integration" extension. Page 1 is the system diagram, page 2 is the database ERD.

## 1. System overview

```
 Buyer / Merchant (browser)
        │
        ▼
 ┌──────────────────────────┐        login (email + password)   ┌─────────────────┐
 │ React SPA  — Vercel      │ ────────────────────────────────▶ │ Supabase Auth   │
 │ storefront + CRM pages   │ ◀──────────── JWT ─────────────── │                 │
 └────────────┬─────────────┘                                   └────────▲────────┘
              │ HTTPS JSON   (admin calls send "Authorization: Bearer <JWT>")  │ verify JWT
              ▼                                                            │
 ┌──────────────────────────┐   service key (server only)   ┌─────────────┴──────────┐
 │ FastAPI  — Render        │ ────────────────────────────▶ │ Supabase Postgres (RLS)│
 │ validation, auth check,  │                               │ tables + place_order() │
 │ business rules           │                               │ Supabase Storage       │
 └──────────────────────────┘                               │ bucket: product-images │
                                                            └────────────────────────┘
 Product images are loaded by the browser straight from Storage's public URL.
```

What each part does:
- **React (Vercel):** draws the pages and keeps the cart in `localStorage`. It talks only to our FastAPI, except for admin login, which goes to Supabase Auth.
- **FastAPI (Render):** the only part that reads or writes the database. It validates input, recalculates prices, checks the admin JWT and applies the business rules.
- **Supabase:** Postgres holds the data, Auth handles the admin account and JWTs, and Storage holds the product photos.

## 2. Tech choices

| Choice | Why |
|---|---|
| React + Vite | Fast to develop, builds to static files that Vercel hosts for free |
| React Router | Separate pages for shop, product, cart, checkout and CRM, with shareable URLs |
| FastAPI | Python, automatic request validation with Pydantic, free API docs at `/docs` |
| supabase-py (backend) | Official client. It uses the service key, so it is never exposed to the browser |
| supabase-js (frontend, auth only) | Handles admin login and token refresh using the public anon key |
| Postgres function for checkout | Stock check, stock reduction and order creation happen in one transaction, so stock can't go negative (NFR-09) |
| Row Level Security, no policies | Even with the public anon key, nobody can read or write tables directly (NFR-02) |
| Vercel + Render free tiers | Free, connect to GitHub, auto-deploy on push |

## 3. Database

All prices are whole PKR (`integer`). All timestamps are `timestamptz`.

| Table | Columns | Keys / rules |
|---|---|---|
| **products** | id `text`, name, category, description, price, stock, image_url, image_credit, featured `bool`, created_at | PK id (slug, for example `aura-wireless-headphones`). `price > 0`, `stock >= 0`. category is one of Audio, Wearables, Home Office, Accessories |
| **customers** | id `uuid`, name, email, phone, city, created_at | PK id. `email` unique (stored lowercase) |
| **orders** | id `text`, customer_id, ship_name, ship_email, ship_phone, ship_address, ship_city, payment, subtotal, shipping, total, status, created_at, updated_at | PK id = `'NX-' \|\| nextval(order_seq)` (starts at 1001). FK customer_id → customers. status in pending, processing, shipped, delivered, cancelled. payment in cod, demo |
| **order_items** | id `bigint`, order_id, product_id, product_name, unit_price, qty | FK order_id → orders (cascade), FK product_id → products. `qty > 0`. Name and price are copied at purchase time so old orders don't change when prices do |
| **order_status_history** | id `bigint`, order_id, status, changed_at | FK order_id → orders (cascade). One row per status change (FR-19) |
| **inquiries** | id `text`, name, email, subject, message, product_id, status, created_at, updated_at | PK id = `'INQ-' \|\| nextval(inquiry_seq)`. FK product_id → products (nullable). status in open, in_progress, resolved |
| **inquiry_notes** | id `bigint`, inquiry_id, note, created_at | FK inquiry_id → inquiries (cascade) |

Relations: customer 1—* orders, order 1—* order_items, product 1—* order_items, order 1—* order_status_history, product 1—* inquiries (optional), inquiry 1—* inquiry_notes.

### Database functions

| Function | What it does |
|---|---|
| `place_order(customer jsonb, items jsonb, payment text)` | Locks the product rows (`FOR UPDATE`), raises `INSUFFICIENT_STOCK:<product_id>` if any item is short, reduces stock, upserts the customer by email, works out subtotal, shipping (free at Rs 10,000 or more, otherwise Rs 250) and total from **database prices**, inserts the order, items and first history row, then returns the order ID. All in one transaction |
| `update_order_status(order_id text, new_status text)` | Checks the allowed transition, raises `INVALID_TRANSITION` otherwise, puts stock back if the new status is cancelled, writes a history row |

## 4. REST API

Base URL: `https://<render-app>.onrender.com/api`. Every response is JSON. Errors look like `{"detail": "message"}`, or for form errors `{"detail": {"field_errors": {...}}}`.

### Public (no login)

| Method | Path | Purpose | FR |
|---|---|---|---|
| GET | `/health` | Wake-up and health check | NFR-07 |
| GET | `/categories` | Category names with product counts | FR-01 |
| GET | `/products?q=&category=&sort=&featured=` | List, search, filter and sort products. sort is `price_asc`, `price_desc` or `name` | FR-01–04 |
| GET | `/products/{id}` | One product, or 404 | FR-05, FR-06 |
| POST | `/cart/quote` | Body `{items:[{product_id, qty}]}`. Returns current prices, stock, line totals, subtotal, shipping and total | FR-08, FR-26 |
| POST | `/orders` | Body: customer fields, payment, simulate_decline, items. Returns 201 with the order summary. Errors: 422 field errors, 409 stock, 402 demo payment declined, 400 empty cart | FR-10–13, FR-26 |
| POST | `/inquiries` | Body: name, email, subject, message, product_id?. Returns 201 with the inquiry ID | FR-14 |

The order confirmation page uses the order summary returned by `POST /orders` (saved in `sessionStorage`). There is deliberately **no public "get order by ID" endpoint**, because order IDs are sequential and anyone could read other people's details.

### Admin (header `Authorization: Bearer <Supabase JWT>`)

| Method | Path | Purpose | FR |
|---|---|---|---|
| GET | `/admin/me` | Returns the admin's email (checks the token) | — |
| GET | `/admin/stats` | Total orders, revenue (excluding cancelled), pending orders, open inquiries, low-stock products, 5 latest orders | FR-15, FR-16 |
| GET | `/admin/orders?status=` | All orders with items and customer | FR-17, FR-23 |
| GET | `/admin/orders/{id}` | One order with items and status history | FR-17, FR-19 |
| PATCH | `/admin/orders/{id}/status` | Body `{status}`. 409 if the transition isn't allowed | FR-18, FR-19 |
| GET | `/admin/customers` | Customers with order count, total spent and last order date | FR-20 |
| GET | `/admin/inquiries?status=` | Inquiries with notes and product name | FR-21 |
| PATCH | `/admin/inquiries/{id}/status` | Body `{status}` | FR-22 |
| POST | `/admin/inquiries/{id}/notes` | Body `{note}` | FR-22 |

Missing or invalid token → 401. Valid token but the email isn't in `ADMIN_EMAILS` → 403.

## 5. Admin login flow

1. The merchant opens `/admin` and React shows the login form.
2. React calls `supabase.auth.signInWithPassword(email, password)` with the **anon** key. Supabase returns a JWT (access token) and a refresh token. supabase-js stores them and refreshes them automatically.
3. Every admin API call sends `Authorization: Bearer <access_token>`.
4. FastAPI's `require_admin` dependency calls `supabase.auth.get_user(token)`. That checks the signature and expiry against Supabase, so it works with any signing-key type. FastAPI then checks that the email is in `ADMIN_EMAILS`.
5. Logout calls `supabase.auth.signOut()`.

Setup notes: **turn off public sign-ups** in Supabase (Auth → Providers → Email → "Allow new users to sign up" off). Create the admin user by hand in the dashboard.

## 6. Checkout flow

1. The cart lives in `localStorage` as `[{product_id, qty}]` (FR-09). The cart page calls `POST /cart/quote` so prices and stock always come from the server.
2. The checkout form validates in the browser first, for quick feedback (FR-11).
3. `POST /orders`. FastAPI validates again with Pydantic (name, email, phone pattern, address length, city, qty ≥ 1).
4. If payment is `demo` and `simulate_decline` is true, FastAPI returns **402** and no order is created (FR-12).
5. FastAPI calls `place_order(...)`. `INSUFFICIENT_STOCK` becomes **409** with the product name (FR-12).
6. On success it returns **201** with `{id, items, subtotal, shipping, total, created_at}`. React stores it, clears the cart and shows `/order/NX-…` (FR-13).
7. The merchant sees the order in `/admin/orders` straight away, since it's the same database (FR-23).

## 7. Environment variables

| Where | Variable | Example / note |
|---|---|---|
| backend | `SUPABASE_URL` | `https://<project>.supabase.co` |
| backend | `SUPABASE_SERVICE_ROLE_KEY` | **secret**, backend only |
| backend | `ADMIN_EMAILS` | comma-separated admin emails |
| backend | `CORS_ORIGINS` | `http://localhost:5173,https://<app>.vercel.app` |
| frontend | `VITE_API_URL` | `http://localhost:8000/api` or the Render URL |
| frontend | `VITE_SUPABASE_URL` | same project URL |
| frontend | `VITE_SUPABASE_ANON_KEY` | public anon key. Safe in the browser because RLS blocks table access |

Real values go only in `backend/.env` and `frontend/.env` (git-ignored), and in the Render and Vercel dashboards. Placeholders go in `.env.example`.

## 8. Folder structure

```
.
├── README.md  .gitignore  .env.example  render.yaml
├── docs/        planning.md requirements.md architecture.md testing.md deployment.md
│   ├── diagrams/architecture.drawio
│   └── assignment/   (brief PDF)
├── prompts/     INDEX.md + one file per phase/feature
├── screenshots/
├── backend/
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py         FastAPI app, CORS, routers
│   │   ├── config.py       env settings
│   │   ├── db.py           Supabase client
│   │   ├── auth.py         require_admin (JWT check)
│   │   ├── schemas.py      Pydantic request/response models
│   │   └── routers/        products.py orders.py inquiries.py admin.py
│   ├── supabase/
│   │   ├── schema.sql      tables, RLS, functions
│   │   └── seed.sql        fictional demo data
│   ├── scripts/upload_images.py   copies product photos into Storage
│   └── tests/              pytest API tests
└── frontend/
    ├── package.json  vite.config.js  vercel.json  index.html
    └── src/
        ├── api/client.js        fetch wrapper, error handling, wake-up retry
        ├── lib/supabase.js      auth-only client
        ├── context/             CartContext, AuthContext
        ├── components/          Layout, AdminLayout, ProductCard, StatusBadge, EmptyState, ...
        └── pages/               Home Shop ProductDetail Cart Checkout OrderConfirmation Contact NotFound
            └── admin/           Login Dashboard Orders Customers Inquiries
```

## 9. How the design covers the NFRs

| NFR | Covered by |
|---|---|
| NFR-01 | `.env` git-ignored, `.env.example` |
| NFR-02 | Service key only on Render; RLS with no policies |
| NFR-03 | FastAPI `CORSMiddleware` with `CORS_ORIGINS` |
| NFR-04 | No card fields; `payment` is only `cod` or `demo` |
| NFR-05, 06 | Responsive CSS, empty-state and inline-error components |
| NFR-07 | `api/client.js` shows "waking up server…" and retries `/health` |
| NFR-08 | Small payloads, one query per page |
| NFR-09 | `place_order` with row locks in one transaction |
| NFR-10 | Data in Supabase Postgres |
| NFR-11 | README and FastAPI `/docs` |
| NFR-12 | Labels, alt text, native buttons and selects |
