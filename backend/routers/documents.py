import os
import json
import shutil
import uuid
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_

from backend.database import get_db
from backend.config import settings
from backend.models import Document, DocumentChunk, CollectionDocument, User
from backend.schemas import DocumentResponse, DocumentDetailResponse, DocumentRenameRequest
from backend.services.parser import DocumentParser
from backend.services.chunker import DocumentChunker
from backend.services.embedder import EmbeddingService
from backend.services.auth import get_current_active_user, log_audit_event

router = APIRouter(prefix="/api/documents", tags=["Documents"])

def process_document_pipeline(db: Session, doc: Document, file_path: str):
    try:
        # Stage 1: Parsing
        doc.status = "parsing"
        db.commit()

        pages = DocumentParser.parse_file(file_path, doc.file_type)
        doc.page_count = len(pages)
        db.commit()

        # Stage 2: Chunking
        doc.status = "chunking"
        db.commit()

        chunks = DocumentChunker.chunk_pages(
            pages,
            chunk_size=settings.DEFAULT_CHUNK_SIZE,
            chunk_overlap=settings.DEFAULT_CHUNK_OVERLAP
        )

        if not chunks:
            raise ValueError("No text could be extracted from this document.")

        doc.chunk_count = len(chunks)
        db.commit()

        # Stage 3: Indexing & Embeddings
        doc.status = "indexing"
        db.commit()

        # Clear any existing chunks for retry cases
        db.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).delete()

        embedder = EmbeddingService.get_instance()
        texts = [c.text for c in chunks]
        embeddings = embedder.embed_texts(texts)

        for i, c in enumerate(chunks):
            chunk_model = DocumentChunk(
                document_id=doc.id,
                chunk_index=c.chunk_index,
                page_number=c.page_number,
                section_heading=c.section_heading,
                text_content=c.text,
                token_count=c.token_count,
                embedding_json=json.dumps(embeddings[i]) if i < len(embeddings) else None
            )
            db.add(chunk_model)

        doc.status = "completed"
        doc.error_message = None
        db.commit()
    except Exception as e:
        doc.status = "failed"
        doc.error_message = str(e)
        db.commit()
        raise e

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    request: Request,
    file: UploadFile = File(...),
    collection_id: Optional[str] = Form(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Validation
    original_name = file.filename or "unknown_document"
    ext = Path(original_name).suffix.lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed types: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )

    # Save to disk
    safe_filename = f"{uuid.uuid4().hex[:12]}_{original_name}"
    save_path = Path(settings.UPLOAD_FOLDER) / safe_filename

    try:
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    file_size = os.path.getsize(save_path)
    if file_size > settings.MAX_FILE_SIZE_BYTES:
        os.remove(save_path)
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_BYTES // (1024*1024)}MB"
        )

    # Create document record owned by current_user
    doc = Document(
        user_id=current_user.id,
        filename=safe_filename,
        original_name=original_name,
        file_type=ext.lstrip("."),
        file_size=file_size,
        status="uploaded"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Associate with collection if requested and user owns it
    if collection_id:
        coll = db.query(CollectionDocument).filter(
            CollectionDocument.collection_id == collection_id,
            CollectionDocument.document_id == doc.id
        ).first()
        if not coll:
            db.add(CollectionDocument(collection_id=collection_id, document_id=doc.id))
            db.commit()

    # Ingestion pipeline
    try:
        process_document_pipeline(db, doc, str(save_path))
    except Exception:
        pass

    db.refresh(doc)

    log_audit_event(
        db,
        "document.upload",
        user_id=current_user.id,
        user_email=current_user.email,
        resource_type="document",
        resource_id=doc.id,
        status="success" if doc.status == "completed" else "failed",
        details={"name": doc.original_name, "size": doc.file_size}
    )

    return doc

@router.get("", response_model=List[DocumentResponse])
def list_documents(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    file_type: Optional[str] = Query(None),
    sort_by: str = Query("created_at"),
    order: str = Query("desc"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Strict ownership isolation: show user's documents and system seeded documents (where user_id is None)
    q = db.query(Document).filter(or_(Document.user_id == current_user.id, Document.user_id == None))

    if search:
        q = q.filter(Document.original_name.ilike(f"%{search}%"))
    if status and status != "all":
        q = q.filter(Document.status == status)
    if file_type and file_type != "all":
        q = q.filter(Document.file_type == file_type)

    if sort_by == "name":
        q = q.order_by(Document.original_name.desc() if order == "desc" else Document.original_name.asc())
    elif sort_by == "file_size":
        q = q.order_by(Document.file_size.desc() if order == "desc" else Document.file_size.asc())
    elif sort_by == "status":
        q = q.order_by(Document.status.desc() if order == "desc" else Document.status.asc())
    else:
        q = q.order_by(Document.created_at.desc() if order == "desc" else Document.created_at.asc())

    return q.all()

@router.get("/{document_id}", response_model=DocumentDetailResponse)
def get_document(
    document_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Multi-tenant ownership check
    if doc.user_id is not None and doc.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied: You do not have permission to view this document.")

    meta = {}
    if doc.metadata_json:
        try:
            meta = json.loads(doc.metadata_json)
        except Exception:
            pass

    return DocumentDetailResponse(
        id=doc.id,
        filename=doc.filename,
        original_name=doc.original_name,
        file_type=doc.file_type,
        file_size=doc.file_size,
        page_count=doc.page_count,
        chunk_count=doc.chunk_count,
        status=doc.status,
        error_message=doc.error_message,
        created_at=doc.created_at,
        updated_at=doc.updated_at,
        metadata=meta,
        chunks=doc.chunks
    )

@router.put("/{document_id}/rename", response_model=DocumentResponse)
def rename_document(
    document_id: str,
    payload: DocumentRenameRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if doc.user_id is not None and doc.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied: Cannot rename another user's document.")

    doc.original_name = payload.original_name.strip()
    db.commit()
    db.refresh(doc)

    log_audit_event(
        db,
        "document.rename",
        user_id=current_user.id,
        user_email=current_user.email,
        resource_type="document",
        resource_id=doc.id,
        details={"new_name": doc.original_name}
    )
    return doc

@router.get("/{document_id}/preview")
def preview_document_text(
    document_id: str,
    max_chars: int = 15000,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if doc.user_id is not None and doc.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied: Cannot preview this document.")

    file_path = Path(settings.UPLOAD_FOLDER) / doc.filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Source file not found on disk")

    try:
        pages = DocumentParser.parse_file(str(file_path), doc.file_type)
        full_text = "\n\n".join([f"--- Page {p.page_number} ---\n{p.text}" for p in pages])
        return {
            "document_id": doc.id,
            "title": doc.original_name,
            "page_count": len(pages),
            "preview_text": full_text[:max_chars],
            "total_chars": len(full_text)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate preview: {str(e)}")

@router.post("/{document_id}/retry", response_model=DocumentResponse)
def retry_document_processing(
    document_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if doc.user_id is not None and doc.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied: Cannot retry this document.")

    file_path = Path(settings.UPLOAD_FOLDER) / doc.filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Physical document file missing")

    try:
        process_document_pipeline(db, doc, str(file_path))
    except Exception as e:
        pass

    db.refresh(doc)
    return doc

@router.delete("/{document_id}")
def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if doc.user_id is not None and doc.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied: Cannot delete another user's document.")

    file_path = Path(settings.UPLOAD_FOLDER) / doc.filename
    if file_path.exists():
        try:
            os.remove(file_path)
        except Exception:
            pass

    log_audit_event(
        db,
        "document.delete",
        user_id=current_user.id,
        user_email=current_user.email,
        resource_type="document",
        resource_id=doc.id,
        details={"name": doc.original_name}
    )

    db.delete(doc)
    db.commit()
    return {"message": "Document deleted successfully", "id": document_id}
