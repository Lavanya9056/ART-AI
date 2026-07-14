from art_ai.database import get_db
from art_ai.models.user import User
from sqlalchemy import select
from art_ai.utils.security import hash_password


def create_user(name: str, email: str, password: str):
    with get_db() as db:
        existing_user = db.execute(
            select(User).where(User.email == email)
        ).scalar_one_or_none()

        if existing_user:
            return None

        new_user = User(
            name=name,
            email=email,
            password=hash_password(password)
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return new_user
