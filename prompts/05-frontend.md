# 05 — Frontend (React + Vite)

## What I needed
The storefront and the mini CRM in React, built against the finished FastAPI backend, with a modern light design.

## Prompt 1 — decisions before building
Asked first, in plain words:
- Styling: plain CSS with variables, or Tailwind?
- Colours / logo?

My answers:
> "Q1 A, Q2 not dark vibes, check the design from the dribble for the modern shopping website, and then run the prompt for the frontend"

So: plain CSS, a light theme, and the look based on current Dribbble shopping designs.

## Prompt 2 — design research
```
Open Dribbble search "modern ecommerce website" and look at the light-themed
shots. Note the common patterns: background colours, product card style,
typography, buttons, hero layout. Use them as the design direction for NEXUS.
Don't copy any single shot.
```
The plain page fetch was blocked (empty response, then a "confirm you are human" check). Opened in a real browser instead and looked at the results.

**Patterns taken from the light designs:**
- warm off-white background instead of pure white
- products on soft grey tiles with large rounded corners
- big, tight, bold headings
- pill-shaped buttons and filter chips
- one bright warm accent (orange), everything else near-black and grey
- lots of white space, simple 4-column product grid

**Design tokens chosen:** background `#f7f5f0`, tiles `#eeebe4`, text `#17171b`, accent `#f2542d`, radius 18px, font Plus Jakarta Sans.

## Prompt 3 — the build
```
ROLE: You are a senior React engineer who builds clean, responsive, accessible
storefronts and admin dashboards.

CONTEXT:
- Follow docs/architecture.md (routes, API endpoints, login and checkout flows,
  folder structure) and docs/requirements.md (FR/NFR IDs, validation rules, user stories).
- Backend is done and running at http://localhost:8000/api (docs at /docs).
- Admin login uses Supabase Auth (supabase-js, anon key) and sends the JWT as a Bearer token.
- Prices in PKR. Product images are Supabase Storage URLs from the API.
- Design: light, modern, based on the Dribbble patterns above. Plain CSS with variables.

TASK: Build the React (Vite) frontend in frontend/.
1. Storefront: Home, Shop (search, category filter, sort), Product detail, Cart,
   Checkout, Order confirmation, Contact, 404.
2. CRM (/admin): Login, Dashboard metrics, Orders (status filter + status update),
   Customers, Inquiries (status + notes). Logout.
3. api/client.js with error handling and a "waking up server" message for Render cold starts.
4. Cart kept in localStorage; always re-priced via POST /cart/quote.

CONSTRAINTS:
- Never put the Supabase secret key in the frontend; only VITE_* public values.
- Every list has an empty state; every form shows inline errors that match the backend rules.
- Works from 360px phone width to desktop; keyboard accessible; images have alt text and credits.
- No card fields anywhere.

OUTPUT FORMAT: The frontend files, frontend/.env.example, vercel.json, then the exact
commands to run it locally. Stop and wait for my review.
```

## Context given to the AI (context engineering)
Before writing any page, the AI read the real backend code (`routers/*.py`, `schemas.py`, `schema.sql`) so field names, error format and validation limits match exactly, instead of guessing from the docs. Example: the checkout form uses the same rules as `OrderCreate` (name 2–60, address 10–200, phone `03XXXXXXXXX` or `+923XXXXXXXXX` after removing spaces and dashes).

## Problems found while testing in the browser, and fixes
| Problem | Fix |
|---|---|
| Blank page on first load (`destroy is not a function`) | One-line `useEffect(() => fn())` returned a value React treats as a cleanup. Wrapped those effects in braces |
| Stock badge showed raw `in_stock` | The backend sends `in_stock / low_stock / out_of_stock`, not `in / low / out`. Updated `StockBadge` to the real values. Lesson: check the real API response, not the assumed one |
| Bundle 541 KB (build warning) | Admin area (and supabase-js) now loads only when `/admin` is opened (`React.lazy`). Storefront: 94 KB gzipped |
| Price wrapped onto two lines on phones | `white-space: nowrap` on prices |

## Prompt 4 — review pass: clipping, common frontend issues, more modern feel
> "Review the frontend codes and lookout for the clipping issues, we have to make the website more modern looking, dynamic. We have to look for the common issues that the mostly frontends have, and then resolve the codes of the issues. No need to retest the codes again"

```
Review every file in frontend/src as a senior frontend reviewer.
1. Clipping / overflow: grid and flex children that can't shrink, long names and
   emails, sticky panels taller than the screen, focus rings cut off inside
   scroll areas, labels running out of their boxes, 100vh on mobile browsers.
2. Common frontend issues: broken-image fallback, layout shift, page titles,
   touch target sizes, iOS/Safari quirks, keyboard (Escape to close menus and
   drawers), body scroll behind a drawer, sticky header hiding focused fields,
   reduced-motion users, stale search text.
3. Make it feel more modern and alive without new libraries: skeleton loaders,
   staggered entrance animations, toast notifications, header shadow on scroll,
   cart badge bump, image fade-in, a moving perks strip, category icons.
Fix the code directly. Keep plain CSS. Respect prefers-reduced-motion.
```

### What the review found and fixed
| Issue | Fix |
|---|---|
| Grid columns using `1fr` grow past the screen when content is wide (classic overflow bug) | Changed to `minmax(0, 1fr)` in hero, product detail, cart, contact, admin shell, dashboard and inquiries layouts |
| Long product names make cards different heights | Product titles limited to 2 lines with a fixed min-height |
| Hero image labels could run out of the tile | Max width + "…" ellipsis |
| Long emails, addresses, messages and notes could push out of their boxes | `overflow-wrap: anywhere` on those texts |
| Sticky inquiry panel / order summary taller than the screen: the bottom couldn't be reached | Max height = screen height, scrolls inside |
| Big revenue numbers could overflow the dashboard cards | Fluid font size + `min-width: 0` |
| Filter chips wrapped into 3 rows on phones | Single row that scrolls sideways with a fade edge; padding so focus rings aren't cut off |
| Admin top bar on phones pushed "Log out" off screen | Only the menu links scroll; logo and Log out stay visible |
| `100vh` is wrong on mobile browsers (address bar) | `100dvh` with `100vh` fallback |
| Sticky header covers fields when tabbing through forms | `scroll-padding-top` on the page |
| Safari ignored the header blur | Added `-webkit-backdrop-filter` |
| Page jumps sideways when the order drawer opens | `scrollbar-gutter: stable` + body scroll lock while the drawer is open |
| Drawer and mobile menu ignored the Escape key | Escape closes both |
| A failed image showed the browser's broken-image icon | Falls back to a letter placeholder; images fade in when loaded |
| Every tab was titled the same | Each page sets its own title (e.g. "Cart · NEXUS") |
| Small tap targets (Remove link, small buttons, quantity buttons) | Raised toward 40px+ |
| Header search kept old text after leaving the shop | Search box follows the URL |
| Animations for users who turned motion off | `prefers-reduced-motion` turns them off |
| "+" on a product card gave no feedback | Toast "Added … — View cart" and a bump on the cart badge |
| Spinners while products load felt dated | Skeleton cards with a shimmer |
| Static pages | Staggered fade-up for cards and tiles, header shadow on scroll, moving perks strip, category icons, soft gradient behind the hero, custom select arrows, tabular numbers for prices |

## Prompt 5 — login page clipping + micro optimizations
After adding the Supabase publishable key I could log in and the admin pages worked, but the login page looked cut off on the right.
> "http://localhost:5173/admin/login why this looks clipped. Do all the micro optimizations inside the code, write the prompt for it and then execrute the command"

```
Role: senior React/CSS reviewer.
Context: frontend/src (React 19 + Vite, plain CSS). The login page background
stops before the right edge, and on a 375px phone the Orders table breaks
order IDs onto two lines and runs off the screen.
Task:
1. Find why the login page looks clipped and fix it properly.
2. Go through the code for small optimizations that don't change features:
   - extra network requests and re-renders (admin token refresh, duplicate GETs,
     functions recreated every render, results arriving after a page is closed)
   - repeated expensive work (date/number formatting in tables, filtering on
     every key press)
   - cart kept in sync if the store is open in two tabs
   - faster first paint (preconnect to the image host, high priority for the
     main hero image, a separate cacheable vendor chunk)
   - admin tables readable on phones without sideways scrolling
   - small login polish (focus the email field, bigger "back" link, padding on phones)
Constraints: no new libraries, no feature or API changes, plain CSS,
keep accessibility. npm run build must pass.
Output: the code changes plus a table of issue → fix.
```

### What was found and fixed
| Issue | Fix |
|---|---|
| Login page looked cut off on the right: the page keeps a strip for the scrollbar, and the gradient was painted on the page box, which stops before that strip | Gradient moved to the body (painted on the whole window); softer ellipse gradients so no visible ring |
| Supabase refreshes the admin token about every hour; each refresh created a new `api` object and every admin page reloaded its data | Token kept in a ref; one `api` object for the whole session |
| Same public GET sent twice when two parts of the page (or React's dev double-render) ask at once | Requests already in flight are shared (`src/api/client.js`) |
| Order/inquiry status filter put into the URL without encoding | One `query()` helper builds every query string with `URLSearchParams` |
| Results arriving after leaving a page were still written to state | `useAsync` ignores them; `setData` no longer recreated every render; no extra render on first load |
| Dates and prices formatted with `toLocaleString()`, which builds a new formatter every call (slow in tables) | `Intl` formatters created once in `src/lib/format.js` |
| Customer search filtered the whole list on every key press | `useMemo` + `useDeferredValue` |
| Cart open in two tabs: one tab overwrote the other's changes | Listens for the `storage` event and reloads the cart |
| Each product card searched the cart array for its quantity | Quantities looked up from a Map |
| On a phone the Orders, Customers and Dashboard tables broke "NX-1005" over two lines and ran off the screen | IDs never wrap; under 640px each row becomes a small card with labels |
| First hero photo (the biggest thing on screen) loaded at normal priority | `fetchpriority="high"`, plus `preconnect` to the Supabase image host |
| React and the router were inside the app file, so every app change made browsers download them again | Separate `vendor` chunk (app code is now about 13 KB gzipped) |
| Login: had to click into the email field; "Back to the store" was a tiny tap target; 32px padding on small phones | Email focused on load, bigger back link, 24px padding under 480px |
| Toast ids from `Date.now()` + `Math.random()` | Simple counter |

## Implementation mapping
| Requirement | Where |
|---|---|
| FR-01 Home (hero, categories, featured) | `src/pages/Home.jsx` |
| FR-02–04 Catalog, search, filter, sort | `src/pages/Shop.jsx` (filters kept in the URL) |
| FR-05–06 Product detail, not found | `src/pages/ProductDetail.jsx`, `NotFound.jsx` |
| FR-07–09 Cart, totals, kept after refresh | `src/context/CartContext.jsx`, `src/pages/Cart.jsx`, `src/lib/useQuote.js` |
| FR-10–13 Checkout, errors, confirmation | `src/pages/Checkout.jsx`, `OrderConfirmation.jsx`, `src/lib/validation.js` |
| FR-14 Inquiry form | `src/pages/Contact.jsx` (pre-selects the product from a product page) |
| FR-15–16 Dashboard | `src/admin/Dashboard.jsx` |
| FR-17–19 Orders, status changes, history | `src/admin/Orders.jsx` (only allowed next statuses are shown) |
| FR-20 Customers | `src/admin/Customers.jsx` |
| FR-21–22 Inquiries, status, notes | `src/admin/Inquiries.jsx` |
| Admin login | `src/context/AuthContext.jsx`, `src/admin/Login.jsx`, `AdminLayout.jsx` |
| NFR-07 "Waking up server" | `src/api/client.js`, `src/components/ServerWakeNotice.jsx` |
| NFR-02 No secret key in browser | `src/lib/supabase.js` uses only `VITE_SUPABASE_ANON_KEY` |

## Verification (25 Nov 2026, local)
- `npm run build` → builds with no errors
- Browser checks against the live backend:
  - Home shows categories (3 items each) and 4 featured products with real photos
  - Shop lists 12 products; out-of-stock Stride band has its add button disabled
  - Pulse speaker (stock 2): adding 2 changes the button to "All stock is in your cart"
  - Cart: 2 × Rs 6,500 = Rs 13,000, shipping Free, free-shipping note shown
  - Checkout with bad data: an inline error on every field
  - Demo payment with "simulate decline": "Demo payment was declined… No order was placed"
  - 375px phone width: menu button, 2-column grid, filters wrap
  - `/admin` redirects to the login page
- After adding the publishable key: logged in as admin; Dashboard, Orders, Customers and Inquiries load.
- After Prompt 5: `npm run build` passes (vendor 83 KB gz, app 13 KB gz, admin 65 KB gz, lazy). Orders at 375px show as cards with "NX-1005" on one line. Reloading /admin/orders keeps the session.
- Full end-to-end testing is in phase 06.

## My check
-
