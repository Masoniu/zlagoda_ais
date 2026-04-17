from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from backend.core.database import get_db
from backend.models.product import Product as ProductModel
from backend.models.category import Category as CategoryModel
from backend.schemas.product import ProductCreate, ProductResponse, ProductUpdate

router = APIRouter()


@router.get("/", response_model=List[ProductResponse])
async def get_products(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ProductModel))
    return result.scalars().all()


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(product: ProductCreate, db: AsyncSession = Depends(get_db)):
    cat_check = await db.execute(
        select(CategoryModel).where(CategoryModel.category_number == product.category_number)
    )
    if not cat_check.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Category with this ID does not exist")

    new_product = ProductModel(**product.model_dump())
    db.add(new_product)
    await db.commit()
    await db.refresh(new_product)
    return new_product


@router.delete("/{id_product}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(id_product: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ProductModel).where(ProductModel.id_product == id_product))
    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    await db.delete(product)
    await db.commit()
    return None