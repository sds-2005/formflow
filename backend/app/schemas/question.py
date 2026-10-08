from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator

QuestionType = Literal[
    "short_text",
    "long_text",
    "multiple_choice",
    "dropdown",
    "email",
    "number",
    "yes_no",
    "rating",
]


class QuestionOptionCreate(BaseModel):
    id: str | None = None
    label: str = Field(min_length=1, max_length=200)

    @field_validator("label")
    @classmethod
    def trim_label(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Option labels cannot be empty")
        return value


class QuestionOptionResponse(BaseModel):
    id: str
    label: str
    position: int


class QuestionCreate(BaseModel):
    type: QuestionType
    title: str = Field(default="Untitled question", min_length=1, max_length=500)
    description: str | None = Field(default=None, max_length=1000)
    required: bool = False
    settings: dict[str, Any] = Field(default_factory=dict)
    options: list[QuestionOptionCreate] | None = None


class QuestionUpdate(BaseModel):
    type: QuestionType | None = None
    title: str | None = Field(default=None, min_length=1, max_length=500)
    description: str | None = Field(default=None, max_length=1000)
    required: bool | None = None
    settings: dict[str, Any] | None = None
    options: list[QuestionOptionCreate] | None = None


class QuestionReorder(BaseModel):
    # Expects a list of question IDs in the new order
    question_ids: list[str]


class QuestionResponse(BaseModel):
    id: str
    form_id: str
    type: str
    title: str
    description: str | None
    required: bool
    position: int
    settings: dict[str, Any]
    options: list[QuestionOptionResponse] = Field(default_factory=list)
