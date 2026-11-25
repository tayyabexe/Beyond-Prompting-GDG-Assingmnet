"""Business rules shared by the API. The same shipping rule is in place_order() in schema.sql."""

FREE_SHIPPING_FROM = 10_000  # PKR
SHIPPING_FEE = 250  # PKR
LOW_STOCK_MAX = 3


def shipping_for(subtotal: int) -> int:
    if subtotal <= 0:
        return 0
    return 0 if subtotal >= FREE_SHIPPING_FROM else SHIPPING_FEE


def stock_status(stock: int) -> str:
    if stock <= 0:
        return "out_of_stock"
    if stock <= LOW_STOCK_MAX:
        return "low_stock"
    return "in_stock"


def with_stock_status(product: dict) -> dict:
    return {**product, "stock_status": stock_status(product["stock"])}
