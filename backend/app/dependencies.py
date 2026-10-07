from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated

from app.database import get_db_session
from app.repositories.creator_repo import CreatorRepository
from app.services.creator_service import CreatorService, hash_token
from app.models.creator import Creator, CreatorSession
from app.schemas.creator import CreatorInfo

async def get_creator_repo(session: AsyncSession = Depends(get_db_session)) -> CreatorRepository:
    return CreatorRepository(session)

async def get_creator_service(repo: CreatorRepository = Depends(get_creator_repo)) -> CreatorService:
    return CreatorService(repo)

async def get_current_session(
    request: Request,
    repo: CreatorRepository = Depends(get_creator_repo)
) -> CreatorSession:
    # Token is expected in the Authorization header as Bearer token,
    # forwarded by the Next.js BFF which extracts it from the cookie.
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authentication token"
        )
    
    raw_token = auth_header.replace("Bearer ", "")
    token_hash = hash_token(raw_token)
    
    session = await repo.get_session_by_token_hash(token_hash)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid"
        )
        
    return session

async def get_current_creator(
    session: CreatorSession = Depends(get_current_session),
    repo: CreatorRepository = Depends(get_creator_repo)
) -> CreatorInfo:
    creator = await repo.get_creator(session.creator_id)
    if not creator:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Creator not found"
        )
    return CreatorInfo(
        creator_id=creator.id,
        display_name=creator.display_name
    )

CurrentCreator = Annotated[CreatorInfo, Depends(get_current_creator)]
