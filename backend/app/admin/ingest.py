print("Starting ingestion script...")

from pathlib import Path
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from app.core.llm import get_embedding_model
from app.db.mongodb import db


BASE_CHROMA_PATH = Path("app/storage/chroma")
UPLOAD_PATH = Path("app/storage/uploads")

BASE_CHROMA_PATH.mkdir(parents=True, exist_ok=True)
UPLOAD_PATH.mkdir(parents=True, exist_ok=True)


async def ingest_documents(file_path: str, client_id: str, doc_id: str):
    """
    Ingest PDF into CLIENT-SPECIFIC vector store
    """

    try:
        pdf_path = Path(file_path)
        if not pdf_path.exists():
            raise FileNotFoundError(f"PDF not found at {pdf_path}")

        # ---------------------------
        # CLIENT-SPECIFIC PATH
        # ---------------------------
        client_chroma_path = (BASE_CHROMA_PATH / f"client_{client_id}").resolve()
        client_chroma_path.mkdir(parents=True, exist_ok=True)

        # ---------------------------
        # LOAD PDF
        # ---------------------------
        loader = PyPDFLoader(str(pdf_path))
        docs = loader.load()

        # ---------------------------
        # SPLIT DOCUMENT
        # ---------------------------
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=800,
            chunk_overlap=120
        )
        chunks = splitter.split_documents(docs)

        # ---------------------------
        # ADD METADATA
        # ---------------------------
        for chunk in chunks:
            chunk.metadata.update({
                "client_id": client_id,
                "doc_id": doc_id,
                "source": pdf_path.name,
            })

        # ---------------------------
        # CREATE / LOAD VECTORSTORE
        # ---------------------------
        vectorstore = Chroma(
            persist_directory=str(client_chroma_path),
            embedding_function=get_embedding_model(),
            collection_name="company_kb"
        )

        vectorstore.add_documents(chunks)

        # ---------------------------
        # UPDATE DB STATUS
        # ---------------------------
        await db.documents.update_one(
            {"id": doc_id},
            {
                "$set": {
                    "status": "indexed",
                    "chunk_count": len(chunks)
                }
            }
        )

        print(f"[SUCCESS] Document {doc_id} indexed for client {client_id}")

    except Exception as e:
        await db.documents.update_one(
            {"id": doc_id},
            {"$set": {"status": "failed"}}
        )
        print(f"[FAILED] Document {doc_id} | {e}")
        raise