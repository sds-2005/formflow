from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import json

from app.database import get_db_session
from app.models.form import Form
from app.models.submission import Submission, Answer
import uuid

router = APIRouter(prefix="/public/forms/{slug}/submissions", tags=["public"])

@router.post("", response_model=SubmissionResponse, status_code=status.HTTP_201_CREATED)
async def submit_form(
    slug: str,
    data: SubmissionCreate,
    session: AsyncSession = Depends(get_db_session)
):
    from sqlalchemy.orm import selectinload
    stmt = select(Form).where(Form.slug == slug, Form.status == "published").options(selectinload(Form.versions))
    result = await session.execute(stmt)
    form = result.scalar_one_or_none()
    
    if not form or not form.published_version_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form not found or not published")

    version = next((v for v in form.versions if v.id == form.published_version_id), None)
    question_map = {}
    if version:
        questions_data = json.loads(version.questions_snapshot)
        question_map = {q["id"]: q for q in questions_data}

    submission = Submission(
        form_id=form.id,
        form_version_id=form.published_version_id,
        idempotency_key=str(uuid.uuid4())
    )
    
    for q_id, value in data.answers.items():
        q_type = question_map.get(q_id, {}).get("type", "text")
        ans = Answer(
            question_id=q_id,
            question_type=q_type,
            value_text=str(value) if value else None
        )
        submission.answers.append(ans)
    
    session.add(submission)
    await session.commit()
    await session.refresh(submission)
    
    return SubmissionResponse(
        id=submission.id,
        form_id=submission.form_id,
        form_version_id=submission.form_version_id,
        submitted_at=submission.submitted_at,
        answers=data.answers
    )
