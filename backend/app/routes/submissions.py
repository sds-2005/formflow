from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import json

from app.database import get_db_session
from app.models.form import Form
from app.models.submission import Submission, Answer
from app.schemas.submission import SubmissionCreate, SubmissionResponse
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
    
    # Validate all required questions are present
    for q_id, q_data in question_map.items():
        val = data.answers.get(q_id)
        if q_data.get("required") and (val is None or str(val).strip() == ""):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Required answer missing for question {q_id}")

    for q_id, value in data.answers.items():
        if q_id not in question_map:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unknown question ID: {q_id}")
            
        q_type = question_map[q_id].get("type", "text")
        
        val_str = str(value) if value is not None else ""
        if val_str.strip():
            if q_type == "email" and ("@" not in val_str or "." not in val_str):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid email format")
            elif q_type == "number":
                try:
                    float(val_str)
                except ValueError:
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid number format")
            elif q_type == "boolean" and val_str not in ("Yes", "No"):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid yes/no value")
        
        ans = Answer(
            question_id=q_id,
            question_type=q_type,
            value_text=val_str if val_str.strip() else None
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
