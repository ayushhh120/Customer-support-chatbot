from pydantic import BaseModel,  Field
from typing import List
from datetime import datetime, timezone


class Client(BaseModel):
    client_id: str
    name: str
    allowed_domains: List[str]
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
