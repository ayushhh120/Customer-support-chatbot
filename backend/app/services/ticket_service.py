from app.models.ticket_schema import TicketDB
from app.db.mongodb import tickets_collection
from datetime import datetime, timezone
import uuid


async def create_ticket(thread_id: str, question: str, answer: str):
    ticket = TicketDB(
        ticket_id = str(uuid.uuid4()),
        thread_id = thread_id,
        user_query=  question,
        bot_answer = answer,
        status = "ESCALATED",
        assigned_to = "HUMAN",
        created_at = datetime.now(timezone.utc),
        updated_at = datetime.now(timezone.utc)
    )
    await tickets_collection.insert_one(ticket.model_dump())
    return ticket