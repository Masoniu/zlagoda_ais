from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import List

from backend.core.database import get_db
from backend.schemas.product import ProductCreate, ProductResponse, ProductUpdate
from backend.api.dep import get_current_user

router = APIRouter()


@router.get("/", response_model=List[ProductResponse])
async def get_products(db: AsyncSession = Depends(get_db)):
    query = text("SELECT * FROM product")
    result = await db.execute(query)
    return result.mappings().all()


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
        product: ProductCreate,
        db: AsyncSession = Depends(get_db),
        current_user: dict = Depends(get_current_user)
):
    if current_user["empl_role"] != "Менеджер":
        raise HTTPException(status_code=403, detail="Not enough permissions")

    cat_query = text("SELECT 1 FROM category WHERE category_number = :cat_num")
    cat_check = await db.execute(cat_query, {"cat_num": product.category_number})
    if not cat_check.scalar():
        raise HTTPException(status_code=400, detail="Category not found")

    query = text("""
        INSERT INTO product (category_number, product_name, characteristics)
        VALUES (:cat_num, :name, :chars)
        RETURNING id_product, category_number, product_name, characteristics
    """)

    result = await db.execute(query, {
        "cat_num": product.category_number,
        "name": product.product_name,
        "chars": product.characteristics
    })
    await db.commit()
    return result.mappings().first()