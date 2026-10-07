from pydantic import BaseModel, Field
from typing import List, Optional, Any

class QuestionOptionCreate(BaseModel):
    label: str

class QuestionOptionResponse(BaseModel):
    id: str
    label: str
    position: int

class QuestionCreate(BaseModel):
    type: str
    title: str = "Untitled question"
    description: Optional[str] = None
    required: bool = False
    options: Optional[List[QuestionOptionCreate]] = None

class QuestionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    required: Optional[bool] = None
    settings: Optional[str] = None

class QuestionReorder(BaseModel):
    # Expects a list of question IDs in the new order
    question_ids: List[str]

class QuestionResponse(BaseModel):
    id: str
    form_id: str
    type: str
    title: str
    description: Optional[str]
    required: bool
    position: int
    settings: str
    options: List[QuestionOptionResponse] = Field(default_factory=list)
