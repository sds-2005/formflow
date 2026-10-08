import json
import re

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db_session
from app.models.form import Form
from app.models.submission import Answer, AnswerOptionSelection, Submission
from app.schemas.submission import SubmissionCreate, SubmissionResponse

router = APIRouter(prefix="/public/forms/{slug}/submissions", tags=["public"])
EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


@router.post("", response_model=SubmissionResponse, status_code=status.HTTP_201_CREATED)
async def submit_form(
    slug: str,
    data: SubmissionCreate,
    session: AsyncSession = Depends(get_db_session),
):
    form_result = await session.execute(
        select(Form)
        .where(Form.slug == slug, Form.status == "published")
        .options(selectinload(Form.versions))
    )
    form = form_result.scalar_one_or_none()
    if not form or not form.published_version_id:
        raise HTTPException(status_code=404, detail="Form not found or not published")
    if data.version_id and data.version_id != form.published_version_id:
        raise HTTPException(
            status_code=409, detail="This form changed. Refresh before submitting."
        )

    existing_result = await session.execute(
        select(Submission).where(
            Submission.form_id == form.id,
            Submission.idempotency_key == data.idempotency_key,
        )
    )
    existing = existing_result.scalar_one_or_none()
    if existing:
        return SubmissionResponse(
            id=existing.id,
            form_id=existing.form_id,
            form_version_id=existing.form_version_id,
            submitted_at=existing.submitted_at,
            answers=data.answers,
        )

    version = next(
        (item for item in form.versions if item.id == form.published_version_id), None
    )
    if not version:
        raise HTTPException(status_code=404, detail="Published version not found")
    questions = json.loads(version.questions_snapshot)
    question_map = {question["id"]: question for question in questions}
    unknown = set(data.answers) - set(question_map)
    if unknown:
        raise HTTPException(
            status_code=400, detail="Submission contains an unknown question"
        )

    submission = Submission(
        form_id=form.id,
        form_version_id=form.published_version_id,
        idempotency_key=data.idempotency_key,
    )
    for question in questions:
        question_id = question["id"]
        value = data.answers.get(question_id)
        empty = value is None or (isinstance(value, str) and not value.strip())
        if question.get("required") and empty:
            raise HTTPException(
                status_code=422, detail=f"'{question['title']}' is required"
            )
        if empty:
            continue

        question_type = question["type"]
        answer = Answer(question_id=question_id, question_type=question_type)
        settings = question.get("settings") or {}
        if question_type == "email":
            if not isinstance(value, str) or not EMAIL_PATTERN.match(value):
                raise HTTPException(
                    status_code=422, detail="Please enter a valid email address"
                )
            answer.value_text = value.strip()
        elif question_type in {"short_text", "long_text"}:
            if not isinstance(value, str):
                raise HTTPException(status_code=422, detail="Please enter text")
            answer.value_text = value.strip()
        elif question_type == "number":
            if isinstance(value, bool):
                raise HTTPException(
                    status_code=422, detail="Please enter a valid number"
                )
            try:
                number = float(str(value))
            except (TypeError, ValueError):
                raise HTTPException(
                    status_code=422, detail="Please enter a valid number"
                )
            minimum, maximum = settings.get("min"), settings.get("max")
            if minimum is not None and number < float(minimum):
                raise HTTPException(
                    status_code=422, detail=f"Number must be at least {minimum}"
                )
            if maximum is not None and number > float(maximum):
                raise HTTPException(
                    status_code=422, detail=f"Number must be at most {maximum}"
                )
            answer.value_number = number
        elif question_type == "rating":
            if isinstance(value, bool) or not isinstance(value, (int, float)):
                raise HTTPException(status_code=422, detail="Please select a rating")
            maximum = int(settings.get("max", 5))
            if int(value) != value or value < 1 or value > maximum:
                raise HTTPException(
                    status_code=422, detail=f"Rating must be between 1 and {maximum}"
                )
            answer.value_number = float(value)
        elif question_type == "yes_no":
            if not isinstance(value, bool):
                raise HTTPException(status_code=422, detail="Please select Yes or No")
            answer.value_boolean = int(value)
        elif question_type in {"multiple_choice", "dropdown"}:
            if not isinstance(value, str):
                raise HTTPException(status_code=422, detail="Please select an option")
            option = next(
                (item for item in question.get("options", []) if item["id"] == value),
                None,
            )
            if not option:
                raise HTTPException(
                    status_code=422, detail="Please select a valid option"
                )
            answer.selections.append(
                AnswerOptionSelection(
                    option_id=option["id"], option_label=option["label"]
                )
            )
        else:
            raise HTTPException(status_code=422, detail="Unsupported question type")
        submission.answers.append(answer)

    session.add(submission)
    await session.commit()
    await session.refresh(submission)
    return SubmissionResponse(
        id=submission.id,
        form_id=submission.form_id,
        form_version_id=submission.form_version_id,
        submitted_at=submission.submitted_at,
        answers=data.answers,
    )
