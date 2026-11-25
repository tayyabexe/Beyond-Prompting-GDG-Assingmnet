# 06 — Testing

## What I needed
Proof that the core flow works end to end: browse → cart → checkout → the order shows up in the CRM and can be managed. I also needed the error cases, real screenshots, and a test report.

## Prompt 1 — the test plan
I gave the go and asked for the deployment to run alongside:
> "proceed the test.md"
> "deploy multiple agents, do it fast"

```
Role: QA tester for a student e-commerce + mini CRM project.
Context: backend at localhost:8000 (27 pytest tests), frontend at localhost:5173,
Supabase database with seed data, admin login works. docs/requirements.md lists
the requirements (FR/NFR ids).
Task:
1. Run the backend tests, including the write test (RUN_WRITE_TESTS=1).
2. Test the core flow in the browser: browse → search/filter → product page →
   cart (change qty, remove) → COD checkout → confirmation → order appears in
   CRM → change status → cancel an order and check stock goes back.
3. Test error cases: empty cart, invalid checkout fields, demo payment decline,
   unknown product URL, empty search, contact form errors, wrong admin password.
4. Check phone (375px) and desktop layouts.
5. Re-run seed.sql, then take real screenshots into screenshots/.
Constraints: only record results that actually happened; note any failure or
limitation honestly; fictional data only.
Output: docs/testing.md (table: test, steps, expected, actual, pass/fail,
requirement id), screenshots/, and prompts/06-testing.md.
```

## Context given to the AI
- `docs/requirements.md` (FR-01 to FR-26, NFR-01 to NFR-12), so every test maps to a requirement id
- The running backend and frontend, plus the logged-in admin session in the test browser (the password was never typed or written down)
- The backend tests in `backend/tests/`
- Rule: fictional customer data only, and no fake results

## Iterations
- Testing was split off to run in parallel with the deployment work. The first run was stopped by a misclick and restarted, carrying on from what already existed.
- `seed.sql` can't be re-run from here (it runs in the Supabase SQL editor), so that step was skipped. The test orders appear in the screenshots, and the data is made up.
- For the cancel test, a fresh order was placed through `POST /api/orders` so the stock change could be read exactly before and after.
- Partway through I told it to stop adding test steps and write up what was done. The remaining checks are listed as "Not tested" in `docs/testing.md`.

## Bugs found
| Bug | Fix |
|---|---|
| After placing an order, the empty cart badge showed a red "0" | Badge only shown when the cart has items (`frontend/src/components/Header.jsx`) |

## Implementation mapping
| What | Where |
|---|---|
| Test report (27 manual tests with requirement ids) | `docs/testing.md` |
| Screenshots (19 real captures) | `screenshots/01-home.png` … `screenshots/19-mobile-home.png` |
| Automated tests | `backend/tests/` (validation, business rules, auth, seed data, write test) |
| Bug fix | `frontend/src/components/Header.jsx` |

## Verification
- `python -m pytest -q` → 27 passed, 1 skipped
- With `RUN_WRITE_TESTS=1` → 28 passed (created and cancelled NX-1009)
- Manual: order NX-1010 placed, seen in the CRM, moved Pending → Processing → Shipped with history. Order NX-1011 cancelled; Aura stock went 14 → 12 → 14. Echo Buds stock 9 → 8 after the order.
- Inquiry INQ-1006 sent, a note was added, and the status changed to In progress.
- Not tested: wrong admin password, the phone layout on most pages, two checkouts at the same time, load times, the deployed site.

## My check
-
