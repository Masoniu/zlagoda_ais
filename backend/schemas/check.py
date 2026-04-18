from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from decimal import Decimal

class SaleItemCreate(BaseModel):
    UPC: str = Field(..., max_length=12)
    product_number: int = Field(..., gt=0)

class CheckCreate(BaseModel):
    check_number: str = Field(..., max_length=10)
    card_number: Optional[str] = Field(None, max_length=13)
    items: List[SaleItemCreate]

class CheckResponse(BaseModel):
    check_number: str
    id_employee: str
    cashier_name: str
    card_number: Optional[str]
    print_date: datetime
    sum_total: Decimal
    vat: Decimal