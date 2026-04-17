from fastapi import APIRouter, Depends, HTTPException, status
import asyncpg

from backend.core.database import get_db_conn
from backend.services.auth import authenticate_user
from backend.core.security import create_access_token
from fastapi.security import OAuth2PasswordRequestForm

router = APIRouter(tags=["Authentication"])

@router.post("/login")
async def login(
        form_data: OAuth2PasswordRequestForm = Depends(),
        conn: asyncpg.Connection = Depends(get_db_conn)
):
    user = await authenticate_user(conn, form_data.username, form_data.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect ID or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(data={"sub": str(user["id_employee"])})

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user["empl_role"]
    }