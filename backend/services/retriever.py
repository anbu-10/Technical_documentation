import re
import json
import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.models import Document, DocumentChunk, CollectionDocument
from backend.services.embedder import EmbeddingService

logger = logging.getLogger(__name__)

class ScoredChunk:
    def __init__(
        self,
        chunk: DocumentChunk,
        document: Document,
        vector_score: float = 0.0,
        bm25_score: float = 0.0,
        final_score: float = 0.0,
        method: str = "hybrid",
        highlighted_text: str = ""
    ):
        self.chunk = chunk
        self.document = document
        self.vector_score = vector_score
        self.bm25_score = bm25_score
        self.final_score = final_score
        self.method = method
        self.highlighted_text = highlighted_text

class HybridRetriever:
    def __init__(self, db: Session):
        self.db = db
        self.embedder = EmbeddingService.get_instance()

    def search(
        self,
        query: str,
        mode: str = "hybrid",  # "hybrid", "vector", "bm25"
        collection_id: Optional[str] = None,
        document_ids: Optional[List[str]] = None,
        user_id: Optional[str] = None,
        limit: int = 5,
        dense_weight: float = 0.65,
        sparse_weight: float = 0.35,
        enable_reranker: bool = True
    ) -> List[ScoredChunk]:
        query = query.strip()
        if not query:
            return []

        # Build base query for chunks
        query_filter = self.db.query(DocumentChunk).join(Document, DocumentChunk.document_id == Document.id)
        
        # Only search completed documents
        query_filter = query_filter.filter(Document.status == "completed")

        # Multi-tenant user isolation
        if user_id:
            from sqlalchemy import or_
            query_filter = query_filter.filter(or_(Document.user_id == user_id, Document.user_id == None))

        if document_ids:
            query_filter = query_filter.filter(Document.id.in_(document_ids))
        elif collection_id:
            doc_ids_in_coll = [
                row[0] for row in self.db.query(CollectionDocument.document_id)
                .filter(CollectionDocument.collection_id == collection_id).all()
            ]
            query_filter = query_filter.filter(Document.id.in_(doc_ids_in_coll))

        all_chunks = query_filter.all()
        if not all_chunks:
            return []

        # Vector Search
        vector_scores: Dict[str, float] = {}
        if mode in ["hybrid", "vector"]:
            query_emb = self.embedder.embed_query(query)
            for c in all_chunks:
                if c.embedding_json:
                    try:
                        emb = json.loads(c.embedding_json)
                        score = EmbeddingService.cosine_similarity(query_emb, emb)
                        vector_scores[c.id] = score
                    except Exception:
                        vector_scores[c.id] = 0.0
                else:
                    vector_scores[c.id] = 0.0

        # BM25 Search
        bm25_scores: Dict[str, float] = {}
        if mode in ["hybrid", "bm25"]:
            bm25_scores = self._compute_bm25(query, all_chunks)

        # Merge & Fuse
        scored_results: List[ScoredChunk] = []
        token_regex = re.compile(r'\b(' + '|'.join(re.escape(t) for t in query.split() if len(t) > 2) + r')\b', re.IGNORECASE) if len(query.split()) > 0 else None

        for c in all_chunks:
            v_score = vector_scores.get(c.id, 0.0)
            b_score = bm25_scores.get(c.id, 0.0)

            if mode == "vector":
                final_score = v_score
                method = "vector (dense)"
            elif mode == "bm25":
                final_score = b_score
                method = "BM25 (keyword)"
            else:
                # Hybrid fusion: normalized combination
                final_score = (dense_weight * v_score) + (sparse_weight * b_score)
                method = "hybrid (dense + BM25)"

            # Highlight keywords
            highlighted = c.text_content
            if token_regex:
                try:
                    highlighted = token_regex.sub(r'<mark class="bg-amber-200 dark:bg-amber-900/60 dark:text-amber-200 px-0.5 rounded">\1</mark>', c.text_content)
                except Exception:
                    pass

            scored_results.append(ScoredChunk(
                chunk=c,
                document=c.document,
                vector_score=round(v_score, 4),
                bm25_score=round(b_score, 4),
                final_score=round(final_score, 4),
                method=method,
                highlighted_text=highlighted
            ))

        # Sort by final score descending
        scored_results.sort(key=lambda x: x.final_score, reverse=True)

        # Optional Reranking
        if enable_reranker and len(scored_results) > 1:
            scored_results = self._rerank(query, scored_results[:limit * 2])

        return scored_results[:limit]

    def _compute_bm25(self, query: str, chunks: List[DocumentChunk]) -> Dict[str, float]:
        query_terms = [t.lower() for t in re.findall(r'\w+', query) if len(t) > 1]
        if not query_terms:
            return {c.id: 0.0 for c in chunks}

        corpus = []
        for c in chunks:
            tokens = [t.lower() for t in re.findall(r'\w+', c.text_content) if len(t) > 1]
            corpus.append(tokens)

        try:
            from rank_bm25 import BM25Okapi
            bm25 = BM25Okapi(corpus)
            raw_scores = bm25.get_scores(query_terms)
            max_s = max(raw_scores) if len(raw_scores) > 0 and max(raw_scores) > 0 else 1.0
            return {chunks[i].id: float(raw_scores[i] / max_s) for i in range(len(chunks))}
        except Exception as e:
            logger.warning(f"BM25 fallback calculation: {e}")
            # Fallback exact word frequency overlap
            scores = {}
            for c in chunks:
                words = set(re.findall(r'\w+', c.text_content.lower()))
                overlap = len(set(query_terms).intersection(words))
                scores[c.id] = min(1.0, overlap / max(1, len(query_terms)))
            return scores

    def _rerank(self, query: str, candidates: List[ScoredChunk]) -> List[ScoredChunk]:
        """
        Structure-aware reranking: boosts candidates that match the exact phrase,
        appear in headings, or have high term co-occurrences.
        """
        query_lower = query.lower()
        for cand in candidates:
            text_lower = cand.chunk.text_content.lower()
            heading_lower = (cand.chunk.section_heading or "").lower()
            boost = 0.0

            # Exact phrase match in body
            if query_lower in text_lower:
                boost += 0.15

            # Heading contains query terms
            if any(term in heading_lower for term in query_lower.split() if len(term) > 3):
                boost += 0.10

            cand.final_score = min(1.0, cand.final_score + boost)

        candidates.sort(key=lambda x: x.final_score, reverse=True)
        return candidates
