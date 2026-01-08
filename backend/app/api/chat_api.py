from fastapi import APIRouter, HTTPException
import uuid
import logging
from app.schemas.chat_schema import ChatRequest, ChatResponse
from app.agents.support_agent import get_support_agent 
from app.services.ticket_service import create_ticket

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post('/chat', response_model=ChatResponse)
async def chat_request(req: ChatRequest):
    # thread_id
    thread_id = req.thread_id or str(uuid.uuid4())
    try:
        logger.info(f"Incoming chat | thread_id: {thread_id}")
        CONFIG = {"configurable" : {"thread_id": thread_id}}
        support_agent = await get_support_agent()
        result = await support_agent.ainvoke({"query": req.query}, config=CONFIG)

        if result.get("escalated"):
            await create_ticket(
                thread_id = thread_id,
                question= req.query,
                answer = result.get("answer")
            )    
        return {
        "answer": result.get("answer", "Sorry I could not process your request"),
        "ticket_id": result.get("ticket_id"),
        "escalated": result.get("escalated", False),
        "thread_id": thread_id
        }

    except Exception as e:
        logger.exception("Chat processing failed")
        raise HTTPException(status_code=500, detail="Internal server error whike processing the chat")



