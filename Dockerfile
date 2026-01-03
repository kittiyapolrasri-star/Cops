# Backend Build
FROM node:20-alpine AS backend-builder

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci --legacy-peer-deps

COPY backend/ ./
RUN npx prisma generate
RUN npm run build

# Backend Production
FROM node:20-alpine AS backend

WORKDIR /app

COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/node_modules ./node_modules
COPY --from=backend-builder /app/backend/package*.json ./
COPY --from=backend-builder /app/backend/prisma ./prisma

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 4000

CMD ["npm", "run", "start:prod"]

# Frontend Build
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci --legacy-peer-deps

COPY frontend/ ./
RUN npm run build

# Frontend Production
FROM node:20-alpine AS frontend

WORKDIR /app

COPY --from=frontend-builder /app/frontend/.next ./.next
COPY --from=frontend-builder /app/frontend/public ./public
COPY --from=frontend-builder /app/frontend/node_modules ./node_modules
COPY --from=frontend-builder /app/frontend/package*.json ./
COPY --from=frontend-builder /app/frontend/next.config.js ./

EXPOSE 3000

CMD ["npm", "run", "start"]
