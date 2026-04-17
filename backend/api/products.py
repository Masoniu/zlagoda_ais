from fastapi import APIRouter, Depends, HTTPException, status
import asyncpg
from typing import List

from backend.core.database import get_db_conn
from backend.schemas.product import ProductCreate, ProductResponse
from backend.api.dep import get_current_user

router = APIRouter()


@router.get("/", response_model=List[ProductResponse])
async def get_products(conn: asyncpg.Connection = Depends(get_db_conn)):
    result = await conn.fetch("SELECT * FROM product")
    return [dict(r) for r in result]


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
        product: ProductCreate,
        conn: asyncpg.Connection = Depends(get_db_conn),
        current_user: dict = Depends(get_current_user)
):
    if current_user["empl_role"] != "Менеджер":
        raise HTTPException(status_code=403, detail="Not enough permissions")

    cat_check = await conn.fetchval("SELECT 1 FROM category WHERE category_number = $1", product.category_number)
    if not cat_check:
        raise HTTPException(status_code=400, detail="Category not found")

    new_product = await conn.fetchrow("""
                                      INSERT INTO product (category_number, product_name, manufacturer, characteristics)
                                      VALUES ($1, $2, $3, $4) RETURNING *
                                      """, product.category_number, product.product_name,
                                      getattr(product, 'manufacturer', 'Невідомо'), product.characteristics)

    return dict(new_product)