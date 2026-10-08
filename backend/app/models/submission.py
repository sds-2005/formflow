import uuid

from sqlalchemy import Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, utc_now


class Submission(Base):
    __tablename__ = "submissions"
    __table_args__ = (
        UniqueConstraint(
            "form_id", "idempotency_key", name="uq_submission_form_idempotency"
        ),
    )

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    form_id: Mapped[str] = mapped_column(
        String, ForeignKey("forms.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    form_version_id: Mapped[str] = mapped_column(
        String,
        ForeignKey("form_versions.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    idempotency_key: Mapped[str] = mapped_column(String, nullable=False)
    submitted_at: Mapped[str] = mapped_column(
        String, default=utc_now, nullable=False, index=True
    )

    answers: Mapped[list["Answer"]] = relationship(
        back_populates="submission", cascade="all, delete-orphan"
    )


class Answer(Base):
    __tablename__ = "answers"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    submission_id: Mapped[str] = mapped_column(
        String,
        ForeignKey("submissions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    question_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    question_type: Mapped[str] = mapped_column(String, nullable=False)

    value_text: Mapped[str | None] = mapped_column(String, nullable=True)
    value_number: Mapped[float | None] = mapped_column(Float, nullable=True)
    value_boolean: Mapped[int | None] = mapped_column(Integer, nullable=True)

    submission: Mapped["Submission"] = relationship(back_populates="answers")
    selections: Mapped[list["AnswerOptionSelection"]] = relationship(
        back_populates="answer", cascade="all, delete-orphan"
    )


class AnswerOptionSelection(Base):
    __tablename__ = "answer_option_selections"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    answer_id: Mapped[str] = mapped_column(
        String, ForeignKey("answers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    option_id: Mapped[str] = mapped_column(String, nullable=False)
    option_label: Mapped[str] = mapped_column(String, nullable=False)

    answer: Mapped["Answer"] = relationship(back_populates="selections")
