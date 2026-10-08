from typing import Any

from pydantic import BaseModel, Field


class PublicOption(BaseModel):
    id: str
    label: str
    position: int


class PublicQuestion(BaseModel):
    id: str
    type: str
    title: str
    description: str | None
    required: bool
    position: int
    settings: dict[str, Any] = Field(default_factory=dict)
    options: list[PublicOption] = Field(default_factory=list)


class PublicForm(BaseModel):
    id: str
    title: str
    slug: str
    version_id: str
    questions: list[PublicQuestion]
