#!/bin/bash

# Health Check Script for ModernReader
# Verifies all services are running correctly

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

BACKEND_URL="${BACKEND_URL:-http://localhost:8001}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:5173}"

echo "=================================================="
echo "  ModernReader - Health Check"
echo "=================================================="
echo "Backend URL: $BACKEND_URL"
echo "Frontend URL: $FRONTEND_URL"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check service
check_service() {
  local name=$1
  local url=$2
  local max_retries=5
  local retry_delay=2
  
  echo -n "Checking $name... "
  
  for i in $(seq 1 $max_retries); do
    if curl -f -s -o /dev/null "$url"; then
      echo -e "${GREEN}✓ OK${NC}"
      return 0
    fi
    
    if [ $i -lt $max_retries ]; then
      echo -n "."
      sleep $retry_delay
    fi
  done
  
  echo -e "${RED}✗ FAILED${NC}"
  return 1
}

# Function to check backend endpoints
check_backend_endpoints() {
  echo ""
  echo "Checking Backend Endpoints..."
  
  local endpoints=(
    "/health:Health Check"
    "/api/auth/status:Auth Status"
    "/docs:API Documentation"
  )
  
  for endpoint_info in "${endpoints[@]}"; do
    IFS=':' read -r endpoint name <<< "$endpoint_info"
    check_service "$name" "$BACKEND_URL$endpoint" || true
  done
}

# Function to check database
check_database() {
  echo ""
  echo "Checking Database..."
  
  if [ -f "$PROJECT_ROOT/backend/modernreader.db" ]; then
    echo -e "${GREEN}✓ SQLite database exists${NC}"
  else
    echo -e "${YELLOW}⚠ Database not found (will be created on first run)${NC}"
  fi
}

# Function to check environment files
check_env_files() {
  echo ""
  echo "Checking Environment Files..."
  
  if [ -f "$PROJECT_ROOT/backend/.env" ]; then
    echo -e "${GREEN}✓ Backend .env exists${NC}"
  else
    echo -e "${RED}✗ Backend .env missing${NC}"
    echo "  Run: cp backend/.env.example backend/.env"
    return 1
  fi
  
  if [ -f "$PROJECT_ROOT/frontend/.env" ]; then
    echo -e "${GREEN}✓ Frontend .env exists${NC}"
  else
    echo -e "${RED}✗ Frontend .env missing${NC}"
    echo "  Run: cp frontend/.env.example frontend/.env"
    return 1
  fi
}

# Function to check dependencies
check_dependencies() {
  echo ""
  echo "Checking Dependencies..."
  
  # Check Python
  if command -v python3 &> /dev/null; then
    local python_version=$(python3 --version 2>&1 | awk '{print $2}')
    echo -e "${GREEN}✓ Python $python_version${NC}"
  else
    echo -e "${RED}✗ Python not found${NC}"
    return 1
  fi
  
  # Check Poetry
  if command -v poetry &> /dev/null; then
    local poetry_version=$(poetry --version 2>&1 | awk '{print $3}')
    echo -e "${GREEN}✓ Poetry $poetry_version${NC}"
  else
    echo -e "${YELLOW}⚠ Poetry not found (optional)${NC}"
  fi
  
  # Check Node.js
  if command -v node &> /dev/null; then
    local node_version=$(node --version 2>&1)
    echo -e "${GREEN}✓ Node.js $node_version${NC}"
  else
    echo -e "${RED}✗ Node.js not found${NC}"
    return 1
  fi
  
  # Check npm
  if command -v npm &> /dev/null; then
    local npm_version=$(npm --version 2>&1)
    echo -e "${GREEN}✓ npm $npm_version${NC}"
  else
    echo -e "${RED}✗ npm not found${NC}"
    return 1
  fi
  
  # Check Docker
  if command -v docker &> /dev/null; then
    local docker_version=$(docker --version 2>&1 | awk '{print $3}' | sed 's/,//')
    echo -e "${GREEN}✓ Docker $docker_version${NC}"
  else
    echo -e "${YELLOW}⚠ Docker not found (optional)${NC}"
  fi
}

# Function to check ports
check_ports() {
  echo ""
  echo "Checking Ports..."
  
  if lsof -Pi :8001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Port 8001 (Backend) is in use${NC}"
  else
    echo -e "${YELLOW}⚠ Port 8001 (Backend) is free${NC}"
  fi
  
  if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Port 5173 (Frontend) is in use${NC}"
  else
    echo -e "${YELLOW}⚠ Port 5173 (Frontend) is free${NC}"
  fi
}

# Main health check
main() {
  local failed=0
  
  check_dependencies || ((failed++))
  check_env_files || ((failed++))
  check_database
  check_ports
  
  # Try to check services
  echo ""
  echo "Checking Services..."
  check_service "Backend Health" "$BACKEND_URL/health" || ((failed++))
  check_service "Frontend" "$FRONTEND_URL" || ((failed++))
  
  check_backend_endpoints
  
  echo ""
  echo "=================================================="
  if [ $failed -eq 0 ]; then
    echo -e "${GREEN}All checks passed! ✓${NC}"
    echo "=================================================="
    exit 0
  else
    echo -e "${RED}Some checks failed! ($failed)${NC}"
    echo "=================================================="
    exit 1
  fi
}

main "$@"
