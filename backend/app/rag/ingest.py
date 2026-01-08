print("Starting ingestion script...")
from app.core.llm import get_embedding_model
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores.chroma import Chroma
from pathlib import Path
import os


def ingest_documents():

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

    splitter = RecursiveCharacterTextSplitter(chunk_size=150, chunk_overlap=15)
    chunks = splitter.split_documents(docs)

    chroma_dir = backend_root / "storage" / "chroma"
    chroma_dir.mkdir(parents=True, exist_ok=True)
    
    vect = Chroma.from_documents(chunks, embedding=get_embedding_model(), persist_directory=str(chroma_dir), collection_name="company_kb")
    
    # Newer Chroma auto-persists; call persist if available
    if hasattr(vect, "persist"):
        try:
            vect.persist()
        except Exception:
            pass

    print("Chroma vector store saved successfully at storage/chroma")


if __name__ == '__main__':
    ingest_documents()