from pydantic import BaseModel, Field
from typing import Optional

class CustomerCardBase(BaseModel):
    cust_surname: str
    cust_name: str
    cust_patronymic: Optional[str] = None
    phone_number: str = Field(..., max_length=13)
    city: Optional[str] = None
    street: Optional[str] = None
    zip_code: Optional[str] = None
    percent: int

class CustomerCardCreate(CustomerCardBase):
    card_number: str = Field(..., max_length=13)

class CustomerCardUpdate(CustomerCardBase):
    pass

class CustomerCardResponse(CustomerCardBase):
    card_number: str

    class Config:
        from_attributes = True