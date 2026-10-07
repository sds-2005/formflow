from fastapi import HTTPException, status
from typing import List
import json

from app.repositories.question_repo import QuestionRepository
from app.repositories.form_repo import FormRepository
from app.schemas.question import QuestionCreate, QuestionUpdate, QuestionResponse, QuestionOptionResponse
from app.models.question import Question, QuestionOption
from app.models.base import utc_now

class QuestionService:
    def __init__(self, repo: QuestionRepository, form_repo: FormRepository):
        self.repo = repo
        self.form_repo = form_repo

    def _to_response(self, q: Question) -> QuestionResponse:
        return QuestionResponse(
            id=q.id,
            form_id=q.form_id,
            type=q.type,
            title=q.title,
            description=q.description,
            required=bool(q.required),
            position=q.position,
            settings=q.settings,
            options=[QuestionOptionResponse(id=o.id, label=o.label, position=o.position) for o in q.options]
        )

    async def list_questions(self, form_id: str, creator_id: str) -> List[QuestionResponse]:
        form = await self.form_repo.get_form(form_id, creator_id)
        if not form:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form not found")
            
        questions = await self.repo.list_questions(form_id)
        return [self._to_response(q) for q in questions]

    async def create_question(self, form_id: str, creator_id: str, data: QuestionCreate) -> QuestionResponse:
        form = await self.form_repo.get_form(form_id, creator_id)
        if not form:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form not found")
            
        questions = await self.repo.list_questions(form_id)
        position = len(questions)
        
        q = Question(
            form_id=form_id,
            type=data.type,
            title=data.title,
            description=data.description,
            required=int(data.required),
            position=position,
            settings="{}"
        )
        
        q = await self.repo.create_question(q)
        
        if data.options:
            for i, opt in enumerate(data.options):
                await self.repo.create_option(QuestionOption(
                    question_id=q.id,
                    label=opt.label,
                    position=i
                ))
        
        form.updated_at = utc_now()
        await self.form_repo.update_form(form)
        
        # Reload to get options
        q = await self.repo.get_question(q.id, form_id)
        return self._to_response(q)

    async def update_question(self, form_id: str, question_id: str, creator_id: str, data: QuestionUpdate) -> QuestionResponse:
        form = await self.form_repo.get_form(form_id, creator_id)
        if not form:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form not found")
            
        q = await self.repo.get_question(question_id, form_id)
        if not q:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")
            
        if data.title is not None:
            q.title = data.title
        if data.description is not None:
            q.description = data.description
        if data.required is not None:
            q.required = int(data.required)
        if data.settings is not None:
            q.settings = data.settings
            
        q.updated_at = utc_now()
        q = await self.repo.update_question(q)
        
        form.updated_at = utc_now()
        await self.form_repo.update_form(form)
        
        return self._to_response(q)

    async def delete_question(self, form_id: str, question_id: str, creator_id: str) -> None:
        form = await self.form_repo.get_form(form_id, creator_id)
        if not form:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form not found")
            
        q = await self.repo.get_question(question_id, form_id)
        if not q:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")
            
        await self.repo.delete_question(q)
        
        # Re-compact positions
        questions = await self.repo.list_questions(form_id)
        for i, remain_q in enumerate(questions):
            if remain_q.position != i:
                remain_q.position = i
                await self.repo.update_question(remain_q)
                
        form.updated_at = utc_now()
        await self.form_repo.update_form(form)

    async def reorder_questions(self, form_id: str, creator_id: str, question_ids: List[str]) -> List[QuestionResponse]:
        form = await self.form_repo.get_form(form_id, creator_id)
        if not form:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form not found")
            
        questions = await self.repo.list_questions(form_id)
        db_ids = {q.id for q in questions}
        
        if set(question_ids) != db_ids:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Must provide exactly all question IDs for this form")
            
        id_to_pos = {qid: i for i, qid in enumerate(question_ids)}
        await self.repo.reorder_questions(form_id, id_to_pos)
        
        form.updated_at = utc_now()
        await self.form_repo.update_form(form)
        
        return await self.list_questions(form_id, creator_id)
