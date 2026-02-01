from pydantic import BaseModel, Field
from typing import Optional


class ChatRequest(BaseModel):
    query: str
    thread_id: Optional[str] = None


class ChatResponse(BaseModel):
    answer: str
    thread_id: str
    # When the AI escalates to human support, backend may also create a ticket.
    # These fields must be part of the response model; otherwise FastAPI will drop them.
    escalated: bool = False
    ticket_id: Optional[str] = None
