# 03 — Architecture & Design

## What I needed
A design that covers every requirement before building: how React, FastAPI and Supabase connect, the database tables, the API endpoints, and how admin login and checkout work.

## Decisions I made first
- CRM protected by login: Supabase Auth issues a JWT, FastAPI checks it
- Row Level Security on, with no public access. Only the backend touches the database
- Checkout runs as a Postgres function so stock can't go negative when two people buy at once
- Product images are free photos (Unsplash/Pexels) with credits, stored in Supabase Storage. Not AI-generated

## Prompt
```
ROLE: You are a senior software architect designing a small, production-style
web application.

CONTEXT:
- Project: NEXUS-COMMERCE. Approved docs: docs/planning.md, docs/requirements.md.
- Decided: React (Vite) on Vercel, FastAPI on Render, Supabase Postgres + Storage.
- Admin auth: Supabase Auth issues a JWT on admin login; FastAPI verifies it on
  every /api/admin route. Public storefront routes need no login.
- Database: Row Level Security on, no public access; only the backend
  (service key) reads/writes.
- Checkout: a Postgres function place_order checks stock, reduces it and
  creates the order in one transaction.
- Product images: free photos (Unsplash/Pexels) stored in a Supabase Storage bucket, with source credits.
- Prices in PKR.

TASK: Design the architecture and document it.

CONSTRAINTS:
- Cover every FR and NFR in requirements.md; reference their IDs where relevant.
- Keep it simple. No extra services beyond the ones listed.
- Simple English, short explanations.

OUTPUT FORMAT:
1. Replace docs/architecture.md with: system overview, tech choices with reasons,
   database tables (columns, keys, relations), REST API endpoint table
   (method, path, auth, purpose, FR IDs), admin login flow, checkout flow,
   environment variables, folder structure.
2. Create docs/diagrams/architecture.drawio with two pages: system architecture
   and database ERD.
Stop after this and wait for my review.
```

## Context given
- `docs/planning.md`, `docs/requirements.md`
- My decisions on auth, RLS, checkout and images

## Result
- [docs/architecture.md](../docs/architecture.md)
- [docs/diagrams/architecture.drawio](../docs/diagrams/architecture.drawio)

## My check
-
