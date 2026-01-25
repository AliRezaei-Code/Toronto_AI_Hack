# ===========================================
# Production MCP Server Dockerfile
# Multi-stage build for optimized image size
# ===========================================

# Build stage
FROM python:3.11-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY mcp-server/requirements.txt .
RUN pip install --no-cache-dir --no-compile --user -r requirements.txt

# Runtime stage
FROM python:3.11-slim

WORKDIR /app

# Install runtime system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copy Python packages from builder to app directory (accessible by appuser)
COPY --from=builder /root/.local /app/.local

# Copy application code
COPY mcp-server/tools/ ./tools/
COPY mcp-server/server.py .
COPY mcp-server/main.py .
COPY mcp-server/http_api.py .

# Set environment variables
ENV PATH=/app/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Set proper permissions (now includes .local directory)
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 9000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:9000/health')" || exit 1

# Run with production settings
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "9000", "--workers", "2", "--timeout-keep-alive", "30"]
