from fastapi import APIRouter, Depends, HTTPException, status, Query
import asyncpg
from typing import List, Optional
from backend.core.database import get_db_conn
from backend.schemas.product import ProductCreate, ProductResponse, ProductUpdate
from backend.api.dep import get_current_user

router = APIRouter()


@router.put("/{id_product}", response_model=ProductResponse)
async def update_product(
        id_product: int,
        product_data: ProductUpdate,
        conn: asyncpg.Connection = Depends(get_db_conn),
        current_user: dict = Depends(get_current_user)
):
    if current_user["empl_role"] != "Менеджер":
        raise HTTPException(status_code=403, detail="Тільки Менеджер може оновлювати товари")

    cat_check = await conn.fetchval("SELECT 1 FROM category WHERE category_number = $1", product_data.category_number)
    if not cat_check:
        raise HTTPException(status_code=400, detail="Category not found")

    await conn.execute("""
        UPDATE product
        SET category_number = $1, product_name = $2, manufacturer = $3, characteristics = $4
        WHERE id_product = $5
    """, product_data.category_number, product_data.product_name, product_data.manufacturer, product_data.characteristics, id_product)

    updated_product = await conn.fetchrow("""
        SELECT p.id_product, p.category_number, p.product_name, p.manufacturer, p.characteristics, c.category_name 
        FROM product p
        JOIN category c ON p.category_number = c.category_number
        WHERE p.id_product = $1
    """, id_product)

    return dict(updated_product)

@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
        product: ProductCreate,
        conn: asyncpg.Connection = Depends(get_db_conn),
        current_user: dict = Depends(get_current_user)
):
    if current_user["empl_role"] != "Менеджер":
        raise HTTPException(status_code=403, detail="Тільки Менеджер може створювати товари")

    cat_check = await conn.fetchval("SELECT 1 FROM category WHERE category_number = $1", product.category_number)
    if not cat_check:
        raise HTTPException(status_code=400, detail="Категорія не знайдена")

    try:
        new_product = await conn.fetchrow("""
            INSERT INTO product (category_number, product_name, manufacturer, characteristics)
            VALUES ($1, $2, $3, $4) RETURNING *
        """, product.category_number, product.product_name,
            getattr(product, 'manufacturer', 'Невідомо'), product.characteristics)

        return dict(new_product)
    except asyncpg.exceptions.UniqueViolationError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Товар з такою назвою у цій категорії вже існує"
        )


@router.put("/{id_product}", response_model=ProductResponse)
async def update_product(
        id_product: int,
        product_data: ProductUpdate,
        conn: asyncpg.Connection = Depends(get_db_conn),
        current_user: dict = Depends(get_current_user)
):
    if current_user["empl_role"] != "Менеджер":
        raise HTTPException(status_code=403, detail="Тільки Менеджер може оновлювати товари")

    if product_data.category_number is not None:
        cat_check = await conn.fetchval("SELECT 1 FROM category WHERE category_number = $1", product_data.category_number)
        if not cat_check:
            raise HTTPException(status_code=400, detail="Категорія не знайдена")

    try:
        update_fields = []
        update_values = []
        
        if product_data.category_number is not None:
            update_fields.append("category_number = $1")
            update_values.append(product_data.category_number)
        
        if product_data.product_name is not None:
            update_fields.append(f"product_name = ${len(update_values) + 1}")
            update_values.append(product_data.product_name)
        
        if product_data.characteristics is not None:
            update_fields.append(f"characteristics = ${len(update_values) + 1}")
            update_values.append(product_data.characteristics)
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="Не надано жодних полів для оновлення")
        
        update_values.append(id_product)
        query = f"UPDATE product SET {', '.join(update_fields)} WHERE id_product = ${len(update_values)} RETURNING *"
        
        updated_product = await conn.fetchrow(query, *update_values)

        if not updated_product:
            raise HTTPException(status_code=404, detail="Товар не знайдено")

        return dict(updated_product)
    except asyncpg.exceptions.UniqueViolationError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Товар з такою назвою у цій категорії вже існує"
        )


@router.delete("/{id_product}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
        id_product: int,
        conn: asyncpg.Connection = Depends(get_db_conn),
        current_user: dict = Depends(get_current_user)
):
    if current_user["empl_role"] != "Менеджер":
        raise HTTPException(status_code=403, detail="Тільки Менеджер може видаляти товари")

    try:
        result = await conn.fetchval(
            "DELETE FROM product WHERE id_product = $1 RETURNING id_product",
            id_product
        )

        if not result:
            raise HTTPException(status_code=404, detail="Товар не знайдено")
        return None

    except asyncpg.exceptions.ForeignKeyViolationError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неможливо видалити цей товар з каталогу, оскільки він зараз знаходиться у списку 'Товари в магазині'. Спочатку приберіть його з полиць."
        )