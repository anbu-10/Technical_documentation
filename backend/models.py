import datetime
import uuid
from sqlalchemy import Column, String, Integer, Float, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from backend.database import Base

def gen_uuid() -> str:
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), default="Demo Engineer")
    role = Column(String(50), default="user")  # "user" or "admin"
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    avatar_url = Column(String(500), nullable=True)
    theme = Column(String(50), default="dark")
    preferred_provider = Column(String(50), default="auto")
    notification_preferences_json = Column(Text, default='{"email_notifications": true, "security_alerts": true}')
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    documents = relationship("Document", back_populates="user", cascade="all, delete-orphan")
    collections = relationship("Collection", back_populates="user", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    email_tokens = relationship("EmailVerificationToken", back_populates="user", cascade="all, delete-orphan")
    reset_tokens = relationship("PasswordResetToken", back_populates="user", cascade="all, delete-orphan")

class EmailVerificationToken(Base):
    __tablename__ = "email_verification_tokens"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token = Column(String(255), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="email_tokens")

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token = Column(String(255), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="reset_tokens")

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), nullable=True, index=True)
    user_email = Column(String(255), nullable=True)
    action = Column(String(100), nullable=False, index=True)  # auth.login, auth.register, doc.upload, etc.
    resource_type = Column(String(100), nullable=True)
    resource_id = Column(String(100), nullable=True)
    ip_address = Column(String(100), nullable=True)
    status = Column(String(50), default="success")  # success, failed
    details_json = Column(Text, default="{}")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    filename = Column(String(255), nullable=False)
    original_name = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)
    file_size = Column(Integer, default=0)
    page_count = Column(Integer, default=1)
    chunk_count = Column(Integer, default=0)
    status = Column(String(50), default="uploaded")  # uploaded, parsing, chunking, indexing, completed, failed
    error_message = Column(Text, nullable=True)
    metadata_json = Column(Text, default="{}")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="documents")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan", order_by="DocumentChunk.chunk_index")
    collection_items = relationship("CollectionDocument", back_populates="document", cascade="all, delete-orphan")

class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_index = Column(Integer, nullable=False)
    page_number = Column(Integer, default=1)
    section_heading = Column(String(255), default="")
    text_content = Column(Text, nullable=False)
    token_count = Column(Integer, default=0)
    embedding_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    document = relationship("Document", back_populates="chunks")

class Collection(Base):
    __tablename__ = "collections"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, default="")
    color = Column(String(50), default="brand")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="collections")
    documents = relationship("CollectionDocument", back_populates="collection", cascade="all, delete-orphan")

class CollectionDocument(Base):
    __tablename__ = "collection_documents"

    collection_id = Column(String(36), ForeignKey("collections.id", ondelete="CASCADE"), primary_key=True)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), primary_key=True)
    added_at = Column(DateTime, default=datetime.datetime.utcnow)

    collection = relationship("Collection", back_populates="documents")
    document = relationship("Document", back_populates="collection_items")

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    title = Column(String(255), default="New Technical Discussion")
    collection_id = Column(String(36), ForeignKey("collections.id"), nullable=True)
    document_ids_json = Column(Text, default="[]")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.created_at")

class Message(Base):
    __tablename__ = "messages"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    conversation_id = Column(String(36), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(50), nullable=False)  # user, assistant
    content = Column(Text, nullable=False)
    model_used = Column(String(100), default="local-rag")
    latency_ms = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    conversation = relationship("Conversation", back_populates="messages")
    citations = relationship("Citation", back_populates="message", cascade="all, delete-orphan", order_by="Citation.rank_order")
    feedback = relationship("Feedback", back_populates="message", uselist=False, cascade="all, delete-orphan")

class Citation(Base):
    __tablename__ = "citations"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    message_id = Column(String(36), ForeignKey("messages.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_id = Column(String(36), ForeignKey("document_chunks.id", ondelete="SET NULL"), nullable=True)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    document_title = Column(String(255), nullable=False)
    page_number = Column(Integer, default=1)
    section_heading = Column(String(255), default="")
    excerpt = Column(Text, nullable=False)
    score = Column(Float, default=0.0)
    rank_order = Column(Integer, default=1)

    message = relationship("Message", back_populates="citations")

class QueryLog(Base):
    __tablename__ = "query_logs"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), nullable=True, index=True)
    query_text = Column(Text, nullable=False)
    search_mode = Column(String(50), default="hybrid")  # hybrid, vector, bm25
    retrieved_count = Column(Integer, default=0)
    latency_ms = Column(Float, default=0.0)
    provider_used = Column(String(100), default="local-rag")
    was_answered = Column(Boolean, default=True)
    top_score = Column(Float, default=0.0)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class Feedback(Base):
    __tablename__ = "feedbacks"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    message_id = Column(String(36), ForeignKey("messages.id", ondelete="CASCADE"), nullable=True, index=True)
    query_log_id = Column(String(36), ForeignKey("query_logs.id", ondelete="SET NULL"), nullable=True)
    rating = Column(Integer, nullable=False)  # 1 for thumbs up, -1 for thumbs down
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    message = relationship("Message", back_populates="feedback")

class BenchmarkItem(Base):
    __tablename__ = "benchmark_items"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    query = Column(Text, nullable=False)
    category = Column(String(100), default="architecture")
    ground_truth_answer = Column(Text, nullable=True)
    expected_doc_title = Column(String(255), nullable=True)
    expected_keywords = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
