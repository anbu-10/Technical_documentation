import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, EmailStr

# User & Auth Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str = "Demo Engineer"
    role: str = "user"

class UserRegisterRequest(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=100)
    password: str = Field(..., min_length=8)
    confirm_password: str

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str
    remember_me: Optional[bool] = False

class UserDetailResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    is_active: bool
    is_verified: bool
    avatar_url: Optional[str] = None
    theme: str = "dark"
    preferred_provider: str = "auto"
    notification_preferences: Dict[str, Any] = {}
    created_at: datetime.datetime
    updated_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserDetailResponse

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    theme: Optional[str] = None
    preferred_provider: Optional[str] = None
    notification_preferences: Optional[Dict[str, Any]] = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)
    confirm_password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)
    confirm_password: str

class VerifyEmailRequest(BaseModel):
    token: str

class AuditEventResponse(BaseModel):
    id: str
    user_id: Optional[str]
    user_email: Optional[str]
    action: str
    resource_type: Optional[str]
    resource_id: Optional[str]
    ip_address: Optional[str]
    status: str
    details: Dict[str, Any] = {}
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class AdminOverviewResponse(BaseModel):
    total_users: int
    active_users: int
    admin_users: int
    total_documents: int
    completed_documents: int
    failed_documents: int
    total_chunks: int
    total_conversations: int
    total_queries: int
    total_audit_events: int
    average_latency_ms: float

class AdminUserUpdate(BaseModel):
    is_active: Optional[bool] = None
    role: Optional[str] = None

# Document Schemas
class DocumentChunkResponse(BaseModel):
    id: str
    chunk_index: int
    page_number: int
    section_heading: str
    text_content: str
    token_count: int

    class Config:
        from_attributes = True

class DocumentRenameRequest(BaseModel):
    original_name: str = Field(..., min_length=1, max_length=255)

class DocumentResponse(BaseModel):
    id: str
    filename: str
    original_name: str
    file_type: str
    file_size: int
    page_count: int
    chunk_count: int
    status: str
    error_message: Optional[str] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True

class DocumentDetailResponse(DocumentResponse):
    metadata: Dict[str, Any] = {}
    chunks: List[DocumentChunkResponse] = []

# Collection Schemas
class CollectionCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    color: Optional[str] = "brand"

class CollectionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None

class CollectionResponse(BaseModel):
    id: str
    name: str
    description: str
    color: str
    document_count: int = 0
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class CollectionAddDocRequest(BaseModel):
    document_id: str

# Citation Schema
class CitationResponse(BaseModel):
    id: str
    chunk_id: Optional[str] = None
    document_id: str
    document_title: str
    page_number: int
    section_heading: str
    excerpt: str
    score: float
    rank_order: int

    class Config:
        from_attributes = True

# Conversation & Chat Schemas
class MessageResponse(BaseModel):
    id: str
    role: str
    content: str
    model_used: str
    latency_ms: float
    created_at: datetime.datetime
    citations: List[CitationResponse] = []
    feedback: Optional[int] = None

    class Config:
        from_attributes = True

class ConversationCreate(BaseModel):
    title: Optional[str] = "New Technical Discussion"
    collection_id: Optional[str] = None
    document_ids: List[str] = []

class ConversationUpdate(BaseModel):
    title: Optional[str] = None
    document_ids: Optional[List[str]] = None

class ConversationResponse(BaseModel):
    id: str
    title: str
    collection_id: Optional[str] = None
    document_ids: List[str] = []
    message_count: int = 0
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True

class ConversationDetailResponse(ConversationResponse):
    messages: List[MessageResponse] = []

class ChatRequest(BaseModel):
    conversation_id: Optional[str] = None
    question: str
    document_ids: Optional[List[str]] = None
    collection_id: Optional[str] = None
    provider: Optional[str] = None
    top_k: Optional[int] = 5

class FeedbackCreate(BaseModel):
    rating: int = Field(..., description="1 for thumbs up, -1 for thumbs down")
    comment: Optional[str] = None

class FeedbackResponse(BaseModel):
    id: str
    message_id: Optional[str]
    rating: int
    comment: Optional[str]
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Search Schemas
class SearchRequest(BaseModel):
    query: str
    mode: str = "hybrid" # hybrid, vector, bm25
    collection_id: Optional[str] = None
    document_ids: Optional[List[str]] = None
    limit: int = 10
    file_types: Optional[List[str]] = None

class SearchResultItem(BaseModel):
    chunk_id: str
    document_id: str
    document_title: str
    page_number: int
    section_heading: str
    text_content: str
    highlighted_text: Optional[str] = None
    score: float
    retrieval_method: str
    vector_score: Optional[float] = None
    bm25_score: Optional[float] = None

class SearchResponse(BaseModel):
    query: str
    mode: str
    total_results: int
    latency_ms: float
    results: List[SearchResultItem]

# Analytics & Evaluation Schemas
class AnalyticsSummaryResponse(BaseModel):
    total_documents: int
    processed_documents: int
    failed_documents: int
    total_chunks: int
    total_questions: int
    average_latency_ms: float
    positive_feedback_count: int
    negative_feedback_count: int
    search_success_rate: float
    recent_documents: List[DocumentResponse]
    recent_conversations: List[ConversationResponse]
    processing_chart: List[Dict[str, Any]]
    query_chart: List[Dict[str, Any]]

class EvaluationMetrics(BaseModel):
    total_benchmark_queries: int
    mrr: float
    ndcg_at_5: float
    recall_at_3: float
    recall_at_5: float
    precision_at_1: float
    average_latency_ms: float
    retrieval_hit_rate: float

class BenchmarkRunResult(BaseModel):
    query: str
    category: str
    retrieved_top_docs: List[str]
    hit: bool
    reciprocal_rank: float
    ndcg: float
    latency_ms: float
    answer_preview: Optional[str] = None

class EvaluationReportResponse(BaseModel):
    pipeline_mode: str
    metrics: EvaluationMetrics
    detailed_results: List[BenchmarkRunResult]
    evaluated_at: datetime.datetime

# Settings & Provider Schemas
class ProviderInfo(BaseModel):
    name: str
    display_name: str
    status: str
    details: str
    model: str
    is_default: bool = False

class SettingsResponse(BaseModel):
    app_name: str
    app_version: str
    active_provider: str
    providers: List[ProviderInfo]
    embedding_model: str
    chunk_size: int
    chunk_overlap: int
    top_k: int
    dense_weight: float
    sparse_weight: float
    enable_reranker: bool
    database_type: str

class SettingsUpdateRequest(BaseModel):
    active_provider: Optional[str] = None
    chunk_size: Optional[int] = None
    chunk_overlap: Optional[int] = None
    top_k: Optional[int] = None
    dense_weight: Optional[float] = None
    sparse_weight: Optional[float] = None
    enable_reranker: Optional[bool] = None
