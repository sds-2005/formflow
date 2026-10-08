import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db_session
from app.models.form import Form
from app.schemas.public import PublicForm

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/forms/{slug}", response_model=PublicForm)
async def get_public_form(slug: str, session: AsyncSession = Depends(get_db_session)):
    stmt = (
        select(Form)
        .where(Form.slug == slug, Form.status == "published")
        .options(selectinload(Form.versions))
    )
    result = await session.execute(stmt)
    form = result.scalar_one_or_none()

    if not form or not form.published_version_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found or not published",
        )

    version = next(
        (v for v in form.versions if v.id == form.published_version_id), None
    )
    if not version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Published version not found"
        )

    questions_data = json.loads(version.questions_snapshot)

    return PublicForm(
        id=form.id,
        title=form.title,
        slug=form.slug,
        version_id=version.id,
        questions=questions_data,
    )
