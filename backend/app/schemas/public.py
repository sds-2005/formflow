from pydantic import BaseModel
from typing import List, Optional

class PublicOption(BaseModel):
    id: str
    label: str
    position: int

class PublicQuestion(BaseModel):
    id: str
    type: str
    title: str
    description: Optional[str]
    required: bool
    position: int
    settings: str
    options: List[PublicOption] = []

class PublicForm(BaseModel):
    id: str
    title: str
    slug: str
    questions: List[PublicQuestion]
