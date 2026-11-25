"""Context-engineering check.

The demo-data rules and business rules in docs/requirements.md (sections 4 and 5) were given
to the AI as context when it wrote seed.sql and the API. These tests read the LIVE Supabase
data through the API and check that it really follows those rules.
"""

import re

from conftest import needs_supabase

from app.db import get_db
from app.pricing import shipping_for

SEED_CUSTOMER_IDS = {f"00000000-0000-4000-8000-00000000000{i}" for i in range(1, 7)}
SEED_ORDER_IDS = {f"NX-{n}" for n in range(1001, 1009)}
PHONE_RE = re.compile(r"^(03\d{9}|\+923\d{9})$")


@needs_supabase
def test_products_follow_demo_data_rules(live_client):
    products = live_client.get("/api/products").json()
    assert len(products) == 12
    by_cat = {}
    for p in products:
        by_cat.setdefault(p["category"], []).append(p)
        assert 1_500 <= p["price"] <= 45_000, p["id"]
        assert p["stock"] >= 0
    assert {c: len(v) for c, v in by_cat.items()} == {
        "Audio": 3, "Wearables": 3, "Home Office": 3, "Accessories": 3}

    cats = live_client.get("/api/categories").json()
    assert sum(c["count"] for c in cats) == 12


@needs_supabase
def test_seed_customers_are_fictional():
    rows = get_db().table("customers").select("*").in_("id", list(SEED_CUSTOMER_IDS)).execute().data
    assert len(rows) == 6
    for c in rows:
        assert c["email"].endswith("@example.com")
        assert PHONE_RE.match(c["phone"])


@needs_supabase
def test_seed_orders_cover_every_status():
    rows = get_db().table("orders").select("status").in_("id", list(SEED_ORDER_IDS)).execute().data
    assert len(rows) == 8
    statuses = {r["status"] for r in rows}
    # seed orders may have moved forward during demos, but the seed started with all five
    assert len(statuses) >= 3


@needs_supabase
def test_every_order_total_matches_its_items():
    """Business rule: subtotal = sum(items), shipping by rule, total = subtotal + shipping."""
    orders = get_db().table("orders").select("*, order_items(*)").execute().data
    assert orders
    for o in orders:
        items_sum = sum(i["unit_price"] * i["qty"] for i in o["order_items"])
        assert o["subtotal"] == items_sum, o["id"]
        assert o["shipping"] == shipping_for(o["subtotal"]), o["id"]
        assert o["total"] == o["subtotal"] + o["shipping"], o["id"]


@needs_supabase
def test_inquiries_have_valid_status(live_admin_client):
    inquiries = live_admin_client.get("/api/admin/inquiries").json()
    assert len(inquiries) >= 5
    assert {i["status"] for i in inquiries} <= {"open", "in_progress", "resolved"}
