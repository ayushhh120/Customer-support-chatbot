from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    name: str
    email: EmailStr
    created_at: datetime
    
    class Config:
        populate_by_name = True

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    