from fastapi import APIRouter, Depends, HTTPException
from postgrest.exceptions import APIError

from ..db import get_db
from ..schemas import InquiryCreate, OrderCreate

router = APIRouter(tags=["storefront"])


def db_error_code(err: APIError) -> tuple[str, str]:
    """Our SQL functions raise messages like 'INSUFFICIENT_STOCK:product-id'. Split into (code, detail)."""
    msg = (getattr(err, "message", None) or str(err)).strip()
    code, _, detail = msg.partition(":")
    return code.strip(), detail.strip()


@router.post("/orders", status_code=201)
def create_order(body: OrderCreate, db=Depends(get_db)):
    if not body.items:
        raise HTTPException(400, "Your cart is empty.")

    # Simulated payment only — no card data exists anywhere in this system.
    if body.payment == "demo" and body.simulate_decline:
        raise HTTPException(402, "Demo payment was declined (simulated). No order was placed. "
                                 "Try again or choose Cash on Delivery.")

    customer = {"name": body.name, "email": body.email, "phone": body.phone,
                "address": body.address, "city": body.city}
    items = [{"product_id": i.product_id, "qty": i.qty} for i in body.items]

    try:
        order_id = db.rpc("place_order", {"p_customer": customer, "p_items": items,
                                          "p_payment": body.payment}).execute().data
    except APIError as err:
        code, detail = db_error_code(err)
        if code == "INSUFFICIENT_STOCK":
            rows = db.table("products").select("name,stock").eq("id", detail).limit(1).execute().data
            name, left = (rows[0]["name"], rows[0]["stock"]) if rows else (detail, 0)
            msg = f"{name} is out of stock." if left == 0 else f"Only {left} left of {name}."
            raise HTTPException(409, f"{msg} Please update your cart. No order was placed.")
        if code == "PRODUCT_NOT_FOUND":
            raise HTTPException(409, "A product in your cart is no longer available. Please update your cart.")
        if code == "EMPTY_CART":
            raise HTTPException(400, "Your cart is empty.")
        raise

    order = db.table("orders").select("*, order_items(*)").eq("id", order_id).limit(1).execute().data[0]
    # Only what the confirmation page needs.
    return {
        "id": order["id"],
        "created_at": order["created_at"],
        "status": order["status"],
        "name": order["ship_name"],
        "email": order["ship_email"],
        "city": order["ship_city"],
        "payment": order["payment"],
        "items": [{"product_id": i["product_id"], "name": i["product_name"],
                   "price": i["unit_price"], "qty": i["qty"]} for i in order["order_items"]],
        "subtotal": order["subtotal"],
        "shipping": order["shipping"],
        "total": order["total"],
    }


@router.post("/inquiries", status_code=201)
def create_inquiry(body: InquiryCreate, db=Depends(get_db)):
    product_id = (body.product_id or "").strip() or None
    if product_id:
        exists = db.table("products").select("id").eq("id", product_id).limit(1).execute().data
        if not exists:
            raise HTTPException(422, {"field_errors": {"product_id": "Unknown product."}})

    row = db.table("inquiries").insert({
        "name": body.name, "email": body.email.lower(), "subject": body.subject,
        "message": body.message, "product_id": product_id,
    }).execute().data[0]
    return {"id": row["id"], "status": row["status"], "created_at": row["created_at"]}
