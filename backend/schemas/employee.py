from pydantic import BaseModel, Field
from datetime import date
from typing import Optional

class EmployeeLogin(BaseModel):
    id_employee: str = Field(..., min_length=1, max_length=10)
    password: str = Field(..., min_length=4)

class EmployeeResponse(BaseModel):
    id_employee: str
    empl_surname: str
    empl_name: str
    empl_patronymic: Optional[str] = None
    empl_role: str
    salary: float
    date_of_start: date
    phone_number: str

    class Config:
        from_attributes = True