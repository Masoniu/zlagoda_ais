from fastapi import APIRouter, Depends, HTTPException, status
import asyncpg
from fastapi import Query
from typing import Optional
from backend.core.database import get_db_conn
from backend.schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate
from backend.api.dep import get_current_user

router = APIRouter()


@router.get("/", response_model=list[CategoryResponse])
async def get_all_categories(
        category_name: Optional[str] = Query(None, description="Пошук за назвою"),
        sort_order: Optional[str] = Query("asc", description="Сортування (asc/desc)"),
        conn: asyncpg.Connection = Depends(get_db_conn)
):
    if sort_order.lower() not in ["asc", "desc"]:
        sort_order = "asc"
    
    query = "SELECT category_number, category_name FROM category WHERE 1=1"
    args = []
    if category_name:
        args.append(f"%{category_name}%")
        query += f" AND category_name ILIKE ${len(args)}"

    order = "DESC" if sort_order.lower() == "desc" else "ASC"
    query += f" ORDER BY category_name {order}"

    result = await conn.fetch(query, *args)
    return [dict(r) for r in result]

@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
        category: CategoryCreate,
        conn: asyncpg.Connection = Depends(get_db_conn),
        current_user: dict = Depends(get_current_user)
):
    if current_user["empl_role"] != "Менеджер":
        raise HTTPException(status_code=403, detail="Тільки Менеджер може створювати категорії")

    try:
        new_category = await conn.fetchrow("""
            INSERT INTO category (category_name) 
            VALUES ($1) 
            RETURNING category_number, category_name
        """, category.category_name)

        return dict(new_category)
    except asyncpg.exceptions.UniqueViolationError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Категорія з назвою '{category.category_name}' вже існує"
        )

@router.put("/{category_number}", response_model=CategoryResponse)
async def update_category(
        category_number: int,
        category_data: CategoryUpdate,
        conn: asyncpg.Connection = Depends(get_db_conn),
        current_user: dict = Depends(get_current_user)
):
    if current_user["empl_role"] != "Менеджер":
        raise HTTPException(status_code=403, detail="Тільки Менеджер може оновлювати категорії")

    try:
        updated_category = await conn.fetchrow("""
            UPDATE category 
            SET category_name = $1 
            WHERE category_number = $2 
            RETURNING category_number, category_name
        """, category_data.category_name, category_number)

        if not updated_category:
            raise HTTPException(status_code=404, detail="Категорію не знайдено")

        return dict(updated_category)
    except asyncpg.exceptions.UniqueViolationError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Категорія з назвою '{category_data.category_name}' вже існує"
        )


@router.delete("/{category_number}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
        category_number: int,
        conn: asyncpg.Connection = Depends(get_db_conn),
        current_user: dict = Depends(get_current_user)
):
    if current_user["empl_role"] != "Менеджер":
        raise HTTPException(status_code=403, detail="Тільки Менеджер може видаляти категорії")

    try:
        result = await conn.fetchval(
            "DELETE FROM category WHERE category_number = $1 RETURNING category_number",
            category_number
        )

        if not result:
            raise HTTPException(status_code=404, detail="Категорію не знайдено")
        return None

    except asyncpg.exceptions.ForeignKeyViolationError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неможливо видалити цю категорію, оскільки до неї прив'язані товари в каталозі. Спочатку змініть категорію для цих товарів або видаліть їх."
        )