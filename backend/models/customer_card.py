from sqlalchemy import String, Integer, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column
from backend.core.database import Base

class CustomerCard(Base):
    __tablename__ = "customer_card"
    card_number: Mapped[str] = mapped_column(String(13), primary_key=True)
    cust_surname: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    cust_name: Mapped[str] = mapped_column(String(50), nullable=False)
    cust_patronymic: Mapped[str] = mapped_column(String(50), nullable=True)
    phone_number: Mapped[str] = mapped_column(String(13), nullable=False)
    city: Mapped[str] = mapped_column(String(50), nullable=True)
    street: Mapped[str] = mapped_column(String(50), nullable=True)
    zip_code: Mapped[str] = mapped_column(String(9), nullable=True)
    percent: Mapped[int] = mapped_column(Integer, nullable=False)
    __table_args__ = (
        CheckConstraint('percent >= 0 AND percent <= 100', name='check_cust_percent_range'),
    )