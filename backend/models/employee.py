from sqlalchemy import String, Date, Numeric, Column
from sqlalchemy.orm import Mapped, mapped_column
from backend.core.database import Base
from datetime import date

class Employee(Base):
    __tablename__ = "employee"
    id_employee: Mapped[str] = mapped_column(String(10), primary_key=True)
    #??????????????????????????????????????????????????????????
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False) # ??? (цього нема в моделі, але треба десь пароль зберігати)
    #??????????????????????????????????????????????????????????
    empl_surname: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    empl_name: Mapped[str] = mapped_column(String(50), nullable=False)
    empl_patronymic: Mapped[str] = mapped_column(String(50), nullable=True)  #нулабле тру, не чіпати, так в моделі
    empl_role: Mapped[str] = mapped_column(String(10), nullable=False)
    salary: Mapped[float] = mapped_column(Numeric(13, 4), nullable=False)
    date_of_birth: Mapped[date] = mapped_column(Date, nullable=False)
    date_of_start: Mapped[date] = mapped_column(Date, nullable=False)
    phone_number: Mapped[str] = mapped_column(String(13), nullable=False)
    city: Mapped[str] = mapped_column(String(50), nullable=False)
    street: Mapped[str] = mapped_column(String(50), nullable=False)
    zip_code: Mapped[str] = mapped_column(String(9), nullable=False)