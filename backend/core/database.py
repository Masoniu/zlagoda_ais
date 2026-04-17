import asyncpg
import os
from dotenv import load_dotenv
from fastapi import Request

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def create_db_pool():
    pool = await asyncpg.create_pool(
        DATABASE_URL,
        min_size=5, #скільки з'єднань тримати відкритими завжди
        max_size=20 #скільки максимум можна відкрити при великому навантаженні
    )
    return pool

async def get_db_conn(request: Request):
    """
    Дістає одне вільне з'єднання з пулу для конкретного запиту
    і автоматично повертає його назад після завершення.
    """
    async with request.app.state.pool.acquire() as connection:
        yield connection