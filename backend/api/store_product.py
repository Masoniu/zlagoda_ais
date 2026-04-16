from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from backend.core.database import get_db
from backend.models.store_product import StoreProduct as StoreProductModel
from backend.models.product import Product as ProductModel
from backend.schemas.store_product import StoreProductCreate, StoreProductResponse, StoreProductUpdate

router = APIRouter()


@router.get("/", response_model=List[StoreProductResponse])
async def get_all_store_products(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(StoreProductModel))
    return result.scalars().all()


@router.post("/", response_model=StoreProductResponse, status_code=status.HTTP_201_CREATED)
async def create_store_product(item: StoreProductCreate, db: AsyncSession = Depends(get_db)):
    prod_check = await db.execute(
        select(ProductModel).where(ProductModel.id_product == item.id_product)
    )
    if not prod_check.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Product ID does not exist in catalog")
    upc_check = await db.execute(
        select(StoreProductModel).where(StoreProductModel.UPC == item.UPC)
    )
    if upc_check.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Product with this UPC already exists")

    new_store_item = StoreProductModel(**item.model_dump())
    db.add(new_store_item)
    await db.commit()
    await db.refresh(new_store_item)
    return new_store_item


@router.delete("/{upc}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_store_product(upc: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(StoreProductModel).where(StoreProductModel.UPC == upc))
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(status_code=404, detail="Store product not found")

    await db.delete(item)
    await db.commit()
    return None