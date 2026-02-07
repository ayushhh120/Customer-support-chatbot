import logging
from typing import Optional
from fastapi import Depends, HTTPException, status, Request
from jose import JWTError, jwt
from app.core.config import settings
from app.db.mongodb import db
from bson import ObjectId

logger = logging.getLogger(__name__)


def _get_token_from_request(request: Request) -> Optional[str]:
    """Get token from cookie (same-origin) or Authorization header (cross-origin SPA)."""
    token = request.cookies.get("access_token")
    if token:
        return token
    auth = request.headers.get("Authorization")
    if auth and auth.startswith("Bearer "):
        return auth[7:].strip()
    return None


async def get_current_user(request: Request):
    token = _get_token_from_request(request)
    if not token:
        logger.warning("Auth failed: no token (cookie or Authorization header)")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )

    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")

        if not user_id:
            logger.warning("Auth failed: token missing 'sub'")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )

    except JWTError as e:
        logger.warning("Auth failed: invalid or expired token: %s", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
    except Exception as e:
        logger.warning("Auth failed: invalid user_id in token: %s", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

    if not user:
        logger.warning("Auth failed: user not found for id=%s", user_id)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    return user


async def require_admin(user=Depends(get_current_user)):
    if not user.get("is_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    if not user.get("client_id"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Client ID missing for admin"
        )

    return user