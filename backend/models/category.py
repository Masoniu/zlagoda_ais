from sqlalchemy import String, Integer
from sqlalchemy.orm import Mapped, mapped_column
from backend.core.database import Base

class Category(Base):
    __tablename__ = "category"

    category_number: Mapped[int] = mapped_column(Integer, primary_key=True)
    category_name: Mapped[str] = mapped_column(String(50), nullable=False)