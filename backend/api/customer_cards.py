from fastapi import APIRouter, Depends, HTTPException, status
import asyncpg
from typing import List

from backend.core.database import get_db_conn
from backend.schemas.customer_card import CustomerCardCreate, CustomerCardResponse
from backend.api.dep import get_current_user

router = APIRouter()

@router.get("/", response_model=List[CustomerCardResponse])
async def get_all_cards(conn: asyncpg.Connection = Depends(get_db_conn), current_user: dict = Depends(get_current_user)):
    result = await conn.fetch("SELECT * FROM customer_card")
    return [dict(r) for r in result]

@router.post("/", response_model=CustomerCardResponse, status_code=status.HTTP_201_CREATED)
async def create_card(
        card: CustomerCardCreate,
        conn: asyncpg.Connection = Depends(get_db_conn),
        current_user: dict = Depends(get_current_user)
):
    exists = await conn.fetchval("SELECT 1 FROM customer_card WHERE card_number = $1", card.card_number)
    if exists:
        raise HTTPException(status_code=400, detail="Card already exists")

    new_card = await conn.fetchrow("""
        INSERT INTO customer_card (card_number, cust_surname, cust_name, cust_patronymic, phone_number, city, street, zip_code, percent)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
    """, card.card_number, card.cust_surname, card.cust_name, card.cust_patronymic,
         card.phone_number, card.city, card.street, card.zip_code, card.percent)

    return dict(new_card)

@router.delete("/{card_number}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_card(
        card_number: str,
        conn: asyncpg.Connection = Depends(get_db_conn),
        current_user: dict = Depends(get_current_user)
):
    if current_user["empl_role"] != "Менеджер":
        raise HTTPException(status_code=403, detail="Only Managers can delete cards")

    result = await conn.fetchval("DELETE FROM customer_card WHERE card_number = $1 RETURNING card_number", card_number)

    if not result:
        raise HTTPException(status_code=404, detail="Card not found")
    return None