from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal

class StoreProductBase(BaseModel):
    upc_prom: Optional[str] = Field(None, max_length=12)
    id_product: int
    selling_price: Decimal = Field(..., ge=0)
    products_number: int = Field(..., ge=0)
    promotional_product: bool

class StoreProductCreate(StoreProductBase):
    UPC: str = Field(..., max_length=12)

class StoreProductUpdate(StoreProductBase):
    pass

class StoreProductResponse(StoreProductBase):
    UPC: str = Field(..., alias="UPC")
    class Config:
        from_attributes = True
        populate_by_name = True

class StoreProductResponse(StoreProductBase):
    UPC: str = Field(..., alias="UPC")
    product_name: str

    class Config:
        from_attributes = True
        populate_by_name = True