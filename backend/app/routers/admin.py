from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from postgrest.exceptions import APIError

from ..auth import require_admin
from ..db import get_db
from ..pricing import LOW_STOCK_MAX
from ..schemas import InquiryStatusUpdate, NoteCreate, OrderStatus, OrderStatusUpdate
from .orders import db_error_code

# Every route in this router requires a valid admin JWT.
router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])

NEXT_STATUSES = {
    "pending": ["processing", "cancelled"],
    "processing": ["shipped", "cancelled"],
    "shipped": ["delivered"],
    "delivered": [],
    "cancelled": [],
}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def shape_order(o: dict) -> dict:
    o = {**o}
    o["items"] = o.pop("order_items", [])
    if "order_status_history" in o:
        o["history"] = sorted(o.pop("order_status_history"), key=lambda h: h["changed_at"])
    o["next_statuses"] = NEXT_STATUSES[o["status"]]
    return o


def shape_inquiry(i: dict) -> dict:
    i = {**i}
    i["notes"] = sorted(i.pop("inquiry_notes", []), key=lambda n: n["created_at"])
    product = i.pop("products", None)
    i["product_name"] = product["name"] if product else None
    return i


@router.get("/me")
def me(email: str = Depends(require_admin)):
    return {"email": email}


@router.get("/stats")
def stats(db=Depends(get_db)):
    orders = db.table("orders").select("id,ship_name,total,status,created_at").execute().data
    inquiries = db.table("inquiries").select("status").execute().data
    low_stock = (db.table("products").select("id,name,stock")
                 .lte("stock", LOW_STOCK_MAX).order("stock").execute().data)
    latest = sorted(orders, key=lambda o: o["created_at"], reverse=True)[:5]
    return {
        "total_orders": len(orders),
        "revenue": sum(o["total"] for o in orders if o["status"] != "cancelled"),
        "pending_orders": sum(1 for o in orders if o["status"] == "pending"),
        "open_inquiries": sum(1 for i in inquiries if i["status"] != "resolved"),
        "low_stock": low_stock,
        "latest_orders": latest,
    }


@router.get("/orders")
def list_orders(status: OrderStatus | None = None, db=Depends(get_db)):
    query = db.table("orders").select("*, order_items(*)").order("created_at", desc=True)
    if status:
        query = query.eq("status", status)
    return [shape_order(o) for o in query.execute().data]


def fetch_order(db, order_id: str) -> dict:
    rows = (db.table("orders").select("*, order_items(*), order_status_history(*)")
            .eq("id", order_id).limit(1).execute().data)
    if not rows:
        raise HTTPException(404, "Order not found.")
    return shape_order(rows[0])


@router.get("/orders/{order_id}")
def get_order(order_id: str, db=Depends(get_db)):
    return fetch_order(db, order_id)


@router.patch("/orders/{order_id}/status")
def update_order_status(order_id: str, body: OrderStatusUpdate, db=Depends(get_db)):
    try:
        db.rpc("update_order_status", {"p_order_id": order_id, "p_new_status": body.status}).execute()
    except APIError as err:
        code, detail = db_error_code(err)
        if code == "ORDER_NOT_FOUND":
            raise HTTPException(404, "Order not found.")
        if code == "INVALID_TRANSITION":
            current = detail.split("->")[0] if "->" in detail else "current"
            raise HTTPException(409, f"Can't change a {current} order to {body.status}.")
        raise
    return fetch_order(db, order_id)


@router.get("/customers")
def list_customers(db=Depends(get_db)):
    customers = db.table("customers").select("*").execute().data
    orders = db.table("orders").select("customer_id,total,status,created_at").execute().data
    result = []
    for c in customers:
        mine = [o for o in orders if o["customer_id"] == c["id"]]
        result.append({
            **c,
            "order_count": len(mine),
            "total_spent": sum(o["total"] for o in mine if o["status"] != "cancelled"),
            "last_order_at": max((o["created_at"] for o in mine), default=None),
        })
    result.sort(key=lambda c: c["last_order_at"] or c["created_at"], reverse=True)
    return result


INQUIRY_SELECT = "*, inquiry_notes(*), products(name)"


@router.get("/inquiries")
def list_inquiries(status: str | None = None, db=Depends(get_db)):
    query = db.table("inquiries").select(INQUIRY_SELECT).order("created_at", desc=True)
    if status:
        if status not in ("open", "in_progress", "resolved"):
            raise HTTPException(400, "Unknown inquiry status.")
        query = query.eq("status", status)
    return [shape_inquiry(i) for i in query.execute().data]


def fetch_inquiry(db, inquiry_id: str) -> dict:
    rows = db.table("inquiries").select(INQUIRY_SELECT).eq("id", inquiry_id).limit(1).execute().data
    if not rows:
        raise HTTPException(404, "Inquiry not found.")
    return shape_inquiry(rows[0])


@router.patch("/inquiries/{inquiry_id}/status")
def update_inquiry_status(inquiry_id: str, body: InquiryStatusUpdate, db=Depends(get_db)):
    fetch_inquiry(db, inquiry_id)  # 404 if missing
    db.table("inquiries").update({"status": body.status, "updated_at": now_iso()}).eq("id", inquiry_id).execute()
    return fetch_inquiry(db, inquiry_id)


@router.post("/inquiries/{inquiry_id}/notes", status_code=201)
def add_inquiry_note(inquiry_id: str, body: NoteCreate, db=Depends(get_db)):
    fetch_inquiry(db, inquiry_id)  # 404 if missing
    db.table("inquiry_notes").insert({"inquiry_id": inquiry_id, "note": body.note}).execute()
    db.table("inquiries").update({"updated_at": now_iso()}).eq("id", inquiry_id).execute()
    return fetch_inquiry(db, inquiry_id)
