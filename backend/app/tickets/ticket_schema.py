from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime, timezone


TicketStatus = Literal["OPEN", "RESOLVED"]
AssignedTo = Literal["BOT", "HUMAN"]

class TicketCreate(BaseModel):
    thread_id: str
    user_query: str


class TicketDB(BaseModel):
    ticket_id: Optional[str] = None
    thread_id: str
    user_query: str
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    status: TicketStatus = "OPEN"
    assigned_to: AssignedTo = "BOT"
    admin_remarks : Optional[str] = None
    bot_answer: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Config:
        from_attributes = True



class TicketResponse(BaseModel):
    """Response model matching frontend expectations"""
    id: str  # ticket_id
    thread_id: str
    query: str  # user_query
    llmAnswer: Optional[str] = None  # bot_answer
    status: str
    assignedTo: str  # assigned_to
    createdAt: datetime  # created_at
    remark: Optional[str] = None  # admin_remarks
    userName: Optional[str] = None
    userEmail: Optional[str] = None
    
    @classmethod
    def from_db(cls, ticket: TicketDB):
        """Convert TicketDB to TicketResponse"""
        # Use ticket_id if available, otherwise use thread_id as fallback to avoid empty IDs
        ticket_id = ticket.ticket_id or ticket.thread_id
        if not ticket_id:
            # Last resort: generate a temporary ID (shouldn't happen in practice)
            import uuid
            ticket_id = str(uuid.uuid4())
        
        return cls(
            id=ticket_id,
            thread_id=ticket.thread_id,
            query=ticket.user_query,
            llmAnswer=ticket.bot_answer,
            status=ticket.status,
            assignedTo=ticket.assigned_to,
            createdAt=ticket.created_at,
            remark=ticket.admin_remarks,
            userName=ticket.user_name,
            userEmail=ticket.user_email,
        )
