from fastapi import APIRouter, HTTPException
from art_ai.schemas.user import UserRegister, UserLogin
from art_ai.services.user_service import create_user
from art_ai.database import get_db
from art_ai.models.user import User
from sqlalchemy import select
from art_ai.utils.security import verify_password
from art_ai.utils.jwt import create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register")
def register(user: UserRegister):

    new_user = create_user(
        name=user.name,
        email=user.email,
        password=user.password
    )

    if not new_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    return {
        "message": "User created successfully",
        "user_id": new_user.id,
        "email": new_user.email
    }


@router.post("/login")
def login(user: UserLogin):
    with get_db() as db:
        db_user = db.execute(
            select(User).where(User.email == user.email)
        ).scalar_one_or_none()

        if not db_user:
            raise HTTPException(status_code=400, detail="Invalid credentials")

        if not verify_password(user.password, db_user.password):
            raise HTTPException(status_code=400, detail="Invalid credentials")

        token = create_access_token({"user_id": db_user.id})

        return {
            "access_token": token,
            "token_type": "bearer"
        }
