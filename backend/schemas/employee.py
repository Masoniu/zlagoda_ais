from pydantic import BaseModel, Field
from datetime import date
from typing import Optional

class EmployeeBase(BaseModel):
    empl_surname: str = Field(..., max_length=50)
    empl_name: str = Field(..., max_length=50)
    empl_patronymic: Optional[str] = Field(None, max_length=50)
    empl_role: str = Field(..., max_length=50)
    salary: float
    date_of_start: date
    date_of_birth: date
    phone_number: str = Field(..., max_length=13)
    city: Optional[str] = Field(None, max_length=50)
    street: Optional[str] = Field(None, max_length=50)
    zip_code: Optional[str] = Field(None, max_length=9)

class EmployeeCreate(EmployeeBase):
    id_employee: str = Field(..., min_length=1, max_length=10)
    password: str = Field(..., min_length=4)

class EmployeeUpdate(EmployeeBase):
    pass

class EmployeeResponse(EmployeeBase):
    id_employee: str

    class Config:
        from_attributes = True

class EmployeeLogin(BaseModel):
    id_employee: str = Field(..., min_length=1, max_length=10)
    password: str = Field(..., min_length=4)