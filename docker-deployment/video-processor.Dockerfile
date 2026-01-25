# ===========================================
# Production Video Processor Dockerfile
# Multi-stage build for optimized image size
# ===========================================

# Build stage
FROM python:3.11-slim AS builder

WORKDIR /app

# Install build dependencies for OpenCV and MediaPipe
RUN DEBIAN_FRONTEND=noninteractive apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libglib2.0-dev \
    libgl1-mesa-dev \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY video-processor/requirements.txt .
RUN pip install --no-cache-dir --no-compile --user -r requirements.txt

# Runtime stage
FROM python:3.11-slim

WORKDIR /app

# Install runtime system dependencies for OpenCV and MediaPipe
RUN DEBIAN_FRONTEND=noninteractive apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libgl1 \
    libsm6 \
    libxext6 \
    libxrender1 \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copy Python packages from builder to app directory (accessible by appuser)
COPY --from=builder /root/.local /app/.local

# Copy application code
COPY video-processor/*.py ./

# Create temp directory with proper permissions
RUN mkdir -p /tmp/video-processor && \
    chown -R appuser:appuser /tmp/video-processor

# Set environment variables
ENV PATH=/app/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV TEMP_DIR=/tmp/video-processor

# Set proper permissions (now includes .local directory)
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8001/health || exit 1

# Run with production settings
CMD ["python", "-m", "uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "2", "--timeout-keep-alive", "30"]
