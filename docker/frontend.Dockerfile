FROM node:18-alpine AS base

WORKDIR /app

COPY package*.json ./
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build
RUN npm run build

# Default port for Next.js
ENV PORT=3000
EXPOSE 3000

CMD ["npm", "start"]