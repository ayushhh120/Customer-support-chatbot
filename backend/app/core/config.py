from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    HF_TOKEN : str
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    CHAT_MODEL_REPO: str = "Qwen/Qwen2.5-7B-Instruct"
    MONGO_URI: str
    FRONTEND_URL: str
    JWT_SECRET_KEY: str
    ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    model_config = {"env_file": ".env", "case_sensitive": False}

settings = Settings()