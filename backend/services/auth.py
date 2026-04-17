import asyncpg
from backend.core.security import verify_password

async def authenticate_user(conn: asyncpg.Connection, id_employee: str, password: str):
    user = await conn.fetchrow("SELECT * FROM employee WHERE id_employee = $1", id_employee)

    if not user:
        return None

    if not verify_password(password, user["password_hash"]):
        return None

    return dict(user)