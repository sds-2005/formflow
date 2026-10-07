from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List, Sequence

from app.models.form import Form
from app.models.submission import Submission

class FormRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_form(self, creator_id: str, title: str) -> Form:
        form = Form(creator_id=creator_id, title=title)
        self.session.add(form)
        await self.session.flush()
        return form

    async def get_form(self, form_id: str, creator_id: str) -> Form | None:
        stmt = select(Form).where(Form.id == form_id, Form.creator_id == creator_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_forms(self, creator_id: str) -> Sequence[Form]:
        stmt = select(Form).where(Form.creator_id == creator_id).order_by(desc(Form.created_at))
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def update_form(self, form: Form) -> Form:
        self.session.add(form)
        await self.session.flush()
        return form

    async def delete_form(self, form: Form) -> None:
        await self.session.delete(form)
        await self.session.flush()

    async def get_response_count(self, form_id: str) -> int:
        from sqlalchemy import func
        stmt = select(func.count(Submission.id)).where(Submission.form_id == form_id)
        result = await self.session.execute(stmt)
        return result.scalar_one() or 0
