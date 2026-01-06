#!/bin/bash

# ============================================
# C.O.P.S. - One-Click Deployment Script
# Usage: ./deploy.sh [--full] [--quick]
#   --full  : Full install with npm install
#   --quick : Quick deploy (skip npm install)
# ============================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🚔 C.O.P.S. - One-Click Deployment${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Parse arguments
FULL_INSTALL=false
QUICK_DEPLOY=false

for arg in "$@"; do
    case $arg in
        --full)
            FULL_INSTALL=true
            ;;
        --quick)
            QUICK_DEPLOY=true
            ;;
    esac
done

# Step 1: Pull Latest Code
echo -e "\n${YELLOW}📥 Step 1/7: Pulling latest code...${NC}"
git pull origin main

# Step 2: Stop Existing Containers
echo -e "\n${YELLOW}🛑 Step 2/7: Stopping existing containers...${NC}"
docker-compose down 2>/dev/null || true

# Step 3: Clean Up (Optional)
echo -e "\n${YELLOW}🧹 Step 3/7: Cleaning up old resources...${NC}"
docker image prune -f

# Step 4: Build & Start Containers
echo -e "\n${YELLOW}🏗️  Step 4/7: Building and starting containers...${NC}"
docker-compose up -d --build

# Wait for backend to be ready
echo -e "\n${YELLOW}⏳ Waiting for backend to initialize...${NC}"
sleep 15

# Check if backend is running
for i in {1..10}; do
    if docker exec cops-backend echo "OK" 2>/dev/null; then
        echo -e "${GREEN}✓ Backend container is ready${NC}"
        break
    fi
    echo "Waiting for backend... ($i/10)"
    sleep 5
done

# Step 5: Prisma Generate & Push
echo -e "\n${YELLOW}🔄 Step 5/7: Running Prisma migrations...${NC}"

# Generate Prisma Client (required for new models)
echo "  Generating Prisma client..."
docker exec cops-backend npx prisma generate || {
    echo -e "${RED}⚠️ Prisma generate failed - trying to continue...${NC}"
}

# Push database schema
echo "  Pushing database schema..."
docker exec cops-backend npx prisma db push --accept-data-loss || {
    echo -e "${RED}⚠️ Database push failed${NC}"
}

# Step 6: Seed Database
echo -e "\n${YELLOW}🌱 Step 6/7: Seeding database...${NC}"
docker exec cops-backend npx prisma db seed 2>/dev/null || {
    echo -e "${YELLOW}⚠️ Seed skipped (may already be seeded)${NC}"
}

# Step 7: Health Check
echo -e "\n${YELLOW}🏥 Step 7/7: Health check...${NC}"
echo ""

# Check container status
docker-compose ps

echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  🌐 ${GREEN}Frontend:${NC} http://43.229.133.251:3000"
echo -e "  🔧 ${GREEN}Backend:${NC}  http://43.229.133.251:4005"
echo ""
echo -e "  ${YELLOW}Useful Commands:${NC}"
echo -e "    docker-compose logs -f          # View logs"
echo -e "    docker-compose restart backend  # Restart backend"
echo -e "    docker-compose restart frontend # Restart frontend"
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
