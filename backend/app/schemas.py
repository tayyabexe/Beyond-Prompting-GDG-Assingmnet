import re
from typing import Annotated, Literal

from pydantic import BaseModel, EmailStr, Field, StringConstraints, field_validator

PHONE_RE = re.compile(r"^(03\d{9}|\+923\d{9})$")


def Text(min_len: int, max_len: int):
    return Annotated[str, StringConstraints(strip_whitespace=True, min_length=min_len, max_length=max_len)]


class CartItem(BaseModel):
    product_id: Text(1, 80)
    qty: int = Field(ge=1, le=99)


class QuoteRequest(BaseModel):
    items: list[CartItem] = Field(default_factory=list, max_length=50)


class OrderCreate(BaseModel):
    name: Text(2, 60)
    email: EmailStr
    phone: str
    address: Text(10, 200)
    city: Text(2, 60)
    payment: Literal["cod", "demo"]
    simulate_decline: bool = False
    items: list[CartItem] = Field(default_factory=list, max_length=50)

    @field_validator("phone")
    @classmethod
    def valid_phone(cls, v: str) -> str:
        cleaned = re.sub(r"[\s-]", "", v or "")
        if not PHONE_RE.match(cleaned):
            raise ValueError("Enter a valid mobile number (03XXXXXXXXX)")
        return cleaned


class InquiryCreate(BaseModel):
    name: Text(2, 60)
    email: EmailStr
    subject: Text(3, 100)
    message: Text(10, 1000)
    product_id: str | None = None


OrderStatus = Literal["pending", "processing", "shipped", "delivered", "cancelled"]
InquiryStatus = Literal["open", "in_progress", "resolved"]


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class InquiryStatusUpdate(BaseModel):
    status: InquiryStatus


class NoteCreate(BaseModel):
    note: Text(1, 500)
