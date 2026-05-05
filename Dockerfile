# syntax=docker/dockerfile:1

FROM node:22-alpine AS frontend-build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY index.html tsconfig.json vite.config.ts ./
COPY src ./src
RUN npm run build

FROM node:22-alpine AS server-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/tsconfig.json ./
COPY server/src ./src
RUN npm run build

FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000
ENV FRONTEND_DIST_DIR=/app/dist
ENV FILE_STORAGE_DIR=/app/server/storage

COPY --from=frontend-build /app/dist ./dist
COPY server/package*.json ./server/
RUN npm --prefix server ci --omit=dev
COPY --from=server-build /app/server/dist ./server/dist

RUN mkdir -p /app/server/storage
EXPOSE 4000
CMD ["npm", "--prefix", "server", "run", "start"]
