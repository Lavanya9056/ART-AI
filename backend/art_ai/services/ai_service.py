import os
import uuid
import urllib.parse
from pathlib import Path

import requests
from fastapi import HTTPException

from art_ai.database import SessionLocal
from art_ai.models.image import Image

PROJECT_ROOT = Path(__file__).resolve().parents[2]
UPLOAD_FOLDER = PROJECT_ROOT / "uploads" / "generated"
UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)


def generate_image(prompt: str, user_id: int):
    encoded_prompt = urllib.parse.quote(prompt, safe="")
    url = f"https://image.pollinations.ai/prompt/{encoded_prompt}"

    try:
        response = requests.get(url, timeout=15)
        response.raise_for_status()
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate image: {str(e)}")

    filename = f"{uuid.uuid4()}.png"
    filepath = UPLOAD_FOLDER / filename

    with filepath.open("wb") as f:
        f.write(response.content)

    base_url = os.getenv("API_BASE_URL", "http://127.0.0.1:8000").rstrip("/")

    # Save image record to database
    db = SessionLocal()
    try:
        image_record = Image(
            filename=filename,
            filepath=str(filepath),
            user_id=user_id
        )
        db.add(image_record)
        db.commit()
        db.refresh(image_record)
    finally:
        db.close()

    return {
        "message": "Image generated successfully",
        "filename": filename,
        "image_url": f"{base_url}/uploads/generated/{filename}",
        "image_id": image_record.id
    }
