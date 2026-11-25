# Phase 1 — Planning

## 1. Problem statement

Small online sellers keep product listings, customer inquiries, carts and orders in different places, so things get lost. Buyers need a simple way to find a product and check out. Sellers need one place to see customers, track each order's progress and reply to inquiries. NEXUS-COMMERCE connects a customer storefront to a merchant mini-CRM that share the same database.

## 2. Goals and success criteria

**Storefront**
- [ ] Responsive home page and product catalog showing image, name, price and stock status
- [ ] Search and category filter, plus a page for each product
- [ ] Cart where you can add, remove and change quantities, with a visible total
- [ ] Simulated checkout that ends in an order confirmation, with the order showing in the CRM. No real card numbers or payments

**Merchant CRM**
- [ ] Customer list and inquiry list using fictional demo records only
- [ ] Order list showing order ID, items, customer, total and status
- [ ] Order status updates, plus inquiry status and notes
- [ ] Summary metrics such as total orders, revenue and open inquiries

**Quality**
- [ ] Storefront and CRM use the same Supabase data, and changes are kept
- [ ] Empty states, invalid input, missing products and checkout errors are handled
- [ ] Works on mobile and desktop
- [ ] No secrets in GitHub (`.env.example` and `.gitignore`)
- [ ] Core flow tested: browse → cart → checkout → manage the order in the CRM

**Evidence**
- [ ] Prompt logs in `prompts/` for every phase and major feature
- [ ] At least one context-engineering example, checked against real app data
- [ ] README with setup steps and screenshots
- [ ] Live deployment link, or an honest log of the deployment attempt

## 3. Scope

| In scope | Out of scope |
|---|---|
| Product catalog, search, category filter, product page | Login and accounts, admin roles |
| Cart and simulated checkout (cash on delivery / demo payment) | Real payment gateway or card collection |
| Order confirmation page | AI chatbot, RAG, image search |
| CRM dashboard, orders with status updates, customers, inquiries with notes | Dynamic pricing, fraud scoring |
| Contact / inquiry form | Microservices, Kafka, Kubernetes, load testing |
| Supabase Postgres + Storage for product images | Docker |
| FastAPI REST API used by the React app | Emails and notifications |
| React on Vercel, FastAPI on Render | Custom domain |

## 4. Stakeholders

| Stakeholder | What they need |
|---|---|
| Buyer | Find products quickly, trust prices and stock, check out without confusion |
| Merchant | See new orders, update their status, see customers, reply to inquiries |
| Evaluator | Working demo, clear README, real prompt logs, honest testing and deployment evidence |

## 5. Phases

| # | Phase | Output |
|---|---|---|
| 1 | Planning | `docs/planning.md` |
| 2 | Requirements | `docs/requirements.md` |
| 3 | Architecture & Design | `docs/architecture.md`, draw.io diagram |
| 4 | Build | `backend/` (FastAPI + Supabase), `frontend/` (React) |
| 5 | Testing | `docs/testing.md`, screenshots |
| 6 | Deployment | Live links, `docs/deployment.md` |

## 6. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Supabase key leaked to GitHub | Keys live only in a git-ignored `.env`. The backend uses the service key, and React never sees it |
| Render free server sleeps when idle, so the first request is slow | React shows a "waking up server…" message |
| Browser blocks requests between Vercel and Render (CORS) | FastAPI allows only the Vercel URL and localhost |
| Two buyers check out the last item at the same time | Backend re-checks stock at checkout and rejects the order if stock is too low |
| Deployment fails | Keep local setup working and record what went wrong in `docs/deployment.md` |
