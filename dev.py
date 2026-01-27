#!/usr/bin/env python3
"""
Development server launcher - runs all services with hot reload.

Usage:
    python dev.py              # Start all services
    python dev.py --install    # Force reinstall dependencies
    python dev.py --no-clear   # Skip clearing shared-data

Handles pnpm workspaces and Python virtual environments elegantly.
"""

import subprocess
import sys
import os
import signal
import threading
import socket
import shutil
import time
from pathlib import Path
from typing import List, Dict, Any

ROOT = Path(__file__).parent

# Ports used by our services
PORTS_TO_CLEAR = [ 8000, 8001, 9000]  # web, backend, video-processor, mcp-server

# ANSI colors
RESET = "\033[0m"
BOLD = "\033[1m"
RED = "\033[31m"
GREEN = "\033[32m"
YELLOW = "\033[33m"
BLUE = "\033[34m"
MAGENTA = "\033[35m"
CYAN = "\033[36m"

processes: List[subprocess.Popen] = []
our_pids: set = set()
DEV_PY_PID = os.getpid()


# =============================================================================
# Logging Utilities
# =============================================================================

def log(message: str, color: str = "", prefix: str = ""):
    """Print a formatted log message."""
    if prefix:
        print(f"{color}[{prefix}]{RESET} {message}")
    else:
        print(f"{color}{message}{RESET}")


def log_header(message: str):
    """Print a section header."""
    print(f"\n{BOLD}{BLUE}{'=' * 60}{RESET}")
    print(f"{BOLD}{BLUE}  {message}{RESET}")
    print(f"{BOLD}{BLUE}{'=' * 60}{RESET}\n")


def log_success(message: str):
    """Print a success message."""
    print(f"{GREEN}  [OK]{RESET} {message}")


def log_warning(message: str):
    """Print a warning message."""
    print(f"{YELLOW}  [WARN]{RESET} {message}")


def log_error(message: str):
    """Print an error message."""
    print(f"{RED}  [ERR]{RESET} {message}")


# =============================================================================
# Tool Discovery
# =============================================================================

def find_python() -> str:
    """Find the best Python executable to use."""
    candidates = [
        # Explicit Windows paths (common locations)
        r"C:\Users\Chris\AppData\Local\Python\bin\python.exe",
        r"C:\Python311\python.exe",
        r"C:\Python310\python.exe",
        # System Python
        sys.executable,
        # Generic commands
        "python3",
        "python",
    ]

    for candidate in candidates:
        try:
            # Skip empty or None
            if not candidate:
                continue

            result = subprocess.run(
                [candidate, "--version"],
                capture_output=True,
                text=True,
                timeout=5,
            )
            if result.returncode == 0:
                version = result.stdout.strip() or result.stderr.strip()
                log_success(f"Python: {candidate} ({version})")
                return candidate
        except (FileNotFoundError, OSError, subprocess.TimeoutExpired):
            continue

    log_error("Could not find Python! Please install Python 3.11+")
    sys.exit(1)


def find_node_package_manager() -> str:
    """Find pnpm or npm, preferring pnpm for workspaces."""
    # Check for pnpm first (preferred for this workspace)
    try:
        result = subprocess.run(
            ["pnpm", "--version"],
            capture_output=True,
            text=True,
            shell=(os.name == "nt"),
            timeout=5,
        )
        if result.returncode == 0:
            log_success(f"Package manager: pnpm v{result.stdout.strip()}")
            return "pnpm"
    except (FileNotFoundError, OSError, subprocess.TimeoutExpired):
        pass

    # Fall back to npm
    try:
        result = subprocess.run(
            ["npm", "--version"],
            capture_output=True,
            text=True,
            shell=(os.name == "nt"),
            timeout=5,
        )
        if result.returncode == 0:
            log_warning(f"Using npm v{result.stdout.strip()} (pnpm recommended)")
            return "npm"
    except (FileNotFoundError, OSError, subprocess.TimeoutExpired):
        pass

    log_error("Neither pnpm nor npm found! Please install Node.js and pnpm")
    sys.exit(1)


# =============================================================================
# Port Management
# =============================================================================

def is_port_in_use(port: int) -> bool:
    """Check if a port is currently in use."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0


def kill_process_on_port(port: int, skip_our_pids: bool = True) -> bool:
    """Kill any process using the specified port."""
    if os.name == 'nt':  # Windows
        try:
            result = subprocess.run(
                ['netstat', '-ano', '-p', 'TCP'],
                capture_output=True,
                text=True,
                shell=True
            )

            pids_to_kill = set()
            for line in result.stdout.split('\n'):
                if f':{port}' in line and 'LISTENING' in line:
                    parts = line.split()
                    if len(parts) >= 5:
                        pid = parts[-1]
                        if pid.isdigit() and pid != '0':
                            pid_int = int(pid)
                            if pid_int == DEV_PY_PID:
                                continue
                            if skip_our_pids and pid_int in our_pids:
                                continue
                            pids_to_kill.add(pid)

            for pid in pids_to_kill:
                log(f"Killing PID {pid} on port {port}", YELLOW, "PORT")
                subprocess.run(
                    ['taskkill', '/F', '/T', '/PID', pid],
                    capture_output=True,
                    shell=True
                )

            return len(pids_to_kill) > 0

        except Exception as e:
            log_warning(f"Could not kill process on port {port}: {e}")
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
                killed_any = False
                for pid_str in pids:
                    if pid_str.isdigit():
                        pid_int = int(pid_str)
                        if pid_int == DEV_PY_PID:
                            continue
                        if skip_our_pids and pid_int in our_pids:
                            continue
                        log(f"Killing PID {pid_int} on port {port}", YELLOW, "PORT")
                        os.kill(pid_int, signal.SIGKILL)
                        killed_any = True
                return killed_any
            return False
        except Exception as e:
            log_warning(f"Could not kill process on port {port}: {e}")
            return False


def check_ports_warning() -> bool:
    """Check if required ports are in use and warn user."""
    blocked_ports = [port for port in PORTS_TO_CLEAR if is_port_in_use(port)]

    if not blocked_ports:
        return True

    log_header("Ghost Processes Detected")
    log_warning(f"Ports already in use: {blocked_ports}")
    print("\n  This will prevent the dev server from starting properly.")
    print("\n  Options:")
    print("    [K] Kill the processes and continue")
    print("    [Q] Quit and handle manually")
    print()

    while True:
        try:
            choice = input("  Choose an option [K/Q]: ").strip().upper()
            if choice == 'K':
                return True
            elif choice == 'Q':
                print("\n  Exiting. Kill processes manually:")
                if os.name == 'nt':
                    print("    netstat -ano | findstr :<port>")
                    print("    taskkill /F /PID <pid>")
                else:
                    print("    lsof -ti :<port> | xargs kill -9")
                return False
            else:
                print("  Invalid choice. Please enter K or Q.")
        except (KeyboardInterrupt, EOFError):
            print("\n  Exiting.")
            return False


def clear_ports():
    """Clear any processes using our required ports."""
    log_header("Checking Ports")

    any_blocked = False
    for port in PORTS_TO_CLEAR:
        if is_port_in_use(port):
            any_blocked = True
            log(f"Port {port} is in use, freeing...", YELLOW, "PORT")
            if kill_process_on_port(port, skip_our_pids=True):
                time.sleep(0.5)
                if is_port_in_use(port):
                    log_warning(f"Port {port} may still be in use")
                else:
                    log_success(f"Port {port} freed")

    if not any_blocked:
        log_success("All ports available")


# =============================================================================
# Dependency Installation
# =============================================================================

def install_workspace_deps(pkg_manager: str) -> bool:
    """Install all Node.js workspace dependencies from root."""
    log_header("Installing Node.js Workspace")

    # Use frozen lockfile if available
    if pkg_manager == "pnpm":
        if (ROOT / "pnpm-lock.yaml").exists():
            cmd = ["pnpm", "install", "--frozen-lockfile"]
        else:
            cmd = ["pnpm", "install"]
    else:
        if (ROOT / "package-lock.json").exists():
            cmd = ["npm", "ci"]
        else:
            cmd = ["npm", "install"]

    log(f"Running: {' '.join(cmd)}", BLUE)
    print()

    result = subprocess.run(
        cmd,
        cwd=ROOT,
        shell=(os.name == "nt"),
    )

    if result.returncode != 0:
        log_error("Failed to install Node.js dependencies!")
        return False

    log_success("Node.js workspace ready")
    return True


def install_python_deps(python_cmd: str, services: List[Dict[str, Any]]) -> bool:
    """Install Python dependencies for all Python services."""
    log_header("Installing Python Dependencies")

    python_services = [s for s in services if s.get("type") == "python"]

    for svc in python_services:
        req_file = svc.get("requirements")
        if req_file and req_file.exists():
            log(f"Installing {svc['name']}...", svc["color"], svc["name"])

            result = subprocess.run(
                [python_cmd, "-m", "pip", "install", "-r", str(req_file), "-q", "--disable-pip-version-check"],
                cwd=svc["cwd"],
            )

            if result.returncode != 0:
                log_error(f"Failed to install {svc['name']} dependencies!")
                return False

            log_success(f"{svc['name']} dependencies installed")
        else:
            log_warning(f"No requirements.txt for {svc['name']}")

    return True


def needs_install() -> bool:
    """Check if dependencies need to be installed."""
    # Check root node_modules (workspace install)
    if not (ROOT / "node_modules").exists():
        return True

    # Check apps/web node_modules
    web_modules = ROOT / "apps" / "web" / "node_modules"
    if not web_modules.exists():
        return True

    return False


# =============================================================================
# Service Configuration
# =============================================================================

def get_services(python_cmd: str, pkg_manager: str) -> List[Dict[str, Any]]:
    """Build service configurations based on available directories."""
    services = []

    # Web frontend (Next.js via workspace)
  #web_dir = ROOT / "apps" / "web"
  #if web_dir.exists():
  #    services.append({
  #        "name": "web",
  #        "cwd": web_dir,
  #        "run": [pkg_manager, "run", "dev"],
  #        "color": CYAN,
  #        "type": "node",
  #        "port": 3000,
  #    })

    # Backend API (FastAPI)
    backend_dir = ROOT / "backend"
    if backend_dir.exists():
        services.append({
            "name": "backend",
            "cwd": backend_dir,
            "run": [python_cmd, "-m", "uvicorn", "app.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"],
            "color": YELLOW,
            "type": "python",
            "requirements": backend_dir / "requirements.txt",
            "port": 8000,
        })

    # MCP Server
    mcp_dir = ROOT / "mcp-server"
    if mcp_dir.exists():
        services.append({
            "name": "mcp-server",
            "cwd": mcp_dir,
            "run": [python_cmd, "-m", "uvicorn", "server:app", "--reload", "--host", "0.0.0.0", "--port", "9000"],
            "color": MAGENTA,
            "type": "python",
            "requirements": mcp_dir / "requirements.txt",
            "port": 9000,
        })

    # Video Processor (MediaPipe)
    video_dir = ROOT / "video-processor"
    if video_dir.exists():
        services.append({
            "name": "video-processor",
            "cwd": video_dir,
            "run": [python_cmd, "-m", "uvicorn", "api:app", "--reload", "--host", "0.0.0.0", "--port", "8001"],
            "color": GREEN,
            "type": "python",
            "requirements": video_dir / "requirements.txt",
            "port": 8001,
        })

    return services


# =============================================================================
# Service Runtime
# =============================================================================

def stream_output(proc: subprocess.Popen, name: str, color: str):
    """Stream subprocess output with colored prefix."""
    try:
        for line in iter(proc.stdout.readline, ""):
            if line:
                print(f"{color}[{name}]{RESET} {line}", end="")
    except (ValueError, OSError):
        pass


def start_services(services: List[Dict[str, Any]]):
    """Start all services with hot reload."""
    log_header("Starting Services")

    started = []
    for svc in services:
        if not svc["cwd"].exists():
            log_warning(f"Skipping {svc['name']}: directory not found")
            continue

        cmd_str = ' '.join(str(c) for c in svc['run'])
        log(f"Starting: {cmd_str}", svc["color"], svc["name"])

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
        our_pids.add(proc.pid)
        started.append(svc)

        thread = threading.Thread(
            target=stream_output,
            args=(proc, svc["name"], svc["color"]),
            daemon=True,
        )
        thread.start()

    # Print service URLs
    print()
    log_header("Services Ready")
    for svc in started:
        port = svc.get("port", "?")
        if svc["name"] == "web":
            url = f"http://localhost:{port}"
        elif svc["name"] == "backend":
            url = f"http://localhost:{port}/docs"
        else:
            url = f"http://localhost:{port}/health"
        print(f"  {svc['color']}[{svc['name']}]{RESET}  {url}")

    print(f"\n  Press {BOLD}Ctrl+C{RESET} to stop all services.\n")


def shutdown(signum=None, frame=None):
    """Gracefully shutdown all processes."""
    log_header("Shutting Down")

    if os.name == 'nt':
        for proc in processes:
            try:
                subprocess.run(
                    ['taskkill', '/F', '/T', '/PID', str(proc.pid)],
                    capture_output=True,
                    shell=True
                )
            except Exception:
                pass

        time.sleep(0.5)
        for port in PORTS_TO_CLEAR:
            if is_port_in_use(port):
                kill_process_on_port(port, skip_our_pids=False)
    else:
        for proc in processes:
            proc.terminate()
        for proc in processes:
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill()

    log_success("All services stopped")
    sys.exit(0)


def clear_shared_data():
    """Clear the shared-data directory contents at startup."""
    shared_data_dir = ROOT / "shared-data"

    if shared_data_dir.exists():
        items = list(shared_data_dir.iterdir())
        if items:
            log_header("Clearing Shared Data")
            for item in items:
                if item.is_dir():
                    shutil.rmtree(item)
                else:
                    item.unlink()
            log_success(f"Removed {len(items)} items from shared-data/")
    else:
        shared_data_dir.mkdir(parents=True, exist_ok=True)
        log_success("Created shared-data/")


# =============================================================================
# Main Entry Point
# =============================================================================

def main():
    # Handle signals
    signal.signal(signal.SIGINT, shutdown)
    if os.name != "nt":
        signal.signal(signal.SIGTERM, shutdown)

    # Banner
    print()
    print(f"{BOLD}{CYAN}╔══════════════════════════════════════════════════════════╗{RESET}")
    print(f"{BOLD}{CYAN}║        Toronto AI Hack - Development Server              ║{RESET}")
    print(f"{BOLD}{CYAN}╚══════════════════════════════════════════════════════════╝{RESET}")
    print()

    # Discover tools
    log_header("Discovering Tools")
    python_cmd = find_python()
    pkg_manager = None

    # Build service list
    services = get_services(python_cmd, pkg_manager)
    if not services:
        log_error("No services found! Check your project structure.")
        sys.exit(1)

    log_success(f"Found {len(services)} services: {', '.join(s['name'] for s in services)}")

    # Port management
    if not check_ports_warning():
        sys.exit(1)
    clear_ports()

    # Clear shared-data (unless --no-clear)
    if "--no-clear" not in sys.argv:
        clear_shared_data()

    # Install dependencies
    force_install = "--install" in sys.argv
    if force_install or needs_install():
       # if not install_workspace_deps(pkg_manager):
       #     sys.exit(1)
        if not install_python_deps(python_cmd, services):
            sys.exit(1)
    else:
        log_success("Dependencies already installed (use --install to reinstall)")

    # Start services
    start_services(services)

    # Keep alive
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        shutdown()


if __name__ == "__main__":
    main()
