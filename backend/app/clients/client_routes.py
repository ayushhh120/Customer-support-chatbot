from fastapi import APIRouter
from app.db.mongodb import db

router = APIRouter()

@router.post("/")
async def create_client():
    client = {
        "client_id": "abc1234",
        "name": "Ayush Demo Company",
        "allowed_domains": ["localhost"],
        "is_active": True
    }
    await db.clients.insert_one(client)
    return client