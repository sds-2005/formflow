import uuid
from sqlalchemy import String, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List

from .base import Base, utc_now

class Creator(Base):
    __tablename__ = "creators"
    
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    display_name: Mapped[str] = mapped_column(String, default="Demo Creator", nullable=False)
    created_at: Mapped[str] = mapped_column(String, default=utc_now, nullable=False)
    
    sessions: Mapped[List["CreatorSession"]] = relationship(back_populates="creator", cascade="all, delete-orphan")
    forms: Mapped[List["Form"]] = relationship(back_populates="creator", cascade="all, delete-orphan")

class CreatorSession(Base):
    __tablename__ = "creator_sessions"
    
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    creator_id: Mapped[str] = mapped_column(String, nullable=False)
    token_hash: Mapped[str] = mapped_column(String, nullable=False, unique=True, index=True)
    created_at: Mapped[str] = mapped_column(String, default=utc_now, nullable=False)
    expires_at: Mapped[str] = mapped_column(String, nullable=False, index=True)
    is_active: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    
    creator: Mapped["Creator"] = relationship(back_populates="sessions", foreign_keys=[creator_id])
