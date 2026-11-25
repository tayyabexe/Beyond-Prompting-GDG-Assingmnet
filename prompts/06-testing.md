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
- Partway through I told it to stop adding test steps and write up what was done.
- Then I came back for the rest: "we have to contniue with these remaining testing adn then upadte the status on the github of the proejct, + including the screenshots from the website". Second round (T28–T35), run on the production build:
  - 5 orders fired at the same moment for the Pulse speaker (stock 2): exactly 2 went through, 3 got "out of stock", stock never went below 0. Both orders were cancelled afterwards.
  - Load times: store pages show data in about 0.9 s, CRM pages in 1.4–2.0 s.
  - Phone layout at 375px for every store and CRM page, using device emulation because the browser window wouldn't go narrower than 400px.
  - Wrong admin password shows "Wrong email or password." and saves no session.
- While timing the CRM pages, a Supabase timeout logged the admin out. Written up as a known issue with the planned fix; I said "thats enough, push the current execution", so it isn't fixed yet.

## Bugs found
| Bug | Fix |
|---|---|
| After placing an order, the empty cart badge showed a red "0" | Badge only shown when the cart has items (`frontend/src/components/Header.jsx`) |
| A Supabase timeout while checking the admin token gives 401, so the admin gets logged out | Not fixed yet. Plan: 503 for network errors, 401 only for bad tokens, cache verified tokens (`backend/app/auth.py`) |

## Implementation mapping
| What | Where |
|---|---|
| Test report (35 manual tests with requirement ids) | `docs/testing.md` |
| Screenshots (28 real captures) | `screenshots/01-home.png` … `screenshots/28-admin-wrong-password.png` |
| Automated tests | `backend/tests/` (validation, business rules, auth, seed data, write test) |
| Bug fix | `frontend/src/components/Header.jsx` |

## Verification
- `python -m pytest -q` → 27 passed, 1 skipped
- With `RUN_WRITE_TESTS=1` → 28 passed (created and cancelled NX-1009)
- Manual: order NX-1010 placed, seen in the CRM, moved Pending → Processing → Shipped with history. Order NX-1011 cancelled; Aura stock went 14 → 12 → 14. Echo Buds stock 9 → 8 after the order.
- Inquiry INQ-1006 sent, a note was added, and the status changed to In progress.
- Second round: concurrency test 2 × 201 + 3 × 409, stock 2 → 0 → 2 after cancelling; pages under 2 s; no sideways scroll at 375px; wrong password rejected.

## My check
-
