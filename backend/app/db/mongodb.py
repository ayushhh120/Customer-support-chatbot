from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings


MONGO_URI = settings.MONGO_URI

client = AsyncIOMotorClient(MONGO_URI)
db = client.support_db
tickets_collection = db.tickets