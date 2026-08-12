import os
from pathlib import Path
from art_ai.database import Base, engine
from art_ai.models import user, image

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from art_ai.api.home import router as home_router
from art_ai.api.auth import router as auth_router
from art_ai.api.users import router as users_router
from art_ai.api.image import router as image_router
from art_ai.api.ai import router as ai_router
from art_ai.api.scan import router as scan_router
from art_ai.api.simulate import router as simulate_router
from art_ai.api.compliance import router as compliance_router
from art_ai.api.chat import router as chat_router

PROJECT_ROOT = Path(__file__).resolve().parents[2]
UPLOADS_DIR = PROJECT_ROOT / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Support comma-separated list of allowed origins, e.g. for Vercel preview URLs
_extra = os.getenv("EXTRA_ORIGINS", "")
ALLOWED_ORIGINS = list(filter(None, [
    FRONTEND_URL,
    "http://127.0.0.1:5173",
    "http://localhost:5173",
    *[o.strip() for o in _extra.split(",") if o.strip()],
]))

app = FastAPI(title="ART-AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GENERATED_DIR = UPLOADS_DIR / "generated"
GENERATED_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads/generated", StaticFiles(directory=str(GENERATED_DIR)), name="generated")
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

app.include_router(home_router)
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(image_router)
app.include_router(ai_router)
app.include_router(scan_router)
app.include_router(simulate_router)
app.include_router(compliance_router)
app.include_router(chat_router)


@app.get("/debug")
def debug():
    return {
        "frontend_url": FRONTEND_URL,
        "origins": ALLOWED_ORIGINS,
    }


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
