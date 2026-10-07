import uuid
import secrets
from sqlalchemy import String, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List, Optional

from .base import Base, utc_now

def generate_slug() -> str:
    return secrets.token_urlsafe(8)

class Form(Base):
    __tablename__ = "forms"
    
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    creator_id: Mapped[str] = mapped_column(String, ForeignKey("creators.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String, default="Untitled form", nullable=False)
    status: Mapped[str] = mapped_column(String, default="draft", nullable=False, index=True)
    published_version_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("form_versions.id"), nullable=True)
    slug: Mapped[str] = mapped_column(String, default=generate_slug, unique=True, nullable=False, index=True)
    created_at: Mapped[str] = mapped_column(String, default=utc_now, nullable=False)
    updated_at: Mapped[str] = mapped_column(String, default=utc_now, nullable=False, index=True)
    
    creator: Mapped["Creator"] = relationship(back_populates="forms")
    questions: Mapped[List["Question"]] = relationship(back_populates="form", cascade="all, delete-orphan")
    versions: Mapped[List["FormVersion"]] = relationship(
        back_populates="form", 
        cascade="all, delete-orphan",
        foreign_keys="[FormVersion.form_id]"
    )

class FormVersion(Base):
    __tablename__ = "form_versions"
    
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    form_id: Mapped[str] = mapped_column(String, ForeignKey("forms.id", ondelete="CASCADE"), nullable=False, index=True)
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    published_at: Mapped[str] = mapped_column(String, default=utc_now, nullable=False)
    questions_snapshot: Mapped[str] = mapped_column(String, nullable=False)
    
    form: Mapped["Form"] = relationship(back_populates="versions", foreign_keys=[form_id])
