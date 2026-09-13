# ==============================================================================
# OTIP Backend Production Dockerfile (FastAPI + XGBoost + Scikit-Learn)
# ==============================================================================
FROM python:3.11-slim

# Prevent Python from writing .pyc files and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    PORT=8000

WORKDIR /app

# Install system dependencies needed for compiling or native libraries (libgomp for XGBoost)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first for optimal Docker layer caching
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy application source code and pre-trained ML model
COPY backend/ /app/backend/
COPY data/models/ /app/data/models/

# Create runtime cache directory
RUN mkdir -p /app/backend/ingestion/.cache

# Expose standard port
EXPOSE 8000

# Healthcheck to verify the ASGI service is responding
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:' + str(__import__('os').environ.get('PORT', 8000)) + '/health')" || exit 1

# Launch production server with dynamic port support
CMD ["sh", "-c", "uvicorn backend.api.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
