from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
import hashlib

from app.models.creator import Creator, CreatorSession
from app.models.base import utc_now

class CreatorRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_creator(self, display_name: str) -> Creator:
        creator = Creator(display_name=display_name)
        self.session.add(creator)
        await self.session.flush()
        return creator

    async def create_session(self, creator_id: str, token_hash: str, expires_at: str) -> CreatorSession:
        creator_session = CreatorSession(
            creator_id=creator_id,
            token_hash=token_hash,
            expires_at=expires_at
        )
        self.session.add(creator_session)
        await self.session.flush()
        return creator_session

    async def get_session_by_token_hash(self, token_hash: str) -> CreatorSession | None:
        stmt = select(CreatorSession).where(
            CreatorSession.token_hash == token_hash,
            CreatorSession.is_active == 1,
            CreatorSession.expires_at > utc_now()
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_creator(self, creator_id: str) -> Creator | None:
        stmt = select(Creator).where(Creator.id == creator_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
