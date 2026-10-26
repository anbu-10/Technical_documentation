import os
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.config import settings
from backend.database import engine, Base, SessionLocal
from backend.models import Document, DocumentChunk, Collection, CollectionDocument, User
from backend.routers import documents, collections, chat, search, analytics, evaluation, settings as settings_router, auth, admin
from backend.services.evaluator import RetrievalEvaluator
from backend.services.parser import DocumentParser
from backend.services.chunker import DocumentChunker
from backend.services.embedder import EmbeddingService
from backend.services.auth import hash_password

def provision_initial_users():
    db = SessionLocal()
    try:
        # 1. Admin account
        admin_user = db.query(User).filter(User.email == settings.ADMIN_EMAIL).first()
        if not admin_user:
            admin_user = User(
                email=settings.ADMIN_EMAIL,
                hashed_password=hash_password(settings.ADMIN_PASSWORD),
                full_name=settings.ADMIN_NAME,
                role="admin",
                is_active=True,
                is_verified=True
            )
            db.add(admin_user)
            db.commit()
        else:
            # Ensure role is admin
            if admin_user.role != "admin":
                admin_user.role = "admin"
                db.commit()

        # 2. Demo engineer account
        demo_user = db.query(User).filter(User.email == "developer@techdoc.ai").first()
        if not demo_user:
            demo_user = User(
                email="developer@techdoc.ai",
                hashed_password=hash_password("DemoPass123!"),
                full_name="Alex Mercer (Staff AI Architect)",
                role="user",
                is_active=True,
                is_verified=True
            )
            db.add(demo_user)
            db.commit()
    except Exception as e:
        print(f"Error provisioning users: {e}")
    finally:
        db.close()

def seed_sample_technical_documents():
    db = SessionLocal()
    try:
        count = db.query(Document).count()
        if count == 0:
            sample_docs_dir = Path(settings.UPLOAD_FOLDER) / "samples"
            sample_docs_dir.mkdir(parents=True, exist_ok=True)

            samples = [
                {
                    "filename": "distributed_cache_architecture.md",
                    "original_name": "Distributed_Cache_Architecture_Spec.md",
                    "file_type": "md",
                    "content": """# Distributed Cache Architecture Specification

## 1. Executive Summary & Architecture Overview
The Distributed Cache System is an in-memory, highly available key-value caching layer designed for low-latency technical microservices. It features two-tier caching: an L1 local in-process cache (using LRU policy) and an L2 shared distributed cluster (powered by consistent hashing rings with virtual nodes).

## 2. Core Components and Data Flow
- **Ingress Gateway**: Routes incoming RPC requests to cache proxies.
- **Consistent Hash Ring**: Employs Murmur3 hashing with 256 virtual nodes per physical node to guarantee uniform key distribution.
- **L1 In-Memory Cache**: 128MB per container, sub-microsecond lookup time.
- **L2 Distributed Partition**: Partitioned across nodes with replication factor R=3.
- **Write-Through & Write-Behind Policies**: Configurable per namespace. Default is write-through with asynchronous replication.

## 3. Installation and Setup Requirements
To deploy the distributed cache cluster, ensure the following prerequisites are met:
- Linux kernel 5.4+ with epoll support
- Minimum 16GB RAM and 4 vCPU per cache node
- Python 3.11+ for orchestration and management CLI
- Open ports: 6379 (client traffic), 16379 (cluster gossip protocol), 9090 (Prometheus metrics)

## 4. API Configuration & Endpoints
The cache exposes a high-throughput REST and gRPC interface:
- `POST /api/v1/cache/get`: Retrieves key value. Header `X-Cache-Tier` indicates whether L1 or L2 served the hit.
- `POST /api/v1/cache/set`: Sets key with TTL in seconds. Payload: `{"key": "user:123", "value": "...", "ttl": 3600}`.
- `DELETE /api/v1/cache/invalidate`: Explicitly flushes key or wildcard pattern.

## 5. Troubleshooting & Error Recovery
- **Error ERR_NODE_TIMEOUT**: Occurs when gossip ping exceeds 500ms. Check network partitions or CPU throttling.
- **Cache Stampede (Thundering Herd)**: Mitigated using mutex lock leases with exponential backoff on cache misses.
- **Out of Memory (OOM)**: Automatic eviction triggers when memory reaches 90% threshold using volatile-lru policy.
"""
                },
                {
                    "filename": "microservices_deployment_guide.md",
                    "original_name": "Kubernetes_Microservices_Deployment_Manual.md",
                    "file_type": "md",
                    "content": """# Production Microservices Deployment Manual

## 1. System Overview & Container Architecture
This manual outlines the continuous delivery pipeline and Helm deployment strategy for enterprise containerized services running on managed Kubernetes (EKS/GKE).

## 2. Infrastructure & Ingress Configuration
- **Ingress Controller**: Traefik v2.10 with automated Let's Encrypt TLS cert-manager.
- **Service Mesh**: Istio ambient mesh for zero-trust mTLS encryption and distributed tracing.
- **Horizontal Pod Autoscaler (HPA)**: Configured to autoscale pods when CPU utilization exceeds 75% or p99 latency exceeds 250ms.

## 3. Deployment Steps and CLI Commands
Run the following deployment commands:
1. Initialize namespace: `kubectl create namespace production`
2. Apply Helm chart: `helm upgrade --install techdoc-services ./helm/techdoc --namespace production --values values-prod.yaml`
3. Verify rollouts: `kubectl rollout status deployment/techdoc-backend -n production`
4. Inspect running pods: `kubectl get pods -n production -l app.kubernetes.io/name=techdoc`

## 4. Environment Variables and Secrets Management
All secrets are injected using HashiCorp Vault sidecar or SealedSecrets:
- `DATABASE_URL`: Connection string with SSL mode required.
- `JWT_SECRET`: 256-bit cryptographic key rotated quarterly.
- `OLLAMA_BASE_URL`: Endpoint for internal model inference nodes.

## 5. Monitoring, Health Checks & Diagnostics
- **Liveness Probe**: `/api/health` checked every 15s. Failure threshold: 3.
- **Readiness Probe**: `/api/health/ready` verifying DB connectivity before admitting ingress traffic.
- **Common Failure**: `CrashLoopBackOff` usually caused by missing secrets or database migration lock.
"""
                },
                {
                    "filename": "security_and_auth_protocol.md",
                    "original_name": "Security_and_Authentication_Protocol.md",
                    "file_type": "md",
                    "content": """# Security & Authentication Protocol Specification

## 1. Authentication Standards & JWT Specifications
TechDoc AI utilizes JSON Web Tokens (JWT) conforming to RFC 7519 with HMAC-SHA256 (HS256) signature verification. Access tokens have an expiration window of 60 minutes, while refresh tokens remain valid for 14 days with sliding-window rotation.

## 2. Role-Based Access Control (RBAC) Matrix
- **Admin**: Full read, write, delete permissions on all documents, users, and audit logs.
- **Engineer**: Upload, index, search, and chat with technical documents in assigned collections.
- **Viewer**: Read-only query and citation inspection capabilities.

## 3. Cryptographic and Password Hashing Requirements
- Passwords must be hashed using bcrypt with work factor >= 12 or PBKDF2/SHA-256.
- Plaintext passwords or unencrypted secrets must never be committed to source repositories or printed in stdout logs.
- All client-to-server and inter-service communications require TLS 1.3.

## 4. Rate Limiting & Denial of Service Protection
- Public endpoints: 60 requests per minute per IP address.
- AI Generation endpoints: 20 queries per minute per authenticated user to prevent compute resource exhaustion.
- Upload limits: Maximum file size 25MB with strict MIME-type and magic byte validation.
"""
                }
            ]

            embedder = EmbeddingService.get_instance()

            for item in samples:
                file_path = sample_docs_dir / item["filename"]
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(item["content"])

                doc = Document(
                    filename=f"samples/{item['filename']}",
                    original_name=item["original_name"],
                    file_type=item["file_type"],
                    file_size=len(item["content"].encode("utf-8")),
                    status="completed"
                )
                db.add(doc)
                db.commit()
                db.refresh(doc)

                # Parse and chunk
                pages = DocumentParser.parse_file(str(file_path), item["file_type"])
                doc.page_count = len(pages)
                chunks = DocumentChunker.chunk_pages(pages, chunk_size=400, chunk_overlap=80)
                doc.chunk_count = len(chunks)
                db.commit()

                embeddings = embedder.embed_texts([c.text for c in chunks])
                for idx, c in enumerate(chunks):
                    chunk_model = DocumentChunk(
                        document_id=doc.id,
                        chunk_index=c.chunk_index,
                        page_number=c.page_number,
                        section_heading=c.section_heading,
                        text_content=c.text,
                        token_count=c.token_count,
                        embedding_json=import_json_dumps(embeddings[idx]) if idx < len(embeddings) else None
                    )
                    db.add(chunk_model)
                db.commit()

            # Seed default collection
            col = Collection(
                name="Core Technical Specs",
                description="Core architecture, Kubernetes deployment, and security protocol manuals.",
                color="brand"
            )
            db.add(col)
            db.commit()
            db.refresh(col)

            for d in db.query(Document).all():
                db.add(CollectionDocument(collection_id=col.id, document_id=d.id))
            db.commit()

            # Seed benchmark queries
            RetrievalEvaluator.seed_default_benchmarks(db)

    except Exception as e:
        print(f"Error during seeding: {e}")
    finally:
        db.close()

def import_json_dumps(obj):
    import json
    return json.dumps(obj)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables and quick user setup
    Base.metadata.create_all(bind=engine)
    provision_initial_users()
    
    # Run heavy document parsing, chunking, and embeddings in background thread
    # This guarantees the server binds to $PORT in <1 second, preventing Render port scan timeouts
    import threading
    seeding_thread = threading.Thread(target=seed_sample_technical_documents, daemon=True)
    seeding_thread.start()
    
    yield
    # Shutdown

app = FastAPI(
    title="TechDoc AI API",
    description="Technical Document Intelligence & Question Answering Platform API",
    version=settings.APP_VERSION,
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(documents.router)
app.include_router(collections.router)
app.include_router(chat.router)
app.include_router(search.router)
app.include_router(analytics.router)
app.include_router(evaluation.router)
app.include_router(settings_router.router)
app.include_router(auth.router)
app.include_router(admin.router)

@app.get("/health", tags=["Health"])
@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port)

