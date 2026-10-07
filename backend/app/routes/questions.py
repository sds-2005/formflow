from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.database import get_db_session
from app.repositories.question_repo import QuestionRepository
from app.repositories.form_repo import FormRepository
from app.services.question_service import QuestionService
from app.schemas.question import QuestionCreate, QuestionUpdate, QuestionResponse, QuestionReorder
from app.dependencies import CurrentCreator

router = APIRouter(prefix="/forms/{form_id}/questions", tags=["questions"])

async def get_question_service(session: AsyncSession = Depends(get_db_session)) -> QuestionService:
    q_repo = QuestionRepository(session)
    f_repo = FormRepository(session)
    return QuestionService(q_repo, f_repo)

@router.get("", response_model=List[QuestionResponse])
async def list_questions(
    form_id: str,
    creator: CurrentCreator,
    service: QuestionService = Depends(get_question_service)
):
    return await service.list_questions(form_id, creator.creator_id)

@router.post("", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
async def create_question(
    form_id: str,
    data: QuestionCreate,
    creator: CurrentCreator,
    service: QuestionService = Depends(get_question_service),
    session: AsyncSession = Depends(get_db_session)
):
    result = await service.create_question(form_id, creator.creator_id, data)
    await session.commit()
    return result

@router.patch("/{question_id}", response_model=QuestionResponse)
async def update_question(
    form_id: str,
    question_id: str,
    data: QuestionUpdate,
    creator: CurrentCreator,
    service: QuestionService = Depends(get_question_service),
    session: AsyncSession = Depends(get_db_session)
):
    result = await service.update_question(form_id, question_id, creator.creator_id, data)
    await session.commit()
    return result

@router.delete("/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_question(
    form_id: str,
    question_id: str,
    creator: CurrentCreator,
    service: QuestionService = Depends(get_question_service),
    session: AsyncSession = Depends(get_db_session)
):
    await service.delete_question(form_id, question_id, creator.creator_id)
    await session.commit()

@router.put("/reorder", response_model=List[QuestionResponse])
async def reorder_questions(
    form_id: str,
    data: QuestionReorder,
    creator: CurrentCreator,
    service: QuestionService = Depends(get_question_service),
    session: AsyncSession = Depends(get_db_session)
):
    result = await service.reorder_questions(form_id, creator.creator_id, data.question_ids)
    await session.commit()
    return result
