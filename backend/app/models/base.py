from sqlalchemy.orm import DeclarativeBase
from datetime import datetime, timezone

class Base(DeclarativeBase):
    pass

def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()
