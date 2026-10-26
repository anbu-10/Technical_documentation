from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.database import get_db
from backend.models import User, Document, DocumentChunk, Conversation, QueryLog, AuditEvent
from backend.schemas import (
    AdminOverviewResponse,
    AdminUserUpdate,
    UserDetailResponse,
    DocumentResponse,
    AuditEventResponse
)
from backend.services.auth import require_admin, log_audit_event
from backend.routers.documents import process_document_pipeline
from pathlib import Path
from backend.config import settings

router = APIRouter(prefix="/api/admin", tags=["Admin & RBAC"])

@router.get("/overview", response_model=AdminOverviewResponse)
def get_admin_overview(
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    admin_users = db.query(User).filter(User.role == "admin").count()

    total_docs = db.query(Document).count()
    completed_docs = db.query(Document).filter(Document.status == "completed").count()
    failed_docs = db.query(Document).filter(Document.status == "failed").count()

    total_chunks = db.query(DocumentChunk).count()
    total_conversations = db.query(Conversation).count()
    total_queries = db.query(QueryLog).count()
    total_audit_events = db.query(AuditEvent).count()

    avg_lat = db.query(func.avg(QueryLog.latency_ms)).scalar() or 0.0

    return AdminOverviewResponse(
        total_users=total_users,
        active_users=active_users,
        admin_users=admin_users,
        total_documents=total_docs,
        completed_documents=completed_docs,
        failed_documents=failed_docs,
        total_chunks=total_chunks,
        total_conversations=total_conversations,
        total_queries=total_queries,
        total_audit_events=total_audit_events,
        average_latency_ms=round(avg_lat, 2)
    )

@router.get("/users")
def list_admin_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=100),
    search: Optional[str] = Query(None),
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    q = db.query(User)
    if search:
        q = q.filter((User.email.ilike(f"%{search}%")) | (User.full_name.ilike(f"%{search}%")))

    users = q.order_by(User.created_at.desc()).offset(skip).limit(limit).all()
    results = []
    for u in users:
        doc_count = db.query(Document).filter(Document.user_id == u.id).count()
        results.append({
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "is_active": u.is_active,
            "is_verified": u.is_verified,
            "document_count": doc_count,
            "created_at": u.created_at.isoformat() if u.created_at else None
        })
    return results

@router.put("/users/{user_id}/status")
def update_user_status(
    user_id: str,
    payload: AdminUserUpdate,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    if user_id == admin_user.id and payload.is_active is False:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own administrative account.")

    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.is_active is not None:
        target_user.is_active = payload.is_active

    if payload.role is not None:
        if payload.role not in ["user", "admin"]:
            raise HTTPException(status_code=400, detail="Role must be 'user' or 'admin'.")
        target_user.role = payload.role

    db.commit()
    log_audit_event(
        db,
        "admin.update_user",
        user_id=admin_user.id,
        user_email=admin_user.email,
        resource_type="user",
        resource_id=target_user.id,
        details={"target_email": target_user.email, "is_active": target_user.is_active, "role": target_user.role}
    )

    return {"message": "User updated successfully", "user_id": target_user.id, "is_active": target_user.is_active, "role": target_user.role}

@router.get("/documents")
def list_admin_documents(
    status_filter: Optional[str] = Query(None),
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    q = db.query(Document)
    if status_filter and status_filter != "all":
        q = q.filter(Document.status == status_filter)

    docs = q.order_by(Document.created_at.desc()).limit(100).all()
    results = []
    for d in docs:
        owner = db.query(User).filter(User.id == d.user_id).first() if d.user_id else None
        results.append({
            "id": d.id,
            "original_name": d.original_name,
            "file_type": d.file_type,
            "file_size": d.file_size,
            "page_count": d.page_count,
            "chunk_count": d.chunk_count,
            "status": d.status,
            "error_message": d.error_message,
            "owner_email": owner.email if owner else "System / Seeded",
            "created_at": d.created_at.isoformat() if d.created_at else None
        })
    return results

@router.post("/documents/{doc_id}/retry")
def admin_retry_document(
    doc_id: str,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    file_path = Path(settings.UPLOAD_FOLDER) / doc.filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Source file missing from disk")

    try:
        process_document_pipeline(db, doc, str(file_path))
    except Exception as e:
        pass

    db.refresh(doc)
    log_audit_event(
        db,
        "admin.retry_document",
        user_id=admin_user.id,
        user_email=admin_user.email,
        resource_type="document",
        resource_id=doc.id,
        status="success" if doc.status == "completed" else "failed"
    )
    return {"message": "Document retry finished", "status": doc.status, "id": doc.id}

@router.get("/audit-logs")
def list_audit_logs(
    limit: int = Query(50, le=200),
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    events = db.query(AuditEvent).order_by(AuditEvent.created_at.desc()).limit(limit).all()
    results = []
    for e in events:
        det = {}
        if e.details_json:
            try:
                det = json.loads(e.details_json)
            except Exception:
                pass
        results.append({
            "id": e.id,
            "action": e.action,
            "user_id": e.user_id,
            "user_email": e.user_email or "anonymous",
            "resource_type": e.resource_type,
            "resource_id": e.resource_id,
            "ip_address": e.ip_address,
            "status": e.status,
            "details": det,
            "created_at": e.created_at.isoformat() if e.created_at else None
        })
    return results
