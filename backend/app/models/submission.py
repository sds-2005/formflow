import uuid
from sqlalchemy import String, Integer, ForeignKey, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List, Optional

from .base import Base, utc_now

class Submission(Base):
    __tablename__ = "submissions"
    
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    form_id: Mapped[str] = mapped_column(String, ForeignKey("forms.id", ondelete="RESTRICT"), nullable=False, index=True)
    form_version_id: Mapped[str] = mapped_column(String, ForeignKey("form_versions.id", ondelete="RESTRICT"), nullable=False, index=True)
    idempotency_key: Mapped[str] = mapped_column(String, nullable=False)
    submitted_at: Mapped[str] = mapped_column(String, default=utc_now, nullable=False, index=True)
    
    answers: Mapped[List["Answer"]] = relationship(back_populates="submission", cascade="all, delete-orphan")

class Answer(Base):
    __tablename__ = "answers"
    
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    submission_id: Mapped[str] = mapped_column(String, ForeignKey("submissions.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    question_type: Mapped[str] = mapped_column(String, nullable=False)
    
    value_text: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    value_number: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    value_boolean: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    submission: Mapped["Submission"] = relationship(back_populates="answers")
    selections: Mapped[List["AnswerOptionSelection"]] = relationship(back_populates="answer", cascade="all, delete-orphan")

class AnswerOptionSelection(Base):
    __tablename__ = "answer_option_selections"
    
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    answer_id: Mapped[str] = mapped_column(String, ForeignKey("answers.id", ondelete="CASCADE"), nullable=False, index=True)
    option_id: Mapped[str] = mapped_column(String, nullable=False)
    option_label: Mapped[str] = mapped_column(String, nullable=False)
    
    answer: Mapped["Answer"] = relationship(back_populates="selections")
