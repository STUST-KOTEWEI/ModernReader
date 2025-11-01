#!/bin/bash

# Test Docker Builds Locally
# This script tests Docker image builds before pushing to CI

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "=================================================="
echo "  Testing Docker Builds Locally"
echo "=================================================="
echo ""

FAILED=0

# Check Docker
echo -e "${YELLOW}→ Checking Docker installation...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker not found${NC}"
    echo "Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
else
    echo -e "${GREEN}✓ Docker installed${NC}"
fi

# Backend Docker Build
echo ""
echo -e "${BLUE}=== Building Backend Docker Image ===${NC}"
cd "$PROJECT_ROOT/backend"

echo -e "${YELLOW}→ Building backend image...${NC}"
if docker build -t modernreader-backend:test .; then
    echo -e "${GREEN}✓ Backend image built successfully${NC}"
else
    echo -e "${RED}✗ Backend image build failed${NC}"
    ((FAILED++))
fi

# Test backend image
if [ $FAILED -eq 0 ]; then
    echo -e "${YELLOW}→ Testing backend image...${NC}"
    if docker run --rm modernreader-backend:test python --version; then
        echo -e "${GREEN}✓ Backend image runs correctly${NC}"
    else
        echo -e "${RED}✗ Backend image test failed${NC}"
        ((FAILED++))
    fi
fi

# Frontend Docker Build
echo ""
echo -e "${BLUE}=== Building Frontend Docker Image ===${NC}"
cd "$PROJECT_ROOT/frontend"

echo -e "${YELLOW}→ Building frontend image...${NC}"
if docker build -t modernreader-frontend:test .; then
    echo -e "${GREEN}✓ Frontend image built successfully${NC}"
else
    echo -e "${RED}✗ Frontend image build failed${NC}"
    ((FAILED++))
fi

# Test frontend image
if [ $FAILED -eq 0 ]; then
    echo -e "${YELLOW}→ Testing frontend image...${NC}"
    if docker run --rm modernreader-frontend:test nginx -v; then
        echo -e "${GREEN}✓ Frontend image runs correctly${NC}"
    else
        echo -e "${RED}✗ Frontend image test failed${NC}"
        ((FAILED++))
    fi
fi

# Docker Compose Build
echo ""
echo -e "${BLUE}=== Testing Docker Compose ===${NC}"
cd "$PROJECT_ROOT"

echo -e "${YELLOW}→ Building with docker-compose...${NC}"
if docker-compose build; then
    echo -e "${GREEN}✓ Docker Compose build succeeded${NC}"
else
    echo -e "${RED}✗ Docker Compose build failed${NC}"
    ((FAILED++))
fi

# Check images
echo ""
echo -e "${BLUE}=== Built Images ===${NC}"
docker images | grep modernreader || true

# Clean up test images
echo ""
echo -e "${YELLOW}→ Cleaning up test images...${NC}"
docker rmi modernreader-backend:test 2>/dev/null || true
docker rmi modernreader-frontend:test 2>/dev/null || true
echo -e "${GREEN}✓ Cleanup complete${NC}"

# Summary
echo ""
echo "=================================================="
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All Docker builds passed!${NC}"
    echo "=================================================="
    echo ""
    echo "Next steps:"
    echo "1. Push to GitHub to trigger CI/CD"
    echo "2. Monitor GitHub Actions workflow"
    echo "3. Verify images in GitHub Container Registry"
    exit 0
else
    echo -e "${RED}❌ $FAILED build(s) failed${NC}"
    echo "=================================================="
    echo ""
    echo "Please fix the errors before pushing to GitHub"
    exit 1
fi
