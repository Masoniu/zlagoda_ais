import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from backend.api.auth import router as auth_router
from backend.api.categories import router as categories_router
from backend.api.products import router as products_router
from backend.api.store_product import router as store_products_router
from backend.api.customer_cards import router as customer_cards_router
from backend.api.checks import router as checks_router
from backend.api.employees import router as employees_router
from backend.core.database import create_db_pool
# uvicorn backend.main:app --reload

async def cleanup_old_checks(pool):
    while True:
        try:
            async with pool.acquire() as conn:
                #видалення чеків через 3 роки
                result = await conn.execute('''
                                            DELETE
                                            FROM "check"
                                            WHERE print_date < NOW() - INTERVAL '3 years'
                                            ''')
                print(f"Автоочищення: {result}")
        except Exception as e:
            print(f"Помилка очищення чеків: {e}")

        # Очікування 24 години (86400 секунд)
        await asyncio.sleep(86400)


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.pool = await create_db_pool()
    cleanup_task = asyncio.create_task(cleanup_old_checks(app.state.pool))
    yield

    cleanup_task.cancel()
    try:
        await cleanup_task
    except asyncio.CancelledError:
        pass
    await app.state.pool.close()

app = FastAPI(title="ZLAGODA AIS API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(categories_router, prefix="/categories", tags=["Categories"])
app.include_router(products_router, prefix="/products", tags=["Products"])
app.include_router(store_products_router, prefix="/store-products", tags=["Store Inventory"])
app.include_router(customer_cards_router, prefix="/customer-cards", tags=["Customer Cards"])
app.include_router(checks_router, prefix="/checks", tags=["Checks"])
app.include_router(employees_router, prefix="/employees", tags=["Employees"])

@app.get("/")
async def root():
    return {"message": "Zlagoda AIS is running"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}