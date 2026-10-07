from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import json

from app.database import get_db_session
from app.models.form import Form
from app.models.submission import Submission
from app.schemas.submission import SubmissionCreate, SubmissionResponse

router = APIRouter(prefix="/public/forms/{slug}/submissions", tags=["public"])

@router.post("", response_model=SubmissionResponse, status_code=status.HTTP_201_CREATED)
async def submit_form(
    slug: str,
    data: SubmissionCreate,
    session: AsyncSession = Depends(get_db_session)
):
    stmt = select(Form).where(Form.slug == slug, Form.status == "published")
    result = await session.execute(stmt)
    form = result.scalar_one_or_none()
    
    if not form or not form.published_version_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form not found or not published")

    submission = Submission(
        form_id=form.id,
        form_version_id=form.published_version_id,
        answers=json.dumps(data.answers)
    )
    
    session.add(submission)
    await session.commit()
    await session.refresh(submission)
    
    return SubmissionResponse(
        id=submission.id,
        form_id=submission.form_id,
        form_version_id=submission.form_version_id,
        submitted_at=submission.submitted_at,
        answers=json.loads(submission.answers)
    )
