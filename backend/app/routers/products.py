import re

from fastapi import APIRouter, Depends, HTTPException, Query

from ..db import get_db
from ..pricing import shipping_for, stock_status, with_stock_status
from ..schemas import QuoteRequest

router = APIRouter(tags=["storefront"])

CATEGORIES = ["Audio", "Wearables", "Home Office", "Accessories"]
SORTS = {
    "featured": [("featured", True), ("name", False)],
    "price_asc": [("price", False)],
    "price_desc": [("price", True)],
    "name": [("name", False)],
}


@router.get("/health")
def health():
    return {"status": "ok"}


@router.get("/categories")
def list_categories(db=Depends(get_db)):
    rows = db.table("products").select("category").execute().data
    return [{"name": c, "count": sum(1 for r in rows if r["category"] == c)} for c in CATEGORIES]


@router.get("/products")
def list_products(
    q: str | None = Query(default=None, max_length=80),
    category: str | None = None,
    sort: str = "featured",
    featured: bool | None = None,
    db=Depends(get_db),
):
    if category and category not in CATEGORIES:
        raise HTTPException(400, f"Unknown category. Use one of: {', '.join(CATEGORIES)}")
    if sort not in SORTS:
        raise HTTPException(400, f"Unknown sort. Use one of: {', '.join(SORTS)}")

    query = db.table("products").select("*")
    if category:
        query = query.eq("category", category)
    if featured is not None:
        query = query.eq("featured", featured)
    if q:
        # Keep only safe characters so the text can't break the PostgREST filter syntax.
        term = re.sub(r"[^\w\s-]", " ", q).strip()
        if term:
            query = query.or_(f"name.ilike.%{term}%,description.ilike.%{term}%,category.ilike.%{term}%")
    for column, desc in SORTS[sort]:
        query = query.order(column, desc=desc)

    return [with_stock_status(p) for p in query.execute().data]


@router.get("/products/{product_id}")
def get_product(product_id: str, db=Depends(get_db)):
    rows = db.table("products").select("*").eq("id", product_id).limit(1).execute().data
    if not rows:
        raise HTTPException(404, "Product not found.")
    return with_stock_status(rows[0])


@router.post("/cart/quote")
def quote_cart(body: QuoteRequest, db=Depends(get_db)):
    """Recalculate the cart from database prices and stock (never trust the browser)."""
    ids = list({i.product_id for i in body.items})
    products = {}
    if ids:
        products = {p["id"]: p for p in db.table("products").select("*").in_("id", ids).execute().data}

    lines, subtotal, has_issues = [], 0, False
    for item in body.items:
        p = products.get(item.product_id)
        if not p:
            lines.append({"product_id": item.product_id, "qty": item.qty, "issue": "not_found"})
            has_issues = True
            continue
        issue = None
        if p["stock"] <= 0:
            issue = "out_of_stock"
        elif item.qty > p["stock"]:
            issue = "insufficient_stock"
        has_issues = has_issues or issue is not None
        line_total = p["price"] * item.qty
        subtotal += line_total
        lines.append({
            "product_id": p["id"],
            "name": p["name"],
            "image_url": p["image_url"],
            "price": p["price"],
            "stock": p["stock"],
            "stock_status": stock_status(p["stock"]),
            "qty": item.qty,
            "line_total": line_total,
            "issue": issue,
        })

    shipping = shipping_for(subtotal)
    return {"lines": lines, "subtotal": subtotal, "shipping": shipping,
            "total": subtotal + shipping, "has_issues": has_issues}
