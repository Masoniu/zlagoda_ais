from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from backend.core.security import verify_password


async def authenticate_user(session: AsyncSession, id_employee: str, password: str):
    query = text("SELECT * FROM employee WHERE id_employee = :emp_id")
    result = await session.execute(query, {"emp_id": id_employee})
    user = result.mappings().first()

    if not user:
        return None

    if not verify_password(password, user["password_hash"]):
        return None

    return dict(user)