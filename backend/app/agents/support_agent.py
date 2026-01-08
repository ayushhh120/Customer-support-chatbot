from app.core.llm import chat_model
from pydantic import BaseModel
from langchain_core.output_parsers import PydanticOutputParser
from typing import TypedDict, Literal
from langgraph.graph import StateGraph, START, END
from app.rag.pipeline import rag_answer
from app.core.checkpointer import get_checkpointer
from app.rag.vectorstore import retrieve_documents
import uuid
import logging
import re

logger = logging.getLogger(__name__)


class AgentState(TypedDict):
    query: str
    intent: str
    answer: str
    ticket_id: str


class IntentOutput(BaseModel):
    intent: Literal["faq", "other"]


output_parser = PydanticOutputParser(pydantic_object=IntentOutput)


async def intent_classifier_node(state: AgentState) -> AgentState:
    query = state['query']

    # 0) Greeting detection (high priority)
    greeting_pattern = r"\b(hi|hello|hey|namaste|how are you|hiya)\b"
    if re.search(greeting_pattern, query, flags=re.I):
        logger.debug("Intent classifier: detected greeting: %s", query)
        # Route to the greet node which will generate the reply; keep classifier lightweight
        return {**state, "intent": "greet"}

    # 1) First try a quick retrieval check: if the vector store contains relevant docs,
    # treat it as an FAQ (RAG) query. This is more reliable for RAG-driven intents
    # than relying purely on LLM classification which can be noisy.
    try:
        docs = await retrieve_documents(query, k=3)
        if docs and any(d.page_content.strip() for d in docs):
            logger.debug("Intent classifier: found relevant docs, choosing 'faq'")
            return {**state, "intent": "faq"}
    except Exception as e:
        # If vector store is missing or retrieval fails, fall back to LLM-based classification
        logger.debug("Intent classifier: vector store unavailable or error: %s", e)

    # LLM-based fallback classifier
    prompt = f"""You are an intent classifier. Classify the user's query into one of the following intents:
- faq: The user's question is answerable from the provided documentation/knowledge base.
- other: The user's question requires escalation or cannot be answered from the KB.
Query: {query}

{output_parser.get_format_instructions()}
"""

    try:
        response = await chat_model.ainvoke(prompt)
        logger.debug("Intent classifier LLM response: %s", response.content)
        parsed = output_parser.parse(response.content)
        logger.debug("Intent classifier parsed intent: %s", parsed.intent)
        intent = parsed.intent.lower()
        if intent not in {"faq", "other"}:
            intent = "other"
        return {**state, "intent": intent}
    except Exception as e:
        logger.exception("Intent classifier failed, defaulting to 'other'")
        return {**state, "intent": "other"}

async def greet_node(state: AgentState) -> AgentState:
    # Generate a friendly greeting and prompt for the user's request
    query = state.get("query", "")
    try:
        prompt = (
            "You are a friendly customer support assistant. Reply briefly to the user's greeting and then ask: 'How can I help you today?'"
            f" Greeting: '{query}'"
        )
        response = await chat_model.ainvoke(prompt)
        answer = response.content
    except Exception as e:
        logger.exception("Greeting node LLM failed: %s", e)
        answer = "Hi! I'm the support assistant — how can I help you today?"

    return {**state, "answer": answer}
    

async def rag_node(state: AgentState) -> AgentState:
    query = state['query']
    # Attempt to answer using the RAG pipeline and log retrieval result
    try:
        docs = await retrieve_documents(query, k=3)
        logger.debug("RAG retrieved %d docs", len(docs))
    except Exception as e:
        logger.debug("RAG retrieval failed: %s", e)
        docs = []

    answer = await rag_answer(query)
    logger.debug("RAG answer: %s", answer)
    return {**state, "answer": answer}


def fallback_node(state: AgentState) -> AgentState:
    ticket_id = f"TICKET-{uuid.uuid4().hex[:6]}"
    return {
        **state,
        "answer": ("i am not fully confident about this \n Let me connect you with a human support agent"),
        "ticket_id": ticket_id,
        "escalated": True,
    }



def route_by_intent(state: AgentState) -> str:
    # Return branch keys matching node names: 'greet_node', 'rag_node', or 'fallback_node'
    intent = state.get('intent')
    if intent in ("greet", "greet_node"):
        return "greet_node"
    if intent in ("faq", "rag_node"):
        return "rag_node"
    return "fallback_node"



#graph
graph = StateGraph(AgentState)

# nodes
graph.add_node("intent_classifier_node", intent_classifier_node)
graph.add_node("greet_node", greet_node)
graph.add_node("rag_node", rag_node)
graph.add_node("fallback_node", fallback_node)


# edges
graph.add_edge(START, "intent_classifier_node")
graph.add_conditional_edges(
    "intent_classifier_node",
    route_by_intent,
    {"rag_node": "rag_node", "greet_node": "greet_node", "fallback_node": "fallback_node"},
)
graph.add_edge("greet_node", END)
graph.add_edge("rag_node", END)
graph.add_edge("fallback_node", END)


# Lazy initialization: compile the agent after obtaining an actual checkpointer instance
_support_agent = None

async def get_support_agent():
    """Return a compiled support agent, initializing it once on first use."""
    global _support_agent
    if _support_agent is None:
        cp = await get_checkpointer()
        _support_agent = graph.compile(checkpointer=cp)
    return _support_agent


