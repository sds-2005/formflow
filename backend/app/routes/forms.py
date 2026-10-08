from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db_session
from app.dependencies import CurrentCreator
from app.repositories.form_repo import FormRepository
from app.schemas.form import FormCreate, FormListResponse, FormResponse, FormUpdate
from app.services.form_service import FormService

router = APIRouter(prefix="/forms", tags=["forms"])


async def get_form_service(
    session: AsyncSession = Depends(get_db_session),
) -> FormService:
    repo = FormRepository(session)
    return FormService(repo)


@router.post("", response_model=FormResponse, status_code=status.HTTP_201_CREATED)
async def create_form(
    data: FormCreate,
    creator: CurrentCreator,
    service: FormService = Depends(get_form_service),
    session: AsyncSession = Depends(get_db_session),
):
    result = await service.create_form(creator.creator_id, data)
    await session.commit()
    return result


@router.get("", response_model=FormListResponse)
async def list_forms(
    creator: CurrentCreator,
    service: FormService = Depends(get_form_service),
    search: str | None = Query(default=None, max_length=200),
):
    return await service.list_forms(creator.creator_id, search)


@router.get("/{form_id}", response_model=FormResponse)
async def get_form(
    form_id: str,
    creator: CurrentCreator,
    service: FormService = Depends(get_form_service),
):
    return await service.get_form(form_id, creator.creator_id)


@router.patch("/{form_id}", response_model=FormResponse)
async def update_form(
    form_id: str,
    data: FormUpdate,
    creator: CurrentCreator,
    service: FormService = Depends(get_form_service),
    session: AsyncSession = Depends(get_db_session),
):
    result = await service.update_form(form_id, creator.creator_id, data)
    await session.commit()
    return result


@router.delete("/{form_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_form(
    form_id: str,
    creator: CurrentCreator,
    service: FormService = Depends(get_form_service),
    session: AsyncSession = Depends(get_db_session),
):
    await service.delete_form(form_id, creator.creator_id)
    await session.commit()


@router.post(
    "/{form_id}/duplicate",
    response_model=FormResponse,
    status_code=status.HTTP_201_CREATED,
)
async def duplicate_form(
    form_id: str,
    creator: CurrentCreator,
    service: FormService = Depends(get_form_service),
    session: AsyncSession = Depends(get_db_session),
):
    result = await service.duplicate_form(form_id, creator.creator_id)
    await session.commit()
    return result


@router.post("/{form_id}/publish", response_model=FormResponse)
async def publish_form(
    form_id: str,
    creator: CurrentCreator,
    service: FormService = Depends(get_form_service),
    session: AsyncSession = Depends(get_db_session),
):
    result = await service.publish_form(form_id, creator.creator_id)
    await session.commit()
    return result


@router.post("/{form_id}/unpublish", response_model=FormResponse)
async def unpublish_form(
    form_id: str,
    creator: CurrentCreator,
    service: FormService = Depends(get_form_service),
    session: AsyncSession = Depends(get_db_session),
):
    result = await service.unpublish_form(form_id, creator.creator_id)
    await session.commit()
    return result


@router.get("/{form_id}/results")
async def get_form_results(
    form_id: str,
    creator: CurrentCreator,
    service: FormService = Depends(get_form_service),
):
    return await service.get_results(form_id, creator.creator_id)


@router.get("/{form_id}/results/{submission_id}")
async def get_submission(
    form_id: str,
    submission_id: str,
    creator: CurrentCreator,
    service: FormService = Depends(get_form_service),
):
    return await service.get_submission(form_id, submission_id, creator.creator_id)
