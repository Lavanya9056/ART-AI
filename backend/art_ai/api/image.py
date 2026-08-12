from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select

from art_ai.database import get_db
from art_ai.dependencies.auth import get_current_user
from art_ai.models.image import Image

router = APIRouter()


@router.delete("/delete/{image_id}")
def delete_image(image_id: int, current_user=Depends(get_current_user)):
    with get_db() as db:
        image = db.execute(
            select(Image).where(Image.id == image_id)
        ).scalar_one_or_none()

        if image is None:
            raise HTTPException(status_code=404, detail="Image not found")

        if image.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Unauthorized")

        filepath = Path(image.filepath)
        if filepath.exists():
            filepath.unlink()

        db.delete(image)
        db.commit()

        return {"message": "Image deleted successfully"}
