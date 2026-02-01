from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta, timezone
from app.core.config import settings


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    password = password.strip()
    # Bcrypt has a 72-byte limit, so truncate the UTF-8 encoded password if necessary
    password_bytes = password.encode("utf-8")
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
    password = password_bytes.decode("utf-8", errors="ignore")
    return pwd_context.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    password = password.strip()
    # Bcrypt has a 72-byte limit, so truncate the UTF-8 encoded password if necessary
    password_bytes = password.encode("utf-8")
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
        password = password_bytes.decode("utf-8", errors="ignore")
    return pwd_context.verify(password, hashed)

def create_access_token(user_id: str):
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    }
    
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.ALGORITHM)
  
