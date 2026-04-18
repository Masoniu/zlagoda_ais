from fastapi import APIRouter, Depends, HTTPException, status
import asyncpg
from typing import List
from fastapi import Query
from typing import Optional
from backend.core.database import get_db_conn
from backend.schemas.product import ProductCreate, ProductResponse, ProductUpdate
from backend.api.dep import get_current_user

router = APIRouter()


@router.get("/", response_model=List[ProductResponse])
async def get_products(
        category_number: Optional[int] = Query(None, description="Фільтр за категорією"),
        name: Optional[str] = Query(None, description="Пошук за назвою товару"),
        conn: asyncpg.Connection = Depends(get_db_conn)
):
    query = """
            SELECT p.id_product, \
                   p.category_number, \
                   p.product_name,
                   p.manufacturer, \
                   p.characteristics, \
                   c.category_name
            FROM product p
                     JOIN category c ON p.category_number = c.category_number
            WHERE 1 = 1 \
            """
    args = []

    if category_number is not None:
        args.append(category_number)
        query += f" AND p.category_number = ${len(args)}"

    if name:
        args.append(f"%{name}%")
        query += f" AND p.product_name ILIKE ${len(args)}"

    query += " ORDER BY p.product_name"

    result = await conn.fetch(query, *args)
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

    updated_product = await conn.fetchrow("""
                                          UPDATE product
                                          SET category_number = $1,
                                              product_name    = $2,
                                              manufacturer    = $3,
                                              characteristics = $4
                                          WHERE id_product = $5 RETURNING *
                                          """, product_data.category_number, product_data.product_name,
                                          getattr(product_data, 'manufacturer', 'Невідомо'),
                                          product_data.characteristics, id_product)

    if not updated_product:
        raise HTTPException(status_code=404, detail="Product not found")

    return dict(updated_product)


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