from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.schemas.employee import EmployeeLogin
from backend.core.database import SessionLocal
from backend.services.auth import authenticate_user
from backend.core.security import create_access_token
from fastapi.security import OAuth2PasswordRequestForm


router = APIRouter(tags=["Authentication"])

async def get_db():
    async with SessionLocal() as session:
        yield session


@router.post("/login")
async def login(
        form_data: OAuth2PasswordRequestForm = Depends(),
        db: AsyncSession = Depends(get_db)
):
    user = await authenticate_user(db, form_data.username, form_data.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect ID or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(data={"sub": user.id_employee})

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.empl_role
    }