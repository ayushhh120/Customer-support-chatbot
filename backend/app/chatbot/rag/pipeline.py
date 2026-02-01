from app.chatbot.rag.vectorstore import retrieve_documents
from app.chatbot.rag.rag_prompts import RAG_PROMPT
from app.core.llm import get_chat_model
import traceback
import logging

logger = logging.getLogger(__name__)

chat_model = get_chat_model()


async def rag_answer(query: str,client_id: str):
    """
    RAG answer generator.
    Fetches documents ONLY from the given client's vector store.
    """

    try:
        docs = await retrieve_documents(
            query=query,
            client_id=client_id,
            k=3,
        )

        logger.info(
            f"RAG | client={client_id} | retrieved_docs={len(docs)}"
        )

        if not docs:
            logger.warning(
                f"RAG | client={client_id} | no documents found"
            )
            return (
                "I could not find relevant information in our knowledge base. "
                "Please rephrase your question or request human support."
            )

        # Build context safely
        context = "\n\n".join(doc.page_content for doc in docs)

        prompt = RAG_PROMPT.format(
            question=query,
            context=context,
        )

        response = await chat_model.ainvoke(prompt)
        return response.content

    except Exception as e:
        logger.error(
            f"RAG failed | client={client_id} | error={e}",
            exc_info=True,
        )
        traceback.print_exc()

        return (
            "I'm having trouble accessing the knowledge base right now. "
            "Please try again later or contact support."
        )