# Phase 2 — Requirements

## 1. Functional requirements

### Storefront (buyer)

| ID | Requirement | Who | Priority |
|---|---|---|---|
| FR-01 | Home page shows a hero section, product categories and featured products | Buyer | Must |
| FR-02 | Catalog page lists all products with image, name, price (PKR) and stock status (In stock / Low stock / Out of stock) | Buyer | Must |
| FR-03 | Buyer can search products by name or description | Buyer | Must |
| FR-04 | Buyer can filter products by category and sort by price or name | Buyer | Must |
| FR-05 | Product detail page shows image, description, price, stock and an "Add to cart" button | Buyer | Must |
| FR-06 | Opening a product that doesn't exist shows a "Product not found" page | Buyer | Must |
| FR-07 | Buyer can add products to the cart, change quantities and remove items | Buyer | Must |
| FR-08 | Cart shows the subtotal, shipping and total, updated immediately | Buyer | Must |
| FR-09 | The cart is kept when the page is refreshed | Buyer | Should |
| FR-10 | Checkout form collects name, email, phone, address, city and a payment method (Cash on Delivery or Demo Payment). No card number fields | Buyer | Must |
| FR-11 | Checkout shows a clear error for each invalid field | Buyer | Must |
| FR-12 | Checkout fails with a clear message if stock is no longer available or the demo payment is declined | Buyer | Must |
| FR-13 | A successful checkout shows a confirmation page with the order ID, items and total, then empties the cart | Buyer | Must |
| FR-14 | Buyer can send an inquiry (name, email, subject, message, optional product) from the contact page or a product page | Buyer | Must |

### CRM (merchant)

| ID | Requirement | Who | Priority |
|---|---|---|---|
| FR-15 | Dashboard shows total orders, revenue, pending orders, open inquiries and low-stock products | Merchant | Must |
| FR-16 | Dashboard lists the latest orders | Merchant | Should |
| FR-17 | Orders page lists each order's ID, date, customer, items, total and status, with a status filter | Merchant | Must |
| FR-18 | Merchant can change an order's status, but only to an allowed next status | Merchant | Must |
| FR-19 | Every status change is saved with a timestamp in the order history | Merchant | Should |
| FR-20 | Customers page lists customers with email, phone, city, number of orders and total spent | Merchant | Must |
| FR-21 | Inquiries page lists inquiries with a status filter (Open / In progress / Resolved) | Merchant | Must |
| FR-22 | Merchant can change an inquiry's status and add internal notes | Merchant | Must |
| FR-23 | An order placed in the storefront appears in the CRM straight away | Merchant | Must |

### API (backend)

| ID | Requirement | Who | Priority |
|---|---|---|---|
| FR-24 | FastAPI exposes REST endpoints for products, orders, customers, inquiries and dashboard stats | System | Must |
| FR-25 | The backend validates every request and returns clear error messages (400 / 404 / 409) | System | Must |
| FR-26 | The backend recalculates prices and totals from the database and never trusts prices sent by the browser | System | Must |

## 2. Non-functional requirements

| ID | Category | Requirement | How we check it |
|---|---|---|---|
| NFR-01 | Security | Supabase keys stay only in `.env` files, which are git-ignored. `.env.example` has placeholders | Search the repo for keys before pushing |
| NFR-02 | Security | Only the backend talks to Supabase. React never has the service key | Inspect the built frontend bundle and network requests |
| NFR-03 | Security | The backend accepts browser requests only from the Vercel URL and localhost (CORS) | Call the API from another origin and see it blocked |
| NFR-04 | Security | No card numbers or real payment data are collected anywhere | Review the checkout form and database tables |
| NFR-05 | Usability | Layout works from 360 px phone width up to desktop, and navigation stays usable on mobile | Test in browser device mode and on a real phone |
| NFR-06 | Usability | Every list has an empty state, and every form shows inline errors | Manual test with empty and invalid data |
| NFR-07 | Usability | Loading states are shown while data is fetched, including a "waking up server" message | Load the site after the Render server has been idle |
| NFR-08 | Performance | Once the server is awake, catalog and CRM pages load in under 2 seconds | Browser DevTools Network tab |
| NFR-09 | Reliability | Stock can never go below zero, even if two checkouts happen together | Backend test: order more than the stock and expect a 409 |
| NFR-10 | Reliability | Data stays after a refresh, a restart or a redeploy (stored in Supabase) | Place an order, redeploy, check the CRM |
| NFR-11 | Maintainability | README has exact setup commands, and the API has auto-generated docs at `/docs` | Fresh clone and follow the README |
| NFR-12 | Accessibility | Images have alt text, form fields have labels, and buttons work with the keyboard | Keyboard-only walkthrough |

## 3. User stories

### Buyer

**US-01 Find a product** (FR-02, FR-03, FR-04)
- Given I am on the catalog, when I type "headphones", then I only see matching products.
- Given my search matches nothing, when the list is empty, then I see "No products found" and a button to clear filters.

**US-02 View a product** (FR-05, FR-06)
- Given a product is out of stock, when I open its page, then the Add to cart button is disabled.
- Given I open `/product/does-not-exist`, then I see "Product not found" and a link back to the shop.

**US-03 Manage my cart** (FR-07, FR-08, FR-09)
- Given an item has 5 in stock, when I try to set the quantity to 6, then it stays at 5 and I see a message.
- Given I remove the last item, then I see "Your cart is empty" and a link to the shop.

**US-04 Check out** (FR-10 to FR-13)
- Given I enter phone "12345", when I submit, then I see "Enter a valid mobile number (03XXXXXXXXX)" under the field.
- Given someone bought the last unit after I added it, when I submit, then I see which item is no longer available and no order is created.
- Given all fields are valid, when I submit, then I see my order ID (for example NX-1009) and my cart is empty.

**US-05 Ask a question** (FR-14)
- Given I fill in the contact form correctly, when I submit, then I see a confirmation and the inquiry appears in the CRM as Open.

### Merchant

**US-06 See my business at a glance** (FR-15, FR-16)
- Given I open the dashboard, then I see total orders, revenue, pending orders, open inquiries and low-stock count.

**US-07 Process an order** (FR-17, FR-18, FR-19, FR-23)
- Given an order is Pending, when I open its status options, then I can only pick Processing or Cancelled.
- Given I cancel an order, then its items go back into stock and the history shows the cancellation time.

**US-08 Know my customers** (FR-20)
- Given a customer has placed 2 orders, then the customers page shows 2 orders and their combined total.

**US-09 Handle inquiries** (FR-21, FR-22)
- Given an inquiry is Open, when I set it to In progress and add a note, then both are saved and still there after a refresh.

## 4. Business rules

| Rule | Detail |
|---|---|
| Order status flow | Pending → Processing → Shipped → Delivered. Pending or Processing can also go to Cancelled. Delivered and Cancelled are final |
| Cancelling | Puts the ordered quantities back into stock |
| Stock | Stock is reduced when an order is placed. An order is rejected if any item doesn't have enough stock |
| Stock status | 0 = Out of stock, 1–3 = Low stock, 4 or more = In stock |
| Shipping | Free when the subtotal is Rs 10,000 or more, otherwise Rs 250 |
| Prices | Whole rupees (PKR). The server calculates every total |
| Order ID | `NX-` followed by a number, for example NX-1001 |
| Customer matching | Customers are matched by email (case-insensitive). A new email creates a new customer |
| Payment | "Cash on Delivery" or "Demo Payment". Demo Payment has a "simulate decline" option to show the error path |
| Inquiry status | Open → In progress → Resolved (can be reopened) |

### Form validation

| Field | Rule |
|---|---|
| Name | 2–60 characters |
| Email | Valid email format |
| Phone | `03XXXXXXXXX` or `+923XXXXXXXXX` (spaces and dashes ignored) |
| Address | At least 10 characters |
| City | Required |
| Quantity | Whole number, from 1 up to the available stock |
| Inquiry subject | 3–100 characters |
| Inquiry message | 10–1000 characters |
| Inquiry note | 1–500 characters |

## 5. Demo data (all fictional)

| Data | Amount | Details |
|---|---|---|
| Products | 12 | 4 categories (Audio, Wearables, Home Office, Accessories), 3 each. Prices Rs 1,500–45,000. A mix of stock levels: at least 1 out of stock and 2 low stock. Images in Supabase Storage |
| Customers | 6 | Made-up Pakistani names, `@example.com` emails, fake `03XX` numbers, cities such as Wah Cantt, Islamabad, Rawalpindi, Lahore |
| Orders | 8 | Spread across all statuses (pending, processing, shipped, delivered, cancelled), linked to the demo customers and products |
| Inquiries | 5 | A mix of Open, In progress and Resolved, some linked to a product, some with notes |

This seed dataset (`products` with categories, prices and stock) is the context we'll give the AI when building the catalog. We'll then check the running app against it, which is our context-engineering example.
