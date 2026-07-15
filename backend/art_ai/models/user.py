from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from art_ai.database import Base
from art_ai.database import Base, engine
from art_ai.models.user import User

class User(Base):

    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(String(50), default="user")
    created_at = Column(DateTime, default=datetime.utcnow)
    