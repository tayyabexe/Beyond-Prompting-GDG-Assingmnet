"""Unit tests: request validation and checkout guards (no database needed)."""

from app.pricing import shipping_for, stock_status

VALID_ORDER = {
    "name": "Test Buyer",
    "email": "buyer@example.com",
    "phone": "0300-1234567",
    "address": "House 1, Street 2, Test Town",
    "city": "Wah Cantt",
    "payment": "cod",
    "items": [{"product_id": "aura-wireless-headphones", "qty": 1}],
}


def test_health(unit_client):
    assert unit_client.get("/api/health").json() == {"status": "ok"}


def test_invalid_fields_return_field_errors(unit_client):
    bad = {**VALID_ORDER, "name": "A", "email": "not-an-email", "phone": "12345", "address": "short"}
    res = unit_client.post("/api/orders", json=bad)
    assert res.status_code == 422
    errors = res.json()["detail"]["field_errors"]
    assert set(errors) >= {"name", "email", "phone", "address"}
    assert errors["phone"] == "Enter a valid mobile number (03XXXXXXXXX)"


def test_card_payment_is_not_accepted(unit_client):
    res = unit_client.post("/api/orders", json={**VALID_ORDER, "payment": "card"})
    assert res.status_code == 422
    assert "payment" in res.json()["detail"]["field_errors"]


def test_quantity_must_be_positive(unit_client):
    res = unit_client.post("/api/orders", json={**VALID_ORDER, "items": [{"product_id": "x", "qty": 0}]})
    assert res.status_code == 422


def test_empty_cart_rejected(unit_client):
    res = unit_client.post("/api/orders", json={**VALID_ORDER, "items": []})
    assert res.status_code == 400
    assert res.json()["detail"] == "Your cart is empty."


def test_simulated_decline_creates_no_order(unit_client):
    # FakeDB would raise if the route tried to write an order.
    res = unit_client.post("/api/orders", json={**VALID_ORDER, "payment": "demo", "simulate_decline": True})
    assert res.status_code == 402


def test_inquiry_validation(unit_client):
    res = unit_client.post("/api/inquiries", json={"name": "Zed", "email": "z@example.com",
                                                   "subject": "Hi", "message": "short"})
    assert res.status_code == 422
    assert set(res.json()["detail"]["field_errors"]) == {"subject", "message"}


def test_shipping_rule():
    assert shipping_for(9_999) == 250
    assert shipping_for(10_000) == 0
    assert shipping_for(0) == 0


def test_stock_status_rule():
    assert [stock_status(n) for n in (0, 1, 3, 4)] == ["out_of_stock", "low_stock", "low_stock", "in_stock"]
