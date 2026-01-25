# ===========================================
# Production Frontend Dockerfile
# Multi-stage build for optimized image size
# ===========================================

# Dependencies stage
FROM node:18-alpine AS deps

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm@latest

# Copy root workspace files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./

# Copy web app package files
COPY apps/web/package.json ./apps/web/

# Install all dependencies (including workspace dependencies)
RUN pnpm install --frozen-lockfile

# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm@latest

# Copy workspace configuration
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy workspace packages if they exist
COPY packages/ ./packages/ 2>/dev/null || true

# Copy web application source
COPY apps/web/ ./apps/web/

# Set build environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js application (standalone output enabled in next.config.js)
WORKDIR /app/apps/web
RUN pnpm run build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3010

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone output from builder
# Next.js standalone output structure mirrors the project structure
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

# Set working directory to standalone root
WORKDIR /app/apps/web

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3010

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3010/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Start Next.js standalone server
CMD ["node", "server.js"]
