from pydantic import BaseModel, EmailStr, Field
from bson import ObjectId
from typing import Literal, Optional
from datetime import datetime, timezone

class User(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    name: str
    email: EmailStr
    hashed_password: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Config:
        populate_by_name = True
    
