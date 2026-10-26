from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import BenchmarkItem
from backend.schemas import EvaluationReportResponse
from backend.services.evaluator import RetrievalEvaluator

router = APIRouter(prefix="/api/evaluation", tags=["Evaluation & Benchmarks"])

@router.get("/benchmarks")
def list_benchmarks(db: Session = Depends(get_db)):
    RetrievalEvaluator.seed_default_benchmarks(db)
    items = db.query(BenchmarkItem).all()
    return items

@router.post("/run", response_model=EvaluationReportResponse)
def run_evaluation(
    pipeline_mode: str = Query("hybrid", description="Pipeline mode: hybrid, vector, or bm25"),
    db: Session = Depends(get_db)
):
    result = RetrievalEvaluator.run_benchmark(db, pipeline_mode=pipeline_mode)
    return result
