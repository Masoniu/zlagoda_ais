"""Add trigger for inventory deduction

Revision ID: 3f30550ad135
Revises: d2e2e6ca4d54
Create Date: 2026-04-17 12:11:35.249086

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3f30550ad135'
down_revision: Union[str, Sequence[str], None] = 'd2e2e6ca4d54'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    #NEW.product_number = к-ть товару яку продали
    # NEW."UPC" = штрих код проданого товару
    op.execute("""
               CREATE
               OR REPLACE FUNCTION deduct_inventory()
        RETURNS TRIGGER AS $$
               BEGIN
               UPDATE store_product
               SET products_number = products_number - NEW.product_number
               WHERE "UPC" = NEW."UPC";

               RETURN NEW;
               END;
        $$
               LANGUAGE plpgsql;
               """)

    #тригер спрацьовує АВТОМАТИЧНО після кожного INSERT у таблицю sale
    op.execute("""
               CREATE TRIGGER trigger_deduct_inventory
                   AFTER INSERT
                   ON sale
                   FOR EACH ROW
                   EXECUTE FUNCTION deduct_inventory();
               """)


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS trigger_deduct_inventory ON sale;")
    op.execute("DROP FUNCTION IF EXISTS deduct_inventory();")