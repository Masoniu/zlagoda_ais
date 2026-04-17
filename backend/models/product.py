from sqlalchemy import String, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from backend.core.database import Base

class Product(Base):
    __tablename__ = "product"
    id_product: Mapped[int] = mapped_column(Integer, primary_key=True)
    category_number: Mapped[int] = mapped_column(
        Integer, 
        ForeignKey("category.category_number", onupdate="CASCADE", ondelete="NO ACTION"), 
        nullable=False
    )
    product_name: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    characteristics: Mapped[str] = mapped_column(String(100), nullable=False)