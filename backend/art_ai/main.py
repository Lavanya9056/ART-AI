import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from art_ai.api.home import router as home_router
from art_ai.api.auth import router as auth_router
from art_ai.api.users import router as users_router
from art_ai.api.image import router as image_router
from art_ai.api.ai import router as ai_router

PROJECT_ROOT = Path(__file__).resolve().parents[2]
UPLOADS_DIR = PROJECT_ROOT / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

# Get frontend URL from environment (for production) or use localhost for development
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://127.0.0.1:5173", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

# Mount generated images directory
GENERATED_DIR = UPLOADS_DIR / "generated"
GENERATED_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads/generated", StaticFiles(directory=str(GENERATED_DIR)), name="generated")

app.include_router(home_router)
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(image_router)
app.include_router(ai_router)
