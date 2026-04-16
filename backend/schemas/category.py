from pydantic import BaseModel

class CategoryBase(BaseModel):
    category_name: str

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(CategoryBase):
    category_name: str

class CategoryResponse(CategoryBase):
    category_number: int

    class Config:
        from_attributes = True