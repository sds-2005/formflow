from fastapi import APIRouter, Depends
from app.schemas.creator import CreatorSessionResponse, CreatorInfo
from app.services.creator_service import CreatorService
from app.dependencies import get_creator_service, CurrentCreator

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/demo", response_model=CreatorSessionResponse)
async def create_demo_workspace(
    service: CreatorService = Depends(get_creator_service)
):
    """
    Creates a new demo creator workspace and returns a session token.
    This token should be kept server-side in the BFF as an HttpOnly cookie.
    """
    return await service.create_demo_workspace()

@router.get("/me", response_model=CreatorInfo)
async def get_current_user(creator: CurrentCreator):
    """
    Returns the current authenticated creator's info.
    """
    return creator
