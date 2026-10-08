from collections.abc import Sequence

from sqlalchemy import delete, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.form import Form
from app.models.question import Question
from app.models.submission import Answer, AnswerOptionSelection, Submission


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

    async def list_forms(
        self, creator_id: str, search: str | None = None
    ) -> Sequence[Form]:
        stmt = (
            select(Form)
            .where(Form.creator_id == creator_id)
            .order_by(desc(Form.created_at))
        )
        if search:
            stmt = stmt.where(func.lower(Form.title).contains(search.strip().lower()))
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_form_with_questions(
        self, form_id: str, creator_id: str
    ) -> Form | None:
        stmt = (
            select(Form)
            .where(Form.id == form_id, Form.creator_id == creator_id)
            .options(selectinload(Form.questions).selectinload(Question.options))
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def update_form(self, form: Form) -> Form:
        self.session.add(form)
        await self.session.flush()
        return form

    async def delete_form(self, form: Form) -> None:
        answer_ids = (
            select(Answer.id).join(Submission).where(Submission.form_id == form.id)
        )
        await self.session.execute(
            delete(AnswerOptionSelection).where(
                AnswerOptionSelection.answer_id.in_(answer_ids)
            )
        )
        submission_ids = select(Submission.id).where(Submission.form_id == form.id)
        await self.session.execute(
            delete(Answer).where(Answer.submission_id.in_(submission_ids))
        )
        await self.session.execute(
            delete(Submission).where(Submission.form_id == form.id)
        )
        form.published_version_id = None
        await self.session.flush()
        await self.session.delete(form)
        await self.session.flush()

    async def get_response_count(self, form_id: str) -> int:
        stmt = select(func.count(Submission.id)).where(Submission.form_id == form_id)
        result = await self.session.execute(stmt)
        return result.scalar_one() or 0

    async def get_question_count(self, form_id: str) -> int:
        stmt = select(func.count(Question.id)).where(Question.form_id == form_id)
        result = await self.session.execute(stmt)
        return result.scalar_one() or 0

    async def list_submissions(self, form_id: str) -> Sequence[Submission]:
        stmt = (
            select(Submission)
            .where(Submission.form_id == form_id)
            .order_by(desc(Submission.submitted_at))
            .options(selectinload(Submission.answers).selectinload(Answer.selections))
        )
        result = await self.session.execute(stmt)
        return result.unique().scalars().all()

    async def get_submission(
        self, form_id: str, submission_id: str
    ) -> Submission | None:
        stmt = (
            select(Submission)
            .where(Submission.form_id == form_id, Submission.id == submission_id)
            .options(selectinload(Submission.answers).selectinload(Answer.selections))
        )
        result = await self.session.execute(stmt)
        return result.unique().scalar_one_or_none()
