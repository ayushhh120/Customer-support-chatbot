from app.rag.vectorstore import retrieve_documents
from app.rag.rag_prompts import RAG_PROMPT
from app.core.llm import get_chat_model
import traceback

chat_model = get_chat_model()


async def rag_answer(query):
    try:
        docs = await retrieve_documents(query, k=3)
    except Exception as e:
        # If vector store is missing or can't be loaded, return a helpful message
        print(f"Error retrieving documents: {e}")
        traceback.print_exc()
        return "I could not find any relevant information in the knowledge base"

    context = "\n\n".join(doc.page_content for doc in docs)
    prompt = RAG_PROMPT.format(question=query, context=context)
    response = await chat_model.ainvoke(prompt)
    return response.content
    
 

