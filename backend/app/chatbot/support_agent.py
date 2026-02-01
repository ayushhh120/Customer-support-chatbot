from typing import TypedDict, Literal
from pydantic import BaseModel
from langgraph.graph import StateGraph, START, END
from langchain_core.output_parsers import PydanticOutputParser
from app.core.llm import chat_model
from app.chatbot.rag.pipeline import rag_answer
from app.core.checkpointer import get_checkpointer
import re
import logging

logger = logging.getLogger(__name__)

# =========================
# STATE
# =========================
class AgentState(TypedDict, total=False):
    thread_id: str
    query: str
    intent: str
    answer: str
    context_summary: str
    policy_days: int
    failure_count: int
    escalated: bool
    awaiting_ticket_query: bool
    ticket_user_query: str  


# =========================
# INTENT CLASSIFIER
# =========================
class IntentOutput(BaseModel):
    intent: Literal[
        "greeting",
        "faq",
        "followup",
        "small_talk",
        "escalation_request",
        "out_of_scope",
    ]


async def intent_classifier(state: AgentState) -> AgentState:
    # ✅ Prevent any ticket-related logic if already escalated
    if state.get("escalated"):
        # Clear any ticket-related flags to prevent duplicate tickets
        return {
            **state,
            "awaiting_ticket_query": False,
            "ticket_user_query": None,
        }
    
    # ✅ Capture final ticket message (only if not already escalated)
    if state.get("awaiting_ticket_query") and not state.get("escalated"):
        return {
            **state,
            "ticket_user_query": state["query"],
            "intent": "escalation_request"
        }

    # Create output parser
    parser = PydanticOutputParser(pydantic_object=IntentOutput)
    
    prompt = f"""
You are an enterprise customer-support intent classifier.

Classify the message into ONE intent:
- greeting (hello, hi, thanks, ok, bye)
- faq (company policy / product / service)
- followup (related to previous answer)
- escalation_request (contact human, raise ticket)
- small_talk (hmm, okay, got it)
- out_of_scope (weather, celebrities, unrelated)

Message:
{state["query"]}

{parser.get_format_instructions()}
"""
    try:
        res = await chat_model.ainvoke(prompt)
        parsed_output = parser.parse(res.content)
        intent = parsed_output.intent
    except Exception as e:
        logger.warning(f"Intent classification failed: {e}, defaulting to 'faq'")
        intent = "faq"

    return {**state, "intent": intent}


# =========================
# SMALL TALK
# =========================
async def small_talk_node(state: AgentState) -> AgentState:
    res = await chat_model.ainvoke(
        f"Reply politely and briefly to: {state['query']}"
    )
    return {**state, "answer": res.content}


# =========================
# RAG NODE
# =========================
async def rag_node(state: AgentState) -> AgentState:
    prev_summary = state.get("context_summary", "")
    query = state["query"]

    combined_query = (
        f"Previous context:\n{prev_summary}\n\nUser follow-up:\n{query}"
        if prev_summary else query
    )

    answer = await rag_answer(query=combined_query, client_id=state["client_Id"])

    match = re.search(r"(\d+)\s*(business\s*)?days", answer.lower())
    policy_days = int(match.group(1)) if match else state.get("policy_days")

    summary = (await chat_model.ainvoke(
        f"Summarize this policy in one line:\n{answer}"
    )).content

    return {
        **state,
        "answer": answer,
        "context_summary": summary,
        "policy_days": policy_days,
        "failure_count": state.get("failure_count", 0),
    }


# =========================
# POLICY BREACH CHECK
# =========================
def policy_breach(state: AgentState) -> bool:
    if not state.get("policy_days"):
        return False

    numbers = re.findall(r"\d+", state["query"])
    return bool(numbers and max(map(int, numbers)) > state["policy_days"])


# =========================
# ASK FULL ISSUE
# =========================
async def ask_ticket_query_node(state: AgentState) -> AgentState:
    return {
        **state,
        "answer": (
            "I understand this needs human support.\n\n"
            "Before I raise a ticket, please describe your full issue "
            "clearly in one message."
        ),
        "awaiting_ticket_query": True,
    }


# =========================
# ESCALATION NODE
# =========================
async def escalation_node(state: AgentState) -> AgentState:
    # Store ticket_user_query before clearing it
    ticket_query = state.get("ticket_user_query")
    
    return {
        **state,
        "answer": (
            "Thank you. I've raised a support ticket for you. "
            "Our human support team will contact you shortly."
        ),
        "escalated": True,
        "awaiting_ticket_query": False,  # Clear flag after escalation
        "ticket_user_query": ticket_query,  # Keep for ticket creation in this turn only
    }

# =========================
# OUT OF SCOPE
# =========================
async def out_of_scope_node(state: AgentState) -> AgentState:
    return {
        **state,
        "answer": (
            "I can help with questions related to the company and its services."
        ),
        "failure_count": state.get("failure_count", 0) + 1,
    }


# =========================
# ROUTER
# =========================
def router(state: AgentState) -> str:
    # CRITICAL: Prevent duplicate ticket creation - if already escalated, treat as normal conversation
    # This ensures no ticket is created for subsequent messages after escalation
    if state.get("escalated"):
        if state["intent"] in ("greeting", "small_talk"):
            return "small_talk_node"
        if state["intent"] in ("faq", "followup"):
            return "rag_node"
        return "small_talk_node"  # Default to small_talk for any message after escalation
    
    # Only route to escalation if not already escalated AND we have both flags
    if state.get("awaiting_ticket_query") and state.get("ticket_user_query") and not state.get("escalated"):
        return "escalation_node"

    if policy_breach(state) and not state.get("escalated"):
        return "ask_ticket_query_node"

    if state["intent"] == "escalation_request" and not state.get("escalated"):
        return "ask_ticket_query_node"

    if state["intent"] in ("greeting", "small_talk"):
        return "small_talk_node"

    if state["intent"] in ("faq", "followup"):
        return "rag_node"

    return "out_of_scope_node"


# =========================
# GRAPH
# =========================
graph = StateGraph(AgentState)

graph.add_node("intent_classifier", intent_classifier)
graph.add_node("small_talk_node", small_talk_node)
graph.add_node("rag_node", rag_node)
graph.add_node("out_of_scope_node", out_of_scope_node)
graph.add_node("ask_ticket_query_node", ask_ticket_query_node)
graph.add_node("escalation_node", escalation_node)

graph.add_edge(START, "intent_classifier")
graph.add_conditional_edges(
    "intent_classifier",
    router,
    {
        "small_talk_node": "small_talk_node",
        "rag_node": "rag_node",
        "out_of_scope_node": "out_of_scope_node",
        "ask_ticket_query_node": "ask_ticket_query_node",
        "escalation_node": "escalation_node",
    },
)

graph.add_edge("small_talk_node", END)
graph.add_edge("rag_node", END)
graph.add_edge("out_of_scope_node", END)
graph.add_edge("ask_ticket_query_node", END)
graph.add_edge("escalation_node", END)


# =========================
# COMPILED AGENT
# =========================
_support_agent = None

async def get_support_agent():
    global _support_agent
    if _support_agent is None:
        cp = await get_checkpointer()
        _support_agent = graph.compile(checkpointer=cp)
    return _support_agent