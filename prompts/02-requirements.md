# 02 — Requirements

## What I needed
A list of everything the system must do, with IDs, so I can build and test against it and show where each feature came from.

## Prompt
```
ROLE: You are a senior business analyst writing requirements for a small
e-commerce project.

CONTEXT:
- Project: NEXUS-COMMERCE, a storefront + mini CRM. The approved plan is in docs/planning.md.
- Stack: React (Vite), FastAPI, Supabase Postgres + Storage.
- Prices are in PKR.

TASK: Write the requirements document for the MVP in docs/planning.md.

CONSTRAINTS:
- Give every requirement an ID (FR-01, NFR-01) so tests can refer to it later.
- Nothing from the out-of-scope list.
- Fictional demo data only, no card fields or real payments.
- Simple English.

OUTPUT FORMAT: Create docs/requirements.md with:
1. Functional requirements table (ID, requirement, who uses it, Must/Should)
2. Non-functional requirements table (ID, category, requirement, how we check it)
3. User stories for buyer and merchant, with acceptance criteria
4. Business rules: order status flow, stock, shipping, form validation
5. Demo data: what fictional products, customers and orders to seed
Stop after this and wait for my review.
```

## Context given
- `docs/planning.md` (approved scope)
- Decision: prices in PKR

## Result
[docs/requirements.md](../docs/requirements.md): 26 functional requirements, 12 non-functional requirements, 9 user stories, business rules and a demo data plan.

## My check
-
