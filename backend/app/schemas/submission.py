from pydantic import BaseModel
from typing import Dict, Any

class SubmissionCreate(BaseModel):
    answers: Dict[str, Any]

class SubmissionResponse(BaseModel):
    id: str
    form_id: str
    form_version_id: str
    submitted_at: str
    answers: Dict[str, Any]
