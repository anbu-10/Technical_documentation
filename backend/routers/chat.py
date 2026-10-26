import json
import time
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_

from backend.database import get_db
from backend.models import Conversation, Message, Citation, QueryLog, Feedback, Document, User
from backend.schemas import (
    ConversationResponse,
    ConversationDetailResponse,
    ConversationCreate,
    ConversationUpdate,
    ChatRequest,
    MessageResponse,
    CitationResponse,
    FeedbackCreate,
    FeedbackResponse
)
from backend.services.retriever import HybridRetriever
from backend.services.llm import LLMService
from backend.services.auth import get_current_active_user, log_audit_event

router = APIRouter(prefix="/api/chat", tags=["Chat & AI Assistant"])

@router.get("/conversations", response_model=List[ConversationResponse])
def list_conversations(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    convs = (
        db.query(Conversation)
        .filter(or_(Conversation.user_id == current_user.id, Conversation.user_id == None))
        .order_by(Conversation.updated_at.desc())
        .all()
    )
    results = []
    for c in convs:
        doc_ids = []
        if c.document_ids_json:
            try:
                doc_ids = json.loads(c.document_ids_json)
            except Exception:
                pass
        msg_count = len(c.messages)
        results.append(ConversationResponse(
            id=c.id,
            title=c.title,
            collection_id=c.collection_id,
            document_ids=doc_ids,
            message_count=msg_count,
            created_at=c.created_at,
            updated_at=c.updated_at
        ))
    return results

@router.post("/conversations", response_model=ConversationResponse)
def create_conversation(
    payload: ConversationCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    conv = Conversation(
        user_id=current_user.id,
        title=payload.title or "New Technical Discussion",
        collection_id=payload.collection_id,
        document_ids_json=json.dumps(payload.document_ids or [])
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return ConversationResponse(
        id=conv.id,
        title=conv.title,
        collection_id=conv.collection_id,
        document_ids=payload.document_ids or [],
        message_count=0,
        created_at=conv.created_at,
        updated_at=conv.updated_at
    )

@router.get("/conversations/{conversation_id}", response_model=ConversationDetailResponse)
def get_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if conv.user_id is not None and conv.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied: Cannot access another user's conversation.")

    doc_ids = []
    if conv.document_ids_json:
        try:
            doc_ids = json.loads(conv.document_ids_json)
        except Exception:
            pass

    messages_out = []
    for m in conv.messages:
        cits = [
            CitationResponse(
                id=c.id,
                chunk_id=c.chunk_id,
                document_id=c.document_id,
                document_title=c.document_title,
                page_number=c.page_number,
                section_heading=c.section_heading or "",
                excerpt=c.excerpt,
                score=c.score,
                rank_order=c.rank_order
            )
            for c in m.citations
        ]
        fb_val = m.feedback.rating if m.feedback else None
        messages_out.append(MessageResponse(
            id=m.id,
            role=m.role,
            content=m.content,
            model_used=m.model_used,
            latency_ms=m.latency_ms,
            created_at=m.created_at,
            citations=cits,
            feedback=fb_val
        ))

    return ConversationDetailResponse(
        id=conv.id,
        title=conv.title,
        collection_id=conv.collection_id,
        document_ids=doc_ids,
        message_count=len(messages_out),
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        messages=messages_out
    )

@router.put("/conversations/{conversation_id}", response_model=ConversationResponse)
def update_conversation(
    conversation_id: str,
    payload: ConversationUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if conv.user_id is not None and conv.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied: Cannot edit another user's conversation.")

    if payload.title is not None:
        conv.title = payload.title.strip()
    if payload.document_ids is not None:
        conv.document_ids_json = json.dumps(payload.document_ids)

    conv.updated_at = time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime())
    db.commit()
    db.refresh(conv)

    doc_ids = []
    if conv.document_ids_json:
        try:
            doc_ids = json.loads(conv.document_ids_json)
        except Exception:
            pass

    return ConversationResponse(
        id=conv.id,
        title=conv.title,
        collection_id=conv.collection_id,
        document_ids=doc_ids,
        message_count=len(conv.messages),
        created_at=conv.created_at,
        updated_at=conv.updated_at
    )

@router.delete("/conversations/{conversation_id}")
def delete_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if conv.user_id is not None and conv.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied: Cannot delete another user's conversation.")

    db.delete(conv)
    db.commit()
    return {"message": "Conversation deleted successfully", "id": conversation_id}

@router.post("/ask", response_model=MessageResponse)
async def ask_question(
    payload: ChatRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # 1. Resolve or create conversation
    conv = None
    if payload.conversation_id:
        conv = db.query(Conversation).filter(Conversation.id == payload.conversation_id).first()
        if conv and conv.user_id is not None and conv.user_id != current_user.id and current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Access denied to this conversation.")

    if not conv:
        title_snippet = " ".join(payload.question.split()[:6])
        if len(payload.question.split()) > 6:
            title_snippet += "..."
        conv = Conversation(
            user_id=current_user.id,
            title=title_snippet,
            collection_id=payload.collection_id,
            document_ids_json=json.dumps(payload.document_ids or [])
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)

    # 2. Record User Message
    user_msg = Message(
        conversation_id=conv.id,
        role="user",
        content=payload.question,
        model_used="client"
    )
    db.add(user_msg)
    db.commit()

    active_doc_ids = payload.document_ids
    if not active_doc_ids and conv.document_ids_json:
        try:
            active_doc_ids = json.loads(conv.document_ids_json)
        except Exception:
            pass

    # 3. Hybrid Retrieval with user_id multi-tenant scoping
    retriever = HybridRetriever(db)
    retrieved_chunks = retriever.search(
        query=payload.question,
        mode="hybrid",
        collection_id=payload.collection_id,
        document_ids=active_doc_ids,
        user_id=current_user.id,
        limit=payload.top_k or 5,
        enable_reranker=True
    )

    # 4. Grounded Answer Generation
    answer_text, citations_data, model_used, latency_ms = await LLMService.generate_grounded_answer(
        question=payload.question,
        retrieved_chunks=retrieved_chunks,
        preferred_provider=payload.provider or current_user.preferred_provider
    )

    # 5. Record Assistant Message
    assistant_msg = Message(
        conversation_id=conv.id,
        role="assistant",
        content=answer_text,
        model_used=model_used,
        latency_ms=latency_ms
    )
    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)

    # 6. Save Citations
    citations_out = []
    for cit in citations_data:
        cit_record = Citation(
            message_id=assistant_msg.id,
            chunk_id=cit["chunk_id"],
            document_id=cit["document_id"],
            document_title=cit["document_title"],
            page_number=cit["page_number"],
            section_heading=cit["section_heading"],
            excerpt=cit["excerpt"],
            score=cit["score"],
            rank_order=cit["rank_order"]
        )
        db.add(cit_record)
        db.commit()
        db.refresh(cit_record)
        citations_out.append(CitationResponse(
            id=cit_record.id,
            chunk_id=cit_record.chunk_id,
            document_id=cit_record.document_id,
            document_title=cit_record.document_title,
            page_number=cit_record.page_number,
            section_heading=cit_record.section_heading or "",
            excerpt=cit_record.excerpt,
            score=cit_record.score,
            rank_order=cit_record.rank_order
        ))

    # 7. Query Log
    top_score = retrieved_chunks[0].final_score if retrieved_chunks else 0.0
    was_answered = len(citations_data) > 0
    query_log = QueryLog(
        user_id=current_user.id,
        query_text=payload.question,
        search_mode="hybrid",
        retrieved_count=len(retrieved_chunks),
        latency_ms=latency_ms,
        provider_used=model_used,
        was_answered=was_answered,
        top_score=top_score
    )
    db.add(query_log)
    db.commit()

    return MessageResponse(
        id=assistant_msg.id,
        role=assistant_msg.role,
        content=assistant_msg.content,
        model_used=assistant_msg.model_used,
        latency_ms=assistant_msg.latency_ms,
        created_at=assistant_msg.created_at,
        citations=citations_out,
        feedback=None
    )

@router.post("/messages/{message_id}/feedback", response_model=FeedbackResponse)
def submit_message_feedback(
    message_id: str,
    payload: FeedbackCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    msg = db.query(Message).filter(Message.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    fb = db.query(Feedback).filter(Feedback.message_id == message_id).first()
    if fb:
        fb.rating = payload.rating
        fb.comment = payload.comment
    else:
        fb = Feedback(
            message_id=message_id,
            rating=payload.rating,
            comment=payload.comment
        )
        db.add(fb)

    db.commit()
    db.refresh(fb)
    return FeedbackResponse(
        id=fb.id,
        message_id=fb.message_id,
        rating=fb.rating,
        comment=fb.comment,
        created_at=fb.created_at
    )
