# Testing

## Summary
I tested the backend with pytest and then went through the core flow by hand in the browser: browse → search/filter → product → cart → checkout → confirmation → order in the CRM → status changes → cancel and restock. I also tried the main error cases. In a second round I tested buying the last items at the same time, load times, phone layouts for every page and a wrong admin password. All planned tests were run. Found two bugs: the empty cart badge (fixed) and the admin being logged out when Supabase times out (written up below, not fixed yet).

## Environment
- Windows 11, Python 3.14 (system install), Node + Vite 7 dev server
- Backend: FastAPI at `http://localhost:8000/api`, connected to the real Supabase project (Postgres + Storage + Auth)
- Frontend: React at `http://localhost:5173`, tested in Chromium through Playwright at 1366×900 (desktop) and 375×812 (phone)
- Admin logged in with the allowlisted admin account (Supabase Auth)
- All names, emails, phones and addresses used are made up

## Automated tests (backend)
Run from `backend/`:

| Command | Result |
|---|---|
| `python -m pytest -q` | **27 passed, 1 skipped**, 2 warnings (supabase-py deprecation warning, not from our code) |
| `RUN_WRITE_TESTS=1` then `python -m pytest -q` | **28 passed**, 2 warnings |

The skipped test is the write test. It places a real order and then cancels it, so it only runs with `RUN_WRITE_TESTS=1`. That run created order NX-1009 ("Pytest Buyer"), which shows as Cancelled in the CRM screenshots.

## Manual tests (browser)

| ID | Test | Steps | Expected | Actual | Result | Req |
|---|---|---|---|---|---|---|
| T01 | Home page | Open `/` | Hero, category tiles with counts, featured products, real photos | All shown; 4 categories with "3 items" each; 3 hero photos | Pass | FR-01 |
| T02 | Category filter | `/shop?category=Audio` | Only Audio products | "Audio · 3 products": Aura, Echo Buds, Pulse | Pass | FR-02, FR-04 |
| T03 | Search + filter together | Type "buds" in shop search while on Audio | URL updates after typing stops; only matching items | URL became `?category=Audio&q=buds`, "1 product matching 'buds'" (Echo Buds Pro) | Pass | FR-03 |
| T04 | Search with no results | `/shop?q=zzzqqq` | Empty state with a way out | "No products found", "Clear filters" button | Pass | FR-03, NFR-06 |
| T05 | Stock limit on card | Pulse speaker (stock 2) with 2 already in cart | Add button disabled | Button disabled, badge "Only 2 left" | Pass | FR-07 |
| T06 | Product detail | Open Echo Buds Pro | Image, credit, price, stock, qty picker, add button | All shown; photo credit "Earbuds by Dylan_Payne, CC BY 2.0" | Pass | FR-05 |
| T07 | Add with quantity | Qty + → 2, Add to cart | Cart count goes up by 2 | Badge 2 → 4 | Pass | FR-07 |
| T08 | Cart totals | Open `/cart` with 2 × speaker + 2 × buds | Line totals and subtotal from the server | 13,000 + 25,998 = Rs 38,998, shipping Free | Pass | FR-08, FR-26 |
| T09 | Remove + change qty | Remove speaker, buds − to 1 | Totals update straight away | Rs 12,999, shipping Free, badge 1 | Pass | FR-07, FR-08 |
| T10 | Cart kept after reload | Full page load of `/checkout` | Cart still there | Still 1 item (Echo Buds) | Pass | FR-09 |
| T11 | Checkout validation | Name "A", email "not-an-email", phone "123", empty city/address, Place order | Inline error on each bad field | 5 inline errors (name length, email, mobile format, city, address) | Pass | FR-11, NFR-06 |
| T12 | Demo payment declined | Valid data, Demo payment, tick "Simulate a declined payment" | Clear error, no order | "Demo payment was declined (simulated). No order was placed…"; API returned 402 | Pass | FR-12 |
| T13 | COD checkout | Same data, Cash on Delivery, Place order | Confirmation with order ID, items, total; cart emptied | NX-1010, Echo Buds × 1, Rs 12,999, Pending, COD; cart emptied | Pass | FR-10, FR-13 |
| T14 | Stock goes down | Check Echo Buds stock via API before/after | 9 → 8 | 9 → 8 | Pass | FR-26, NFR-09 |
| T15 | Order in CRM straight away | Open `/admin/orders` | NX-1010 at the top | NX-1010, Sara Test, Rawalpindi, 1 item, Rs 12,999, Pending | Pass | FR-17, FR-23 |
| T16 | Status changes + history | Open NX-1010, Mark as processing, then shipped | Only allowed next steps; history with times | Pending → Processing → Shipped, all 3 in History with timestamps; after Shipped only "Mark as delivered" is offered (no cancel) | Pass | FR-18, FR-19 |
| T17 | Cancel restocks | Place NX-1011 (2 × Aura headphones, via `POST /api/orders`), cancel it in the CRM | Confirm dialog; status Cancelled; stock back | Dialog "Its items will go back into stock"; Cancelled, "no further changes allowed"; stock 14 → 12 → 14 | Pass | FR-18, NFR-09 |
| T18 | Dashboard | Open `/admin` | Metrics + latest orders + low stock | 11 orders, revenue excluding cancelled, 2 pending, 4 open inquiries; latest 5 orders; low stock: Stride (out), Pulse (2), Lumen (3) | Pass | FR-15, FR-16 |
| T19 | Customers | Open `/admin/customers` | New buyer listed | Sara Test listed with order count and total | Pass | FR-20 |
| T20 | Contact form errors | `/contact?product=echo-buds-pro`, send empty | Inline errors; product pre-selected | Name, email, subject, message "is required"; product = Echo Buds Pro | Pass | FR-14, NFR-06 |
| T21 | Send inquiry | Fill valid fields, send | Success with reference | "Message sent", reference INQ-1006 | Pass | FR-14 |
| T22 | Inquiry in CRM: note + status | Open INQ-1006, Add note empty, then with text, status → In progress | Empty note rejected; note saved; status saved | "Note is required."; note shown with time; status In progress in panel and list; toast "INQ-1006 marked as in progress" | Pass | FR-21, FR-22 |
| T23 | Unknown product | `/product/does-not-exist` | "Product not found" page | Title "Product not found · NEXUS", not-found page shown | Pass | FR-06 |
| T24 | Empty cart | `/cart` with nothing in it | Empty state | "Your cart is empty" + "Start shopping" | Pass | NFR-06 |
| T25 | Checkout with empty cart | Open `/checkout` | Sent back to cart | Redirected to `/cart` | Pass | FR-13 |
| T26 | Phone layout: home | 375×812, open `/` | No sideways scroll; menu button | Menu button + cart, hero text wraps, photo grid fits | Pass | NFR-05 |
| T27 | Phone layout: CRM orders | 375px, `/admin/orders` (checked during the frontend fixes) | Readable without sideways scroll | Rows shown as cards, "NX-1005" on one line | Pass | NFR-05 |

### Second round (remaining tests)
Run on the production build (`npm run build` + `vite preview` on port 5173) against the local backend.

| ID | Test | Steps | Expected | Actual | Result | Req |
|---|---|---|---|---|---|---|
| T28 | Last items bought at the same time | Pulse speaker had stock 2. A script sent 5 COD orders for 1 speaker each at the exact same moment (threads released together), then cancelled the ones that went through | Exactly 2 orders succeed, the rest get "out of stock", stock never below 0 | 2 × 201 (NX-1012, NX-1013), 3 × 409 "Pulse Mini Bluetooth Speaker is out of stock… No order was placed"; stock 2 → 0; after cancelling both, back to 2 | Pass | FR-26, NFR-09 |
| T29 | API response times | 5 calls per endpoint from the same machine, median | Fast enough for pages under 2 s | `/health` 1 ms; `/products` 308 ms; featured 307 ms; one product 307 ms; `/categories` 310 ms; `/cart/quote` 241 ms. Most of that is the round trip to Supabase | Pass | NFR-08 |
| T30 | Store page load times | Fresh load of each page 3 times, time until real product data is on screen (not the skeleton) | Under 2 s | Home ~930 ms, Shop ~915 ms, Product 400–930 ms, Contact 67–600 ms; first paint 50–130 ms everywhere | Pass | NFR-08 |
| T31 | CRM page load times | Same, logged in, until table rows are shown | Under 2 s | Dashboard 1.9 s (first load 3.5 s), Orders ~1.4 s, Customers ~1.9 s, Inquiries 1.4–2.0 s | Pass, but only just | NFR-08 |
| T32 | Phone layout: store pages | 375×812, shop, product, cart (1 item), checkout, contact | No sideways scroll, everything readable | Page width equals screen width on all five; the only wider element is the category chip row on shop, which is a sideways-scrolling strip on purpose | Pass | NFR-05 |
| T33 | Phone layout: other CRM pages | 375px, dashboard, customers, inquiries | No sideways scroll | Page width equals screen width; tables shown as cards; the admin menu is a sideways-scrolling strip on purpose | Pass | NFR-05 |
| T34 | Admin session during a Supabase timeout | Seen while timing T31: one dashboard load hung, the backend log showed `httpx.ReadTimeout` talking to Supabase, and the next `/admin/me` returned 401 | A short network problem should not log the admin out | The admin was logged out and sent to the login page | **Fail** (not fixed yet) | — |
| T35 | Wrong admin password | `/admin/login`, admin email + a wrong password, Sign in | Clear error, stays on login, no session saved | "Wrong email or password." shown, still on `/admin/login`, nothing stored in localStorage | Pass | FR-15 |

## Bugs found and fixed during testing
| Bug | Fix | File |
|---|---|---|
| After the order was placed the cart badge showed a red "0" | Badge only shown when the cart has items | `frontend/src/components/Header.jsx` |

## Known issue (found, not fixed yet)
**Admin gets logged out when Supabase is slow (T34).** In `backend/app/auth.py`, `verify_token` returns `None` for *any* error from `auth.get_user`, including a network timeout. `require_admin` turns that into 401, and the frontend (`AuthContext.jsx`) signs out on 401. So a short timeout looks the same as a bad token.
Planned fix: return 401 only when Supabase says the token is invalid, return 503 ("try again") for network errors, and keep verified tokens in a small in-memory cache until they expire. The cache also removes one Supabase round trip from every admin request, which should bring the CRM pages (T31) well under 2 s.

## Notes
- All planned tests were run: 35 manual tests (34 pass, 1 fail written up above) plus the automated suite.
- Phone layouts were checked with Chrome device emulation at 375×812.
- Load times were measured locally. On Render's free plan the first request after the server sleeps is much slower; the "waking up the server" message covers that.
- `seed.sql` was not re-run before the screenshots, so the test orders (NX-1009 to NX-1013, all but NX-1010 cancelled) and inquiry INQ-1006 appear in them. All of that data is made up.

## Screenshots
All in [`screenshots/`](../screenshots/). Real captures from this test run:

| File | Shows |
|---|---|
| `01-home.png` | Home page (desktop) |
| `02-shop-search-filter.png` | Audio category + search "buds" |
| `03-shop-no-results.png` | Empty search result |
| `04-product-detail.png` | Echo Buds Pro product page |
| `05-cart.png` | Cart with totals and free shipping |
| `06-checkout-errors.png` | Inline checkout errors |
| `07-demo-payment-declined.png` | Simulated declined payment |
| `08-order-confirmation.png` | Confirmation for NX-1010 |
| `09-admin-orders.png` | CRM orders list with the new order |
| `10-admin-order-status.png` | Order drawer: shipped + history |
| `11-admin-order-cancelled.png` | Cancelled order NX-1011 |
| `12-admin-dashboard.png` | Dashboard metrics and low stock |
| `13-admin-customers.png` | Customers list |
| `14-contact-errors.png` | Contact form errors |
| `15-contact-sent.png` | Inquiry sent (INQ-1006) |
| `16-admin-inquiry-note-status.png` | Inquiry with note and new status |
| `17-product-not-found.png` | Unknown product page |
| `18-empty-cart.png` | Empty cart |
| `19-mobile-home.png` | Home page at 375px |
| `20-mobile-shop.png` | Shop at 375px |
| `21-mobile-product.png` | Product page at 375px |
| `22-mobile-cart.png` | Cart at 375px |
| `23-mobile-checkout.png` | Checkout form at 375px |
| `24-mobile-contact.png` | Contact form at 375px |
| `25-mobile-admin-dashboard.png` | CRM dashboard at 375px (tables as cards; shows the race-test orders NX-1012/1013 cancelled) |
| `26-mobile-admin-customers.png` | CRM customers at 375px |
| `27-mobile-admin-inquiries.png` | CRM inquiries at 375px |
| `28-admin-wrong-password.png` | Login page after a wrong password |
