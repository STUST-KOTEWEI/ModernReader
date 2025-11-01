#!/bin/bash

# Test CI Pipeline Locally
# This script mimics the GitHub Actions CI pipeline for local testing

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
echo "  Testing CI Pipeline Locally"
echo "=================================================="
echo ""

FAILED=0

# Backend Tests
echo -e "${BLUE}=== Backend Tests ===${NC}"
cd "$PROJECT_ROOT/backend"

echo -e "${YELLOW}→ Checking Poetry installation...${NC}"
if ! command -v poetry &> /dev/null; then
    echo -e "${RED}✗ Poetry not found${NC}"
    ((FAILED++))
else
    echo -e "${GREEN}✓ Poetry installed${NC}"
fi

echo ""
echo -e "${YELLOW}→ Installing dependencies...${NC}"
poetry install --no-interaction || ((FAILED++))

echo ""
echo -e "${YELLOW}→ Running Ruff (linter)...${NC}"
if poetry run ruff check .; then
    echo -e "${GREEN}✓ Ruff passed${NC}"
else
    echo -e "${RED}✗ Ruff failed${NC}"
    ((FAILED++))
fi

echo ""
echo -e "${YELLOW}→ Running MyPy (type checker)...${NC}"
if poetry run mypy .; then
    echo -e "${GREEN}✓ MyPy passed${NC}"
else
    echo -e "${RED}✗ MyPy failed${NC}"
    ((FAILED++))
fi

echo ""
echo -e "${YELLOW}→ Running Bandit (security)...${NC}"
if poetry run bandit -r app/ -ll; then
    echo -e "${GREEN}✓ Bandit passed${NC}"
else
    echo -e "${RED}✗ Bandit failed${NC}"
    ((FAILED++))
fi

echo ""
echo -e "${YELLOW}→ Running Safety (dependency check)...${NC}"
if poetry run safety check --json || true; then
    echo -e "${GREEN}✓ Safety check completed${NC}"
else
    echo -e "${YELLOW}⚠ Safety check had warnings${NC}"
fi

echo ""
echo -e "${YELLOW}→ Running Pytest...${NC}"
if poetry run pytest --cov=app --cov-report=term --cov-report=xml; then
    echo -e "${GREEN}✓ Tests passed${NC}"
else
    echo -e "${RED}✗ Tests failed${NC}"
    ((FAILED++))
fi

# Frontend Tests
echo ""
echo -e "${BLUE}=== Frontend Tests ===${NC}"
cd "$PROJECT_ROOT/frontend"

echo -e "${YELLOW}→ Checking npm installation...${NC}"
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm not found${NC}"
    ((FAILED++))
else
    echo -e "${GREEN}✓ npm installed${NC}"
fi

echo ""
echo -e "${YELLOW}→ Installing dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    npm install || ((FAILED++))
else
    echo -e "${GREEN}✓ Dependencies already installed${NC}"
fi

echo ""
echo -e "${YELLOW}→ Running ESLint...${NC}"
if npm run lint; then
    echo -e "${GREEN}✓ ESLint passed${NC}"
else
    echo -e "${RED}✗ ESLint failed${NC}"
    ((FAILED++))
fi

echo ""
echo -e "${YELLOW}→ Running TypeScript check...${NC}"
if npm run type-check; then
    echo -e "${GREEN}✓ TypeScript check passed${NC}"
else
    echo -e "${RED}✗ TypeScript check failed${NC}"
    ((FAILED++))
fi

echo ""
echo -e "${YELLOW}→ Building frontend...${NC}"
if npm run build; then
    echo -e "${GREEN}✓ Build succeeded${NC}"
else
    echo -e "${RED}✗ Build failed${NC}"
    ((FAILED++))
fi

# Summary
cd "$PROJECT_ROOT"
echo ""
echo "=================================================="
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All CI tests passed!${NC}"
    echo "=================================================="
    exit 0
else
    echo -e "${RED}❌ $FAILED test(s) failed${NC}"
    echo "=================================================="
    exit 1
fi
