from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db_session
from app.repositories.form_repo import FormRepository
from app.services.form_service import FormService
from app.schemas.form import FormCreate, FormUpdate, FormResponse, FormListResponse
from app.dependencies import CurrentCreator

router = APIRouter(prefix="/forms", tags=["forms"])

async def get_form_service(session: AsyncSession = Depends(get_db_session)) -> FormService:
    repo = FormRepository(session)
    return FormService(repo)

@router.post("", response_model=FormResponse, status_code=status.HTTP_201_CREATED)
async def create_form(
    data: FormCreate,
    creator: CurrentCreator,
    service: FormService = Depends(get_form_service),
    session: AsyncSession = Depends(get_db_session)
):
    result = await service.create_form(creator.creator_id, data)
    await session.commit()
    return result

@router.get("", response_model=FormListResponse)
async def list_forms(
    creator: CurrentCreator,
    service: FormService = Depends(get_form_service)
):
    return await service.list_forms(creator.creator_id)

@router.get("/{form_id}", response_model=FormResponse)
async def get_form(
    form_id: str,
    creator: CurrentCreator,
    service: FormService = Depends(get_form_service)
):
    return await service.get_form(form_id, creator.creator_id)

@router.patch("/{form_id}", response_model=FormResponse)
async def update_form(
    form_id: str,
    data: FormUpdate,
    creator: CurrentCreator,
    service: FormService = Depends(get_form_service),
    session: AsyncSession = Depends(get_db_session)
):
    result = await service.update_form(form_id, creator.creator_id, data)
    await session.commit()
    return result

@router.delete("/{form_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_form(
    form_id: str,
    creator: CurrentCreator,
    service: FormService = Depends(get_form_service),
    session: AsyncSession = Depends(get_db_session)
):
    await service.delete_form(form_id, creator.creator_id)
    await session.commit()

@router.post("/{form_id}/publish", response_model=FormResponse)
async def publish_form(
    form_id: str,
    creator: CurrentCreator,
    service: FormService = Depends(get_form_service),
    session: AsyncSession = Depends(get_db_session)
):
    result = await service.publish_form(form_id, creator.creator_id)
    await session.commit()
    return result

@router.get("/{form_id}/results")
async def get_form_results(
    form_id: str,
    creator: CurrentCreator,
    session: AsyncSession = Depends(get_db_session)
):
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload
    from app.models.form import Form
    from app.models.submission import Submission

    # Verify ownership
    stmt = select(Form).where(Form.id == form_id, Form.creator_id == creator.creator_id)
    result = await session.execute(stmt)
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Form not found")

    # Fetch submissions with answers eagerly loaded
    sub_stmt = select(Submission).where(Submission.form_id == form_id).order_by(Submission.submitted_at.desc()).options(selectinload(Submission.answers))
    sub_result = await session.execute(sub_stmt)
    submissions = sub_result.unique().scalars().all()

    # Build response manually
    results = []
    for sub in submissions:
        ans_dict = {a.question_id: a.value_text for a in sub.answers}
        results.append({
            "id": sub.id,
            "submitted_at": sub.submitted_at,
            "answers": ans_dict
        })
        
    return {"submissions": results}
