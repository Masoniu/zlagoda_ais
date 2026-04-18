from fastapi import APIRouter, Depends, HTTPException, status, Query
import asyncpg
from typing import List, Optional
from decimal import Decimal
from backend.core.database import get_db_conn
from backend.schemas.store_product import StoreProductCreate, StoreProductResponse, StoreProductUpdate
from backend.api.dep import get_current_user

router = APIRouter()
@router.get("/", response_model=List[StoreProductResponse])
async def get_all_store_products(
        promotional: Optional[bool] = Query(None, description="True - акційні, False - неакційні, None - всі"),
        sort_by: Optional[str] = Query("name", description="Сортування: 'name' або 'quantity'"),
        conn: asyncpg.Connection = Depends(get_db_conn),
        current_user: dict = Depends(get_current_user)
):
    query = """
            SELECT sp.upc      AS "UPC", \
                   sp.upc_prom AS "UPC_prom", \
                   sp.id_product,
                   sp.selling_price, \
                   sp.products_number, \
                   sp.promotional_product
            FROM store_product sp
                     JOIN product p ON sp.id_product = p.id_product
            WHERE 1 = 1 \
            """
    args = []
    if promotional is not None:
        args.append(promotional)
        query += f" AND sp.promotional_product = ${len(args)}"

    if sort_by == "quantity":
        query += " ORDER BY sp.products_number ASC"
    else:
        query += " ORDER BY p.product_name ASC"

    result = await conn.fetch(query, *args)
    return [dict(r) for r in result]

@router.get("/", response_model=List[StoreProductResponse])
async def get_all_store_products(
        promotional: Optional[bool] = Query(None, description="True - акційні, False - неакційні, None - всі"),
        sort_by: Optional[str] = Query("name", description="Сортування: 'name' або 'quantity'"),
        conn: asyncpg.Connection = Depends(get_db_conn),
        current_user: dict = Depends(get_current_user)
):
    query = """
            SELECT sp.upc      AS "UPC", 
                   sp.upc_prom AS "UPC_prom", 
                   sp.id_product,
                   sp.selling_price, 
                   sp.products_number, 
                   sp.promotional_product,
                   p.product_name
            FROM store_product sp
                     JOIN product p ON sp.id_product = p.id_product
            WHERE 1 = 1 
            """
    args = []
    if promotional is not None:
        args.append(promotional)
        query += f" AND sp.promotional_product = ${len(args)}"

    if sort_by == "quantity":
        query += " ORDER BY sp.products_number ASC"
    else:
        query += " ORDER BY p.product_name ASC"

    result = await conn.fetch(query, *args)
    return [dict(r) for r in result]

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

        reg_price = await conn.fetchval("SELECT selling_price FROM store_product WHERE upc = $1", item.upc_prom)
        if not reg_price:
            raise HTTPException(status_code=404, detail="Звичайний товар за вказаним UPC_prom не знайдено")

        item.selling_price = round(reg_price * Decimal('0.8'), 4)
    else:
        item.upc_prom = None

    new_sp = await conn.fetchrow("""
                                 INSERT INTO store_product (upc, upc_prom, id_product, selling_price, products_number,
                                                            promotional_product)
                                 VALUES ($1, $2, $3, $4, $5, $6) 
                                 RETURNING upc AS "UPC", upc_prom AS "upc_prom", id_product, selling_price, products_number, promotional_product
                                 """, item.UPC, item.upc_prom, item.id_product, item.selling_price,
                                 item.products_number, item.promotional_product)

    return dict(new_sp)


@router.put("/{upc}", response_model=StoreProductResponse)
async def update_store_product(
        upc: str,
        item_data: StoreProductUpdate,
        conn: asyncpg.Connection = Depends(get_db_conn),
        current_user: dict = Depends(get_current_user)
):
    if current_user["empl_role"] != "Менеджер":
        raise HTTPException(status_code=403, detail="Тільки Менеджер може оновлювати товари в магазині")
    if item_data.promotional_product:
        if not item_data.upc_prom:
            raise HTTPException(status_code=400,
                                detail="Для акційного товару необхідно вказати UPC звичайного товару (upc_prom)")

        reg_price = await conn.fetchval("SELECT selling_price FROM store_product WHERE upc = $1", item_data.upc_prom)
        if not reg_price:
            raise HTTPException(status_code=404, detail="Звичайний товар за вказаним UPC_prom не знайдено")

        item_data.selling_price = round(reg_price * Decimal('0.8'), 4)
    else:
        item_data.upc_prom = None

    updated_sp = await conn.fetchrow("""
                                     UPDATE store_product
                                     SET upc_prom            = $1,
                                         id_product          = $2,
                                         selling_price       = $3,
                                         products_number     = $4,
                                         promotional_product = $5
                                     WHERE upc = $6 
                                     RETURNING upc AS "UPC", upc_prom AS "upc_prom", id_product, selling_price, products_number, promotional_product
                                     """, item_data.upc_prom, item_data.id_product, item_data.selling_price,
                                     item_data.products_number, item_data.promotional_product, upc)

    if not updated_sp:
        raise HTTPException(status_code=404, detail="Товар в магазині не знайдено")

    return dict(updated_sp)


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
            raise HTTPException(status_code=404, detail="Store product not found")
        return None

    except asyncpg.exceptions.ForeignKeyViolationError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неможливо видалити цей товар, оскільки він вже фігурує у створених чеках."
        )