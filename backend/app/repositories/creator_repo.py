import json

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.base import utc_now
from app.models.creator import Creator, CreatorSession
from app.models.form import Form, FormVersion
from app.models.question import Question, QuestionOption
from app.models.submission import Answer, AnswerOptionSelection, Submission


class CreatorRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_creator(self, display_name: str) -> Creator:
        creator = Creator(display_name=display_name)
        self.session.add(creator)
        await self.session.flush()
        return creator

    async def create_session(
        self, creator_id: str, token_hash: str, expires_at: str
    ) -> CreatorSession:
        creator_session = CreatorSession(
            creator_id=creator_id, token_hash=token_hash, expires_at=expires_at
        )
        self.session.add(creator_session)
        await self.session.flush()
        return creator_session

    async def get_session_by_token_hash(self, token_hash: str) -> CreatorSession | None:
        stmt = select(CreatorSession).where(
            CreatorSession.token_hash == token_hash,
            CreatorSession.is_active == 1,
            CreatorSession.expires_at > utc_now(),
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_creator(self, creator_id: str) -> Creator | None:
        stmt = select(Creator).where(Creator.id == creator_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def seed_demo_content(self, creator_id: str) -> None:
        form = Form(creator_id=creator_id, title="Product feedback survey")
        self.session.add(form)
        await self.session.flush()
        definitions = [
            (
                "short_text",
                "What should we call you?",
                "Your first name is perfect.",
                True,
                {},
                [],
            ),
            (
                "email",
                "What’s your email address?",
                "We’ll only use this to follow up.",
                True,
                {},
                [],
            ),
            (
                "multiple_choice",
                "What best describes your role?",
                None,
                True,
                {},
                ["Founder", "Product", "Engineering", "Design"],
            ),
            (
                "dropdown",
                "Which region are you in?",
                None,
                False,
                {},
                ["Americas", "Europe", "Asia Pacific", "Other"],
            ),
            (
                "number",
                "How many people are on your team?",
                None,
                False,
                {"min": 1, "max": 10000},
                [],
            ),
            ("yes_no", "Would you recommend FormFlow?", None, True, {}, []),
            (
                "rating",
                "How easy was this form to complete?",
                "1 is difficult, 5 is effortless.",
                True,
                {"max": 5},
                [],
            ),
            ("long_text", "What should we improve next?", None, False, {}, []),
        ]
        questions: list[Question] = []
        for position, (
            question_type,
            title,
            description,
            required,
            settings,
            labels,
        ) in enumerate(definitions):
            question = Question(
                form_id=form.id,
                type=question_type,
                title=title,
                description=description,
                required=int(required),
                position=position,
                settings=json.dumps(settings),
            )
            self.session.add(question)
            await self.session.flush()
            for option_position, label in enumerate(labels):
                self.session.add(
                    QuestionOption(
                        question_id=question.id, label=label, position=option_position
                    )
                )
            questions.append(question)
        await self.session.flush()
        for question in questions:
            await self.session.refresh(question, attribute_names=["options"])
        snapshot = [
            {
                "id": question.id,
                "type": question.type,
                "title": question.title,
                "description": question.description,
                "required": bool(question.required),
                "position": question.position,
                "settings": json.loads(question.settings),
                "options": [
                    {
                        "id": option.id,
                        "label": option.label,
                        "position": option.position,
                    }
                    for option in question.options
                ],
            }
            for question in questions
        ]
        version = FormVersion(
            form_id=form.id, version_number=1, questions_snapshot=json.dumps(snapshot)
        )
        self.session.add(version)
        await self.session.flush()
        form.status = "published"
        form.published_version_id = version.id

        sample_rows = [
            [
                "Maya",
                "maya@example.com",
                "Product",
                "Asia Pacific",
                12,
                True,
                5,
                "More themes.",
            ],
            [
                "Noah",
                "noah@example.com",
                "Engineering",
                "Europe",
                34,
                True,
                4,
                "Conditional logic.",
            ],
        ]
        for row_number, row in enumerate(sample_rows):
            submission = Submission(
                form_id=form.id,
                form_version_id=version.id,
                idempotency_key=f"seed-response-{row_number}",
            )
            for question, value in zip(questions, row):
                answer = Answer(question_id=question.id, question_type=question.type)
                if question.type in {"short_text", "long_text", "email"}:
                    answer.value_text = str(value)
                elif question.type in {"number", "rating"}:
                    answer.value_number = float(str(value))
                elif question.type == "yes_no":
                    answer.value_boolean = int(bool(value))
                else:
                    option = next(
                        item for item in question.options if item.label == value
                    )
                    answer.selections.append(
                        AnswerOptionSelection(
                            option_id=option.id, option_label=option.label
                        )
                    )
                submission.answers.append(answer)
            self.session.add(submission)

        draft = Form(creator_id=creator_id, title="Event registration")
        self.session.add(draft)
        await self.session.flush()
        self.session.add(
            Question(
                form_id=draft.id,
                type="short_text",
                title="What’s your full name?",
                required=1,
                position=0,
                settings="{}",
            )
        )
        await self.session.flush()
