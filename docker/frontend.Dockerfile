FROM node:18-alpine AS base

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Default port for Next.js
ENV PORT=3000
EXPOSE 3000

CMD ["npm", "start"]