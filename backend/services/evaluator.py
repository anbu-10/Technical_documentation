import time
import math
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from backend.models import BenchmarkItem, Document
from backend.services.retriever import HybridRetriever

class RetrievalEvaluator:
    @staticmethod
    def seed_default_benchmarks(db: Session):
        count = db.query(BenchmarkItem).count()
        if count == 0:
            defaults = [
                BenchmarkItem(
                    query="What are the system architecture components and pipeline stages?",
                    category="architecture",
                    ground_truth_answer="Ingestion, parsing, chunking, embedding, vector retrieval, and reranking.",
                    expected_keywords="architecture,ingestion,pipeline,embedding,components"
                ),
                BenchmarkItem(
                    query="How to configure database connection and environment settings?",
                    category="configuration",
                    ground_truth_answer="Set DATABASE_URL and environment variables in .env file.",
                    expected_keywords="database,configuration,environment,settings,url"
                ),
                BenchmarkItem(
                    query="What are the API endpoints for document upload and retrieval?",
                    category="api",
                    ground_truth_answer="POST /api/documents/upload and POST /api/search.",
                    expected_keywords="api,endpoints,upload,documents,search"
                ),
                BenchmarkItem(
                    query="Explain hybrid search combining BM25 keyword matching with dense vectors",
                    category="retrieval",
                    ground_truth_answer="Hybrid search combines BM25 keyword scores with dense vector cosine similarity.",
                    expected_keywords="hybrid,bm25,vector,similarity,search,dense"
                ),
                BenchmarkItem(
                    query="What are the troubleshooting steps and common error handling mechanisms?",
                    category="troubleshooting",
                    ground_truth_answer="Check provider connectivity and document parsing error logs.",
                    expected_keywords="troubleshooting,errors,handling,logs,failure"
                ),
            ]
            for item in defaults:
                db.add(item)
            db.commit()

    @staticmethod
    def run_benchmark(db: Session, pipeline_mode: str = "hybrid") -> Dict[str, Any]:
        RetrievalEvaluator.seed_default_benchmarks(db)
        benchmarks = db.query(BenchmarkItem).all()
        retriever = HybridRetriever(db)

        detailed_results = []
        reciprocal_ranks = []
        ndcg_scores = []
        recall_at_3 = []
        recall_at_5 = []
        precision_at_1 = []
        latencies = []
        hits = []

        for b in benchmarks:
            start_t = time.time()
            scored_chunks = retriever.search(
                query=b.query,
                mode=pipeline_mode,
                limit=5,
                enable_reranker=True
            )
            lat_ms = (time.time() - start_t) * 1000
            latencies.append(lat_ms)

            # Evaluate relevance against expected keywords
            expected_keys = [k.strip().lower() for k in (b.expected_keywords or "").split(",") if k.strip()]
            
            ranks = []
            retrieved_titles = []
            preview_snippet = None

            for idx, sc in enumerate(scored_chunks, 1):
                retrieved_titles.append(f"{sc.document.original_name} (p.{sc.chunk.page_number})")
                text_l = sc.chunk.text_content.lower()
                
                # Check keyword match
                match_count = sum(1 for k in expected_keys if k in text_l)
                is_relevant = match_count >= 1 if expected_keys else (sc.final_score > 0.4)
                
                if is_relevant:
                    ranks.append(idx)
                    if preview_snippet is None:
                        preview_snippet = sc.chunk.text_content[:150] + "..."

            # Reciprocal Rank: 1 / rank of first relevant doc
            rr = 1.0 / ranks[0] if ranks else 0.0
            reciprocal_ranks.append(rr)

            # Precision@1
            p1 = 1.0 if (ranks and ranks[0] == 1) else 0.0
            precision_at_1.append(p1)

            # Recall@3 & Recall@5
            r3 = 1.0 if any(r <= 3 for r in ranks) else 0.0
            r5 = 1.0 if any(r <= 5 for r in ranks) else 0.0
            recall_at_3.append(r3)
            recall_at_5.append(r5)

            # Hit
            hit = len(ranks) > 0
            hits.append(hit)

            # Simple NDCG@5
            dcg = sum((1.0 / math.log2(r + 1)) for r in ranks if r <= 5)
            idcg = (1.0 / math.log2(2)) if ranks else 1.0
            ndcg = min(1.0, dcg / idcg) if idcg > 0 else 0.0
            ndcg_scores.append(ndcg)

            detailed_results.append({
                "query": b.query,
                "category": b.category,
                "retrieved_top_docs": retrieved_titles,
                "hit": hit,
                "reciprocal_rank": round(rr, 3),
                "ndcg": round(ndcg, 3),
                "latency_ms": round(lat_ms, 2),
                "answer_preview": preview_snippet or "No high-confidence passage identified"
            })

        n = len(benchmarks) if benchmarks else 1
        metrics = {
            "total_benchmark_queries": len(benchmarks),
            "mrr": round(sum(reciprocal_ranks) / n, 4),
            "ndcg_at_5": round(sum(ndcg_scores) / n, 4),
            "recall_at_3": round(sum(recall_at_3) / n, 4),
            "recall_at_5": round(sum(recall_at_5) / n, 4),
            "precision_at_1": round(sum(precision_at_1) / n, 4),
            "average_latency_ms": round(sum(latencies) / n, 2),
            "retrieval_hit_rate": round(sum(1 for h in hits if h) / n, 4)
        }

        return {
            "pipeline_mode": pipeline_mode,
            "metrics": metrics,
            "detailed_results": detailed_results,
            "evaluated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }
