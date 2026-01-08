print("Starting ingestion script...")
from langchain_community.vectorstores import FAISS
from app.core.llm import embedding_model
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pathlib import Path
import os


def ingest_documents(vectorstore: str | None = None):
    """Create a vectorstore from the bundled PDF.

    By default this builds FAISS. Set the environment variable `VECTORSTORE=chroma`
    to build a Chroma index instead (no FAISS ABI required).
    """
    repo_root = Path(__file__).resolve().parent
    pdf_name = "Ayush_Tech_Demo_Company_Knowledge_Base_Final.pdf"

    # Look in common locations: `Document/`, `document/`, or directly under `rag/`.
    # Define backend root (assuming ingest.py is in app/rag/)
    backend_root = Path(__file__).resolve().parent.parent.parent
    
    # Look in common locations: `Document/`, `document/`, or directly under `rag/`.
    # Also check absolute path relative to backed root
    possible_paths = [
        repo_root / "Document" / pdf_name,
        repo_root / "document" / pdf_name,
        repo_root / pdf_name,
        backend_root / "app" / "rag" / "Document" / pdf_name,
    ]

    pdf_path = next((p for p in possible_paths if p.exists()), None)
    if pdf_path is None:
        raise RuntimeError(
            "Knowledge base PDF not found. Looked for:\n" + "\n".join(str(p) for p in possible_paths)
        )
    print(f"Using knowledge base PDF at {pdf_path}")

    loader = PyPDFLoader(str(pdf_path))
    docs = loader.load()

    splitter = RecursiveCharacterTextSplitter(chunk_size=350, chunk_overlap=75)
    chunks = splitter.split_documents(docs)

    chosen = (vectorstore or os.getenv("VECTORSTORE", "chroma")).lower()

    if chosen != "chroma":
        raise RuntimeError("Only Chroma ingestion is supported. Set VECTORSTORE=chroma (or omit the env var) and try again.")

    try:
        from langchain_community.vectorstores.chroma import Chroma
    except Exception as e:
        raise RuntimeError("Chroma is not installed. Install with `pip install chromadb langchain langchain-community` to use Chroma.") from e

    chroma_dir = backend_root / "storage" / "chroma"
    chroma_dir.mkdir(parents=True, exist_ok=True)
    vect = Chroma.from_documents(chunks, embedding=embedding_model, persist_directory=str(chroma_dir))
    # Newer Chroma auto-persists; call persist if available
    if hasattr(vect, "persist"):
        try:
            vect.persist()
        except Exception:
            # Some implementations auto-persist; ignore persist failures
            pass

    print("Chroma vector store saved successfully at storage/chroma")


if __name__ == '__main__':
    ingest_documents()