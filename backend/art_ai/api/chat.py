import requests
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List

from art_ai.dependencies.auth import get_current_user

router = APIRouter(prefix="/chat", tags=["Chat"])

SYSTEM_PROMPT = (
    "You are an expert penetration tester and security analyst assisting a security operator "
    "on the ART-AI platform. You provide concise, technically accurate guidance on vulnerability "
    "analysis, attack vectors, remediation, and security best practices. "
    "All advice is for authorized security testing and educational purposes only. "
    "Keep responses focused and professional."
)


class Message(BaseModel):
    role: str   # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: List[Message]
    model: str = "openai"


@router.post("/message")
def send_message(req: ChatRequest, current_user=Depends(get_current_user)):
    """Send messages to Pollinations text AI and return the assistant response."""
    if not req.messages:
        raise HTTPException(status_code=400, detail="Messages list cannot be empty.")

    # Build messages payload for Pollinations
    pollinations_messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in req.messages[-20:]:  # keep last 20 messages for context
        pollinations_messages.append({"role": msg.role, "content": msg.content})

    try:
        response = requests.post(
            "https://text.pollinations.ai/",
            json={
                "messages": pollinations_messages,
                "model": req.model,
                "private": True,
            },
            timeout=30,
            headers={"Content-Type": "application/json"},
        )
        response.raise_for_status()
        reply_text = response.text.strip()
    except requests.Timeout:
        raise HTTPException(status_code=504, detail="AI service timed out. Please retry.")
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"AI service unavailable: {str(exc)}")

    return {
        "role": "assistant",
        "content": reply_text,
        "model": req.model,
        "provider": "pollinations",
    }


@router.get("/status")
def chat_status():
    """Check if the Pollinations text API is reachable."""
    try:
        resp = requests.post(
            "https://text.pollinations.ai/",
            json={"messages": [{"role": "user", "content": "ping"}], "model": "openai"},
            timeout=8,
        )
        if resp.status_code < 500:
            return {"status": "online", "provider": "pollinations", "model": "openai"}
    except requests.RequestException:
        pass
    return {"status": "offline", "provider": "pollinations", "model": "openai"}
