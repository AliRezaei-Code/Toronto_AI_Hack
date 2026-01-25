FROM node:18-alpine AS base

WORKDIR /app

COPY package*.json ./
RUN npm install -g pnpm
RUN pnpm install 

COPY . .
RUN pnpm run build
RUN npm run build

# Default port for Next.js
ENV PORT=3010
EXPOSE 3010

CMD ["npm", "start"]