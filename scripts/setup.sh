#!/bin/bash

# Quick Setup Script - Initialize ModernReader Development Environment
# This script sets up everything needed to run ModernReader

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
echo "  ModernReader - Quick Setup"
echo "=================================================="
echo ""

# 1. Check Prerequisites
echo -e "${BLUE}1️⃣  檢查系統需求...${NC}"

# Check Python
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version | awk '{print $2}')
    echo -e "  ${GREEN}✓ Python $PYTHON_VERSION${NC}"
else
    echo -e "  ${RED}✗ Python 3 未安裝${NC}"
    echo "    請安裝 Python 3.11+: https://www.python.org/downloads/"
    exit 1
fi

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "  ${GREEN}✓ Node.js $NODE_VERSION${NC}"
else
    echo -e "  ${RED}✗ Node.js 未安裝${NC}"
    echo "    請安裝 Node.js 18+: https://nodejs.org/"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "  ${GREEN}✓ npm $NPM_VERSION${NC}"
else
    echo -e "  ${RED}✗ npm 未安裝${NC}"
    exit 1
fi

# Check Poetry (optional, install if missing)
if command -v poetry &> /dev/null; then
    POETRY_VERSION=$(poetry --version | awk '{print $3}')
    echo -e "  ${GREEN}✓ Poetry $POETRY_VERSION${NC}"
else
    echo -e "  ${YELLOW}⚠ Poetry 未安裝，正在安裝...${NC}"
    curl -sSL https://install.python-poetry.org | python3 -
    export PATH="$HOME/.local/bin:$PATH"
    echo -e "  ${GREEN}✓ Poetry 安裝完成${NC}"
fi

# Check Docker (optional)
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version | awk '{print $3}' | sed 's/,//')
    echo -e "  ${GREEN}✓ Docker $DOCKER_VERSION${NC}"
else
    echo -e "  ${YELLOW}⚠ Docker 未安裝 (可選)${NC}"
fi

echo ""

# 2. Setup Environment Files
echo -e "${BLUE}2️⃣  配置環境文件...${NC}"

if [ ! -f "$PROJECT_ROOT/backend/.env" ]; then
    if [ -f "$PROJECT_ROOT/backend/.env.example" ]; then
        cp "$PROJECT_ROOT/backend/.env.example" "$PROJECT_ROOT/backend/.env"
        echo -e "  ${GREEN}✓ 已創建 backend/.env${NC}"
    else
        echo -e "  ${YELLOW}⚠ backend/.env.example 不存在，跳過${NC}"
    fi
else
    echo -e "  ${YELLOW}⚠ backend/.env 已存在${NC}"
fi

if [ ! -f "$PROJECT_ROOT/frontend/.env" ]; then
    if [ -f "$PROJECT_ROOT/frontend/.env.example" ]; then
        cp "$PROJECT_ROOT/frontend/.env.example" "$PROJECT_ROOT/frontend/.env"
        echo -e "  ${GREEN}✓ 已創建 frontend/.env${NC}"
    else
        echo -e "  ${YELLOW}⚠ frontend/.env.example 不存在，跳過${NC}"
    fi
else
    echo -e "  ${YELLOW}⚠ frontend/.env 已存在${NC}"
fi

echo ""

# 3. Install Backend Dependencies
echo -e "${BLUE}3️⃣  安裝後端依賴...${NC}"
cd "$PROJECT_ROOT/backend"

if [ -d ".venv" ]; then
    echo -e "  ${YELLOW}⚠ 虛擬環境已存在，跳過安裝${NC}"
else
    echo "  📦 正在安裝 Python 依賴..."
    poetry install --no-interaction
    echo -e "  ${GREEN}✓ 後端依賴安裝完成${NC}"
fi

cd "$PROJECT_ROOT"

echo ""

# 4. Install Frontend Dependencies
echo -e "${BLUE}4️⃣  安裝前端依賴...${NC}"
cd "$PROJECT_ROOT/frontend"

if [ -d "node_modules" ]; then
    echo -e "  ${YELLOW}⚠ node_modules 已存在，跳過安裝${NC}"
else
    echo "  📦 正在安裝 npm 依賴..."
    npm install
    echo -e "  ${GREEN}✓ 前端依賴安裝完成${NC}"
fi

cd "$PROJECT_ROOT"

echo ""

# 5. Initialize Database
echo -e "${BLUE}5️⃣  初始化數據庫...${NC}"

if [ ! -f "$PROJECT_ROOT/backend/modernreader.db" ]; then
    echo "  🗄️  創建數據庫..."
    cd "$PROJECT_ROOT/backend"
    
    # Run database initialization script
    if [ -f "scripts/init_db.py" ]; then
        poetry run python scripts/init_db.py
        echo -e "  ${GREEN}✓ 數據庫初始化完成${NC}"
    else
        echo -e "  ${YELLOW}⚠ 數據庫腳本不存在，將在首次運行時自動創建${NC}"
    fi
    
    cd "$PROJECT_ROOT"
else
    echo -e "  ${YELLOW}⚠ 數據庫已存在${NC}"
fi

echo ""

# 6. Create Required Directories
echo -e "${BLUE}6️⃣  創建必要目錄...${NC}"

mkdir -p "$PROJECT_ROOT/backend/chroma_db"
mkdir -p "$PROJECT_ROOT/backend/vectors"
mkdir -p "$PROJECT_ROOT/data/catalogs"
mkdir -p "$PROJECT_ROOT/data/ingestion"

echo -e "  ${GREEN}✓ 目錄創建完成${NC}"

echo ""

# 7. Summary
echo "=================================================="
echo -e "${GREEN}✅ 設置完成！${NC}"
echo "=================================================="
echo ""
echo -e "${BLUE}📋 下一步操作:${NC}"
echo ""
echo "1. 配置 API Keys (可選):"
echo "   編輯 backend/.env 文件，添加:"
echo "   - OPENAI_API_KEY"
echo "   - ANTHROPIC_API_KEY"
echo "   - GOOGLE_API_KEY"
echo ""
echo "2. 啟動開發服務器:"
echo "   ./start.sh"
echo ""
echo "3. 運行健康檢查:"
echo "   ./scripts/health-check.sh"
echo ""
echo "4. 使用 Docker (可選):"
echo "   docker-compose up --build"
echo ""
echo -e "${BLUE}📚 文檔:${NC}"
echo "  - README.md - 項目概述"
echo "  - PRODUCTION_CICD_GUIDE.md - CI/CD 指南"
echo "  - CLEANUP_GUIDE.md - 清理指南"
echo ""
echo -e "${YELLOW}💡 提示:${NC}"
echo "  - 後端將運行在 http://localhost:8001"
echo "  - 前端將運行在 http://localhost:5173"
echo "  - API 文檔在 http://localhost:8001/docs"
echo ""
echo "=================================================="
