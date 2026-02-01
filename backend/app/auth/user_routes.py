from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Response
from app.db.mongodb import db
from app.auth.security import get_current_user, require_admin
from app.admin.ingest import ingest_documents
from app.auth.user_services import hash_password, verify_password, create_access_token
from app.auth.user_schemas import UserCreate, UserResponse, LoginRequest
from app.admin.document_schemas import DocumentUploadResponse
from langchain_chroma import Chroma
from app.core.llm import get_embedding_model
from datetime import datetime, timezone
import os, uuid, asyncio, logging
from pathlib import Path

router = APIRouter()
logger = logging.getLogger(__name__)


# -------------------- Admin Activity Feed --------------------
from typing import Literal, Optional
from pydantic import BaseModel


ActivityType = Literal["success", "warning", "info", "default"]


class ActivityItem(BaseModel):
    action: str
    type: ActivityType = "default"
    timestamp: datetime
    entity: Optional[Literal["ticket", "document"]] = None
    entityId: Optional[str] = None


@router.get("/activity", dependencies=[Depends(require_admin)])
async def recent_activity(limit: int = 10):
    """
    Returns a unified recent activity feed for the admin dashboard.
    Includes:
      - ticket created
      - ticket resolved
      - document uploaded
    """

    # Tickets: pull most recent by created/updated time
    ticket_items: list[ActivityItem] = []
    cursor_tickets = db.tickets.find({}).sort("updated_at", -1).limit(limit * 2)
    async for t in cursor_tickets:
        t.pop("_id", None)
        ticket_id = t.get("ticket_id") or t.get("thread_id")
        created_at = t.get("created_at")
        updated_at = t.get("updated_at")
        status = (t.get("status") or "").upper()

        if created_at:
            ticket_items.append(
                ActivityItem(
                    action=f"New ticket received: #{ticket_id}",
                    type="info",
                    timestamp=created_at,
                    entity="ticket",
                    entityId=str(ticket_id) if ticket_id else None,
                )
            )

        # If resolved, also add a resolved event at updated_at
        if status == "RESOLVED" and updated_at:
            ticket_items.append(
                ActivityItem(
                    action=f"Ticket #{ticket_id} resolved",
                    type="success",
                    timestamp=updated_at,
                    entity="ticket",
                    entityId=str(ticket_id) if ticket_id else None,
                )
            )

    # Documents: most recent uploads (indexed + processing)
    doc_items: list[ActivityItem] = []
    cursor_docs = db.documents.find({}).sort("upload_date", -1).limit(limit)
    async for d in cursor_docs:
        d.pop("_id", None)
        doc_id = d.get("id")
        name = d.get("name") or "document"
        upload_date = d.get("upload_date")
        if upload_date:
            doc_items.append(
                ActivityItem(
                    action=f"New document uploaded: {name}",
                    type="default",
                    timestamp=upload_date,
                    entity="document",
                    entityId=str(doc_id) if doc_id else None,
                )
            )

    items = [*ticket_items, *doc_items]
    items.sort(key=lambda x: x.timestamp, reverse=True)
    return items[: max(1, min(limit, 50))]

DEFAULT_CLIENT_ID = "abc1234"


@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate):
    try:
        logger.info(f"Registration attempt for email: {user_data.email}")

        # Check if user already exists
        existing_user = await db.users.find_one({"email": user_data.email})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")

        # Validate password
        password_bytes = user_data.password.encode("utf-8")
        if len(password_bytes) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

        # First user? Make admin and ensure default client exists
        user_count = await db.users.count_documents({})
        is_first_user = user_count == 0

        if is_first_user:
            # Create default client if it doesn't exist
            existing_client = await db.clients.find_one({"client_id": DEFAULT_CLIENT_ID})
            if not existing_client:
                await db.clients.insert_one({
                    "client_id": DEFAULT_CLIENT_ID,
                    "name": "Default Company",
                    "allowed_domains": ["localhost", "127.0.0.1"],
                    "is_active": True,
                    "created_at": datetime.now(timezone.utc),
                })
                logger.info(f"Created default client: {DEFAULT_CLIENT_ID}")

        # Create user document
        user = {
            "name": user_data.name,
            "email": user_data.email,
            "hashed_password": hash_password(user_data.password),
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
        }

        if is_first_user:
            user["is_admin"] = True
            user["client_id"] = DEFAULT_CLIENT_ID
            logger.info(f"First user created as admin with client_id={DEFAULT_CLIENT_ID}")

        res = await db.users.insert_one(user)
        user["_id"] = str(res.inserted_id)

        logger.info(f"User registered successfully: {user_data.email}")
        return user

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during registration: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error during registration")


@router.post("/login")
async def login(login_request: LoginRequest, response: Response):
    try:
        logger.info(f"Login attempt for email: {login_request.email}")
        
        # Find user by email
        user = await db.users.find_one({"email": login_request.email})
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Verify password
        if not verify_password(login_request.password, user["hashed_password"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Generate token
        access_token = create_access_token(user_id=str(user["_id"]))
        response.set_cookie(
            key="access_token",
            value= access_token,
            httponly=True,
            secure=False,
            samesite="lax",
            max_age= 60 * 60
        )  
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_id": str(user["_id"]),
            "email": user["email"],

        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during login: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error during login")


@router.get('/me')
async def get_me(current_user=Depends(get_current_user)):
    return {
        "id": str(current_user["_id"]),
        "email": current_user["email"],
        
    }
    

UPLOAD_DIR = Path("app/storage/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/upload",dependencies=[Depends(require_admin)],response_model=DocumentUploadResponse)
async def ingest_data(
    file: UploadFile = File(...),
    current_admin=Depends(require_admin),
):
    try:
        client_id = current_admin["client_id"]

        logger.info(
            f"Upload request | client={client_id} | "
            f"filename={file.filename} | type={file.content_type}"
        )

        # ---- VALIDATION ----
        allowed_types = {"application/pdf", "application/x-pdf"}
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Only PDF files allowed")

        # ---- FILE SAVE ----
        doc_id = str(uuid.uuid4())
        safe_name = file.filename.replace(" ", "_")
        file_path = UPLOAD_DIR / f"{client_id}_{doc_id}_{safe_name}"

        contents = await file.read()
        size = len(contents)

        with open(file_path, "wb") as f:
            f.write(contents)

        # ---- DB RECORD ----
        document = {
            "doc_id": doc_id,
            "client_id": client_id,
            "filename": file.filename,
            "size": size,
            "status": "processing",
            "upload_date": datetime.now(timezone.utc),
        }

        await db.documents.insert_one(document)

        # ---- BACKGROUND INGESTION ----
        asyncio.create_task(
            ingest_documents(
                file_path=str(file_path),
                client_id=client_id,
                doc_id=doc_id,
            )
        )

        logger.info(
            f"Ingestion started | client={client_id} | doc_id={doc_id}"
        )

        return {
            "doc_id": doc_id,
            "name": file.filename,
            "size": f"{round(size / 1024 / 1024, 2)} MB",
            "upload_date": document["upload_date"].isoformat(),
            "message": "Document uploaded and indexing started",
            "success": True,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Document upload failed")
        raise HTTPException(
            status_code=500,
            detail="Document upload failed. Please try again."
        )


@router.get('/documents', dependencies=[Depends(require_admin)])
async def list_documents():
    docs = []
    cursor = db.documents.find({"status": "indexed"}).sort('upload_date', -1)

    async for doc in cursor:
        doc.pop("_id", None)
        docs.append({
            **doc,
            "size": f"{round(doc['size']/1024/1024, 2)} MB"
        })

    return docs



@router.delete("/delete/{doc_id}", dependencies=[Depends(require_admin)])
async def delete_document(doc_id: str, admin=Depends(require_admin)):
    """
    Delete a document safely:
    - Scoped to admin's client_id
    - Removes DB record
    - Removes vector embeddings
    - Removes uploaded PDF file
    """

    client_id = admin["client_id"]
    logger.info(f"Delete request | client={client_id} | doc_id={doc_id}")

    # -------------------------
    # 1. Delete document record
    # -------------------------
    res = await db.documents.find_one_and_delete(
        {"id": doc_id, "client_id": client_id}
    )

    if not res:
        logger.warning("Document not found or access denied")
        raise HTTPException(status_code=404, detail="Document not found")

    # -------------------------
    # 2. Delete embeddings
    # -------------------------
    try:
        chroma_path = Path("app/storage/chroma").resolve()
        collection_name = f"company_{client_id}_kb"

        if chroma_path.exists():
            chroma = Chroma(
                persist_directory=str(chroma_path),
                embedding_function=get_embedding_model(),
                collection_name=collection_name,
            )

            deleted = chroma.delete(where={"doc_id": doc_id})
            logger.info(
                f"Deleted embeddings | client={client_id} | doc_id={doc_id}"
            )
        else:
            logger.warning("Chroma directory not found, skipping vector deletion")

    except Exception as e:
        logger.exception(
            f"Vector deletion failed | client={client_id} | doc_id={doc_id}"
        )

    # -------------------------
    # 3. Delete uploaded file
    # -------------------------
    try:
        pattern = f"{doc_id}_*"
        for file in UPLOAD_DIR.glob(pattern):
            try:
                file.unlink()
                logger.info(f"Removed file {file.name}")
            except Exception as e:
                logger.warning(f"Failed to remove file {file}: {e}")
    except Exception as e:
        logger.exception("File cleanup failed")

    return {
        "success": True,
        "message": "Document deleted successfully",
    }

@router.post('/logout')
async def logout(response: Response, current_user=Depends(get_current_user)):
    response.delete_cookie(
        key="access_token",
        httponly= True,
        samesite="lax",
        secure=False  #in prod true
        )
    return {"success": True, "message" : "Logged out successfully"}