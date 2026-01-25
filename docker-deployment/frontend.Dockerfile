FROM node:18-alpine AS base

WORKDIR /app

COPY apps/web/ ./

RUN npm i
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
