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
import socket
from pathlib import Path

ROOT = Path(__file__).parent

# Ports used by our services
PORTS_TO_CLEAR = [8000, 9000]  # backend, mcp-server

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


def is_port_in_use(port: int) -> bool:
    """Check if a port is currently in use."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0


def kill_process_on_port(port: int) -> bool:
    """Kill any process using the specified port. Returns True if a process was killed."""
    if os.name == 'nt':  # Windows
        try:
            # Find PID using the port
            result = subprocess.run(
                ['netstat', '-ano', '-p', 'TCP'],
                capture_output=True,
                text=True,
                shell=True
            )
            
            pids_to_kill = set()
            for line in result.stdout.split('\n'):
                # Look for lines with our port in LISTENING or ESTABLISHED state
                if f':{port}' in line and ('LISTENING' in line or 'ESTABLISHED' in line):
                    parts = line.split()
                    if len(parts) >= 5:
                        pid = parts[-1]
                        if pid.isdigit() and pid != '0':
                            pids_to_kill.add(pid)
            
            for pid in pids_to_kill:
                print(f"  Killing process {pid} on port {port}")
                # Use taskkill with /F (force) and /T (tree) to kill child processes too
                subprocess.run(
                    ['taskkill', '/F', '/T', '/PID', pid],
                    capture_output=True,
                    shell=True
                )
            
            return len(pids_to_kill) > 0
            
        except Exception as e:
            print(f"  Warning: Could not kill process on port {port}: {e}")
            return False
    else:  # Unix/Linux/Mac
        try:
            result = subprocess.run(
                ['lsof', '-ti', f':{port}'],
                capture_output=True,
                text=True
            )
            if result.stdout.strip():
                pids = result.stdout.strip().split('\n')
                for pid in pids:
                    if pid.isdigit():
                        print(f"  Killing process {pid} on port {port}")
                        os.kill(int(pid), signal.SIGKILL)
                return True
            return False
        except Exception as e:
            print(f"  Warning: Could not kill process on port {port}: {e}")
            return False


def check_ports_warning():
    """Check if required ports are in use and warn user before proceeding."""
    blocked_ports = []
    
    for port in PORTS_TO_CLEAR:
        if is_port_in_use(port):
            blocked_ports.append(port)
    
    if not blocked_ports:
        return True  # All clear, proceed
    
    # Show warning
    print("\n" + "=" * 60)
    print("  WARNING: Ghost processes detected!")
    print("=" * 60)
    print(f"\nThe following ports are already in use: {blocked_ports}")
    print("\nThis will prevent the dev server from starting properly.")
    print("\nOptions:")
    print("  [K] Kill the processes and continue")
    print("  [Q] Quit and handle manually")
    print()
    
    while True:
        try:
            choice = input("Choose an option [K/Q]: ").strip().upper()
            if choice == 'K':
                return True  # User wants to kill and proceed
            elif choice == 'Q':
                print("\nExiting. You can manually kill processes with:")
                print("  netstat -ano | findstr :8000")
                print("  taskkill /F /PID <pid>")
                return False
            else:
                print("Invalid choice. Please enter K or Q.")
        except (KeyboardInterrupt, EOFError):
            print("\nExiting.")
            return False


def clear_ports():
    """Clear any processes using our required ports."""
    print("\n=== Clearing blocked ports ===\n")
    
    any_killed = False
    for port in PORTS_TO_CLEAR:
        if is_port_in_use(port):
            print(f"Port {port} is in use, attempting to free it...")
            if kill_process_on_port(port):
                any_killed = True
                # Give the OS a moment to release the port
                import time
                time.sleep(0.5)
                if is_port_in_use(port):
                    print(f"  Warning: Port {port} may still be in use")
                else:
                    print(f"  Port {port} is now free")
    
    if any_killed:
        print("\n=== Cleared ghost processes ===\n")
    else:
        print("\n=== Ports cleared ===\n")


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
    
    if os.name == 'nt':  # Windows - need to kill process trees
        for proc in processes:
            try:
                # Use taskkill with /T to kill the entire process tree
                subprocess.run(
                    ['taskkill', '/F', '/T', '/PID', str(proc.pid)],
                    capture_output=True,
                    shell=True
                )
            except Exception as e:
                print(f"Warning: Failed to kill process {proc.pid}: {e}")
        
        # Also clear the ports to catch any stragglers
        import time
        time.sleep(0.5)
        for port in PORTS_TO_CLEAR:
            if is_port_in_use(port):
                kill_process_on_port(port)
    else:  # Unix - terminate then kill
        for proc in processes:
            proc.terminate()
        for proc in processes:
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill()
    
    print("=== All services stopped ===")
    sys.exit(0)


def clear_shared_data():
    """Clear the shared-data directory contents at startup."""
    import shutil
    
    shared_data_dir = ROOT / "shared-data"
    
    if shared_data_dir.exists():
        print("\n=== Clearing shared-data directory ===\n")
        for item in shared_data_dir.iterdir():
            if item.is_dir():
                shutil.rmtree(item)
                print(f"  Removed: {item.name}/")
            else:
                item.unlink()
                print(f"  Removed: {item.name}")
        print("\n=== shared-data cleared ===\n")
    else:
        print("\n=== Creating shared-data directory ===\n")
        shared_data_dir.mkdir(parents=True, exist_ok=True)


def main():
    # Handle Ctrl+C
    signal.signal(signal.SIGINT, shutdown)
    if os.name != "nt":
        signal.signal(signal.SIGTERM, shutdown)

    # Check for ghost processes and warn user
    if not check_ports_warning():
        sys.exit(1)
    
    # Clear any ghost processes holding our ports (user approved)
    clear_ports()

    # Clear shared-data directory
    clear_shared_data()

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
