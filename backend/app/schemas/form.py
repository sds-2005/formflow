from pydantic import BaseModel, Field


class FormCreate(BaseModel):
    title: str = Field(default="Untitled form", min_length=1, max_length=200)


class FormUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)


class FormResponse(BaseModel):
    id: str
    creator_id: str
    title: str
    status: str
    slug: str
    created_at: str
    updated_at: str

    # Optional field for response count in lists
    response_count: int = 0
    question_count: int = 0
    published_version_id: str | None = None


class FormListResponse(BaseModel):
    forms: list[FormResponse]
