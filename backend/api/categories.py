from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.core.database import get_db
from backend.models.category import Category as CategoryModel
from backend.schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate

router = APIRouter()


@router.get("/", response_model=list[CategoryResponse])
async def get_all_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CategoryModel))
    return result.scalars().all()


@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(category: CategoryCreate, db: AsyncSession = Depends(get_db)):
    new_category = CategoryModel(category_name=category.category_name)
    db.add(new_category)
    await db.commit()
    await db.refresh(new_category)
    return new_category


@router.delete("/{category_number}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(category_number: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CategoryModel).where(CategoryModel.category_number == category_number))
    category = result.scalar_one_or_none()

    if not category:
        raise HTTPException(status_code=404, detail="Категорію не знайдено")

    await db.delete(category)
    await db.commit()
    return None


@router.put("/{category_number}", response_model=CategoryResponse)
async def update_category(category_number: int, category_data: CategoryUpdate, db: AsyncSession = Depends(get_db)):
    """Update an existing category by its ID"""
    result = await db.execute(select(CategoryModel).where(CategoryModel.category_number == category_number))
    category = result.scalar_one_or_none()

    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    # Update the fields
    category.category_name = category_data.category_name

    await db.commit()
    await db.refresh(category)
    return category