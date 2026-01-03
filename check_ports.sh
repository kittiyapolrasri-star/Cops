#!/bin/bash

# COPS System - Port Availability Check Script
# Run this on your Linux VM before deploying to check for conflicts.

echo "=========================================="
echo "   C.O.P.S. Deployment Port Check"
echo "=========================================="
echo ""

# Define ports to check (Default values)
PORTS=(
  3000  # Frontend
  4000  # Backend
  5432  # PostgreSQL
  6379  # Redis
  80    # Nginx HTTP
  443   # Nginx HTTPS
)

# Service Names for display
NAMES=(
  "Next.js Frontend"
  "NestJS Backend"
  "PostgreSQL DB"
  "Redis Cache"
  "Nginx Web"
  "Nginx SSL"
)

CONFLICT_FOUND=false

for i in "${!PORTS[@]}"; do
  PORT=${PORTS[$i]}
  NAME=${NAMES[$i]}

  # Check if port is in use using 'ss' or 'netstat'
  if command -v ss >/dev/null 2>&1; then
    IS_USED=$(ss -tuln | grep ":$PORT " | wc -l)
  elif command -v netstat >/dev/null 2>&1; then
    IS_USED=$(netstat -tuln | grep ":$PORT " | wc -l)
  else
    echo "Error: Neither 'ss' nor 'netstat' found. Cannot check ports."
    exit 1
  fi

  if [ "$IS_USED" -gt 0 ]; then
    echo -e "❌ CRITICAL: Port $PORT ($NAME) is \033[1;31mOCCUPIED\033[0m"
    CONFLICT_FOUND=true
  else
    echo -e "✅ OK: Port $PORT ($NAME) is \033[1;32mAVAILABLE\033[0m"
  fi
done

echo ""
echo "=========================================="
if [ "$CONFLICT_FOUND" = true ]; then
  echo -e "\033[1;31m⚠️  PORT CONFLICTS DETECTED!\033[0m"
  echo "You must change the ports in your .env file or docker-compose command."
  echo "Example usage to override ports:"
  echo ""
  echo "  export FRONTEND_PORT=3005"
  echo "  export BACKEND_PORT=4005"
  echo "  docker-compose -f docker-compose.prod.yml up -d"
else
  echo -e "\033[1;32m✨ SYSTEM READY FOR DEPLOYMENT\033[0m"
  echo "No conflicts found on standard ports."
fi
echo "=========================================="
