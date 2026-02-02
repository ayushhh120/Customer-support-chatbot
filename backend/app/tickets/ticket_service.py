import uuid
from datetime import datetime, timezone, timedelta
from app.db.mongodb import db
from app.tickets.ticket_schema import TicketDB

ticket_collection = db.tickets


async def create_ticket(
    thread_id: str,
    user_query: str,
    bot_answer: str | None = None,
    user_name: str | None = None,
    user_email: str | None = None,
):
    """
    Create a support ticket for a given conversation thread.

    Notes:
    - user_query must represent the customer's actual problem (not the AI answer).
    - We trust user-provided identity (no email verification at this stage).
    """
    ticket_id = str(uuid.uuid4())

    ticket = TicketDB(
        ticket_id=ticket_id,
        thread_id=thread_id,
        user_query=user_query,
        user_name=user_name,
        user_email=user_email,
        bot_answer=bot_answer,
        status="OPEN",
        assigned_to="HUMAN",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )

    await ticket_collection.insert_one(ticket.model_dump())
    return ticket_id


async def get_all_tickets():
    tickets = []
    cursor = ticket_collection.find({})
    async for ticket_data in cursor:
        # Convert MongoDB document to dict, handling _id field
        ticket_dict = dict(ticket_data)
        # Remove MongoDB's _id if present (we use ticket_id instead)
        ticket_dict.pop('_id', None)
        tickets.append(TicketDB(**ticket_dict))
    return tickets

async def get_ticket_count():
    return await ticket_collection.count_documents({})

async def get_open_tickets_count():
    return await ticket_collection.count_documents({"status": "OPEN"})

async def get_resolved_tickets_count():
    return await ticket_collection.count_documents({"status": "RESOLVED"})


async def calculate_trend_percentage(this_week_count: int, last_week_count: int) -> float:
    """Calculate percentage change between this week and last week"""
    if last_week_count == 0:
        # If last week had 0, any positive this week is 100% increase
        return 100.0 if this_week_count > 0 else 0.0
    return ((this_week_count - last_week_count) / last_week_count) * 100


async def get_ticket_trends():
    """Calculate week-over-week trends for tickets"""
    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)
    two_weeks_ago = now - timedelta(days=14)
    
    # This week counts
    this_week_total = await ticket_collection.count_documents({
        "created_at": {"$gte": week_ago}
    })
    this_week_open = await ticket_collection.count_documents({
        "status": "OPEN",
        "created_at": {"$gte": week_ago}
    })
    this_week_resolved = await ticket_collection.count_documents({
        "status": "RESOLVED",
        "updated_at": {"$gte": week_ago}
    })
    
    # Last week counts
    last_week_total = await ticket_collection.count_documents({
        "created_at": {"$gte": two_weeks_ago, "$lt": week_ago}
    })
    last_week_open = await ticket_collection.count_documents({
        "status": "OPEN",
        "created_at": {"$gte": two_weeks_ago, "$lt": week_ago}
    })
    last_week_resolved = await ticket_collection.count_documents({
        "status": "RESOLVED",
        "updated_at": {"$gte": two_weeks_ago, "$lt": week_ago}
    })
    
    # Calculate trends
    total_trend = await calculate_trend_percentage(this_week_total, last_week_total)
    open_trend = await calculate_trend_percentage(this_week_open, last_week_open)
    resolved_trend = await calculate_trend_percentage(this_week_resolved, last_week_resolved)
    
    return {
        "total": {
            "value": abs(round(total_trend, 1)),
            "isPositive": total_trend >= 0
        },
        "open": {
            "value": abs(round(open_trend, 1)),
            "isPositive": open_trend >= 0
        },
        "resolved": {
            "value": abs(round(resolved_trend, 1)),
            "isPositive": resolved_trend >= 0
        }
    }
    

async def resolve_ticket(ticket_id: str, remarks: str):
    if not ticket_id or not ticket_id.strip():
        raise ValueError("Ticket ID cannot be empty")
    
    # Try to find by ticket_id first, then by thread_id as fallback
    # This handles cases where the frontend sends thread_id when ticket_id is missing
    result = await ticket_collection.update_one(
        {"$or": [{"ticket_id": ticket_id}, {"thread_id": ticket_id}]},
        {
            "$set": {
                "status": "RESOLVED",
                "admin_remarks": remarks,
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    
    if result.matched_count == 0:
        raise ValueError(f"Ticket with ID {ticket_id} not found")
    
    return result


async def delete_ticket(ticket_id: str):
    if not ticket_id or not ticket_id.strip():
        raise ValueError("Ticket ID cannot be empty")
        
    result = await ticket_collection.delete_one({"ticket_id": ticket_id})
    
    if result.deleted_count == 0:
        # Try fall back to thread_id just in case, though usually ticket_id is the primary key
        result = await ticket_collection.delete_one({"thread_id": ticket_id})
        
        if result.deleted_count == 0:
            raise ValueError(f"Ticket with ID {ticket_id} not found")
    
    return True