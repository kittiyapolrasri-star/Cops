#!/bin/bash

# Deployment Helper Script for C.O.P.S.
# Usage: ./deploy.sh

echo "🚀 Starting Deployment Process..."

# 1. Update Codebase
echo "📥 Pulling latest code from git..."
git pull origin main

# 2. Stop Containers (to ensure clean state)
echo "🛑 Stopping containers..."
docker-compose down

# 3. Clean up (Optional but recommended for consistency)
# Removes old images to save space and ensure fresh builds
echo "🧹 Cleaning up old resources..."
docker image prune -f

# 4. Start & Build
echo "🏗️  Building and Starting containers..."
# Using --build to force rebuild of images
docker-compose up -d --build

# 5. Wait for Backend
echo "⏳ Waiting for backend to initialize (30s)..."
sleep 30

# 6. Run Database Migrations (Explicitly)
echo "🔄 Running Database Migrations..."
docker exec cops-backend npx prisma migrate deploy || echo "⚠️ Migration command failed (might have run during startup)"

# 7. Check Health
echo "🏥 Checking System Health..."
docker-compose ps

echo "✅ Deployment Complete!"
echo "----------------------------------------"
echo "Frontend: http://43.229.133.251:3000"
echo "Backend:  http://43.229.133.251:4005"
echo "----------------------------------------"
echo "To view logs: docker-compose logs -f"
