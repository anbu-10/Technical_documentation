import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
UPLOAD_DIR = DATA_DIR / "uploads"
BENCHMARK_DIR = DATA_DIR / "benchmark"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
BENCHMARK_DIR.mkdir(parents=True, exist_ok=True)

class Settings(BaseSettings):
    APP_NAME: str = "TechDoc AI"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Database
    # Default to zero-config SQLite, seamlessly supports postgresql:// if configured
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'techdoc_ai.db'}")

    # Security & JWT
    JWT_SECRET: str = os.getenv("JWT_SECRET", "techdoc-ai-super-secret-production-key-2026")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    APP_URL: str = os.getenv("APP_URL", "http://127.0.0.1:5173")

    # Admin Provisioning
    ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL", "admin@techdoc.ai")
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "AdminPass123!")
    ADMIN_NAME: str = os.getenv("ADMIN_NAME", "System Administrator")

    # Storage
    UPLOAD_FOLDER: str = str(UPLOAD_DIR)
    MAX_FILE_SIZE_BYTES: int = 25 * 1024 * 1024  # 25 MB
    ALLOWED_EXTENSIONS: list[str] = [".pdf", ".docx", ".txt", ".md"]

    # AI Providers
    DEFAULT_PROVIDER: str = os.getenv("DEFAULT_PROVIDER", "auto") # auto, ollama, openai, gemini, local
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3.2")
    
    OPENAI_API_KEY: str | None = os.getenv("OPENAI_API_KEY", None)
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    
    GEMINI_API_KEY: str | None = os.getenv("GEMINI_API_KEY", None)
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

    # Document Chunking & Embeddings
    EMBEDDING_MODEL_NAME: str = "all-MiniLM-L6-v2"
    DEFAULT_CHUNK_SIZE: int = 600
    DEFAULT_CHUNK_OVERLAP: int = 120
    DEFAULT_TOP_K: int = 5
    DENSE_WEIGHT: float = 0.65
    SPARSE_WEIGHT: float = 0.35
    ENABLE_RERANKER: bool = True

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
