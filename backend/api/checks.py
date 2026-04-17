from fastapi import APIRouter, Depends, HTTPException, status
import asyncpg
from decimal import Decimal
from datetime import datetime, timezone
from typing import List
from backend.core.database import get_db_conn
from backend.api.dep import get_current_user
from backend.schemas.check import CheckCreate, CheckResponse

router = APIRouter()


@router.post("/", response_model=CheckResponse, status_code=status.HTTP_201_CREATED)
async def create_check(
        check_data: CheckCreate,
        conn: asyncpg.Connection = Depends(get_db_conn),
        current_user: dict = Depends(get_current_user)
):
    if current_user["empl_role"] != "Касир":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Тільки Касир може створювати чеки")

    try:
        async with conn.transaction():
            chk_exist = await conn.fetchval('SELECT 1 FROM "check" WHERE check_number = $1', check_data.check_number)
            if chk_exist:
                raise HTTPException(status_code=400, detail="Чек з таким номером вже існує")

            discount_percent = Decimal(0)
            if check_data.card_number:
                card_percent = await conn.fetchval('SELECT percent FROM customer_card WHERE card_number = $1',
                                                   check_data.card_number)
                if card_percent is None:
                    raise HTTPException(status_code=404, detail="Картку клієнта не знайдено")
                discount_percent = Decimal(card_percent) / Decimal(100)

            sum_total = Decimal(0)
            sales_to_insert = []

            for item in check_data.items:
                store_product = await conn.fetchrow(
                    'SELECT selling_price, products_number FROM store_product WHERE "UPC" = $1', item.UPC)
                if not store_product:
                    raise HTTPException(status_code=404, detail=f"Товар з UPC {item.UPC} не знайдено")

                if store_product["products_number"] < item.product_number:
                    raise HTTPException(status_code=400, detail=f"Недостатньо товару {item.UPC}")

                line_price = Decimal(store_product["selling_price"])
                sum_total += line_price * Decimal(item.product_number)

                sales_to_insert.append((item.UPC, check_data.check_number, item.product_number, line_price))

            if discount_percent > 0:
                sum_total = sum_total * (Decimal(1) - discount_percent)

            vat = sum_total * Decimal('0.20')
            print_date = datetime.now(timezone.utc)

            new_check = await conn.fetchrow('''
                                            INSERT INTO "check" (check_number, id_employee, card_number, print_date, sum_total, vat)
                                            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
                                            ''', check_data.check_number, current_user["id_employee"],
                                            check_data.card_number, print_date, sum_total, vat)

            await conn.executemany('''
                                   INSERT INTO sale (upc AS "UPC", check_number, product_number, selling_price)
                                   VALUES ($1, $2, $3, $4)
                                   ''', sales_to_insert)

            return dict(new_check)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Помилка сервера: {str(e)}")

@router.get("/", response_model=List[CheckResponse])
async def get_all_checks(
        conn: asyncpg.Connection = Depends(get_db_conn),
        current_user: dict = Depends(get_current_user)
):
    result = await conn.fetch('SELECT * FROM "check" ORDER BY print_date DESC')
    return [dict(r) for r in result]


@router.delete("/{check_number}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_check(
        check_number: str,
        conn: asyncpg.Connection = Depends(get_db_conn),
        current_user: dict = Depends(get_current_user)
        ):
    if current_user["empl_role"] != "Менеджер":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Тільки Менеджер може видаляти чеки"
        )

    result = await conn.fetchval(
        'DELETE FROM "check" WHERE check_number = $1 RETURNING check_number',
        check_number
    )

    if not result:
        raise HTTPException(status_code=404, detail="Чек не знайдено")

    return None