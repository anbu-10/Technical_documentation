from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from backend.database import get_db
from backend.models import Document, DocumentChunk, Message, QueryLog, Feedback, Conversation, User
from backend.schemas import AnalyticsSummaryResponse, DocumentResponse, ConversationResponse
from backend.services.auth import get_current_active_user

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("", response_model=AnalyticsSummaryResponse)
def get_analytics(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Filter documents by user (or system seeded docs)
    doc_filter = or_(Document.user_id == current_user.id, Document.user_id == None)
    total_docs = db.query(Document).filter(doc_filter).count()
    completed_docs = db.query(Document).filter(doc_filter, Document.status == "completed").count()
    failed_docs = db.query(Document).filter(doc_filter, Document.status == "failed").count()
    
    total_chunks = (
        db.query(DocumentChunk)
        .join(Document, DocumentChunk.document_id == Document.id)
        .filter(doc_filter)
        .count()
    )

    # Questions asked by this user
    user_conv_ids = [c.id for c in db.query(Conversation.id).filter(or_(Conversation.user_id == current_user.id, Conversation.user_id == None)).all()]
    total_questions = db.query(Message).filter(Message.conversation_id.in_(user_conv_ids), Message.role == "user").count() if user_conv_ids else 0

    # User's query latency
    avg_lat = db.query(func.avg(QueryLog.latency_ms)).filter(QueryLog.user_id == current_user.id).scalar() or 0.0

    # Feedback counts for user's conversations
    user_msg_ids = [m.id for m in db.query(Message.id).filter(Message.conversation_id.in_(user_conv_ids)).all()] if user_conv_ids else []
    pos_fb = db.query(Feedback).filter(Feedback.message_id.in_(user_msg_ids), Feedback.rating > 0).count() if user_msg_ids else 0
    neg_fb = db.query(Feedback).filter(Feedback.message_id.in_(user_msg_ids), Feedback.rating < 0).count() if user_msg_ids else 0

    # Search success rate for user's queries
    user_queries = db.query(QueryLog).filter(QueryLog.user_id == current_user.id)
    total_queries = user_queries.count()
    successful_queries = user_queries.filter(QueryLog.retrieved_count > 0).count()
    success_rate = (successful_queries / total_queries * 100.0) if total_queries > 0 else 100.0

    # Recent documents
    recent_docs_records = db.query(Document).filter(doc_filter).order_by(Document.created_at.desc()).limit(5).all()
    recent_docs = [
        DocumentResponse(
            id=d.id,
            filename=d.filename,
            original_name=d.original_name,
            file_type=d.file_type,
            file_size=d.file_size,
            page_count=d.page_count,
            chunk_count=d.chunk_count,
            status=d.status,
            error_message=d.error_message,
            created_at=d.created_at,
            updated_at=d.updated_at
        )
        for d in recent_docs_records
    ]

    # Recent conversations
    recent_convs_records = (
        db.query(Conversation)
        .filter(or_(Conversation.user_id == current_user.id, Conversation.user_id == None))
        .order_by(Conversation.updated_at.desc())
        .limit(5)
        .all()
    )
    recent_convs = [
        ConversationResponse(
            id=c.id,
            title=c.title,
            collection_id=c.collection_id,
            document_ids=[],
            message_count=len(c.messages),
            created_at=c.created_at,
            updated_at=c.updated_at
        )
        for c in recent_convs_records
    ]

    processing_chart = [
        {"name": "Completed", "value": completed_docs, "color": "#10b981"},
        {"name": "Parsing/Chunking", "value": db.query(Document).filter(doc_filter, Document.status.in_(["parsing", "chunking", "indexing"])).count(), "color": "#3b82f6"},
        {"name": "Failed", "value": failed_docs, "color": "#ef4444"},
    ]

    hybrid_count = user_queries.filter(QueryLog.search_mode == "hybrid").count()
    vector_count = user_queries.filter(QueryLog.search_mode == "vector").count()
    bm25_count = user_queries.filter(QueryLog.search_mode == "bm25").count()
    
    query_chart = [
        {"mode": "Hybrid (Dense+BM25)", "queries": max(hybrid_count, 1 if total_queries == 0 else 0)},
        {"mode": "Vector Similarity", "queries": vector_count},
        {"mode": "BM25 Keyword", "queries": bm25_count},
    ]

    return AnalyticsSummaryResponse(
        total_documents=total_docs,
        processed_documents=completed_docs,
        failed_documents=failed_docs,
        total_chunks=total_chunks,
        total_questions=total_questions,
        average_latency_ms=round(avg_lat, 2),
        positive_feedback_count=pos_fb,
        negative_feedback_count=neg_fb,
        search_success_rate=round(success_rate, 1),
        recent_documents=recent_docs,
        recent_conversations=recent_convs,
        processing_chart=processing_chart,
        query_chart=query_chart
    )
