from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.chatbot.chat_route import router as chat_router
from app.tickets.ticket_routes import router as ticket_router
from app.auth.user_routes import router as admin_router
from app.clients.client_routes import router as client_router
from app.core.config import settings
load_dotenv()
from contextlib import asynccontextmanager
from app.db.mongodb import db
from datetime import datetime, timezone

DEFAULT_CLIENT_ID = "abc1234"

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup tasks:
    0. Bootstrap: if users exist but no admin, promote first user to admin with client_id=abc1234
    1. Warm up LLM agent (avoid first-request latency)
    2. Check RAG vector store availability
    """

    # 0️⃣ Bootstrap: promote first user to admin if no admin exists
    try:
        admin_exists = await db.users.find_one({"is_admin": True})
        if not admin_exists:
            user_count = await db.users.count_documents({})
            if user_count > 0:
                first_user = await db.users.find_one({}, sort=[("created_at", 1)])
                if first_user:
                    # Ensure default client exists
                    existing_client = await db.clients.find_one({"client_id": DEFAULT_CLIENT_ID})
                    if not existing_client:
                        await db.clients.insert_one({
                            "client_id": DEFAULT_CLIENT_ID,
                            "name": "Default Company",
                            "allowed_domains": ["customer-support-chatbot-gules.vercel.app"],
                            "is_active": True,
                            "created_at": datetime.now(timezone.utc),
                        })
                    await db.users.update_one(
                        {"_id": first_user["_id"]},
                        {"$set": {"is_admin": True, "client_id": DEFAULT_CLIENT_ID}},
                    )
                    print(f"✅ First user promoted to admin (client_id={DEFAULT_CLIENT_ID})")
    except Exception as e:
        print("⚠️ Admin bootstrap failed:", e)

    # 1️⃣ Warm up support agent
    try:
        from app.chatbot.support_agent import get_support_agent
        await get_support_agent()
        print("✅ Support agent warmed up")
    except Exception as e:
        print("⚠️ Agent warm-up failed:", e)

    # 2️⃣ Check vector store
    try:
        from app.chatbot.rag.vectorstore import load_vector_store
        load_vector_store(DEFAULT_CLIENT_ID)
        print("✅ RAG vector store loaded")
    except Exception as e:
        print("⚠️ RAG vector store not available:", e)
        print("➡️ Run ingestion before using RAG answers")

    yield

app = FastAPI(title="Customer Support Agent", lifespan=lifespan)

# -------------------- CORS --------------------
# Note: When allow_credentials=True, you cannot use allow_origins=["*"]
# Must specify the exact frontend URL(s)
try:
    frontend_urls = [settings.FRONTEND_URL] if settings.FRONTEND_URL else ["https://customer-support-chatbot-gules.vercel.app"]
except:
    frontend_urls = ["https://customer-support-chatbot-gules.vercel.app"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_urls,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# -------------------- ROUTERS --------------------
app.include_router(chat_router, prefix="/chat", tags=["Chatbot"])
app.include_router(ticket_router, prefix="/tickets", tags=["Admin Tickets"])
app.include_router(admin_router, prefix='/admin', tags=["Admin"])
app.include_router(client_router, prefix="/client", tags=["Client"])

# -------------------- HEALTH --------------------
@app.get("/health", tags=["Health"])
def health():
    return {"status": "OK"}