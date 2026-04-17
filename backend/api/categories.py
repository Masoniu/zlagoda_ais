from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from backend.core.database import get_db
from backend.schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate
from backend.api.dep import get_current_user

router = APIRouter()


@router.get("/", response_model=list[CategoryResponse])
async def get_all_categories(db: AsyncSession = Depends(get_db)):
    query = text("SELECT category_number, category_name FROM category")
    result = await db.execute(query)

    return result.mappings().all()


@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
        category: CategoryCreate,
        db: AsyncSession = Depends(get_db),
        current_user: dict = Depends(get_current_user)
):
    if current_user["empl_role"] != "Менеджер":
        raise HTTPException(status_code=403, detail="You do not have enough permissions")

    query = text("""
        INSERT INTO category (category_name) 
        VALUES (:name) 
        RETURNING category_number, category_name
    """)

    result = await db.execute(query, {"name": category.category_name})
    await db.commit()

    new_category = result.mappings().first()
    return new_category


@router.put("/{category_number}", response_model=CategoryResponse)
async def update_category(
        category_number: int,
        category_data: CategoryUpdate,
        db: AsyncSession = Depends(get_db),
        current_user: dict = Depends(get_current_user)
):
    if current_user["empl_role"] != "Менеджер":
        raise HTTPException(status_code=403, detail="You do not have enough permissions")

    query = text("""
        UPDATE category 
        SET category_name = :name 
        WHERE category_number = :cat_id 
        RETURNING category_number, category_name
    """)

    result = await db.execute(query, {
        "name": category_data.category_name,
        "cat_id": category_number
    })
    await db.commit()

    updated_category = result.mappings().first()
    if not updated_category:
        raise HTTPException(status_code=404, detail="Category not found")

    return updated_category


@router.delete("/{category_number}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
        category_number: int,
        db: AsyncSession = Depends(get_db),
        current_user: dict = Depends(get_current_user)
):
    if current_user["empl_role"] != "Менеджер":
        raise HTTPException(status_code=403, detail="You do not have enough permissions")

    query = text("DELETE FROM category WHERE category_number = :cat_id RETURNING category_number")
    result = await db.execute(query, {"cat_id": category_number})
    await db.commit()

    if not result.mappings().first():
        raise HTTPException(status_code=404, detail="Category not found")

    return None