from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from datetime import datetime

from art_ai.database import Base



class Image(Base):
    __tablename__ = "images"

    id = Column(Integer, primary_key=True)

    filename = Column(String(255), nullable=False)

    filepath = Column(String(500), nullable=False)

    uploaded_at = Column(DateTime, default=datetime.utcnow)

    user_id = Column(Integer, ForeignKey("users.id"))