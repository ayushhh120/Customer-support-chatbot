from pathlib import Path
from langchain_chroma import Chroma
from app.core.llm import get_embedding_model
import logging

logger = logging.getLogger(__name__)

embedding_model = get_embedding_model()


def _get_client_chroma_path(client_id: str) -> Path:
    """
    Returns client-specific Chroma directory.

    Example:
    app/storage/chroma/client_ayush_demo/
    """

    app_root = Path(__file__).resolve().parents[2]  # backend/app
    return (app_root / "storage" / "chroma" / f"client_{client_id}").resolve()


def load_vector_store(client_id: str) -> Chroma:
    chroma_path = _get_client_chroma_path(client_id)

    if not chroma_path.exists():
        raise RuntimeError(
            f"Vector store not found for client '{client_id}'. "
            "Ensure documents are ingested first."
        )

    logger.info(f"Loading vector store for client: {client_id}")
    logger.info(f"Chroma path: {chroma_path}")

    return Chroma(
        persist_directory=str(chroma_path),
        embedding_function=embedding_model,
        collection_name="company_kb",
    )


async def retrieve_documents(
    query: str,
    client_id: str,
    k: int = 4,
):
    """
    Retrieve documents ONLY from the given client's vector store.
    """
    try:
        vs = load_vector_store(client_id)

        try:
            count = vs._collection.count()
            logger.info(
                f"Client '{client_id}' collection has {count} documents"
            )
        except Exception:
            pass

        docs = vs.similarity_search(query, k=k)

        logger.info(
            f"Retrieved {len(docs)} docs for client={client_id}, query='{query[:50]}'"
        )

        return docs

    except Exception as e:
        logger.error(
            f"Vector retrieval failed for client={client_id}: {e}",
            exc_info=True,
        )
        return []