"""Idempotently seed an immediately explorable demo workspace."""

import asyncio

from sqlalchemy import select

from app.database import async_session_maker
from app.models.creator import Creator
from app.models.form import Form
from app.repositories.creator_repo import CreatorRepository


async def seed() -> None:
    async with async_session_maker() as session:
        result = await session.execute(
            select(Creator).where(Creator.display_name == "Demo Creator").limit(1)
        )
        creator = result.scalar_one_or_none()
        repository = CreatorRepository(session)
        if creator is None:
            creator = await repository.create_creator("Demo Creator")
        form_result = await session.execute(
            select(Form.id).where(Form.creator_id == creator.id).limit(1)
        )
        if form_result.scalar_one_or_none() is None:
            await repository.seed_demo_content(creator.id)
        await session.commit()
        print("FormFlow demo data is ready.")


if __name__ == "__main__":
    asyncio.run(seed())
