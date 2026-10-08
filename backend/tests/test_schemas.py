import pytest
from pydantic import ValidationError

from app.schemas.form import FormCreate
from app.schemas.question import QuestionCreate, QuestionOptionCreate
from app.schemas.submission import SubmissionCreate


def test_all_assignment_question_types_are_accepted() -> None:
    question_types = {
        "short_text",
        "long_text",
        "multiple_choice",
        "dropdown",
        "email",
        "number",
        "yes_no",
        "rating",
    }
    for question_type in question_types:
        assert (
            QuestionCreate.model_validate({"type": question_type}).type == question_type
        )


def test_unknown_question_type_is_rejected() -> None:
    with pytest.raises(ValidationError):
        QuestionCreate.model_validate({"type": "phone"})


def test_blank_choice_label_is_rejected() -> None:
    with pytest.raises(ValidationError):
        QuestionOptionCreate(label="   ")


def test_blank_form_title_is_rejected() -> None:
    with pytest.raises(ValidationError):
        FormCreate(title="")


def test_submission_gets_stable_idempotency_key() -> None:
    submission = SubmissionCreate(answers={})
    assert len(submission.idempotency_key) >= 8
