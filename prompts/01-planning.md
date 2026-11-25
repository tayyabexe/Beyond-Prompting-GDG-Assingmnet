# 01 — Planning

## What I needed
A clear plan (scope, goals, stakeholders, risks) before writing any code, so the later prompts have something solid to build on.

## Decisions I made first
- Real backend with APIs instead of browser-only storage
- Python FastAPI for the backend, React (Vite) for the frontend
- Supabase for the database and image storage
- React deployed on Vercel, FastAPI on Render (both free)

## Prompt — first version
```
ROLE: You are a senior full-stack engineer and business analyst helping me plan
a student capstone project.

CONTEXT:
- Project: NEXUS-COMMERCE — e-commerce storefront + mini CRM for a small online seller.
- Source of truth: the assignment brief PDF in docs/assignment/.
- Stack decided: React (Vite) frontend, Python FastAPI backend (REST API),
  Supabase (Postgres database + Storage for product images).
- Deployment decided: React on Vercel, FastAPI on Render (free tiers).
- Time available: ~2.5 hours.

TASK: Write the Phase 1 Planning document.
...
```

## What I changed
I removed the "time available" line. The plan should be about the project itself, and the time limit was making the AI cut scope.

## Final prompt
```
ROLE: You are a senior full-stack engineer and business analyst helping me plan
a student capstone project.

CONTEXT:
- Project: NEXUS-COMMERCE — e-commerce storefront + mini CRM for a small online seller.
- Source of truth: the assignment brief PDF in docs/assignment/.
- Stack decided: React (Vite) frontend, Python FastAPI backend (REST API),
  Supabase (Postgres database + Storage for product images).
- Deployment decided: React on Vercel, FastAPI on Render (free tiers).

TASK: Write the Phase 1 Planning document.

CONSTRAINTS:
- Only include what the brief requires; put optional extras under "out of scope".
- No real payments, no real customer data (fictional demo records only).
- Plain, simple English. No invented features or numbers.

OUTPUT FORMAT: Replace docs/planning.md with:
1. Problem statement (3–4 lines)
2. Goals and success criteria (checklist)
3. In-scope vs out-of-scope table
4. Stakeholders (buyer, merchant, evaluator)
5. Phase table
6. Risks and mitigations table
Then stop and wait for my review before Phase 2.
```

## Result
[docs/planning.md](../docs/planning.md)

## My check
-
