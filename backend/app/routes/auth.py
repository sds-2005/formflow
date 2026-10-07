from fastapi import APIRouter, Depends
from app.schemas.creator import CreatorSessionResponse, CreatorInfo
from app.services.creator_service import CreatorService
from app.dependencies import get_creator_service, CurrentCreator

router = APIRouter(prefix="/auth", tags=["auth"])

from app.database import get_db_session
from sqlalchemy.ext.asyncio import AsyncSession

@router.post("/demo", response_model=CreatorSessionResponse)
async def create_demo_workspace(
    service: CreatorService = Depends(get_creator_service),
    session: AsyncSession = Depends(get_db_session)
):
    """
    Creates a new demo creator workspace and returns a session token.
    This token should be kept server-side in the BFF as an HttpOnly cookie.
    """
    result = await service.create_demo_workspace()
    await session.commit()
    return result

@router.get("/me", response_model=CreatorInfo)
async def get_current_user(creator: CurrentCreator):
    """
    Returns the current authenticated creator's info.
    """
    return creator
