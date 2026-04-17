from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api.auth import router as auth_router
from backend.api.categories import router as categories_router
from backend.api.products import router as products_router
from backend.api.store_product import router as store_products_router
from backend.api.customer_cards import router as customer_cards_router
from backend.api.checks import router as checks_router
from contextlib import asynccontextmanager
from backend.core.database import create_db_pool
# uvicorn backend.main:app --reload

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.pool = await create_db_pool()
    print("Пул з'єднань asyncpg ініціалізовано")
    yield
    await app.state.pool.close()
    print("Пул з'єднань asyncpg закрито")
app = FastAPI(title="ZLAGODA AIS API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

@app.get("/")
async def root():
    return {"message": "Zlagoda AIS is running"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}