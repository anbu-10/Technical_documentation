import time
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.schemas import SearchRequest, SearchResponse, SearchResultItem
from backend.services.retriever import HybridRetriever
from backend.models import QueryLog, User
from backend.services.auth import get_current_active_user

router = APIRouter(prefix="/api/search", tags=["Search"])

@router.post("", response_model=SearchResponse)
def execute_search(
    payload: SearchRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    start_time = time.time()
    retriever = HybridRetriever(db)

    scored_chunks = retriever.search(
        query=payload.query,
        mode=payload.mode,
        collection_id=payload.collection_id,
        document_ids=payload.document_ids,
        user_id=current_user.id,
        limit=payload.limit or 10,
        enable_reranker=True
    )

    latency_ms = round((time.time() - start_time) * 1000, 2)

    results = []
    for sc in scored_chunks:
        results.append(SearchResultItem(
            chunk_id=sc.chunk.id,
            document_id=sc.document.id,
            document_title=sc.document.original_name,
            page_number=sc.chunk.page_number,
            section_heading=sc.chunk.section_heading or "Document Section",
            text_content=sc.chunk.text_content,
            highlighted_text=sc.highlighted_text,
            score=sc.final_score,
            retrieval_method=sc.method,
            vector_score=sc.vector_score,
            bm25_score=sc.bm25_score
        ))

    # Log search query
    top_s = results[0].score if results else 0.0
    q_log = QueryLog(
        user_id=current_user.id,
        query_text=payload.query,
        search_mode=payload.mode,
        retrieved_count=len(results),
        latency_ms=latency_ms,
        provider_used="retriever",
        was_answered=len(results) > 0,
        top_score=top_s
    )
    db.add(q_log)
    db.commit()

    return SearchResponse(
        query=payload.query,
        mode=payload.mode,
        total_results=len(results),
        latency_ms=latency_ms,
        results=results
    )
