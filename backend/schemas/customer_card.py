from pydantic import BaseModel, Field
from typing import Optional

class CustomerCardBase(BaseModel):
    cust_surname: str = Field(..., max_length=50)
    cust_name: str = Field(..., max_length=50)
    cust_patronymic: Optional[str] = Field(None, max_length=50)
    phone_number: str = Field(..., max_length=13)
    city: Optional[str] = Field(None, max_length=50)
    street: Optional[str] = Field(None, max_length=50)
    zip_code: Optional[str] = Field(None, max_length=9)
    percent: int = Field(..., ge=0, le=100)

class CustomerCardCreate(CustomerCardBase):
    pass

class CustomerCardUpdate(BaseModel):
    cust_surname: Optional[str] = Field(None, max_length=50)
    cust_name: Optional[str] = Field(None, max_length=50)
    cust_patronymic: Optional[str] = Field(None, max_length=50)
    phone_number: Optional[str] = Field(None, max_length=13)
    city: Optional[str] = Field(None, max_length=50)
    street: Optional[str] = Field(None, max_length=50)
    zip_code: Optional[str] = Field(None, max_length=9)
    percent: Optional[int] = Field(None, ge=0, le=100)

class CustomerCardResponse(CustomerCardBase):
    card_number: str
    class Config:
        from_attributes = True