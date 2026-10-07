from fastapi import APIRouter, Depends, status
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
