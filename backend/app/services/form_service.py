import json
from collections import Counter

from fastapi import HTTPException
from sqlalchemy import desc, select

from app.models.base import utc_now
from app.models.form import Form, FormVersion
from app.models.question import Question, QuestionOption
from app.repositories.form_repo import FormRepository
from app.schemas.form import FormCreate, FormListResponse, FormResponse, FormUpdate


class FormService:
    def __init__(self, repo: FormRepository):
        self.repo = repo

    async def _to_response(self, form: Form) -> FormResponse:
        return FormResponse(
            id=form.id,
            creator_id=form.creator_id,
            title=form.title,
            status=form.status,
            slug=form.slug,
            created_at=form.created_at,
            updated_at=form.updated_at,
            response_count=await self.repo.get_response_count(form.id),
            question_count=await self.repo.get_question_count(form.id),
            published_version_id=form.published_version_id,
        )

    async def create_form(self, creator_id: str, data: FormCreate) -> FormResponse:
        return await self._to_response(
            await self.repo.create_form(creator_id, data.title.strip())
        )

    async def get_form(self, form_id: str, creator_id: str) -> FormResponse:
        form = await self.repo.get_form(form_id, creator_id)
        if not form:
            raise HTTPException(status_code=404, detail="Form not found")
        return await self._to_response(form)

    async def list_forms(
        self, creator_id: str, search: str | None = None
    ) -> FormListResponse:
        forms = await self.repo.list_forms(creator_id, search)
        return FormListResponse(forms=[await self._to_response(form) for form in forms])

    async def update_form(
        self, form_id: str, creator_id: str, data: FormUpdate
    ) -> FormResponse:
        form = await self.repo.get_form(form_id, creator_id)
        if not form:
            raise HTTPException(status_code=404, detail="Form not found")
        if data.title is not None:
            form.title = data.title.strip()
        form.updated_at = utc_now()
        await self.repo.update_form(form)
        return await self._to_response(form)

    async def delete_form(self, form_id: str, creator_id: str) -> None:
        form = await self.repo.get_form(form_id, creator_id)
        if not form:
            raise HTTPException(status_code=404, detail="Form not found")
        await self.repo.delete_form(form)

    async def duplicate_form(self, form_id: str, creator_id: str) -> FormResponse:
        source = await self.repo.get_form_with_questions(form_id, creator_id)
        if not source:
            raise HTTPException(status_code=404, detail="Form not found")
        clone = await self.repo.create_form(creator_id, f"{source.title} (copy)")
        for source_question in sorted(source.questions, key=lambda item: item.position):
            question = Question(
                form_id=clone.id,
                type=source_question.type,
                title=source_question.title,
                description=source_question.description,
                required=source_question.required,
                position=source_question.position,
                settings=source_question.settings,
            )
            self.repo.session.add(question)
            await self.repo.session.flush()
            for source_option in source_question.options:
                self.repo.session.add(
                    QuestionOption(
                        question_id=question.id,
                        label=source_option.label,
                        position=source_option.position,
                    )
                )
        await self.repo.session.flush()
        return await self._to_response(clone)

    async def unpublish_form(self, form_id: str, creator_id: str) -> FormResponse:
        form = await self.repo.get_form(form_id, creator_id)
        if not form:
            raise HTTPException(status_code=404, detail="Form not found")
        form.status = "draft"
        form.updated_at = utc_now()
        await self.repo.update_form(form)
        return await self._to_response(form)

    async def publish_form(self, form_id: str, creator_id: str) -> FormResponse:
        form = await self.repo.get_form_with_questions(form_id, creator_id)
        if not form:
            raise HTTPException(status_code=404, detail="Form not found")
        questions = sorted(form.questions, key=lambda item: item.position)
        if not questions:
            raise HTTPException(
                status_code=422, detail="Add at least one question before publishing"
            )
        for question in questions:
            if (
                question.type in {"multiple_choice", "dropdown"}
                and not question.options
            ):
                raise HTTPException(
                    status_code=422,
                    detail=f"'{question.title}' needs at least one option",
                )
        snapshot = [
            {
                "id": question.id,
                "type": question.type,
                "title": question.title,
                "description": question.description,
                "required": bool(question.required),
                "position": question.position,
                "settings": json.loads(question.settings or "{}"),
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
        result = await self.repo.session.execute(
            select(FormVersion)
            .where(FormVersion.form_id == form_id)
            .order_by(desc(FormVersion.version_number))
            .limit(1)
        )
        latest = result.scalar_one_or_none()
        version = FormVersion(
            form_id=form.id,
            version_number=1 if not latest else latest.version_number + 1,
            questions_snapshot=json.dumps(snapshot),
        )
        self.repo.session.add(version)
        await self.repo.session.flush()
        form.status = "published"
        form.published_version_id = version.id
        form.updated_at = utc_now()
        await self.repo.update_form(form)
        return await self._to_response(form)

    @staticmethod
    def _answer_value(answer):
        if answer.question_type in {"number", "rating"}:
            return answer.value_number
        if answer.question_type == "yes_no":
            return bool(answer.value_boolean)
        if answer.selections:
            return answer.selections[0].option_label
        return answer.value_text

    async def get_results(self, form_id: str, creator_id: str) -> dict:
        form = await self.repo.get_form_with_questions(form_id, creator_id)
        if not form:
            raise HTTPException(status_code=404, detail="Form not found")
        submissions = await self.repo.list_submissions(form_id)
        values: dict[str, list[object]] = {
            question.id: [] for question in form.questions
        }
        rows = []
        for submission in submissions:
            answers = {}
            for answer in submission.answers:
                value = self._answer_value(answer)
                answers[answer.question_id] = value
                if value is not None:
                    values.setdefault(answer.question_id, []).append(value)
            rows.append(
                {
                    "id": submission.id,
                    "submitted_at": submission.submitted_at,
                    "answers": answers,
                }
            )
        summaries = []
        for question in sorted(form.questions, key=lambda item: item.position):
            question_values = values.get(question.id, [])
            summary: dict[str, object]
            if question.type in {"multiple_choice", "dropdown", "yes_no"}:
                labels = [option.label for option in question.options]
                normalized = [str(value) for value in question_values]
                if question.type == "yes_no":
                    labels = ["Yes", "No"]
                    normalized = [
                        "Yes" if value is True else "No" for value in question_values
                    ]
                counts = Counter(normalized)
                summary = {
                    "options": [
                        {
                            "label": label,
                            "count": counts[label],
                            "percentage": round(
                                counts[label] / len(question_values) * 100, 1
                            )
                            if question_values
                            else 0,
                        }
                        for label in labels
                    ]
                }
            elif question.type in {"number", "rating"}:
                numbers = [float(str(value)) for value in question_values]
                summary = {
                    "average": round(sum(numbers) / len(numbers), 2)
                    if numbers
                    else None,
                    "min": min(numbers) if numbers else None,
                    "max": max(numbers) if numbers else None,
                    "count": len(numbers),
                }
            else:
                summary = {
                    "recent_values": list(reversed(question_values[-5:])),
                    "total_count": len(question_values),
                }
            summaries.append(
                {
                    "question_id": question.id,
                    "title": question.title,
                    "type": question.type,
                    "total_answers": len(question_values),
                    "summary": summary,
                }
            )
        return {
            "total_submissions": len(rows),
            "submissions": rows,
            "questions": summaries,
        }

    async def get_submission(
        self, form_id: str, submission_id: str, creator_id: str
    ) -> dict:
        form = await self.repo.get_form_with_questions(form_id, creator_id)
        if not form:
            raise HTTPException(status_code=404, detail="Form not found")
        submission = await self.repo.get_submission(form_id, submission_id)
        if not submission:
            raise HTTPException(status_code=404, detail="Submission not found")
        question_map = {question.id: question for question in form.questions}
        return {
            "id": submission.id,
            "submitted_at": submission.submitted_at,
            "answers": [
                {
                    "question_id": answer.question_id,
                    "question_title": question_map[answer.question_id].title
                    if answer.question_id in question_map
                    else "Deleted question",
                    "question_type": answer.question_type,
                    "value": self._answer_value(answer),
                }
                for answer in submission.answers
            ],
        }
