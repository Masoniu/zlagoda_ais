from fastapi import APIRouter, Depends, HTTPException, status
import asyncpg
from typing import List

from backend.core.database import get_db_conn
from backend.schemas.customer_card import CustomerCardCreate, CustomerCardResponse, CustomerCardUpdate
from backend.api.dep import get_current_user

router = APIRouter()


@router.get("/", response_model=List[CustomerCardResponse])
async def get_all_cards(conn: asyncpg.Connection = Depends(get_db_conn),
                        current_user: dict = Depends(get_current_user)):
    result = await conn.fetch("SELECT * FROM customer_card")
    return [dict(r) for r in result]

@router.post("/", response_model=CustomerCardResponse, status_code=status.HTTP_201_CREATED)
async def create_card(
        card: CustomerCardCreate,
        conn: asyncpg.Connection = Depends(get_db_conn),
        current_user: dict = Depends(get_current_user)
):
    if current_user["empl_role"] not in ["Менеджер", "Касир"]:
        raise HTTPException(status_code=403, detail="Додавати картки можуть лише Менеджер або Касир")

    exists = await conn.fetchval("SELECT 1 FROM customer_card WHERE card_number = $1", card.card_number)
    if exists:
        raise HTTPException(status_code=400, detail="Картка з таким номером вже існує")

    new_card = await conn.fetchrow("""
                                   INSERT INTO customer_card (card_number, cust_surname, cust_name, cust_patronymic,
                                                              phone_number, city, street, zip_code, percent)
                                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *
                                   """, card.card_number, card.cust_surname, card.cust_name,
                                   getattr(card, 'cust_patronymic', None),
                                   card.phone_number, getattr(card, 'city', None), getattr(card, 'street', None),
                                   getattr(card, 'zip_code', None), card.percent)

    return dict(new_card)

@router.put("/{card_number}", response_model=CustomerCardResponse)
async def update_card(
        card_number: str,
        card_data: CustomerCardUpdate,
        conn: asyncpg.Connection = Depends(get_db_conn),
        current_user: dict = Depends(get_current_user)
):
    if current_user["empl_role"] not in ["Менеджер", "Касир"]:
        raise HTTPException(status_code=403, detail="Оновлювати картки можуть лише Менеджер або Касир")

    updated_card = await conn.fetchrow("""
                                       UPDATE customer_card
                                       SET cust_surname    = $1,
                                           cust_name       = $2,
                                           cust_patronymic = $3,
                                           phone_number    = $4,
                                           city            = $5,
                                           street          = $6,
                                           zip_code        = $7,
                                           percent         = $8
                                       WHERE card_number = $9 RETURNING *
                                       """, card_data.cust_surname, card_data.cust_name,
                                       getattr(card_data, 'cust_patronymic', None),
                                       card_data.phone_number, getattr(card_data, 'city', None),
                                       getattr(card_data, 'street', None), getattr(card_data, 'zip_code', None),
                                       card_data.percent, card_number)

    if not updated_card:
        raise HTTPException(status_code=404, detail="Картку не знайдено")

    return dict(updated_card)

@router.delete("/{card_number}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_card(
        card_number: str,
        conn: asyncpg.Connection = Depends(get_db_conn),
        current_user: dict = Depends(get_current_user)
):
    # Видаляє лише Менеджер
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