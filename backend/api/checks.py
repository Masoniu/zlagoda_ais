from fastapi import APIRouter, Depends, HTTPException, status
from fastapi import Query
from typing import Optional
from datetime import datetime
import asyncpg
from decimal import Decimal
from datetime import datetime, timezone
from typing import List
from backend.core.database import get_db_conn
from backend.api.dep import get_current_user
from backend.schemas.check import CheckCreate, CheckResponse
from backend.schemas.employee import EmployeeResponse

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
                                   INSERT INTO sale (upc, check_number, product_number, selling_price)
                                   VALUES ($1, $2, $3, $4)
                                   ''', sales_to_insert)

            return dict(new_check)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Помилка сервера: {str(e)}")


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


@router.get("/")
async def get_checks(
        start_date: Optional[datetime] = Query(None, description="Початкова дата (YYYY-MM-DD)"),
        end_date: Optional[datetime] = Query(None, description="Кінцева дата (YYYY-MM-DD)"),
        id_employee: Optional[str] = Query(None, description="ID касира (тільки для Менеджера)"),
        conn: asyncpg.Connection = Depends(get_db_conn),
        current_user: dict = Depends(get_current_user)
):
    query = 'SELECT * FROM "check" WHERE 1=1'
    args = []
    if current_user["empl_role"] == "Касир":
        args.append(current_user["id_employee"])
        query += f' AND id_employee = ${len(args)}'
    elif id_employee:
        args.append(id_employee)
        query += f' AND id_employee = ${len(args)}'

    if start_date:
        args.append(start_date)
        query += f' AND print_date >= ${len(args)}'
    if end_date:
        args.append(end_date)
        query += f' AND print_date <= ${len(args)}'

    query += ' ORDER BY print_date DESC'

    result = await conn.fetch(query, *args)
    return [dict(r) for r in result]

@router.get("/analytics/total-sum")
async def get_total_sales_sum(
        start_date: Optional[datetime] = Query(None),
        end_date: Optional[datetime] = Query(None),
        id_employee: Optional[str] = Query(None),
        conn: asyncpg.Connection = Depends(get_db_conn),
        current_user: dict = Depends(get_current_user)
):
    if current_user["empl_role"] != "Менеджер":
        raise HTTPException(status_code=403, detail="Тільки Менеджер має доступ до фінансової аналітики")

    query = 'SELECT COALESCE(SUM(sum_total), 0) AS total_sum FROM "check" WHERE 1=1'
    args = []

    if id_employee:
        args.append(id_employee)
        query += f' AND id_employee = ${len(args)}'
    if start_date:
        args.append(start_date)
        query += f' AND print_date >= ${len(args)}'
    if end_date:
        args.append(end_date)
        query += f' AND print_date <= ${len(args)}'

    result = await conn.fetchval(query, *args)
    return {"total_sum": result}

@router.get("/analytics/total-quantity/{upc}")
async def get_total_product_quantity(
        upc: str,
        start_date: Optional[datetime] = Query(None),
        end_date: Optional[datetime] = Query(None),
        conn: asyncpg.Connection = Depends(get_db_conn),
        current_user: dict = Depends(get_current_user)
):
    if current_user["empl_role"] != "Менеджер":
        raise HTTPException(status_code=403, detail="Тільки Менеджер має доступ до аналітики товарів")
    query = '''
            SELECT COALESCE(SUM(s.product_number), 0) AS total_sold
            FROM sale s
                     JOIN "check" c ON s.check_number = c.check_number
            WHERE s.upc = $1 \
            '''
    args = [upc]

    if start_date:
        args.append(start_date)
        query += f' AND c.print_date >= ${len(args)}'
    if end_date:
        args.append(end_date)
        query += f' AND c.print_date <= ${len(args)}'

    result = await conn.fetchval(query, *args)
    return {"upc": upc, "total_sold": result}

@router.get("/{check_number}/details")
async def get_check_details(
        check_number: str,
        conn: asyncpg.Connection = Depends(get_db_conn),
        current_user: dict = Depends(get_current_user)
):
    check = await conn.fetchrow('SELECT * FROM "check" WHERE check_number = $1', check_number)
    if not check:
        raise HTTPException(status_code=404, detail="Чек не знайдено")

    if current_user["empl_role"] == "Касир" and check["id_employee"] != current_user["id_employee"]:
        raise HTTPException(status_code=403, detail="Ви не можете переглядати чеки інших касирів")
    items_query = '''
                  SELECT s.upc, p.product_name, s.product_number AS quantity, s.selling_price
                  FROM sale s
                           JOIN store_product sp ON s.upc = sp.upc
                           JOIN product p ON sp.id_product = p.id_product
                  WHERE s.check_number = $1 \
                  '''
    items = await conn.fetch(items_query, check_number)
    response = dict(check)
    response["items"] = [dict(item) for item in items]
    return response