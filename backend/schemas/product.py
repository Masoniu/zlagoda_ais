from pydantic import BaseModel, Field
from typing import Optional

class ProductBase(BaseModel):
    category_number: int
    product_name: str
    characteristics: str

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    category_number: Optional[int] = None
    product_name: Optional[str] = None
    characteristics: Optional[str] = None

class ProductResponse(ProductBase):
    id_product: int

    class Config:
        from_attributes = True