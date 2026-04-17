import datetime
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.core.database import get_db
from backend.api.dep import get_current_user
from backend.models.employee import Employee
from backend.models.check import Check as CheckModel
from backend.models.sale import Sale as SaleModel
from backend.models.store_product import StoreProduct as StoreProductModel
from backend.models.customer_card import CustomerCard as CustomerCardModel
from backend.schemas.check import CheckCreate, CheckResponse

router = APIRouter()


@router.post("/", response_model=CheckResponse, status_code=status.HTTP_201_CREATED)
async def create_check(
        check_data: CheckCreate,
        db: AsyncSession = Depends(get_db),
        current_user: Employee = Depends(get_current_user)
):
    if current_user.empl_role != "Касир":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Cashiers can create checks"
        )
    existing_check = await db.execute(
        select(CheckModel).where(CheckModel.check_number == check_data.check_number)
    )
    if existing_check.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Check number already exists")
    discount_percent = Decimal(0)
    if check_data.card_number:
        card_res = await db.execute(
            select(CustomerCardModel).where(CustomerCardModel.card_number == check_data.card_number)
        )
        card = card_res.scalar_one_or_none()
        if not card:
            raise HTTPException(status_code=404, detail="Customer card not found")
        discount_percent = Decimal(card.percent) / Decimal(100)

    sum_total = Decimal(0)
    sales_to_add = []
    for item in check_data.items:
        sp_res = await db.execute(
            select(StoreProductModel).where(StoreProductModel.UPC == item.UPC)
        )
        store_product = sp_res.scalar_one_or_none()

        if not store_product:
            raise HTTPException(status_code=404, detail=f"Product {item.UPC} not found")
        if store_product.products_number < item.product_number:
            raise HTTPException(
                status_code=400,
                detail=f"Not enough stock for {item.UPC}. Available: {store_product.products_number}"
            )
        store_product.products_number -= item.product_number
        line_price = store_product.selling_price
        sum_total += line_price * item.product_number
        sales_to_add.append(SaleModel(
            UPC=item.UPC,
            check_number=check_data.check_number,
            product_number=item.product_number,
            selling_price=line_price
        ))
    if discount_percent > 0:
        sum_total = sum_total * (Decimal(1) - discount_percent)
    vat = sum_total * Decimal('0.20')
    new_check = CheckModel(
        check_number=check_data.check_number,
        id_employee=current_user.id_employee,
        card_number=check_data.card_number,
        print_date=datetime.datetime.utcnow(),
        sum_total=sum_total,
        vat=vat
    )

    db.add(new_check)
    db.add_all(sales_to_add)
    try:
        await db.commit()
        await db.refresh(new_check)
        return new_check
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail="Transaction failed")