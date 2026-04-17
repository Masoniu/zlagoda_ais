"""Add store inventory view

Revision ID: c92974dc15be
Revises: 91204d7255f6
Create Date: 2026-04-17 10:01:34.990965

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c92974dc15be'
down_revision: Union[str, Sequence[str], None] = '91204d7255f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    #з'єднання таблиці за id_product
    op.execute("""
        CREATE VIEW view_store_inventory AS
        SELECT 
            sp."UPC",
            p.product_name,
            p.characteristics,
            sp.selling_price,
            sp.products_number,
            sp.promotional_product,
            c.category_name
        FROM store_product sp
        JOIN product p ON sp.id_product = p.id_product
        JOIN category c ON p.category_number = c.category_number;
    """)


def downgrade() -> None:
    #видалення представлення при відкаті міграції
    op.execute("DROP VIEW IF EXISTS view_store_inventory;")
