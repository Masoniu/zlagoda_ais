from pydantic import BaseModel, Field
from typing import Optional

class StoreProductBase(BaseModel):
    upc: str = Field(..., max_length=12)
    id_product: int
    selling_price: float
    products_number: int
    promotional_product: bool = False

class StoreProductCreate(StoreProductBase):
    pass

class StoreProductUpdate(BaseModel):
    selling_price: Optional[float] = None
    products_number: Optional[int] = None
    promotional_product: Optional[bool] = None

class StoreProductResponse(StoreProductBase):
    class Config:
        from_attributes = True