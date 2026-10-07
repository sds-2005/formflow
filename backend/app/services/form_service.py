from fastapi import HTTPException, status
from typing import List

from app.repositories.form_repo import FormRepository
from app.schemas.form import FormCreate, FormUpdate, FormResponse, FormListResponse
from app.models.base import utc_now

class FormService:
    def __init__(self, repo: FormRepository):
        self.repo = repo

    async def create_form(self, creator_id: str, data: FormCreate) -> FormResponse:
        form = await self.repo.create_form(creator_id, data.title)
        return FormResponse(
            id=form.id,
            creator_id=form.creator_id,
            title=form.title,
            status=form.status,
            slug=form.slug,
            created_at=form.created_at,
            updated_at=form.updated_at,
            response_count=0
        )

    async def get_form(self, form_id: str, creator_id: str) -> FormResponse:
        form = await self.repo.get_form(form_id, creator_id)
        if not form:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form not found")
        
        response_count = await self.repo.get_response_count(form_id)
        return FormResponse(
            id=form.id,
            creator_id=form.creator_id,
            title=form.title,
            status=form.status,
            slug=form.slug,
            created_at=form.created_at,
            updated_at=form.updated_at,
            response_count=response_count
        )

    async def list_forms(self, creator_id: str) -> FormListResponse:
        forms = await self.repo.list_forms(creator_id)
        # In a real app we might bulk query response counts, but for now we iterate
        results = []
        for f in forms:
            count = await self.repo.get_response_count(f.id)
            results.append(FormResponse(
                id=f.id,
                creator_id=f.creator_id,
                title=f.title,
                status=f.status,
                slug=f.slug,
                created_at=f.created_at,
                updated_at=f.updated_at,
                response_count=count
            ))
        return FormListResponse(forms=results)

    async def update_form(self, form_id: str, creator_id: str, data: FormUpdate) -> FormResponse:
        form = await self.repo.get_form(form_id, creator_id)
        if not form:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form not found")
            
        if data.title is not None:
            form.title = data.title
        if data.status is not None:
            form.status = data.status
            
        form.updated_at = utc_now()
        form = await self.repo.update_form(form)
        
        return await self.get_form(form_id, creator_id)

    async def delete_form(self, form_id: str, creator_id: str) -> None:
        form = await self.repo.get_form(form_id, creator_id)
        if not form:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form not found")
        await self.repo.delete_form(form)
