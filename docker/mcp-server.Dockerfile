FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY tools/ ./tools/
COPY server.py .

ENV PYTHONUNBUFFERED=1

EXPOSE 9000

CMD ["python", "-m", "mcp.cli.server", "server.py"]