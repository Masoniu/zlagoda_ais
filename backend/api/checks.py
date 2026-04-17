from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from decimal import Decimal
from datetime import datetime, timezone

from backend.core.database import get_db
from backend.api.dep import get_current_user
from backend.schemas.check import CheckCreate, CheckResponse

router = APIRouter()


@router.post("/", response_model=CheckResponse, status_code=status.HTTP_201_CREATED)
async def create_check(
        check_data: CheckCreate,
        db: AsyncSession = Depends(get_db),
        current_user: dict = Depends(get_current_user)
):
    if current_user["empl_role"] != "Касир":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Тільки Касир може створювати чеки"
        )

    try:
        query_chk_exist = text('SELECT 1 FROM "check" WHERE check_number = :chk_num')
        chk_exist = await db.execute(query_chk_exist, {"chk_num": check_data.check_number})
        if chk_exist.scalar():
            raise HTTPException(status_code=400, detail="Чек з таким номером вже існує")
        discount_percent = Decimal(0)
        if check_data.card_number:
            query_card = text('SELECT percent FROM customer_card WHERE card_number = :card_num')
            res_card = await db.execute(query_card, {"card_num": check_data.card_number})
            card_percent = res_card.scalar()

            if card_percent is None:
                raise HTTPException(status_code=404, detail="Картку клієнта не знайдено")
            discount_percent = Decimal(card_percent) / Decimal(100)

        sum_total = Decimal(0)
        sales_to_insert = []
        for item in check_data.items:
            query_sp = text('SELECT selling_price, products_number FROM store_product WHERE UPC = :upc')
            res_sp = await db.execute(query_sp, {"upc": item.UPC})
            store_product = res_sp.mappings().first()

            if not store_product:
                raise HTTPException(status_code=404, detail=f"Товар з UPC {item.UPC} не знайдено в магазині")
            if store_product["products_number"] < item.product_number:
                raise HTTPException(
                    status_code=400,
                    detail=f"Недостатньо товару {item.UPC}. Доступно: {store_product['products_number']}"
                )
            query_update_stock = text('''
                UPDATE store_product 
                SET products_number = products_number - :qty 
                WHERE UPC = :upc
            ''')
            await db.execute(query_update_stock, {"qty": item.product_number, "upc": item.UPC})
            line_price = Decimal(store_product["selling_price"])
            sum_total += line_price * Decimal(item.product_number)
            sales_to_insert.append({
                "upc": item.UPC,
                "chk_num": check_data.check_number,
                "qty": item.product_number,
                "price": line_price
            })
        if discount_percent > 0:
            sum_total = sum_total * (Decimal(1) - discount_percent)

        vat = sum_total * Decimal('0.20')
        print_date = datetime.now(timezone.utc)
        query_insert_chk = text('''
            INSERT INTO "check" (check_number, id_employee, card_number, print_date, sum_total, vat)
            VALUES (:chk_num, :empl_id, :card_num, :p_date, :total, :vat)
            RETURNING *
        ''')
        res_insert_chk = await db.execute(query_insert_chk, {
            "chk_num": check_data.check_number,
            "empl_id": current_user["id_employee"],
            "card_num": check_data.card_number,
            "p_date": print_date,
            "total": sum_total,
            "vat": vat
        })
        new_check = res_insert_chk.mappings().first()
        query_insert_sale = text('''
            INSERT INTO sale (UPC, check_number, product_number, selling_price)
            VALUES (:upc, :chk_num, :qty, :price)
        ''')
        for sale in sales_to_insert:
            await db.execute(query_insert_sale, sale)
        await db.commit()
        return dict(new_check)

    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Помилка сервера: {str(e)}")