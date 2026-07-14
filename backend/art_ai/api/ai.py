from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from art_ai.services.ai_service import generate_image
from art_ai.dependencies.auth import get_current_user

router = APIRouter(prefix="/ai", tags=["AI"])


class PromptRequest(BaseModel):
    prompt: str


@router.get("/status")
def ai_status():
    return {
        "status": "online",
        "mode": "pollinations",
        "capabilities": ["image_generation", "prompt_engine", "upload_ready"],
    }


@router.post("/generate")
def generate(request: PromptRequest, current_user=Depends(get_current_user)):
    result = generate_image(request.prompt, current_user.id)
    return result
