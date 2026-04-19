from fastapi import APIRouter, Depends, HTTPException, status, Query
import asyncpg
from typing import List, Optional
from decimal import Decimal

from backend.core.database import get_db_conn
from backend.schemas.store_product import StoreProductCreate, StoreProductResponse, StoreProductUpdate
from backend.api.dep import get_current_user

router = APIRouter()


async def calculate_promo_price(conn: asyncpg.Connection, upc_prom: str) -> Decimal:
    """Calculate 20% discount price from regular product"""
    reg_price = await conn.fetchval("SELECT selling_price FROM store_product WHERE upc = $1", upc_prom)
    if not reg_price:
        raise HTTPException(status_code=404, detail="Звичайний товар за вказаним upc_prom не знайдено")
    return round(Decimal(str(reg_price)) * Decimal('0.8'), 4)


# Видалено unused variable, винесено в dependencies
@router.get("/", response_model=List[StoreProductResponse], dependencies=[Depends(get_current_user)])
async def get_all_store_products(
        search: Optional[str] = Query(None, description="Пошук за UPC"),
        promotional: Optional[bool] = Query(None, description="True - акційні, False - неакційні, None - всі"),
        sort_by: Optional[str] = Query("name", description="Сортування: 'name' або 'quantity'"),
        sort_order: Optional[str] = Query("asc", description="Сортування (asc/desc)"),
        conn: asyncpg.Connection = Depends(get_db_conn)
):
    if sort_by.lower() not in ["name", "quantity"]:
        sort_by = "name"
    if sort_order.lower() not in ["asc", "desc"]:
        sort_order = "asc"

    query = """
            SELECT sp.upc AS "UPC", sp.upc_prom AS "UPC_prom", sp.id_product,
                   sp.selling_price, sp.products_number, sp.promotional_product, p.product_name 
            FROM store_product sp
            JOIN product p ON sp.id_product = p.id_product
            WHERE 1 = 1 
            """
    args = []
    
    if search:
        args.append(f"%{search}%")
        query += f" AND (sp.upc ILIKE ${len(args)} OR p.product_name ILIKE ${len(args)})"

    if promotional is not None:
        args.append(promotional)
        query += f" AND sp.promotional_product = ${len(args)}"

    order = "DESC" if sort_order.lower() == "desc" else "ASC"
    if sort_by.lower() == "quantity":
        query += f" ORDER BY sp.products_number {order}"
    else:
        query += f" ORDER BY p.product_name {order}"

    result = await conn.fetch(query, *args)
    return [dict(r) for r in result]


# Видалено unused variable, винесено в dependencies
@router.get("/{upc}", dependencies=[Depends(get_current_user)])
async def get_store_product_details(
        upc: str,
        conn: asyncpg.Connection = Depends(get_db_conn)
):
    query = """
            SELECT sp.selling_price, 
                   sp.products_number,
                   p.product_name, 
                   p.characteristics
            FROM store_product sp
            JOIN product p ON sp.id_product = p.id_product
            WHERE sp.upc = $1 
            """
    result = await conn.fetchrow(query, upc)

    if not result:
        raise HTTPException(status_code=404, detail="Товар не знайдено")

    return dict(result)


@router.post("/", response_model=StoreProductResponse, status_code=status.HTTP_201_CREATED)
async def create_store_product(
        item: StoreProductCreate,
        conn: asyncpg.Connection = Depends(get_db_conn),
        current_user: dict = Depends(get_current_user)
):
    if current_user["empl_role"] != "Менеджер":
        raise HTTPException(status_code=403, detail="Тільки Менеджер може додавати товари в магазин")

    prod_check = await conn.fetchval("SELECT 1 FROM product WHERE id_product = $1", item.id_product)
    if not prod_check:
        raise HTTPException(status_code=400, detail="Товар з таким ID не знайдено в каталозі")

    upc_check = await conn.fetchval("SELECT 1 FROM store_product WHERE upc = $1", item.UPC)
    if upc_check:
        raise HTTPException(status_code=400, detail="Товар з таким UPC вже існує")

    if item.promotional_product:
        if not item.upc_prom:
            raise HTTPException(status_code=400,
                                detail="Для акційного товару необхідно вказати UPC звичайного товару (upc_prom)")
        item.selling_price = await calculate_promo_price(conn, item.upc_prom)
    else:
        item.upc_prom = None

    try:
        await conn.execute("""
            INSERT INTO store_product (upc, upc_prom, id_product, selling_price, products_number, promotional_product)
            VALUES ($1, $2, $3, $4, $5, $6) 
        """, item.UPC, item.upc_prom, item.id_product, item.selling_price,
                           item.products_number, item.promotional_product)

        # Дістаємо запис разом з product_name
        new_sp = await conn.fetchrow("""
            SELECT sp.upc AS "UPC", sp.upc_prom AS "UPC_prom", sp.id_product,
                   sp.selling_price, sp.products_number, sp.promotional_product, p.product_name 
            FROM store_product sp
            JOIN product p ON sp.id_product = p.id_product
            WHERE sp.upc = $1
        """, item.UPC)

        return dict(new_sp)
    except asyncpg.exceptions.UniqueViolationError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Товар з таким UPC вже існує"
        )


@router.put("/{upc}", response_model=StoreProductResponse)
async def update_store_product(
        upc: str,
        item_data: StoreProductUpdate,
        conn: asyncpg.Connection = Depends(get_db_conn),
        current_user: dict = Depends(get_current_user)
):
    if current_user["empl_role"] != "Менеджер":
        raise HTTPException(status_code=403, detail="Тільки Менеджер може оновлювати товари в магазині")

    provided_fields = item_data.model_dump(exclude_unset=True)

    if 'promotional_product' in provided_fields:
        if item_data.promotional_product is True:
            if not item_data.upc_prom:
                raise HTTPException(status_code=400,
                                    detail="Для акційного товару необхідно вказати UPC звичайного товару (upc_prom)")
            item_data.selling_price = await calculate_promo_price(conn, item_data.upc_prom)
        elif item_data.promotional_product is False:
            item_data.upc_prom = None

    try:
        update_fields = []
        update_values = []

        if item_data.upc_prom is not None:
            update_fields.append(f"upc_prom = ${len(update_values) + 1}")
            update_values.append(item_data.upc_prom)
        elif 'upc_prom' in provided_fields and item_data.upc_prom is None:
            update_fields.append(f"upc_prom = ${len(update_values) + 1}")
            update_values.append(None)

        if item_data.id_product is not None:
            update_fields.append(f"id_product = ${len(update_values) + 1}")
            update_values.append(item_data.id_product)

        if item_data.selling_price is not None:
            update_fields.append(f"selling_price = ${len(update_values) + 1}")
            update_values.append(item_data.selling_price)

        if item_data.products_number is not None:
            update_fields.append(f"products_number = ${len(update_values) + 1}")
            update_values.append(item_data.products_number)

        if item_data.promotional_product is not None:
            update_fields.append(f"promotional_product = ${len(update_values) + 1}")
            update_values.append(item_data.promotional_product)

        if not update_fields:
            raise HTTPException(status_code=400, detail="Не надано жодних полів для оновлення")

        update_values.append(upc)
        query = f"UPDATE store_product SET {', '.join(update_fields)} WHERE upc = ${len(update_values)}"

        await conn.execute(query, *update_values)

        # Витягуємо оновлений запис разом з product_name
        updated_sp = await conn.fetchrow("""
            SELECT sp.upc AS "UPC", sp.upc_prom AS "UPC_prom", sp.id_product,
                   sp.selling_price, sp.products_number, sp.promotional_product, p.product_name 
            FROM store_product sp
            JOIN product p ON sp.id_product = p.id_product
            WHERE sp.upc = $1
        """, upc)

        if not updated_sp:
            raise HTTPException(status_code=404, detail="Товар в магазині не знайдено")

        return dict(updated_sp)
    except asyncpg.exceptions.UniqueViolationError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Товар з таким UPC вже існує"
        )


@router.delete("/{upc}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_store_product(
        upc: str,
        conn: asyncpg.Connection = Depends(get_db_conn),
        current_user: dict = Depends(get_current_user)
):
    if current_user["empl_role"] != "Менеджер":
        raise HTTPException(status_code=403, detail="Тільки Менеджер може видаляти товари")

    try:
        result = await conn.fetchval("DELETE FROM store_product WHERE upc = $1 RETURNING upc", upc)
        if not result:
            raise HTTPException(status_code=404, detail="Товар в магазині не знайдено")
        return None

    except asyncpg.exceptions.ForeignKeyViolationError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неможливо видалити цей товар, оскільки він вже фігурує у створених чеках."
        )