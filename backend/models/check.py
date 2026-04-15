from sqlalchemy import String, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from typing import Optional
from backend.core.database import Base

class Check(Base):
    __tablename__ = "check"
    check_number: Mapped[str] = mapped_column(String(10), primary_key=True)
    id_employee: Mapped[str] = mapped_column(
        String(10),
        ForeignKey("employee.id_employee", onupdate="CASCADE", ondelete="NO ACTION"),
        nullable=False
    )
    card_number: Mapped[Optional[str]] = mapped_column(
        String(13),
        ForeignKey("customer_card.card_number", onupdate="CASCADE", ondelete="NO ACTION"),
        nullable=True
    )
    print_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    sum_total: Mapped[float] = mapped_column(Numeric(13, 4), nullable=False)
    vat: Mapped[float] = mapped_column(Numeric(13, 4), nullable=False)