from langchain_huggingface import (ChatHuggingFace, HuggingFaceEndpoint, HuggingFaceEndpointEmbeddings)
from app.core.config import settings

# embedding model
def get_embedding_model():
    return HuggingFaceEndpointEmbeddings(
        model=settings.EMBEDDING_MODEL,
        huggingfacehub_api_token=settings.HF_TOKEN,
    )

# chat model
def get_chat_model():
    llm = HuggingFaceEndpoint(
        repo_id=settings.CHAT_MODEL_REPO,
        task="text-generation",
        huggingfacehub_api_token=settings.HF_TOKEN,
    )
    return ChatHuggingFace(llm=llm)

# module-level instances
embedding_model = get_embedding_model()
chat_model = get_chat_model()