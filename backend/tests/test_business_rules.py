"""Live tests of stock and status rules against Supabase.

Read-only tests run whenever keys are present. Tests that create data
only run with RUN_WRITE_TESTS=1 (they add an order and then cancel it).
"""

import pytest
from conftest import RUN_WRITE_TESTS, needs_supabase

BUYER = {
    "name": "Pytest Buyer",
    "email": "pytest.buyer@example.com",
    "phone": "03009999999",
    "address": "House 0, Test Street, Test Town",
    "city": "Wah Cantt",
    "payment": "cod",
}


@needs_supabase
def test_missing_product_returns_404(live_client):
    assert live_client.get("/api/products/does-not-exist").status_code == 404


@needs_supabase
def test_search_and_filter(live_client):
    res = live_client.get("/api/products", params={"q": "headphones"}).json()
    assert [p["id"] for p in res] == ["aura-wireless-headphones"]
    audio = live_client.get("/api/products", params={"category": "Audio"}).json()
    assert {p["category"] for p in audio} == {"Audio"}
    prices = [p["price"] for p in live_client.get("/api/products", params={"sort": "price_asc"}).json()]
    assert prices == sorted(prices)


@needs_supabase
def test_cart_quote_uses_server_prices(live_client):
    q = live_client.post("/api/cart/quote", json={"items": [
        {"product_id": "loop-usb-c-cable", "qty": 2}, {"product_id": "ghost", "qty": 1}]}).json()
    cable = q["lines"][0]
    assert cable["line_total"] == cable["price"] * 2
    assert q["lines"][1]["issue"] == "not_found"
    assert q["has_issues"] is True


@needs_supabase
def test_ordering_more_than_stock_is_rejected(live_client):
    before = live_client.get("/api/products/pulse-mini-speaker").json()["stock"]
    res = live_client.post("/api/orders", json={**BUYER, "items": [
        {"product_id": "pulse-mini-speaker", "qty": before + 1}]})
    assert res.status_code == 409
    assert live_client.get("/api/products/pulse-mini-speaker").json()["stock"] == before


@needs_supabase
def test_invalid_status_transition_is_rejected(live_admin_client):
    order = live_admin_client.get("/api/admin/orders/NX-1001").json()
    assert order["status"] == "delivered" and order["next_statuses"] == []
    res = live_admin_client.patch("/api/admin/orders/NX-1001/status", json={"status": "processing"})
    assert res.status_code == 409


@needs_supabase
@pytest.mark.skipif(not RUN_WRITE_TESTS, reason="set RUN_WRITE_TESTS=1 to run tests that write data")
def test_full_flow_order_then_cancel_restocks(live_client, live_admin_client):
    pid = "volt-power-bank"
    before = live_client.get(f"/api/products/{pid}").json()["stock"]

    res = live_client.post("/api/orders", json={**BUYER, "items": [{"product_id": pid, "qty": 2}]})
    assert res.status_code == 201, res.text
    order = res.json()
    assert order["subtotal"] == order["items"][0]["price"] * 2
    assert live_client.get(f"/api/products/{pid}").json()["stock"] == before - 2

    listed = live_admin_client.get("/api/admin/orders", params={"status": "pending"}).json()
    assert order["id"] in {o["id"] for o in listed}

    res = live_admin_client.patch(f"/api/admin/orders/{order['id']}/status", json={"status": "cancelled"})
    assert res.status_code == 200
    assert [h["status"] for h in res.json()["history"]] == ["pending", "cancelled"]
    assert live_client.get(f"/api/products/{pid}").json()["stock"] == before
