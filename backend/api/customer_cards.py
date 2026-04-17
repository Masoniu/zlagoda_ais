from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from backend.core.database import get_db
from backend.models.customer_card import CustomerCard as CustomerCardModel
from backend.schemas.customer_card import CustomerCardCreate, CustomerCardResponse, CustomerCardUpdate
from backend.api.dep import get_current_user
from backend.models.employee import Employee

router = APIRouter()


@router.get("/", response_model=List[CustomerCardResponse])
async def get_all_cards(
        db: AsyncSession = Depends(get_db),
        current_user: Employee = Depends(get_current_user)
):
    result = await db.execute(select(CustomerCardModel))
    return result.scalars().all()


@router.post("/", response_model=CustomerCardResponse, status_code=status.HTTP_201_CREATED)
async def create_card(
        card: CustomerCardCreate,
        db: AsyncSession = Depends(get_db),
        current_user: Employee = Depends(get_current_user)
):
    card_check = await db.execute(
        select(CustomerCardModel).where(CustomerCardModel.card_number == card.card_number)
    )
    if card_check.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Card with this number already exists")

    new_card = CustomerCardModel(**card.model_dump())
    db.add(new_card)
    await db.commit()
    await db.refresh(new_card)
    return new_card


@router.delete("/{card_number}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_card(
        card_number: str,
        db: AsyncSession = Depends(get_db),
        current_user: Employee = Depends(get_current_user)
):
    if current_user.empl_role != "Менеджер":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    result = await db.execute(select(CustomerCardModel).where(CustomerCardModel.card_number == card_number))
    card = result.scalar_one_or_none()

    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    await db.delete(card)
    await db.commit()
    return None