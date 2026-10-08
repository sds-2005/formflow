import uuid
from typing import Any

from pydantic import BaseModel, Field


class SubmissionCreate(BaseModel):
    answers: dict[str, Any]
    idempotency_key: str = Field(
        default_factory=lambda: str(uuid.uuid4()), min_length=8, max_length=100
    )
    version_id: str | None = None


class SubmissionResponse(BaseModel):
    id: str
    form_id: str
    form_version_id: str
    submitted_at: str
    answers: dict[str, Any]
