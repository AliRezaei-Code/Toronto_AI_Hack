# Ubicloud Networking Configuration for Retentio.ca

## Architecture Overview

```
Internet
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│  Ubicloud VM                                            │
│                                                         │
│   ┌─────────────┐                                       │
│   │   Caddy     │ :80, :443 (public)                    │
│   │  (reverse   │                                       │
│   │   proxy)    │                                       │
│   └──────┬──────┘                                       │
│          │                                              │
│          ▼                                              │
│   ┌─────────────────────────────────────────────────┐   │
│   │  Docker Network (video-editor-network)          │   │
│   │                                                 │   │
│   │  ┌──────────┐      ┌──────────────┐             │   │
│   │  │   web    │◄─────│   backend    │             │   │
│   │  │  :3010   │      │    :8000     │             │   │
│   │  └──────────┘      └──────┬───────┘             │   │
│   │       ▲                   │                     │   │
│   │       │                   ▼                     │   │
│   │  Caddy routes        ┌──────────────┐           │   │
│   │  / → :3010           │  mcp-server  │           │   │
│   │  /api/* → :8000      │    :9000     │           │   │
│   │                      └──────────────┘           │   │
│   │                           │                     │   │
│   │                           ▼                     │   │
│   │                    ┌───────────────┐            │   │
│   │                    │video-processor│            │   │
│   │                    │    :8001      │            │   │
│   │                    └───────────────┘            │   │
│   └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Firewall Rules (Ubicloud)

Open only these ports to the public internet:

| Port | Protocol | Source    | Purpose            |
|------|----------|-----------|-------------------|
| 22   | TCP      | Your IP   | SSH access        |
| 80   | TCP      | 0.0.0.0/0 | HTTP (Caddy redirect) |
| 443  | TCP      | 0.0.0.0/0 | HTTPS (Caddy)     |

**Do NOT expose** ports 3010, 8000, 8001, or 9000 to the public internet.

### Ubicloud Firewall Setup

1. Navigate to your Ubicloud VM dashboard
2. Go to **Networking** → **Firewall**
3. Add the following rules:

```
# SSH (restrict to your IP for security)
Allow TCP 22 from <YOUR_IP>/32

# HTTP/HTTPS (public)
Allow TCP 80 from 0.0.0.0/0
Allow TCP 443 from 0.0.0.0/0
```

## Caddy Configuration

Save this as `/etc/caddy/Caddyfile`:

```caddyfile
retentio.ca www.retentio.ca {
  encode zstd gzip

  handle /api/* {
    uri strip_prefix /api
    reverse_proxy 127.0.0.1:8000
  }

  handle {
    reverse_proxy 127.0.0.1:3010
  }
}
```

Caddy will automatically obtain and renew Let's Encrypt SSL certificates.

## Docker Compose Port Bindings

The `docker-compose.deployed.yml` uses localhost-only bindings for security:

| Service         | Binding              | Accessible From        |
|-----------------|---------------------|------------------------|
| web             | 127.0.0.1:3010:3010 | Caddy only (localhost) |
| backend         | 127.0.0.1:8000:8000 | Caddy only (localhost) |
| mcp-server      | (none)              | Docker network only    |
| video-processor | (none)              | Docker network only    |

## DNS Configuration

Point your domain to the Ubicloud VM's public IP:

| Record | Name           | Value              | TTL  |
|--------|----------------|-------------------|------|
| A      | retentio.ca    | <UBICLOUD_IP>     | 300  |
| A      | www.retentio.ca| <UBICLOUD_IP>     | 300  |

## Deployment Steps

### 1. SSH into Ubicloud VM

```bash
ssh user@<UBICLOUD_IP>
```

### 2. Install Docker and Caddy

```bash
# Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Caddy
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

### 3. Configure Caddy

```bash
sudo nano /etc/caddy/Caddyfile
# Paste the Caddyfile content above
sudo systemctl reload caddy
```

### 4. Set Environment Variables

Create `.env` file in your project directory:

```bash
IMAGE_PREFIX=your-github-username/toronto_ai_hack
IMAGE_TAG=latest
OPENAI_API_KEY=sk-...
DEEPGRAM_API_KEY=...
```

### 5. Deploy Docker Stack

```bash
# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Pull and run
docker compose -f docker-compose.deployed.yml pull
docker compose -f docker-compose.deployed.yml up -d
```

### 6. Verify Deployment

```bash
# Check containers are running
docker compose -f docker-compose.deployed.yml ps

# Check Caddy status
sudo systemctl status caddy

# Test endpoints
curl http://localhost:3010  # Should return frontend
curl http://localhost:8000  # Should return backend response
curl https://retentio.ca    # Should work with HTTPS
```

## Troubleshooting

### Caddy can't connect to Docker services

```bash
# Verify Docker containers are running and bound to localhost
docker compose -f docker-compose.deployed.yml ps
netstat -tlnp | grep -E '3010|8000'
```

### SSL certificate issues

```bash
# Check Caddy logs
sudo journalctl -u caddy -f

# Ensure ports 80/443 are open and DNS is propagated
dig retentio.ca
```

### Services can't communicate internally

```bash
# Verify Docker network
docker network inspect video-editor-network

# Test internal connectivity
docker compose -f docker-compose.deployed.yml exec backend curl http://mcp-server:9000
```

## Security Checklist

- [ ] SSH key authentication enabled (password auth disabled)
- [ ] Firewall allows only ports 22, 80, 443
- [ ] Docker services bound to 127.0.0.1 only
- [ ] Environment variables not committed to git
- [ ] Caddy auto-renews SSL certificates
- [ ] Regular security updates enabled
