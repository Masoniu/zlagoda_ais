from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api import auth
from backend.api import categories
from backend.api import auth, categories, products

app = FastAPI(title="ZLAGODA AIS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(categories.router, prefix="/categories", tags=["Categories"])
app.include_router(products.router, prefix="/products", tags=["Products"])

@app.get("/")
async def root():
    return {"message": "Zlagoda AIS is running"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}