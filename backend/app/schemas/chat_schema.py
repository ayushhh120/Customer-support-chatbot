from pydantic import BaseModel, Field
from typing import Optional


class ChatRequest(BaseModel):
    query: str
    thread_id: Optional[str] = None


class ChatResponse(BaseModel):
    answer: str
    thread_id: str
