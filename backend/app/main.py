from fastapi import FastAPI
from app.api.chat_api import router as chat_router
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

load_dotenv()

app = FastAPI(title= "Customer Support Agent")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(chat_router)


@app.on_event("startup")
async def startup_event():
    """Warm up the support agent and its checkpointer on startup to avoid
    first-request latency and to initialize the DB connection lazily."""
    try:
        from importlib import import_module
        mod = import_module("app.agents.support_agent")
        # only initialize if not already created
        if getattr(mod, "_support_agent", None) is None:
            await mod.get_support_agent()
    except Exception:
        # Do not raise on startup if warmup fails; server should still start.
        pass

    # Check if the RAG vectorstore is available and log guidance if not
    try:
        from app.rag.vectorstore import load_vector_store
        try:
            _ = load_vector_store()
            app.logger = getattr(app, "logger", None)
            print("RAG vector store loaded successfully")
        except Exception as e:
            print("RAG vector store not found or failed to load:", e)
            print("To enable RAG answers: set HF_TOKEN in your environment and run: `python -m app.rag.ingest` from the backend folder to create the FAISS index.")
    except Exception:
        # If import fails, just continue
        pass


@app.on_event("shutdown")
async def shutdown_event():
    """Close the checkpointer/DB connection if it exists to avoid hanging on exit."""
    try:
        from importlib import import_module
        mod = import_module("app.agents.support_agent")
        agent = getattr(mod, "_support_agent", None)
        if agent is not None:
            cp = getattr(agent, "checkpointer", None)
            if cp is not None:
                conn = getattr(cp, "conn", None)
                if conn is not None:
                    # Prefer the aclose method on the lazy wrapper if available
                    if hasattr(conn, "aclose"):
                        await conn.aclose()
                    elif hasattr(conn, "close"):
                        try:
                            await conn.close()
                        except Exception:
                            pass
    except Exception:
        pass


@app.get('/')
def health():
    return {"status": "OK"}