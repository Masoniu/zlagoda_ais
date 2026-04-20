from fastapi import APIRouter, Depends, HTTPException, status, Query
import asyncpg
from typing import List, Optional
from backend.core.database import get_db_conn
from backend.schemas.product import ProductCreate, ProductResponse, ProductUpdate
from backend.api.dep import get_current_user

router = APIRouter()


# Тут current_user передаємо в dependencies, бо всередині він не використовується
@router.get("/", response_model=List[ProductResponse], dependencies=[Depends(get_current_user)])
async def get_products(
        category_number: List[int] = Query(default=[], description="Фільтр за категорією"),
        name: Optional[str] = Query(None, description="Пошук за назвою товару"),
        sort_order: Optional[str] = Query("asc", description="Сортування (asc/desc)"),
        conn: asyncpg.Connection = Depends(get_db_conn)
):
    if sort_order.lower() not in ["asc", "desc"]:
        sort_order = "asc"

    query = """
        SELECT p.id_product, p.category_number, p.product_name, 
               p.manufacturer, p.characteristics, c.category_name 
        FROM product p
        JOIN category c ON p.category_number = c.category_number
        WHERE 1=1
    """
    args = []
    if category_number:
        args.append(category_number)
        query += f" AND p.category_number = ANY(${len(args)}::int[])"

    if name:
        args.append(f"%{name}%")
        query += f" AND p.product_name ILIKE ${len(args)}"

    order = "DESC" if sort_order.lower() == "desc" else "ASC"
    query += f" ORDER BY p.product_name {order}"

    result = await conn.fetch(query, *args)
    return [dict(r) for r in result]


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
        # Спочатку вставляємо і отримуємо ID
        new_product_id = await conn.fetchval("""
            INSERT INTO product (category_number, product_name, manufacturer, characteristics)
            VALUES ($1, $2, $3, $4) RETURNING id_product
        """, product.category_number, product.product_name,
                                             getattr(product, 'manufacturer', 'Невідомо'), product.characteristics)

        # Потім дістаємо повний об'єкт із category_name для відповіді API
        new_product = await conn.fetchrow("""
            SELECT p.id_product, p.category_number, p.product_name, 
                   p.manufacturer, p.characteristics, c.category_name 
            FROM product p
            JOIN category c ON p.category_number = c.category_number
            WHERE p.id_product = $1
        """, new_product_id)

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
        cat_check = await conn.fetchval("SELECT 1 FROM category WHERE category_number = $1",
                                        product_data.category_number)
        if not cat_check:
            raise HTTPException(status_code=400, detail="Категорія не знайдена")

    try:
        update_fields = []
        update_values = []

        if product_data.category_number is not None:
            update_fields.append(f"category_number = ${len(update_values) + 1}")
            update_values.append(product_data.category_number)

        if product_data.product_name is not None:
            update_fields.append(f"product_name = ${len(update_values) + 1}")
            update_values.append(product_data.product_name)

        if product_data.manufacturer is not None:
            update_fields.append(f"manufacturer = ${len(update_values) + 1}")
            update_values.append(product_data.manufacturer)

        if product_data.characteristics is not None:
            update_fields.append(f"characteristics = ${len(update_values) + 1}")
            update_values.append(product_data.characteristics)

        if not update_fields:
            raise HTTPException(status_code=400, detail="Не надано жодних полів для оновлення")

        update_values.append(id_product)
        query = f"UPDATE product SET {', '.join(update_fields)} WHERE id_product = ${len(update_values)}"

        await conn.execute(query, *update_values)

        # Витягуємо оновлений запис разом з category_name
        updated_product = await conn.fetchrow("""
            SELECT p.id_product, p.category_number, p.product_name, 
                   p.manufacturer, p.characteristics, c.category_name 
            FROM product p
            JOIN category c ON p.category_number = c.category_number
            WHERE p.id_product = $1
        """, id_product)

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
            detail="Неможливо видалити цей товар з каталогу, оскільки він зараз знаходиться у списку 'Товари в магазині'."
        )
    
@router.get("/reports/bestsellers")
async def get_bestsellers(
        conn: asyncpg.Connection = Depends(get_db_conn)
):
    query = """
        SELECT p.id_product, p.product_name, p.manufacturer, p.characteristics, p.category_number, c.category_name
        FROM product p
        JOIN category c ON p.category_number = c.category_number
        WHERE NOT EXISTS (
            SELECT e.id_employee FROM employee e WHERE e.empl_role = 'Касир'
            AND NOT EXISTS (
                SELECT s.upc FROM sale s
                JOIN "check" ch ON s.check_number = ch.check_number
                JOIN store_product sp ON s.upc = sp.upc
                WHERE ch.id_employee = e.id_employee AND sp.id_product = p.id_product
            )
        )
        ORDER BY p.product_name ASC
    """
    result = await conn.fetch(query)
    return [dict(r) for r in result]