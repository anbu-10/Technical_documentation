from fastapi import APIRouter
from backend.config import settings
from backend.schemas import SettingsResponse, SettingsUpdateRequest, ProviderInfo
from backend.services.llm import LLMService

router = APIRouter(prefix="/api/settings", tags=["Settings"])

@router.get("", response_model=SettingsResponse)
async def get_settings():
    providers_raw = await LLMService.check_provider_status()
    providers = [ProviderInfo(**p) for p in providers_raw]

    db_type = "PostgreSQL (pgvector)" if "postgresql" in settings.DATABASE_URL else "SQLite (Local Zero-Config)"

    return SettingsResponse(
        app_name=settings.APP_NAME,
        app_version=settings.APP_VERSION,
        active_provider=settings.DEFAULT_PROVIDER,
        providers=providers,
        embedding_model=settings.EMBEDDING_MODEL_NAME,
        chunk_size=settings.DEFAULT_CHUNK_SIZE,
        chunk_overlap=settings.DEFAULT_CHUNK_OVERLAP,
        top_k=settings.DEFAULT_TOP_K,
        dense_weight=settings.DENSE_WEIGHT,
        sparse_weight=settings.SPARSE_WEIGHT,
        enable_reranker=settings.ENABLE_RERANKER,
        database_type=db_type
    )

@router.put("", response_model=SettingsResponse)
async def update_settings(payload: SettingsUpdateRequest):
    if payload.active_provider is not None:
        settings.DEFAULT_PROVIDER = payload.active_provider
    if payload.chunk_size is not None:
        settings.DEFAULT_CHUNK_SIZE = payload.chunk_size
    if payload.chunk_overlap is not None:
        settings.DEFAULT_CHUNK_OVERLAP = payload.chunk_overlap
    if payload.top_k is not None:
        settings.DEFAULT_TOP_K = payload.top_k
    if payload.dense_weight is not None:
        settings.DENSE_WEIGHT = payload.dense_weight
    if payload.sparse_weight is not None:
        settings.SPARSE_WEIGHT = payload.sparse_weight
    if payload.enable_reranker is not None:
        settings.ENABLE_RERANKER = payload.enable_reranker

    return await get_settings()
