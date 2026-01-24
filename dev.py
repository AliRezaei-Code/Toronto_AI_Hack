#!/usr/bin/env python3
"""
Development server launcher - runs all services with hot reload.
Usage: python dev.py [--install]
"""

import subprocess
import sys
import os
import signal
import threading
from pathlib import Path

ROOT = Path(__file__).parent

# Use explicit Python path to avoid MSYS2/Windows Store conflicts
PYTHON = r"C:\Users\Chris\AppData\Local\Python\bin\python.exe"

SERVICES = [
    {
        "name": "frontend",
        "cwd": ROOT / "frontend",
        "install": ["npm", "install"],
        "run": ["npm", "run", "dev"],
        "color": "\033[36m",  # cyan
    },
    {
        "name": "backend",
        "cwd": ROOT / "backend",
        "install": [PYTHON, "-m", "pip", "install", "-r", "requirements.txt"],
        "run": [PYTHON, "-m", "uvicorn", "app.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"],
        "color": "\033[33m",  # yellow
    },
    {
        "name": "mcp-server",
        "cwd": ROOT / "mcp-server",
        "install": [PYTHON, "-m", "pip", "install", "-r", "requirements.txt"],
        "run": [PYTHON, "-m", "uvicorn", "server:app", "--reload", "--host", "0.0.0.0", "--port", "9000"],
        "color": "\033[35m",  # magenta
    },
]

RESET = "\033[0m"
processes = []


def log(service_name: str, color: str, message: str):
    """Print a colored log message."""
    print(f"{color}[{service_name}]{RESET} {message}")


def stream_output(proc, service_name: str, color: str):
    """Stream subprocess output with colored prefix."""
    for line in iter(proc.stdout.readline, ""):
        if line:
            print(f"{color}[{service_name}]{RESET} {line}", end="")


def install_deps():
    """Install dependencies for all services."""
    print("\n=== Installing dependencies ===\n")
    for svc in SERVICES:
        if not svc["cwd"].exists():
            log(svc["name"], svc["color"], f"Directory not found: {svc['cwd']}")
            continue
        log(svc["name"], svc["color"], f"Installing dependencies...")
        result = subprocess.run(
            svc["install"],
            cwd=svc["cwd"],
            shell=(os.name == "nt"),
        )
        if result.returncode != 0:
            log(svc["name"], svc["color"], "Failed to install dependencies!")
            sys.exit(1)
        log(svc["name"], svc["color"], "Dependencies installed.")
    print("\n=== All dependencies installed ===\n")


def start_services():
    """Start all services with hot reload."""
    print("\n=== Starting services ===\n")

    for svc in SERVICES:
        if not svc["cwd"].exists():
            log(svc["name"], svc["color"], f"Directory not found: {svc['cwd']}, skipping...")
            continue

        log(svc["name"], svc["color"], f"Starting: {' '.join(str(c) for c in svc['run'])}")

        proc = subprocess.Popen(
            svc["run"],
            cwd=svc["cwd"],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            shell=(os.name == "nt"),
        )
        processes.append(proc)

        # Stream output in a thread
        thread = threading.Thread(
            target=stream_output,
            args=(proc, svc["name"], svc["color"]),
            daemon=True,
        )
        thread.start()

    print(f"\n=== All services started. Press Ctrl+C to stop. ===\n")


def shutdown(signum=None, frame=None):
    """Gracefully shutdown all processes."""
    print("\n\n=== Shutting down services ===\n")
    for proc in processes:
        proc.terminate()
    for proc in processes:
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()
    print("=== All services stopped ===")
    sys.exit(0)


def main():
    # Handle Ctrl+C
    signal.signal(signal.SIGINT, shutdown)
    if os.name != "nt":
        signal.signal(signal.SIGTERM, shutdown)

    # Check for --install flag or if first run
    if "--install" in sys.argv or not (ROOT / "frontend" / "node_modules").exists():
        install_deps()

    start_services()

    # Keep main thread alive - don't monitor process exits since uvicorn --reload
    # manages its own child processes internally
    try:
        import time
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        shutdown()


if __name__ == "__main__":
    main()
