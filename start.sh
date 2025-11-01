#!/bin/bash

# ModernReader 開發啟動腳本
# 同時啟動前後端服務

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"

echo "🚀 ModernReader 開發環境啟動"
echo "=================================="
echo ""

# 檢查是否在專案根目錄
if [ ! -f "$PROJECT_ROOT/docker-compose.yml" ]; then
    echo "❌ 請在專案根目錄執行此腳本"
    exit 1
fi

# 顏色定義
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

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
    
    # 清理日誌文件
    rm -f /tmp/modernreader-*.log 2>/dev/null || true
    
    echo "✅ 清理完成"
    exit 0
}

# 註冊清理函數
trap cleanup EXIT INT TERM

# 檢查環境文件
echo -e "${BLUE}📋 檢查環境配置...${NC}"

if [ ! -f "$PROJECT_ROOT/backend/.env" ]; then
    echo -e "${YELLOW}  ⚠️  後端 .env 不存在，正在創建...${NC}"
    cp "$PROJECT_ROOT/backend/.env.example" "$PROJECT_ROOT/backend/.env"
    echo -e "${GREEN}  ✓ 已創建 backend/.env${NC}"
fi

if [ ! -f "$PROJECT_ROOT/frontend/.env" ]; then
    echo -e "${YELLOW}  ⚠️  前端 .env 不存在，正在創建...${NC}"
    cp "$PROJECT_ROOT/frontend/.env.example" "$PROJECT_ROOT/frontend/.env"
    echo -e "${GREEN}  ✓ 已創建 frontend/.env${NC}"
fi

echo ""

# 1. 啟動後端
echo -e "${BLUE}1️⃣  啟動後端 (http://localhost:8001)...${NC}"
cd "$PROJECT_ROOT/backend"

# 檢查 Python 和 Poetry
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 未安裝${NC}"
    exit 1
fi

if ! command -v poetry &> /dev/null; then
    echo -e "${YELLOW}  ⚠️  Poetry 未安裝，正在安裝...${NC}"
    curl -sSL https://install.python-poetry.org | python3 -
fi

# 安裝依賴
if [ ! -d ".venv" ]; then
    echo "  📦 安裝後端依賴..."
    poetry install --no-interaction
fi

# 啟動 uvicorn (背景執行)
echo "  🚀 啟動 FastAPI 服務..."
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8001 > /tmp/modernreader-backend.log 2>&1 &
BACKEND_PID=$!
echo "  ✓ 後端 PID: $BACKEND_PID"

cd "$PROJECT_ROOT"

# 等待後端啟動
echo "  ⏳ 等待後端啟動..."
for i in {1..15}; do
    if curl -s http://localhost:8001/health > /dev/null 2>&1; then
        echo -e "  ${GREEN}✅ 後端啟動成功${NC}"
        break
    fi
    sleep 1
    if [ $i -eq 15 ]; then
        echo -e "  ${RED}❌ 後端啟動超時，請檢查日誌: tail -f /tmp/modernreader-backend.log${NC}"
    fi
done

echo ""

# 2. 啟動前端
echo -e "${BLUE}2️⃣  啟動前端 (http://localhost:5173)...${NC}"
cd "$PROJECT_ROOT/frontend"

# 檢查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js 未安裝${NC}"
    exit 1
fi

# 安裝依賴（如果需要）
if [ ! -d "node_modules" ]; then
    echo "  📦 安裝前端依賴..."
    npm install
fi

# 啟動 Vite (背景執行)
echo "  🚀 啟動 Vite 開發服務器..."
npm run dev > /tmp/modernreader-frontend.log 2>&1 &
FRONTEND_PID=$!
echo "  ✓ 前端 PID: $FRONTEND_PID"

cd "$PROJECT_ROOT"

# 等待前端啟動
echo "  ⏳ 等待前端啟動..."
for i in {1..15}; do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo -e "  ${GREEN}✅ 前端啟動成功${NC}"
        break
    fi
    sleep 1
    if [ $i -eq 15 ]; then
        echo -e "  ${RED}❌ 前端啟動超時，請檢查日誌: tail -f /tmp/modernreader-frontend.log${NC}"
    fi
done

echo ""

# 3. 顯示訪問資訊
echo "===================================="
echo -e "${GREEN}✅ 系統啟動完成！${NC}"
echo "===================================="
echo ""
echo -e "${BLUE}📍 訪問地址:${NC}"
echo "  🎨 前端應用: http://localhost:5173"
echo "  🔧 後端 API: http://localhost:8001"
echo "  📚 API 文檔: http://localhost:8001/docs"
echo "  ❤️  健康檢查: http://localhost:8001/health"
echo ""
echo -e "${BLUE}📊 查看日誌:${NC}"
echo "  後端: tail -f /tmp/modernreader-backend.log"
echo "  前端: tail -f /tmp/modernreader-frontend.log"
echo ""
echo -e "${BLUE}🔧 常用命令:${NC}"
echo "  健康檢查: ./scripts/health-check.sh"
echo "  查看進程: ps aux | grep -E 'uvicorn|vite'"
echo ""
echo -e "${YELLOW}🛑 停止服務: 按 Ctrl+C${NC}"
echo ""

# 保持腳本運行並定期檢查服務狀態
echo "服務運行中... (每30秒檢查一次狀態)"
echo ""

while true; do
    sleep 30
    
    # 檢查後端
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${RED}❌ 後端進程已停止！${NC}"
        cleanup
    fi
    
    # 檢查前端
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "${RED}❌ 前端進程已停止！${NC}"
        cleanup
    fi
    
    # 健康檢查
    if ! curl -s http://localhost:8001/health > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  後端健康檢查失敗，請檢查日誌${NC}"
    fi
done
    
    # 檢查後端
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${YELLOW}⚠️  後端進程已停止！${NC}"
        cleanup
    fi
    
    # 檢查前端
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "${YELLOW}⚠️  前端進程已停止！${NC}"
        cleanup
    fi
done
