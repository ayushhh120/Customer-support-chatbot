from fastapi import HTTPException, status
from app.db.mongodb import db
from urllib.parse import urlparse


async def validate_client(client_id: str, origin: str | None = None):
    client = await db.clients.find_one({"client_id": client_id})

    if not client:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid client"
        )

    if not client.get("is_active", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Client inactive"
        )

    if origin:
        parsed = urlparse(origin)
        domain = parsed.hostname

        allowed = client.get("allowed_domains", [])
        if domain not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Domain not allowed"
            )

    return client