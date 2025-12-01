#!/bin/bash

# ModernReader 簡化開發啟動腳本
# 直接啟動,跳過依賴檢查

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"

echo "🚀 ModernReader 開發環境啟動 (簡化版)"
echo "=========================================="
echo ""

# 顏色定義
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 清理函數
cleanup() {
    echo ""
    echo "🛑 正在停止所有服務..."
    
    if [ -n "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
        echo "  ✓ 後端已停止"
    fi
    
    if [ -n "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
        echo "  ✓ 前端已停止"
    fi
    
    rm -f /tmp/modernreader-*.log 2>/dev/null || true
    
    echo "✅ 清理完成"
    exit 0
}

trap cleanup EXIT INT TERM

# 檢查環境文件
echo -e "${BLUE}📋 檢查環境配置...${NC}"

if [ ! -f "$PROJECT_ROOT/backend/.env" ]; then
    cp "$PROJECT_ROOT/backend/.env.example" "$PROJECT_ROOT/backend/.env" 2>/dev/null || true
fi

if [ ! -f "$PROJECT_ROOT/web/.env.local" ] && [ -f "$PROJECT_ROOT/web/.env.example" ]; then
    cp "$PROJECT_ROOT/web/.env.example" "$PROJECT_ROOT/web/.env.local" 2>/dev/null || true
fi

echo ""

# 1. 啟動後端
echo -e "${BLUE}1️⃣  啟動後端 (http://localhost:8001)...${NC}"
cd "$PROJECT_ROOT/backend"

# 檢查虛擬環境
if [ ! -d ".venv" ]; then
    echo -e "${YELLOW}  ⚠️  虛擬環境不存在,創建中...${NC}"
    python3 -m venv .venv
    source .venv/bin/activate
    pip install --upgrade pip
    pip install -r <(poetry export -f requirements.txt --without-hashes) || {
        echo -e "${YELLOW}  ⚠️  使用 pip 直接安裝...${NC}"
        pip install fastapi uvicorn sqlalchemy chromadb openai anthropic python-dotenv pydantic-settings
    }
else
    source .venv/bin/activate
fi

# 啟動服務
echo "  🚀 啟動 FastAPI 服務..."
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8001 > /tmp/modernreader-backend.log 2>&1 &
BACKEND_PID=$!
echo "  ✓ 後端 PID: $BACKEND_PID"

cd "$PROJECT_ROOT"

# 等待後端
echo "  ⏳ 等待後端啟動..."
for i in {1..15}; do
    if curl -s http://localhost:8001/health > /dev/null 2>&1; then
        echo -e "  ${GREEN}✅ 後端啟動成功!${NC}"
        break
    fi
    if [ $i -eq 15 ]; then
        echo -e "  ${YELLOW}⚠️  後端啟動中,查看日誌: tail -f /tmp/modernreader-backend.log${NC}"
    fi
    sleep 1
done

echo ""

# 2. 啟動前端
echo -e "${BLUE}2️⃣  啟動前端 (http://localhost:3000)...${NC}"
cd "$PROJECT_ROOT/web"

# 檢查 node_modules
if [ ! -d "node_modules" ]; then
    echo "  📦 安裝前端依賴..."
    npm install
fi

# 啟動前端
echo "  🚀 啟動 Next.js 開發服務器..."
npm run dev > /tmp/modernreader-frontend.log 2>&1 &
FRONTEND_PID=$!
echo "  ✓ 前端 PID: $FRONTEND_PID"

cd "$PROJECT_ROOT"

# 等待前端
echo "  ⏳ 等待前端啟動..."
for i in {1..15}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo -e "  ${GREEN}✅ 前端啟動成功!${NC}"
        break
    fi
    if [ $i -eq 15 ]; then
        echo -e "  ${YELLOW}⚠️  前端啟動中,查看日誌: tail -f /tmp/modernreader-frontend.log${NC}"
    fi
    sleep 1
done

echo ""
echo "════════════════════════════════════════"
echo -e "${GREEN}✨ ModernReader 開發環境已啟動!${NC}"
echo "════════════════════════════════════════"
echo ""
echo -e "${BLUE}📱 訪問地址:${NC}"
echo "  🌐 前端 UI:    http://localhost:3000"
echo "  📚 API 文檔:   http://localhost:8001/docs"
echo "  ❤️  健康檢查:  http://localhost:8001/health"
echo ""
echo -e "${BLUE}📝 日誌文件:${NC}"
echo "  後端: tail -f /tmp/modernreader-backend.log"
echo "  前端: tail -f /tmp/modernreader-frontend.log"
echo ""
echo -e "${YELLOW}💡 按 Ctrl+C 停止所有服務${NC}"
echo ""

# 保持腳本運行
wait
