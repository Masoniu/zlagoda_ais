from sqlalchemy import String, Integer, Numeric, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from typing import Optional
from backend.core.database import Base

class StoreProduct(Base):
    __tablename__ = "store_product"
    UPC: Mapped[str] = mapped_column(String(12), primary_key=True)
    UPC_prom: Mapped[Optional[str]] = mapped_column(
        String(12),
        ForeignKey("store_product.UPC", onupdate="CASCADE", ondelete="SET NULL"),
        nullable=True
    )
    id_product: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("product.id_product", onupdate="CASCADE", ondelete="NO ACTION"),
        nullable=False
    )
    selling_price: Mapped[float] = mapped_column(Numeric(13, 4), nullable=False)
    products_number: Mapped[int] = mapped_column(Integer, nullable=False)
    promotional_product: Mapped[bool] = mapped_column(Boolean, nullable=False)