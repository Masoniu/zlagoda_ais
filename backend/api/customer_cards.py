from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import List

from backend.core.database import get_db
from backend.schemas.customer_card import CustomerCardCreate, CustomerCardResponse, CustomerCardUpdate
from backend.api.dep import get_current_user

router = APIRouter()


@router.get("/", response_model=List[CustomerCardResponse])
async def get_all_cards(db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    query = text("SELECT * FROM customer_card")
    result = await db.execute(query)
    return result.mappings().all()


@router.post("/", response_model=CustomerCardResponse, status_code=status.HTTP_201_CREATED)
async def create_card(
        card: CustomerCardCreate,
        db: AsyncSession = Depends(get_db),
        current_user: dict = Depends(get_current_user)
):
    check_query = text("SELECT 1 FROM customer_card WHERE card_number = :card_num")
    exists = await db.execute(check_query, {"card_num": card.card_number})
    if exists.scalar():
        raise HTTPException(status_code=400, detail="Card already exists")

    query = text("""
        INSERT INTO customer_card (card_number, cust_surname, cust_name, cust_patronymic, phone_number, city, street, zip_code, percent)
        VALUES (:card_num, :surname, :name, :patr, :phone, :city, :street, :zip, :percent)
        RETURNING *
    """)

    result = await db.execute(query, card.model_dump())
    await db.commit()
    return result.mappings().first()


@router.delete("/{card_number}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_card(
        card_number: str,
        db: AsyncSession = Depends(get_db),
        current_user: dict = Depends(get_current_user)
):
    if current_user["empl_role"] != "Менеджер":
        raise HTTPException(status_code=403, detail="Only Managers can delete cards")

    query = text("DELETE FROM customer_card WHERE card_number = :card_num RETURNING card_number")
    result = await db.execute(query, {"card_num": card_number})
    await db.commit()

    if not result.mappings().first():
        raise HTTPException(status_code=404, detail="Card not found")
    return None