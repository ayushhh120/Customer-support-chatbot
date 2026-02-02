from fastapi import APIRouter, HTTPException, Depends
from app.auth.security import require_admin
from app.tickets.ticket_service import (
    create_ticket,
    get_all_tickets, 
    resolve_ticket, 
    get_ticket_count, 
    get_open_tickets_count, 
    get_resolved_tickets_count,
    get_resolved_tickets_count,
    get_ticket_trends,
    delete_ticket
)
from app.tickets.ticket_schema import TicketCreate, TicketResponse
from pydantic import BaseModel

router = APIRouter()

# create ticket
@router.post('/create', dependencies=[Depends(require_admin)])
async def create_ticket_api(payload: TicketCreate):
    await create_ticket(
        thread_id=payload.thread_id,
        user_query=payload.user_query,
        user_name=getattr(payload, "user_name", None),
        user_email=getattr(payload, "user_email", None),
    )
    return {"success": True}

# list all tickets
@router.get('/')
async def list_all_tickets(admin=Depends(require_admin)):
    tickets = await get_all_tickets()
    return [TicketResponse.from_db(ticket) for ticket in tickets]

    
@router.get("/stats")
async def ticket_stats(admin=Depends(require_admin)):
    from datetime import datetime, timezone, timedelta
    from app.db.mongodb import db
    
    total_tickets = await get_ticket_count()
    open_tickets = await get_open_tickets_count()
    resolved_tickets = await get_resolved_tickets_count()
    
    # Get trends
    trends = await get_ticket_trends()
    
    # Get document count and trend
    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)
    two_weeks_ago = now - timedelta(days=14)
    
    total_documents = await db.documents.count_documents({})
    this_week_docs = await db.documents.count_documents({
        "upload_date": {"$gte": week_ago}
    })
    last_week_docs = await db.documents.count_documents({
        "upload_date": {"$gte": two_weeks_ago, "$lt": week_ago}
    })
    
    # Calculate document trend
    if last_week_docs == 0:
        doc_trend_value = 100.0 if this_week_docs > 0 else 0.0
    else:
        doc_trend_value = ((this_week_docs - last_week_docs) / last_week_docs) * 100
    
    doc_trend = {
        "value": abs(round(doc_trend_value, 1)),
        "isPositive": doc_trend_value >= 0
    }
    
    return {
        "total": total_tickets,
        "open": open_tickets,
        "resolved": resolved_tickets,
        "documents": total_documents,
        "trends": {
            "total": trends["total"],
            "open": trends["open"],
            "resolved": trends["resolved"],
            "documents": doc_trend
        }
    }


class ResolveRequest(BaseModel):
    ticket_id: str
    admin_remarks: str

@router.post('/resolve', dependencies=[Depends(require_admin)])
async def resolve(payload: ResolveRequest):
    try:
        if not payload.ticket_id or not payload.ticket_id.strip():
            raise HTTPException(status_code=400, detail="Ticket ID is required")
        
        await resolve_ticket(payload.ticket_id, payload.admin_remarks)
        return {"message": "Ticket resolved successfully"}

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error while resolving ticket: {str(e)}")


@router.delete('/{ticket_id}', dependencies=[Depends(require_admin)])
async def delete_ticket_api(ticket_id: str):
    try:
        await delete_ticket(ticket_id)
        return {"success": True, "message": "Ticket deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting ticket: {str(e)}")


