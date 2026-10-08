from pydantic import BaseModel


class CreatorSessionResponse(BaseModel):
    session_id: str
    creator_id: str
    display_name: str
    token: str


class CreatorInfo(BaseModel):
    creator_id: str
    display_name: str
