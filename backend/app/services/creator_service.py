import hashlib
import secrets
from datetime import UTC, datetime, timedelta

from app.config import settings
from app.repositories.creator_repo import CreatorRepository
from app.schemas.creator import CreatorSessionResponse


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


class CreatorService:
    def __init__(self, repo: CreatorRepository):
        self.repo = repo

    async def create_demo_workspace(
        self, display_name: str = "Demo Creator"
    ) -> CreatorSessionResponse:
        creator = await self.repo.create_creator(display_name=display_name)
        await self.repo.seed_demo_content(creator.id)

        # Generate 32-byte secure token (64 hex chars)
        raw_token = secrets.token_hex(32)
        token_hash = hash_token(raw_token)

        expires_at = (
            datetime.now(UTC) + timedelta(hours=settings.SESSION_EXPIRY_HOURS)
        ).isoformat()

        session = await self.repo.create_session(
            creator_id=creator.id, token_hash=token_hash, expires_at=expires_at
        )

        return CreatorSessionResponse(
            session_id=session.id,
            creator_id=creator.id,
            display_name=creator.display_name,
            token=raw_token,  # Returned exactly once to be set as a cookie by the BFF
        )
