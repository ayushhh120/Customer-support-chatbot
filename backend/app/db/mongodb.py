from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
import certifi
import logging

logger = logging.getLogger(__name__)

MONGO_URI = settings.MONGO_URI
# Use TLS with the certifi CA bundle to avoid platform-specific SSL/TLS issues.
# Increase server selection timeout to give more time during handshake.
client = AsyncIOMotorClient(
    MONGO_URI,
    tls=True,
    tlsCAFile=certifi.where(),
    serverSelectionTimeoutMS=30000,
)
# Use named database to avoid accidental creation/use of default DB
db = client.get_database("support_db")

async def check_connection():
    """Optional helper to verify connectivity at runtime and log errors clearly."""
    try:
        await client.admin.command("ping")
        logger.info("MongoDB connection OK")
    except Exception as e:
        logger.error("MongoDB connection failed: %s", e)
        raise