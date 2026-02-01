from pydantic import BaseModel 
from datetime import datetime
from typing import Literal

class DocumentUploadResponse(BaseModel):
    id: str
    name: str
    size: int
    upload_date: datetime
    status: Literal["processing", "indexed", "failed"]
    message: str
    success: bool
    