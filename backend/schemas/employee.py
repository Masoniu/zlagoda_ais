from pydantic import BaseModel, Field, field_validator
from datetime import date
from typing import Optional

class EmployeeBase(BaseModel):
    empl_surname: str = Field(..., max_length=50)
    empl_name: str = Field(..., max_length=50)
    empl_patronymic: Optional[str] = Field(None, max_length=50)
    empl_role: str = Field(..., max_length=50)
    salary: float = Field(..., ge=0)
    date_of_start: date
    date_of_birth: date
    phone_number: str = Field(..., max_length=13)
    city: Optional[str] = Field(None, max_length=50)
    street: Optional[str] = Field(None, max_length=50)
    zip_code: Optional[str] = Field(None, max_length=9)

    @field_validator('date_of_birth')
    @classmethod
    def check_age(cls, v: date):
        today = date.today()
        age = today.year - v.year - ((today.month, today.day) < (v.month, v.day))
        if age < 18:
            raise ValueError('Працівник повинен бути повнолітнім (18+ років)')
        return v

class EmployeeCreate(EmployeeBase):
    id_employee: str = Field(..., max_length=10)
    password: str = Field(..., min_length=4)

class EmployeeUpdate(EmployeeBase):
    pass

class EmployeeResponse(EmployeeBase):
    id_employee: str
    class Config:
        from_attributes = True