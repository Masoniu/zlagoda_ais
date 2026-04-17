from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import List

from backend.core.database import get_db
from backend.schemas.store_product import StoreProductCreate, StoreProductResponse, StoreProductUpdate
from backend.api.dep import get_current_user

router = APIRouter()


@router.get("/", response_model=List[StoreProductResponse])
async def get_all_store_products(
        db: AsyncSession = Depends(get_db),
        current_user: dict = Depends(get_current_user)
):
    query = text("SELECT * FROM store_product")
    result = await db.execute(query)
    return result.mappings().all()


@router.post("/", response_model=StoreProductResponse, status_code=status.HTTP_201_CREATED)
async def create_store_product(
        item: StoreProductCreate,
        db: AsyncSession = Depends(get_db),
        current_user: dict = Depends(get_current_user)
):
    if current_user["empl_role"] != "Менеджер":
        raise HTTPException(status_code=403, detail="Тільки Менеджер може додавати товари в магазин")

    prod_check_query = text("SELECT 1 FROM product WHERE id_product = :id_prod")
    prod_check = await db.execute(prod_check_query, {"id_prod": item.id_product})
    if not prod_check.scalar():
        raise HTTPException(status_code=400, detail="Product ID does not exist in catalog")
    upc_check_query = text("SELECT 1 FROM store_product WHERE UPC = :upc")
    upc_check = await db.execute(upc_check_query, {"upc": item.UPC})
    if upc_check.scalar():
        raise HTTPException(status_code=400, detail="Product with this UPC already exists")
    insert_query = text("""
        INSERT INTO store_product (UPC, UPC_prom, id_product, selling_price, products_number, promotional_product)
        VALUES (:upc, :upc_prom, :id_product, :price, :qty, :is_prom)
        RETURNING *
    """)

    result = await db.execute(insert_query, {
        "upc": item.UPC,
        "upc_prom": item.UPC_prom,
        "id_product": item.id_product,
        "price": item.selling_price,
        "qty": item.products_number,
        "is_prom": item.promotional_product
    })
    await db.commit()

    return result.mappings().first()


@router.delete("/{upc}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_store_product(
        upc: str,
        db: AsyncSession = Depends(get_db),
        current_user: dict = Depends(get_current_user)
):
    if current_user["empl_role"] != "Менеджер":
        raise HTTPException(status_code=403, detail="Тільки Менеджер може видаляти товари")

    delete_query = text("DELETE FROM store_product WHERE UPC = :upc RETURNING UPC")
    result = await db.execute(delete_query, {"upc": upc})
    await db.commit()

    if not result.mappings().first():
        raise HTTPException(status_code=404, detail="Store product not found")

    return None