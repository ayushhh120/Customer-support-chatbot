from fastapi import APIRouter, HTTPException, Request
import uuid
import logging
from app.chatbot.chat_schema import ChatRequest, ChatResponse
from app.chatbot.support_agent import get_support_agent
from app.tickets.ticket_service import create_ticket
from app.clients.client_service import validate_client

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/", response_model=ChatResponse)
async def chat_request(req: ChatRequest, request: Request):
    origin = request.headers.get("origin")
    client_id = req.client_id


    try:
        await validate_client(client_id, origin)
        thread_id = req.thread_id or str(uuid.uuid4())

        CONFIG = {"configurable": {"thread_id": thread_id}}
        agent = await get_support_agent()

        result = await agent.ainvoke(
            {"query": req.query},
            config=CONFIG
        )

        ticket_id = None

        # ✅ Ticket creation ONLY here
        # CRITICAL: Only create ticket if escalated AND we have ticket_user_query
        # This prevents duplicate tickets when user sends messages after ticket creation
        if result.get("escalated") and result.get("ticket_user_query"):
            # Use context_summary if available (from RAG node), otherwise use answer
            bot_answer = result.get("context_summary") or result.get("answer")
            ticket_id = await create_ticket(
                thread_id=thread_id,
                user_query=result.get("ticket_user_query"),
                bot_answer=bot_answer
            )

            logger.info(
                "Ticket created",
                extra={"thread_id": thread_id, "ticket_id": ticket_id}
            )

        return {
            "answer": result.get("answer", "Sorry, I couldn’t process your request."),
            "ticket_id": ticket_id,
            "escalated": result.get("escalated", False),
            "thread_id": thread_id,
        }

    except Exception as e:
        logger.exception("Chat processing failed")
        raise HTTPException(
            status_code=500,
            detail="Internal server error while processing the chat"
        )