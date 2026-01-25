# syntax=docker/dockerfile:1

FROM node:18-alpine AS deps
WORKDIR /app

# pnpm
RUN corepack enable

# Copy only dependency manifests first (best caching)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./

# If monorepo, copy package.json files for workspaces (CHANGE ME as needed)
# These lines are optional, but help pnpm resolve workspaces without copying all source yet.
COPY apps/*/package.json ./apps/
COPY packages/*/package.json ./packages/

RUN pnpm install --frozen-lockfile

FROM node:18-alpine AS builder
WORKDIR /app
RUN corepack enable

# deps from previous stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=deps /app/pnpm-workspace.yaml* ./

# Now copy the full source (this is where your code comes in)
COPY . .

# Build (CHANGE ME: use your real build command / filter)
# Examples:
# RUN pnpm -C apps/web build
# RUN pnpm --filter web build
RUN pnpm build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable

# Copy only what you need to run
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# CHANGE ME: copy the built output for your Next app
# If Next.js standalone output:
# COPY --from=builder /app/apps/web/.next/standalone ./
# COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
# COPY --from=builder /app/apps/web/public ./apps/web/public
#
# If not standalone, simplest:
COPY --from=builder /app ./

# Your container maps host:FRONTEND_PORT -> 3010, so expose 3010
EXPOSE 3010

# CHANGE ME: your start command
# Examples:
# CMD ["pnpm", "-C", "apps/web", "start", "--port", "3010"]
CMD ["pnpm", "start", "--port", "3010"]
