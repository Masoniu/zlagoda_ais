from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="ZLAGODA AIS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Потім замінимо на конкретний URL фронтенда
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to ZLAGODA AIS API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}