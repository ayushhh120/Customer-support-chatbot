from app.core.llm import get_embedding_model
import inspect
from pathlib import Path
from langchain_chroma import Chroma

embedding_model = get_embedding_model()

def load_vector_store():
    backend_root = Path(__file__).resolve().parent.parent.parent
    chroma_path = backend_root / "storage" / "chroma"

    if not chroma_path.exists():
        raise RuntimeError("Vector store not found. Run ingestion first.")

    return Chroma(
        persist_directory=str(chroma_path),
        embedding_function=get_embedding_model(),
        collection_name="company_kb"
    )


async def retrieve_documents(query: str, k: int = 4):
    vs = load_vector_store()
    docs = vs.similarity_search(query, k=k)
    return docs

   