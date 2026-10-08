from fastapi import APIRouter, Depends

from app.dependencies import CurrentCreator, get_creator_service
from app.schemas.creator import CreatorInfo, CreatorSessionResponse
from app.services.creator_service import CreatorService

router = APIRouter(prefix="/auth", tags=["auth"])

from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db_session


@router.post("/demo", response_model=CreatorSessionResponse)
async def create_demo_workspace(
    service: CreatorService = Depends(get_creator_service),
    session: AsyncSession = Depends(get_db_session),
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
