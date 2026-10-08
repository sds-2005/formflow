import asyncio
from collections.abc import AsyncIterator

from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings
from app.database import get_db_session
from app.main import app
from app.models import Base


def test_seeded_creator_publish_and_response_flow() -> None:
    engine = create_async_engine("sqlite+aiosqlite://")
    session_maker = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async def setup() -> None:
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)

    async def test_session() -> AsyncIterator[AsyncSession]:
        async with session_maker() as session:
            yield session

    asyncio.run(setup())
    app.dependency_overrides[get_db_session] = test_session
    headers = {"X-Proxy-Secret": settings.PROXY_SECRET}
    try:
        with TestClient(app) as client:
            demo = client.post("/api/v1/auth/demo", headers=headers)
            assert demo.status_code == 200
            auth_headers = {
                **headers,
                "Authorization": f"Bearer {demo.json()['token']}",
            }
            forms = client.get("/api/v1/forms", headers=auth_headers)
            assert forms.status_code == 200
            seeded_forms = forms.json()["forms"]
            assert len(seeded_forms) == 2
            published = next(
                form for form in seeded_forms if form["status"] == "published"
            )
            assert published["response_count"] == 2

            public_form = client.get(
                f"/api/v1/public/forms/{published['slug']}", headers=headers
            )
            assert public_form.status_code == 200
            payload = public_form.json()
            answers: dict[str, object] = {}
            for question in payload["questions"]:
                if question["type"] == "short_text":
                    answers[question["id"]] = "Avery"
                elif question["type"] == "email":
                    answers[question["id"]] = "avery@example.com"
                elif question["type"] in {"multiple_choice", "dropdown"}:
                    answers[question["id"]] = question["options"][0]["id"]
                elif question["type"] == "number":
                    answers[question["id"]] = 8
                elif question["type"] == "yes_no":
                    answers[question["id"]] = True
                elif question["type"] == "rating":
                    answers[question["id"]] = 5
                elif question["type"] == "long_text":
                    answers[question["id"]] = "Keep it focused."
            submission = client.post(
                f"/api/v1/public/forms/{published['slug']}/submissions",
                headers=headers,
                json={
                    "version_id": payload["version_id"],
                    "idempotency_key": "api-flow-test-key",
                    "answers": answers,
                },
            )
            assert submission.status_code == 201
            duplicate = client.post(
                f"/api/v1/public/forms/{published['slug']}/submissions",
                headers=headers,
                json={
                    "version_id": payload["version_id"],
                    "idempotency_key": "api-flow-test-key",
                    "answers": answers,
                },
            )
            assert duplicate.status_code == 201
            assert duplicate.json()["id"] == submission.json()["id"]
            results = client.get(
                f"/api/v1/forms/{published['id']}/results", headers=auth_headers
            )
            assert results.status_code == 200
            assert results.json()["total_submissions"] == 3
    finally:
        app.dependency_overrides.clear()
        asyncio.run(engine.dispose())
