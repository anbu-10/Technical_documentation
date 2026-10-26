from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_

from backend.database import get_db
from backend.models import Collection, CollectionDocument, Document, User
from backend.schemas import CollectionCreate, CollectionUpdate, CollectionResponse, CollectionAddDocRequest, DocumentResponse
from backend.services.auth import get_current_active_user, log_audit_event

router = APIRouter(prefix="/api/collections", tags=["Collections"])

@router.get("", response_model=List[CollectionResponse])
def list_collections(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    collections = (
        db.query(Collection)
        .filter(or_(Collection.user_id == current_user.id, Collection.user_id == None))
        .order_by(Collection.created_at.desc())
        .all()
    )
    results = []
    for c in collections:
        doc_count = db.query(CollectionDocument).filter(CollectionDocument.collection_id == c.id).count()
        results.append(CollectionResponse(
            id=c.id,
            name=c.name,
            description=c.description or "",
            color=c.color or "brand",
            document_count=doc_count,
            created_at=c.created_at
        ))
    return results

@router.post("", response_model=CollectionResponse)
def create_collection(
    payload: CollectionCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    coll = Collection(
        user_id=current_user.id,
        name=payload.name.strip(),
        description=payload.description or "",
        color=payload.color or "brand"
    )
    db.add(coll)
    db.commit()
    db.refresh(coll)

    log_audit_event(
        db,
        "collection.create",
        user_id=current_user.id,
        user_email=current_user.email,
        resource_type="collection",
        resource_id=coll.id,
        details={"name": coll.name}
    )

    return CollectionResponse(
        id=coll.id,
        name=coll.name,
        description=coll.description,
        color=coll.color,
        document_count=0,
        created_at=coll.created_at
    )

@router.put("/{collection_id}", response_model=CollectionResponse)
def update_collection(
    collection_id: str,
    payload: CollectionUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    coll = db.query(Collection).filter(Collection.id == collection_id).first()
    if not coll:
        raise HTTPException(status_code=404, detail="Collection not found")

    if coll.user_id is not None and coll.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied: Cannot edit another user's collection.")

    if payload.name is not None:
        coll.name = payload.name.strip()
    if payload.description is not None:
        coll.description = payload.description
    if payload.color is not None:
        coll.color = payload.color

    db.commit()
    db.refresh(coll)

    doc_count = db.query(CollectionDocument).filter(CollectionDocument.collection_id == coll.id).count()
    return CollectionResponse(
        id=coll.id,
        name=coll.name,
        description=coll.description,
        color=coll.color,
        document_count=doc_count,
        created_at=coll.created_at
    )

@router.delete("/{collection_id}")
def delete_collection(
    collection_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    coll = db.query(Collection).filter(Collection.id == collection_id).first()
    if not coll:
        raise HTTPException(status_code=404, detail="Collection not found")

    if coll.user_id is not None and coll.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied: Cannot delete another user's collection.")

    db.delete(coll)
    db.commit()

    log_audit_event(
        db,
        "collection.delete",
        user_id=current_user.id,
        user_email=current_user.email,
        resource_type="collection",
        resource_id=collection_id
    )

    return {"message": "Collection deleted successfully", "id": collection_id}

@router.get("/{collection_id}/documents", response_model=List[DocumentResponse])
def get_collection_documents(
    collection_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    coll = db.query(Collection).filter(Collection.id == collection_id).first()
    if not coll:
        raise HTTPException(status_code=404, detail="Collection not found")

    if coll.user_id is not None and coll.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied to this collection.")

    docs = (
        db.query(Document)
        .join(CollectionDocument, Document.id == CollectionDocument.document_id)
        .filter(CollectionDocument.collection_id == collection_id)
        .all()
    )
    return docs

@router.post("/{collection_id}/documents")
def add_document_to_collection(
    collection_id: str,
    payload: CollectionAddDocRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    coll = db.query(Collection).filter(Collection.id == collection_id).first()
    if not coll:
        raise HTTPException(status_code=404, detail="Collection not found")

    if coll.user_id is not None and coll.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied: Cannot add document to another user's collection.")

    doc = db.query(Document).filter(Document.id == payload.document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    exists = db.query(CollectionDocument).filter(
        CollectionDocument.collection_id == collection_id,
        CollectionDocument.document_id == payload.document_id
    ).first()

    if not exists:
        db.add(CollectionDocument(collection_id=collection_id, document_id=payload.document_id))
        db.commit()

    return {"message": "Document added to collection"}

@router.delete("/{collection_id}/documents/{document_id}")
def remove_document_from_collection(
    collection_id: str,
    document_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    coll = db.query(Collection).filter(Collection.id == collection_id).first()
    if not coll:
        raise HTTPException(status_code=404, detail="Collection not found")

    if coll.user_id is not None and coll.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied.")

    item = db.query(CollectionDocument).filter(
        CollectionDocument.collection_id == collection_id,
        CollectionDocument.document_id == document_id
    ).first()

    if item:
        db.delete(item)
        db.commit()

    return {"message": "Document removed from collection"}
