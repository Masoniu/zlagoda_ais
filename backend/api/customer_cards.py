from fastapi import APIRouter, Depends, HTTPException, status
import asyncpg
from typing import List
from fastapi import Query
from typing import Optional

from backend.core.database import get_db_conn
from backend.schemas.customer_card import CustomerCardCreate, CustomerCardResponse, CustomerCardUpdate
from backend.api.dep import get_current_user

router = APIRouter()


@router.get("/", response_model=List[CustomerCardResponse])
async def get_all_cards(
        percent: Optional[int] = Query(None, description="Фільтр за відсотком знижки"),
        surname: Optional[str] = Query(None, description="Пошук за прізвищем"),
        sort_order: Optional[str] = Query("asc", description="Сортування (asc/desc)"),
        conn: asyncpg.Connection = Depends(get_db_conn)
):
    if sort_order.lower() not in ["asc", "desc"]:
        sort_order = "asc"
    
    query = "SELECT * FROM customer_card WHERE 1=1"
    args = []
    if percent is not None:
        args.append(percent)
        query += f" AND percent = ${len(args)}"
    if surname:
        args.append(f"%{surname}%")
        query += f" AND cust_surname ILIKE ${len(args)}"

    order = "DESC" if sort_order.lower() == "desc" else "ASC"
    query += f" ORDER BY cust_surname {order}"

    result = await conn.fetch(query, *args)
    return [dict(r) for r in result]

@router.post("/", response_model=CustomerCardResponse, status_code=status.HTTP_201_CREATED)
async def create_card(
        card: CustomerCardCreate,
        conn: asyncpg.Connection = Depends(get_db_conn),
        current_user: dict = Depends(get_current_user)
):
    if current_user["empl_role"] not in ["Менеджер", "Касир"]:
        raise HTTPException(status_code=403, detail="Додавати картки можуть лише Менеджер або Касир")

    try:
        new_card = await conn.fetchrow("""
            INSERT INTO customer_card (card_number, cust_surname, cust_name, cust_patronymic,
                                       phone_number, city, street, zip_code, percent)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *
        """, card.card_number, card.cust_surname, card.cust_name, card.cust_patronymic,
            card.phone_number, card.city, card.street, card.zip_code, card.percent)

        return dict(new_card)
    except asyncpg.exceptions.UniqueViolationError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Картка з таким номером вже існує"
        )

@router.put("/{card_number}", response_model=CustomerCardResponse)
async def update_card(
        card_number: str,
        card_data: CustomerCardUpdate,
        conn: asyncpg.Connection = Depends(get_db_conn),
        current_user: dict = Depends(get_current_user)
):
    if current_user["empl_role"] not in ["Менеджер", "Касир"]:
        raise HTTPException(status_code=403, detail="Оновлювати картки можуть лише Менеджер або Касир")

    provided_fields = card_data.model_dump(exclude_unset=True)
    
    if not provided_fields:
        raise HTTPException(status_code=400, detail="Не надано жодних полів для оновлення")
    
    try:
        update_fields = []
        update_values = []
        
        if 'cust_surname' in provided_fields:
            update_fields.append(f"cust_surname = ${len(update_values) + 1}")
            update_values.append(card_data.cust_surname)
        
        if 'cust_name' in provided_fields:
            update_fields.append(f"cust_name = ${len(update_values) + 1}")
            update_values.append(card_data.cust_name)
        
        if 'cust_patronymic' in provided_fields:
            update_fields.append(f"cust_patronymic = ${len(update_values) + 1}")
            update_values.append(card_data.cust_patronymic)
        
        if 'phone_number' in provided_fields:
            update_fields.append(f"phone_number = ${len(update_values) + 1}")
            update_values.append(card_data.phone_number)
        
        if 'city' in provided_fields:
            update_fields.append(f"city = ${len(update_values) + 1}")
            update_values.append(card_data.city)
        
        if 'street' in provided_fields:
            update_fields.append(f"street = ${len(update_values) + 1}")
            update_values.append(card_data.street)
        
        if 'zip_code' in provided_fields:
            update_fields.append(f"zip_code = ${len(update_values) + 1}")
            update_values.append(card_data.zip_code)
        
        if 'percent' in provided_fields:
            # Validate percent is in valid range (schema enforces this, but explicit check for clarity)
            if not (0 <= card_data.percent <= 100):
                raise HTTPException(status_code=400, detail="Відсоток знижки повинен бути від 0 до 100")
            update_fields.append(f"percent = ${len(update_values) + 1}")
            update_values.append(card_data.percent)
        
        update_values.append(card_number)
        query = f"UPDATE customer_card SET {', '.join(update_fields)} WHERE card_number = ${len(update_values)} RETURNING *"
        
        updated_card = await conn.fetchrow(query, *update_values)

        if not updated_card:
            raise HTTPException(status_code=404, detail="Картку не знайдено")

        return dict(updated_card)
    except asyncpg.exceptions.UniqueViolationError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Картка з таким номером або телефоном уже існує"
        )

@router.delete("/{card_number}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_card(
        card_number: str,
        conn: asyncpg.Connection = Depends(get_db_conn),
        current_user: dict = Depends(get_current_user)
):
    if current_user["empl_role"] != "Менеджер":
        raise HTTPException(status_code=403, detail="Тільки Менеджер може видаляти картки клієнтів")

    try:
        result = await conn.fetchval("DELETE FROM customer_card WHERE card_number = $1 RETURNING card_number",
                                     card_number)

        if not result:
            raise HTTPException(status_code=404, detail="Картку не знайдено")
        return None

    except asyncpg.exceptions.ForeignKeyViolationError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неможливо видалити цю картку, оскільки клієнт вже здійснював покупки (картка прив'язана до чеків)."
        )

@router.get("/reports/all-promo")
async def get_top_promo_customers(
    conn: asyncpg.Connection = Depends(get_db_conn),
    current_user: dict = Depends(get_current_user)
):
    query = """
        SELECT cc.*
        FROM customer_card cc
        WHERE NOT EXISTS (
            SELECT sp.upc FROM store_product sp WHERE sp.promotional_product = TRUE
            AND NOT EXISTS (
                SELECT s.upc FROM sale s
                JOIN "check" ch ON s.check_number = ch.check_number
                WHERE ch.card_number = cc.card_number AND s.upc = sp.upc
            )
        )
    """
    rows = await conn.fetch(query)
    return [dict(r) for r in rows]

@router.get("/{card_number}/reports/history")
async def get_customer_history(
        card_number: str,
        conn: asyncpg.Connection = Depends(get_db_conn)
):
    query = """
        SELECT p.product_name, SUM(s.product_number) AS total_quantity
        FROM product p
        JOIN store_product sp ON p.id_product = sp.id_product
        JOIN sale s ON sp.upc = s.upc
        JOIN "check" ch ON s.check_number = ch.check_number
        WHERE ch.card_number = $1
        GROUP BY p.product_name
        ORDER BY total_quantity DESC
    """
    result = await conn.fetch(query, card_number)
    return [dict(r) for r in result]