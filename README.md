# TechDoc AI — Technical Document Intelligence & Question Answering SaaS Platform

TechDoc AI is a production-grade, enterprise-ready multi-tenant SaaS application designed for software engineers, architects, researchers, and technical teams to ingest complex technical documentation, perform hybrid semantic/keyword search, and ask questions with AI-generated answers strictly grounded in verifiable source citations.

---

## 🌟 Key Features

### 1. Authentication, Sessions & Security
- **Full Authentication Lifecycle**: User Registration, Login, Logout, Remember Me, Email Verification, and Password Reset workflows.
- **Enterprise Security**:
  - Secure PBKDF2 password hashing with cryptographically random salts.
  - Signed JWT bearer token sessions with configurable expiration.
  - Sliding-window in-memory IP/endpoint rate limiting for auth and LLM query endpoints.
  - Strict input sanitization and password strength scoring.
  - Full audit logging (`AuditEvent`) capturing security events, user logins, document uploads, modifications, and deletions.
- **Pre-provisioned Accounts**:
  - **Admin User**: `admin@techdoc.ai` / `AdminPass123!`
  - **Demo Engineer**: `developer@techdoc.ai` / `DemoPass123!`

### 2. Role-Based Access Control (RBAC) & Multi-Tenancy
- **Strict Role Separation**: `user` vs `admin` roles verified server-side.
- **Tenant Isolation**: Documents, collections, and conversations belong strictly to their authorized owner. Normal users can never access, query, rename, or delete another user's documents.
- **Administrative Portal**:
  - `/admin`: Real-time operational overview, active users, total ingestion counts, and average latency.
  - `/admin/users`: User management directory with instant account suspension/activation and role promotion/demotion.
  - `/admin/documents`: System-wide ingestion pipeline monitoring with status filtering and one-click ingestion retry.
  - `/admin/analytics`: Performance telemetry, query throughput KPIs, and live immutable security audit trail viewer with payload inspection.

### 3. User Profile & Settings
- Dedicated `/profile` route with user initials/avatar, joined date, full name editing, notification preferences, AI provider defaults, password change form, and account deletion with explicit confirmation.

### 4. Complete Document Management
- **Multi-Format Ingestion**: Supports **PDF** (via PyMuPDF & pypdf), **Word (.docx)**, **Markdown (.md)**, and **Plain Text (.txt)**.
- **Structure-Aware Processing**: Preserves section headings, chapter titles, and page numbers across sliding-window chunk boundaries.
- **Dense & Sparse Indexing**: 384-dimensional dense vector embeddings via SentenceTransformers (`all-MiniLM-L6-v2`) and BM25Okapi inverted index creation.
- **Management Capabilities**: Rename documents, retry failed processing, delete documents with chunk cleanup, preview extracted text, and organize into isolated Collections.

### 5. Grounded AI Assistant & Q&A Workspace
- ChatGPT-style 3-panel workspace:
  - **Left Panel**: Conversation history, new chat, rename, and delete conversation.
  - **Center Panel**: Natural language Q&A, markdown formatting, syntax highlighting, copy answer/code, thumbs up/down feedback, and document filter pills.
  - **Right Panel**: Split-screen Grounded Source Verification Inspector displaying numbered citations `[1]`, `[2]`, `[3]`, exact page numbers, section titles, and source excerpts.
- Grounded RAG with strict verification: If insufficient evidence is found in selected documents, the model honestly reports that evidence is insufficient rather than hallucinating.

### 6. Intelligent Hybrid Search
- Fuses dense semantic vector cosine similarity with BM25 keyword matching and structure-aware reranking.
- Supports search modes: **Hybrid (Dense + BM25)**, **Dense Vector Similarity**, and **BM25 Keyword Matching**.
- Transparent score reporting: returns final relevance score, dense vector score, and BM25 score alongside keyword match highlighting.

### 7. Evaluation Benchmark Suite
- Runnable IR benchmark suite evaluating the retrieval pipeline against ground-truth technical queries.
- Computes standard IR metrics: **Mean Reciprocal Rank (MRR)**, **NDCG@5**, **Recall@3 & Recall@5**, **Precision@1**, and **Retrieval Hit Rate**.

---

## 🛠️ Technology Stack

- **Frontend**:
  - React 19 with TypeScript & Vite
  - React Router v7 for public, protected, and admin routes
  - Tailwind CSS with custom enterprise dark navy & light palettes
  - Lucide React iconography
  - Recharts for metrics & analytics visualization
- **Backend**:
  - Python 3.10+ / 3.14 with FastAPI
  - RESTful architecture with Pydantic v2 schemas
  - SQLAlchemy ORM with SQLite (zero-config default) and PostgreSQL + pgvector adapter support
  - SentenceTransformers (`all-MiniLM-L6-v2`) & PyTorch
  - PyMuPDF (`fitz`), `python-docx`, `pypdf`, `rank_bm25`

---

## 🧭 Application Routes

### Public Routes
- `/` — Public SaaS landing page (hero, features, interactive RAG preview, security architecture).
- `/login` — Sign in with email & password, remember me, quick demo auto-fill.
- `/register` — Create account with password strength indicator and confirmation check.
- `/forgot-password` — Request password reset link.
- `/reset-password` — Set a new password using token.
- `/verify-email` — Email verification confirmation.

### Protected User Workspace Routes
- `/dashboard` — Personalized overview, KPIs, and recent activity.
- `/documents` — Document library with grid/table view, chunk inspection, and rename modal.
- `/chat` — Grounded AI assistant workspace with citations.
- `/chat/:id` — Specific conversation thread.
- `/search` — Intelligent hybrid search and snippet highlights.
- `/collections` — Document collections management.
- `/analytics` — User query analytics and latency metrics.
- `/evaluation` — IR retrieval benchmark runner.
- `/settings` — LLM providers & hyperparameter settings.
- `/profile` — User profile, preferences, and security settings.

### Administrative Routes (RBAC Enforced)
- `/admin` — System administration dashboard.
- `/admin/users` — User directory, permissions, and account status controls.
- `/admin/documents` — System-wide ingestion monitoring & retry.
- `/admin/analytics` — Telemetry & compliance security audit trails.

### Error Routes
- `/403` — Dedicated Access Denied page.
- `*` — Dedicated 404 Not Found page.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Python 3.10+ installed
- Node.js v18+ and npm installed

### 2. Backend Setup & Startup

From the project root directory:

```powershell
# Install Python dependencies
pip install -r requirements.txt

# Start the FastAPI backend server
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

The API server will automatically initialize tables, seed sample technical specifications, pre-provision the admin and demo accounts, and start listening at:
- **Backend API**: `http://127.0.0.1:8000`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`
- **Health Check**: `http://127.0.0.1:8000/api/health`

### 3. Frontend Setup & Startup

In a second terminal window, navigate to the `frontend/` directory:

```powershell
cd frontend

# Install npm packages
npm install

# Start Vite development server
npm run dev -- --host 127.0.0.1 --port 5173
```

Open your browser at `http://127.0.0.1:5173/` to access the TechDoc AI platform.

---

## 🧪 Automated Testing

Automated end-to-end tests verify authentication, JWT session validation, role-based access control (Admin vs Regular User), password reset workflows, and multi-tenant document isolation.

Run the test suite with:

```powershell
python -m pytest -v tests/test_auth_and_rbac.py
```

### Verified Test Cases:
1. `test_health_check` — Verifies system health endpoints.
2. `test_user_registration_and_duplicate_check` — Tests registration, duplicate email rejection, and input validation.
3. `test_user_login_and_token_validation` — Tests credential rejection, valid login, JWT token issuance, and `/api/auth/me`.
4. `test_rbac_admin_vs_regular_user` — Verifies regular users receive HTTP 403 on `/api/admin/*`, while admins receive HTTP 200 with system telemetry.
5. `test_password_reset_workflow` — Verifies token generation, password change, and immediate re-login.
6. `test_multitenant_document_isolation` — Verifies that User B receives HTTP 403 Forbidden when attempting to view or delete User A's private documents.

---

## ⚙️ Environment Configuration

Configuration is managed via `.env` or environment variables:

```env
# Database
DATABASE_URL=sqlite:///./techdoc_ai.db

# Security & Admin Provisioning
JWT_SECRET=techdoc-ai-super-secret-production-key-2026
ADMIN_EMAIL=admin@techdoc.ai
ADMIN_PASSWORD=AdminPass123!
ADMIN_NAME=TechDoc System Administrator

# LLM Providers (auto, local, ollama, openai, gemini)
DEFAULT_PROVIDER=auto
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

---

## 📂 Project Structure

```
├── backend/
│   ├── config.py             # Settings, JWT secret, admin provisioning
│   ├── database.py           # SQLAlchemy database engine & session
│   ├── models.py             # User, Token, AuditEvent, Document, Chunk models
│   ├── schemas.py            # Pydantic v2 validation models
│   ├── main.py               # FastAPI entrypoint, CORS, startup seeders
│   ├── routers/
│   │   ├── auth.py           # Registration, login, profile, reset, email verify
│   │   ├── admin.py          # Admin overview, user controls, pipeline, audits
│   │   ├── documents.py      # Upload, parse, chunk, rename, retry, delete
│   │   ├── collections.py    # Collections CRUD
│   │   ├── chat.py           # Grounded Q&A, citations, feedback
│   │   ├── search.py         # Hybrid, vector, BM25 search
│   │   ├── analytics.py      # Stored logs & metrics
│   │   ├── evaluation.py     # Benchmark suite & IR metrics
│   │   └── settings.py       # Provider connectivity & parameters
│   └── services/
│       ├── auth.py           # PBKDF2 hashing, JWT tokens, rate limiter, audits
│       ├── parser.py         # Multi-format parser (PyMuPDF, docx, txt, md)
│       ├── chunker.py        # Structure-aware chunking with headings & overlap
│       ├── embedder.py       # SentenceTransformers embedding service
│       ├── retriever.py      # Hybrid BM25 + Dense vector search + Reranker
│       ├── llm.py            # Ollama, OpenAI, Gemini, Local grounded synthesizer
│       └── evaluator.py      # MRR, NDCG@5, Recall@K benchmark runner
├── frontend/
│   ├── src/
│   │   ├── api/client.ts     # Typed API client with auth headers & models
│   │   ├── context/
│   │   │   └── AuthContext.tsx # Persistent authentication state & helpers
│   │   ├── components/
│   │   │   ├── Sidebar.tsx   # SaaS navigation sidebar with RBAC admin links
│   │   │   ├── Header.tsx    # Breadcrumb header, quick search, user dropdown
│   │   │   └── UploadModal.tsx # Drag-and-drop document upload modal
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx   # Public marketing landing page
│   │   │   ├── auth/             # Login, Register, Forgot/Reset, Verify Email
│   │   │   ├── Overview.tsx      # Personalized user dashboard
│   │   │   ├── Documents.tsx     # Library, chunk inspector, rename modal
│   │   │   ├── ChatAssistant.tsx # 3-panel grounded AI assistant with citations
│   │   │   ├── IntelligentSearch.tsx # Hybrid search workspace
│   │   │   ├── Collections.tsx   # Document collections
│   │   │   ├── Analytics.tsx     # User metrics & query volume charts
│   │   │   ├── Evaluation.tsx    # IR benchmark runner
│   │   │   ├── Settings.tsx      # System hyperparameter controls
│   │   │   ├── Profile.tsx       # User profile, credentials & preferences
│   │   │   ├── admin/            # AdminDashboard, Users, Documents, Analytics
│   │   │   └── errors/           # Forbidden403, NotFound404
│   │   ├── App.tsx           # React Router v7 routes & RBAC guards
│   │   ├── main.tsx          # React application root
│   │   └── index.css         # Tailwind & custom tokens
├── tests/
│   └── test_auth_and_rbac.py # Pytest test suite for auth, RBAC & isolation
├── requirements.txt
├── .env.example
└── README.md
```
