from collections.abc import Sequence

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.question import Question, QuestionOption


class QuestionRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_questions(self, form_id: str) -> Sequence[Question]:
        stmt = (
            select(Question)
            .where(Question.form_id == form_id)
            .order_by(Question.position)
            .options(selectinload(Question.options))
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_question(self, question_id: str, form_id: str) -> Question | None:
        stmt = (
            select(Question)
            .where(Question.id == question_id, Question.form_id == form_id)
            .options(selectinload(Question.options))
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create_question(self, question: Question) -> Question:
        self.session.add(question)
        await self.session.flush()
        return question

    async def create_option(self, option: QuestionOption) -> QuestionOption:
        self.session.add(option)
        await self.session.flush()
        return option

    async def replace_options(
        self, question: Question, options: list[tuple[str | None, str]]
    ) -> None:
        existing = {option.id: option for option in question.options}
        replacements: list[QuestionOption] = []

        for position, (option_id, label) in enumerate(options):
            option = existing.pop(option_id, None) if option_id else None
            if option is None:
                option = QuestionOption(
                    **({"id": option_id} if option_id else {}),
                    question_id=question.id,
                    label=label,
                    position=position,
                )
            else:
                option.label = label
                option.position = position
            replacements.append(option)

        question.options = replacements
        await self.session.flush()

    async def update_question(self, question: Question) -> Question:
        self.session.add(question)
        await self.session.flush()
        return question

    async def delete_question(self, question: Question) -> None:
        await self.session.delete(question)
        await self.session.flush()

    async def reorder_questions(
        self, form_id: str, id_to_position: dict[str, int]
    ) -> None:
        for q_id, pos in id_to_position.items():
            stmt = (
                update(Question)
                .where(Question.id == q_id, Question.form_id == form_id)
                .values(position=pos)
            )
            await self.session.execute(stmt)
        await self.session.flush()
