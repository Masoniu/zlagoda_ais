from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.schemas.employee import EmployeeLogin
from backend.core.database import SessionLocal
from backend.services.auth import authenticate_user
from backend.core.security import create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])

async def get_db():
    async with SessionLocal() as session:
        yield session

@router.post("/login")
async def login(
    user_credentials: EmployeeLogin,
    db: AsyncSession = Depends(get_db)
):
    user = await authenticate_user(db, user_credentials.id_employee, user_credentials.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect ID or password",
        )

    access_token = create_access_token(
        data={"sub": user.id_employee, "role": user.empl_role}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.empl_role,
        "name": user.empl_name
    }