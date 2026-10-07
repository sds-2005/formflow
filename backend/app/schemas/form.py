from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class FormCreate(BaseModel):
    title: str = "Untitled form"

class FormUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None

class FormResponse(BaseModel):
    id: str
    creator_id: str
    title: str
    status: str
    slug: str
    created_at: str
    updated_at: str
    
    # Optional field for response count in lists
    response_count: Optional[int] = 0

class FormListResponse(BaseModel):
    forms: List[FormResponse]
