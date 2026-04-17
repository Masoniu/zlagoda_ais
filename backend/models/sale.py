from sqlalchemy import String, Integer, Numeric, ForeignKey, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column
from backend.core.database import Base

class Sale(Base):
    __tablename__ = "sale"
    UPC: Mapped[str] = mapped_column(
        String(12),
        ForeignKey("store_product.UPC", onupdate="CASCADE", ondelete="NO ACTION"),
        primary_key=True
    )
    check_number: Mapped[str] = mapped_column(
        String(10),
        ForeignKey("check.check_number", onupdate="CASCADE", ondelete="CASCADE"),
        primary_key=True
    )
    product_number: Mapped[int] = mapped_column(Integer, nullable=False)
    selling_price: Mapped[float] = mapped_column(Numeric(13, 4), nullable=False)
    __table_args__ = (
        CheckConstraint('product_number > 0', name='check_sale_qty_positive'),
        CheckConstraint('selling_price >= 0', name='check_sale_price_positive'),
    )