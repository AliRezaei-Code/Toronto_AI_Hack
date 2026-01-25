# Production Docker Deployment

This folder contains production-optimized Dockerfiles for all services in the Toronto AI Hack project. These Dockerfiles are designed for production deployment with optimized image sizes, security best practices, and efficient build caching.

## Overview

The production Dockerfiles use multi-stage builds to create smaller, more secure images compared to the development Dockerfiles in the `docker/` folder. Key optimizations include:

- **Multi-stage builds** - Separate build and runtime stages to minimize final image size
- **Layer caching** - Optimized layer ordering for better build cache utilization
- **Security** - Non-root users, minimal base images, reduced attack surface
- **Production settings** - Optimized runtime configurations, health checks, proper signal handling

## Dockerfiles

### backend.Dockerfile
Production-optimized Dockerfile for the FastAPI backend service.

**Features:**
- Multi-stage build (builder + runtime)
- Non-root user execution
- Production uvicorn settings (4 workers)
- Health check endpoint
- Minimal Python runtime image

**Build:**
```bash
docker build -f docker-deployment/backend.Dockerfile -t backend:latest .
```

### frontend.Dockerfile
Production-optimized Dockerfile for the Next.js frontend with Remotion support.

**Features:**
- Three-stage build (dependencies + builder + runner)
- Next.js standalone output for minimal runtime
- pnpm workspace support
- Non-root user execution
- Production environment variables

**Note:** Requires `output: 'standalone'` in `next.config.js` (already configured)

**Build:**
```bash
docker build -f docker-deployment/frontend.Dockerfile -t frontend:latest .
```

### mcp-server.Dockerfile
Production-optimized Dockerfile for the MCP (Model Context Protocol) server.

**Features:**
- Multi-stage build
- Non-root user execution
- Production uvicorn settings (2 workers)
- Health check endpoint
- Minimal Python runtime image

**Build:**
```bash
docker build -f docker-deployment/mcp-server.Dockerfile -t mcp-server:latest .
```

### video-processor.Dockerfile
Production-optimized Dockerfile for the video processing service (OpenCV/MediaPipe).

**Features:**
- Multi-stage build with optimized OpenCV/MediaPipe installation
- Separate build dependencies from runtime
- Non-root user execution
- Production uvicorn settings (2 workers)
- Health check endpoint

**Build:**
```bash
docker build -f docker-deployment/video-processor.Dockerfile -t video-processor:latest .
```

## Build Context

All Dockerfiles use the repository root (`.`) as the build context. This allows access to:
- Workspace configuration files (`pnpm-workspace.yaml`, `package.json`)
- Service-specific directories (`backend/`, `apps/web/`, `mcp-server/`, `video-processor/`)
- Shared dependencies and configurations

## Image Size Comparison

The production Dockerfiles are optimized for smaller image sizes:

| Service | Development | Production | Reduction |
|---------|------------|------------|-----------|
| Backend | ~500MB | ~200MB | ~60% |
| Frontend | ~800MB | ~150MB | ~81% |
| MCP Server | ~400MB | ~180MB | ~55% |
| Video Processor | ~1.2GB | ~600MB | ~50% |

*Note: Actual sizes may vary based on dependencies and system architecture.*

## Security Features

All production Dockerfiles implement security best practices:

1. **Non-root users** - All services run as non-privileged users
2. **Minimal base images** - Using `alpine` or `slim` variants
3. **No build tools in runtime** - Build dependencies are excluded from final images
4. **Proper file permissions** - Files owned by non-root users
5. **Health checks** - All services include health check endpoints

## Production Settings

### Backend & MCP Server
- Uvicorn with multiple workers for better concurrency
- Timeout configurations for production workloads
- Proper signal handling for graceful shutdowns

### Frontend
- Next.js standalone output (minimal runtime)
- Production environment variables
- Optimized static asset serving

### Video Processor
- Optimized OpenCV/MediaPipe installation
- Separate temp directory with proper permissions
- Health check for service monitoring

## CI/CD Integration

The production Dockerfiles are integrated with GitHub Actions workflow (`.github/workflows/deploy.yml`):

1. **Build** - Images are built and pushed to GitHub Container Registry (ghcr.io)
2. **Tagging** - Images tagged with `latest` and commit SHA
3. **Caching** - Build cache stored in GitHub Actions cache
4. **Deployment** - Images pulled and deployed to production VM

## Local Testing

To test production builds locally:

```bash
# Build all services
docker build -f docker-deployment/backend.Dockerfile -t backend:prod .
docker build -f docker-deployment/frontend.Dockerfile -t frontend:prod .
docker build -f docker-deployment/mcp-server.Dockerfile -t mcp-server:prod .
docker build -f docker-deployment/video-processor.Dockerfile -t video-processor:prod .

# Test with docker-compose
# Update docker-compose.deployed.yml to use local images
docker compose -f docker-compose.deployed.yml up
```

## Troubleshooting

### Frontend Build Issues
- Ensure `output: 'standalone'` is set in `next.config.js`
- Verify pnpm workspace configuration is correct
- Check that all workspace dependencies are properly installed

### Backend/MCP Server Issues
- Verify Python dependencies are correctly specified in `requirements.txt`
- Check that system dependencies (ffmpeg) are properly installed
- Ensure health check endpoints are accessible

### Video Processor Issues
- OpenCV/MediaPipe installation can be slow - ensure sufficient build time
- Verify system dependencies for OpenCV are correctly installed
- Check temp directory permissions

## Migration Notes

- Development Dockerfiles remain in `docker/` folder for local development
- Production builds use `docker-deployment/` folder
- Both can coexist - development uses `docker-compose.yml`, production uses `docker-compose.deployed.yml`
- GitHub Actions automatically uses production Dockerfiles

## Best Practices

1. **Always test builds locally** before pushing to production
2. **Monitor image sizes** - keep them as small as possible
3. **Update base images regularly** - keep security patches current
4. **Review dependency updates** - minimize security vulnerabilities
5. **Use specific tags** - avoid `latest` in production when possible
6. **Monitor health checks** - ensure services are responding correctly

## Additional Resources

- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Next.js Docker Deployment](https://nextjs.org/docs/deployment#docker-image)
- [Python Docker Optimization](https://pythonspeed.com/articles/docker-caching-model/)
- [Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)
