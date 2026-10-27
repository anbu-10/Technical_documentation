FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set up virtual environment to avoid root user pip warnings
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY . .

# Set default PORT environment variable and expose standard ports
ENV PORT=10000
EXPOSE 8000 10000

# Health check (use 127.0.0.1 to avoid IPv6 localhost resolution mismatch)
HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://127.0.0.1:${PORT:-10000}/health || curl -f http://127.0.0.1:${PORT:-10000}/ || exit 1

# Execute uvicorn expanding $PORT (crucial for Render which passes dynamic PORT=10000)
CMD ["sh", "-c", "exec uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-10000}"]
