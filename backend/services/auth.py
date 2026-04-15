from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.models.employee import Employee
from backend.core.security import verify_password

async def authenticate_user(session: AsyncSession, id_employee: str, password: str):
    query = select(Employee).where(Employee.id_employee == id_employee)
    result = await session.execute(query)
    user = result.scalar_one_or_none()

    if not user:
        return None

    if not verify_password(password, user.password_hash):
        return None

    return user