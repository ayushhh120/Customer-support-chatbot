from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone


class TicketCreate(BaseModel):
    thread_id: str
    user_query: str
    bot_answer: Optional[str] = None
    

class TicketDB(BaseModel):
    ticket_id: str
    thread_id: str
    user_query: str
    bot_answer: Optional[str] = None
    status: str = "open"
    assigned_to: str = "BOT"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
