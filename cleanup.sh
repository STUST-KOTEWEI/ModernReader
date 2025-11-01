#!/bin/bash

# 專案清理腳本 - 移除測試文件、個資和不相關檔案

set -e

echo "🧹 ModernReader 專案清理"
echo "=========================="
echo ""

# 顏色定義
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 確認是否在專案根目錄
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ 請在專案根目錄執行此腳本${NC}"
    exit 1
fi

echo -e "${BLUE}準備清理以下類型的文件:${NC}"
echo "1. 測試文件 (test_*.py)"
echo "2. ngrok 相關文件"
echo "3. 測試數據庫和向量庫"
echo "4. 開發環境文件 (.env)"
echo "5. Python 緩存文件"
echo ""

read -p "確定要繼續嗎？這將永久刪除這些文件 [y/N] " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "已取消"
    exit 1
fi

echo ""
echo -e "${YELLOW}開始清理...${NC}"
echo ""

# 計數器
DELETED_COUNT=0

# 1. 刪除後端測試文件
echo -e "${BLUE}1️⃣  清理後端測試文件...${NC}"
if [ -d "backend" ]; then
    cd backend
    
    # 刪除根目錄的測試文件
    for file in test_*.py; do
        if [ -f "$file" ]; then
            echo "   🗑️  刪除: $file"
            rm "$file"
            ((DELETED_COUNT++))
        fi
    done
    
    # 刪除測試目錄（保留 tests/__init__.py）
    if [ -d "tests" ]; then
        for file in tests/test_*.py; do
            if [ -f "$file" ]; then
                echo "   🗑️  刪除: $file"
                rm "$file"
                ((DELETED_COUNT++))
            fi
        done
    fi
    
    cd ..
fi
echo ""

# 2. 刪除測試數據庫和向量庫
echo -e "${BLUE}2️⃣  清理測試數據...${NC}"
if [ -d "backend" ]; then
    cd backend
    
    # 刪除測試 ChromaDB
    if [ -d "test_chroma_db" ]; then
        echo "   🗑️  刪除目錄: test_chroma_db/"
        rm -rf test_chroma_db
        ((DELETED_COUNT++))
    fi
    
    # 刪除測試向量
    if [ -d "test_vectors" ]; then
        echo "   🗑️  刪除目錄: test_vectors/"
        rm -rf test_vectors
        ((DELETED_COUNT++))
    fi
    
    # 刪除開發數據庫（如果存在）
    if [ -f "modernreader.db" ]; then
        echo "   🗑️  刪除: modernreader.db"
        rm modernreader.db
        ((DELETED_COUNT++))
    fi
    
    # 刪除 ChromaDB（保留結構）
    if [ -d "chroma_db" ]; then
        echo "   🗑️  清空目錄: chroma_db/"
        rm -rf chroma_db/*
        ((DELETED_COUNT++))
    fi
    
    # 刪除向量庫（保留目錄）
    if [ -d "vectors" ]; then
        echo "   🗑️  清空目錄: vectors/"
        rm -rf vectors/*
        ((DELETED_COUNT++))
    fi
    
    cd ..
fi
echo ""

# 3. 刪除 ngrok 相關文件
echo -e "${BLUE}3️⃣  清理 ngrok 相關文件...${NC}"

# 刪除 ngrok 指南
if [ -f "NGROK_TOKEN_GUIDE.md" ]; then
    echo "   🗑️  刪除: NGROK_TOKEN_GUIDE.md"
    rm NGROK_TOKEN_GUIDE.md
    ((DELETED_COUNT++))
fi

if [ -f "QUICK_START_WITH_NGROK.md" ]; then
    echo "   🗑️  刪除: QUICK_START_WITH_NGROK.md"
    rm QUICK_START_WITH_NGROK.md
    ((DELETED_COUNT++))
fi

if [ -f "QUICK_START_PUBLIC_URL.md" ]; then
    echo "   🗑️  刪除: QUICK_START_PUBLIC_URL.md"
    rm QUICK_START_PUBLIC_URL.md
    ((DELETED_COUNT++))
fi

if [ -f "PUBLIC_URL_GUIDE.md" ]; then
    echo "   🗑️  刪除: PUBLIC_URL_GUIDE.md"
    rm PUBLIC_URL_GUIDE.md
    ((DELETED_COUNT++))
fi

# 刪除 ngrok 腳本
if [ -f "scripts/setup_public_url.py" ]; then
    echo "   🗑️  刪除: scripts/setup_public_url.py"
    rm scripts/setup_public_url.py
    ((DELETED_COUNT++))
fi

if [ -f "scripts/start_with_public_url.sh" ]; then
    echo "   🗑️  刪除: scripts/start_with_public_url.sh"
    rm scripts/start_with_public_url.sh
    ((DELETED_COUNT++))
fi

# 更新 start.sh 移除 ngrok 相關代碼
if [ -f "start.sh" ]; then
    echo "   📝 更新: start.sh (移除 ngrok 代碼)"
    # 創建新的簡化版 start.sh
    cat > start.sh.new << 'EOF'
#!/bin/bash

# ModernReader 快速啟動腳本（本地開發）

set -e

echo "🚀 ModernReader 快速啟動"
echo "=========================="
echo ""

# 檢查是否在專案根目錄
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ 請在專案根目錄執行此腳本"
    exit 1
fi

# 顏色定義
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. 啟動後端
echo -e "${BLUE}1️⃣  啟動後端 (http://localhost:8000)...${NC}"
cd backend

# 檢查虛擬環境
if [ -d ".venv" ]; then
    source .venv/bin/activate
else
    echo "   正在創建虛擬環境..."
    poetry install
    source $(poetry env info --path)/bin/activate
fi

# 啟動 uvicorn (背景執行)
poetry run uvicorn app.main:app --reload --port 8000 > /tmp/modernreader-backend.log 2>&1 &
BACKEND_PID=$!
echo "   後端 PID: $BACKEND_PID"

cd ..

# 等待後端啟動
echo "   等待後端啟動..."
sleep 5

# 檢查後端是否成功啟動
if curl -s http://localhost:8000/docs > /dev/null; then
    echo -e "   ${GREEN}✅ 後端啟動成功${NC}"
else
    echo -e "   ${YELLOW}⚠️  後端可能啟動失敗，請檢查日誌: tail -f /tmp/modernreader-backend.log${NC}"
fi

echo ""

# 2. 啟動前端
echo -e "${BLUE}2️⃣  啟動前端 (http://localhost:5173)...${NC}"
cd frontend

# 確保使用本地後端
cat > .env.local << EOF
VITE_API_BASE_URL=http://localhost:8000/api/v1
EOF

# 安裝依賴（如果需要）
if [ ! -d "node_modules" ]; then
    echo "   正在安裝前端依賴..."
    npm install
fi

# 啟動 Vite
npm run dev > /tmp/modernreader-frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   前端 PID: $FRONTEND_PID"

cd ..

echo "   等待前端啟動..."
sleep 5

# 檢查前端是否成功啟動
if curl -s http://localhost:5173 > /dev/null; then
    echo -e "   ${GREEN}✅ 前端啟動成功${NC}"
else
    echo -e "   ${YELLOW}⚠️  前端可能啟動失敗，請檢查日誌: tail -f /tmp/modernreader-frontend.log${NC}"
fi

echo ""

# 3. 顯示訪問資訊
echo "================================"
echo -e "${GREEN}✅ 系統啟動完成！${NC}"
echo "================================"
echo ""
echo -e "${BLUE}📍 訪問地址:${NC}"
echo "  🎨 前端應用: http://localhost:5173"
echo "  🔧 後端 API: http://localhost:8000"
echo "  📚 API 文檔: http://localhost:8000/docs"
echo ""
echo -e "${BLUE}📊 查看日誌:${NC}"
echo "  後端: tail -f /tmp/modernreader-backend.log"
echo "  前端: tail -f /tmp/modernreader-frontend.log"
echo ""
echo -e "${YELLOW}🛑 停止服務: 按 Ctrl+C${NC}"
echo ""

# 清理函數
cleanup() {
    echo ""
    echo "🛑 正在停止所有服務..."
    
    if [ -n "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null && echo "  ✓ 後端已停止"
    fi
    
    if [ -n "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null && echo "  ✓ 前端已停止"
    fi
    
    # 清理可能殘留的進程
    pkill -f "uvicorn app.main:app" 2>/dev/null
    pkill -f "vite" 2>/dev/null
    
    echo ""
    echo "✅ 所有服務已停止"
    exit 0
}

# 設置信號處理
trap cleanup INT TERM

# 保持腳本運行
echo "服務運行中... (按 Ctrl+C 停止)"
echo ""

# 每 30 秒檢查一次服務狀態
while true; do
    sleep 30
    
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
EOF
    mv start.sh.new start.sh
    chmod +x start.sh
    ((DELETED_COUNT++))
fi

echo ""

# 4. 刪除環境變數文件（包含個資）
echo -e "${BLUE}4️⃣  清理環境變數文件...${NC}"

if [ -f "backend/.env" ]; then
    echo "   🗑️  刪除: backend/.env"
    rm backend/.env
    ((DELETED_COUNT++))
fi

if [ -f "frontend/.env" ]; then
    echo "   🗑️  刪除: frontend/.env"
    rm frontend/.env
    ((DELETED_COUNT++))
fi

if [ -f "frontend/.env.local" ]; then
    echo "   🗑️  刪除: frontend/.env.local"
    rm frontend/.env.local
    ((DELETED_COUNT++))
fi

# 創建 .env.example 模板
echo "   📝 創建: backend/.env.example"
cat > backend/.env.example << 'EOF'
# Backend Environment Variables

# Database
DATABASE_URL=sqlite:///./modernreader.db

# OpenAI API
OPENAI_API_KEY=your_openai_api_key_here

# Security
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Feature Flags
USE_MOCK_LLM=true
USE_MOCK_EMBEDDINGS=true
EOF

echo "   📝 創建: frontend/.env.example"
cat > frontend/.env.example << 'EOF'
# Frontend Environment Variables

# API Base URL
VITE_API_BASE_URL=http://localhost:8000/api/v1

# App Info
VITE_APP_NAME=ModernReader
VITE_APP_VERSION=1.0.0
EOF

echo ""

# 5. 清理 Python 緩存
echo -e "${BLUE}5️⃣  清理 Python 緩存...${NC}"

if [ -d "backend" ]; then
    cd backend
    
    # 刪除 __pycache__
    echo "   🗑️  刪除所有 __pycache__ 目錄"
    find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
    ((DELETED_COUNT++))
    
    # 刪除 .pyc 文件
    echo "   🗑️  刪除所有 .pyc 文件"
    find . -type f -name "*.pyc" -delete 2>/dev/null || true
    
    # 刪除 .pytest_cache
    if [ -d ".pytest_cache" ]; then
        echo "   🗑️  刪除: .pytest_cache/"
        rm -rf .pytest_cache
        ((DELETED_COUNT++))
    fi
    
    # 刪除 .mypy_cache
    if [ -d ".mypy_cache" ]; then
        echo "   🗑️  刪除: .mypy_cache/"
        rm -rf .mypy_cache
        ((DELETED_COUNT++))
    fi
    
    cd ..
fi

echo ""

# 6. 清理前端緩存和構建產物
echo -e "${BLUE}6️⃣  清理前端緩存...${NC}"

if [ -d "frontend" ]; then
    cd frontend
    
    # 刪除 node_modules（可選）
    # if [ -d "node_modules" ]; then
    #     echo "   🗑️  刪除: node_modules/ (這會比較久...)"
    #     rm -rf node_modules
    #     ((DELETED_COUNT++))
    # fi
    
    # 刪除構建產物
    if [ -d "dist" ]; then
        echo "   🗑️  刪除: dist/"
        rm -rf dist
        ((DELETED_COUNT++))
    fi
    
    # 刪除 Vite 緩存
    if [ -d ".vite" ]; then
        echo "   🗑️  刪除: .vite/"
        rm -rf .vite
        ((DELETED_COUNT++))
    fi
    
    cd ..
fi

echo ""

# 7. 清理臨時文件和日誌
echo -e "${BLUE}7️⃣  清理臨時文件...${NC}"

# 刪除臨時日誌
if [ -f "/tmp/modernreader-backend.log" ]; then
    echo "   🗑️  刪除: /tmp/modernreader-backend.log"
    rm /tmp/modernreader-backend.log
fi

if [ -f "/tmp/modernreader-frontend.log" ]; then
    echo "   🗑️  刪除: /tmp/modernreader-frontend.log"
    rm /tmp/modernreader-frontend.log
fi

if [ -f "/tmp/ngrok-backend.log" ]; then
    echo "   🗑️  刪除: /tmp/ngrok-backend.log"
    rm /tmp/ngrok-backend.log
fi

echo ""

# 8. 創建 .gitignore 更新
echo -e "${BLUE}8️⃣  更新 .gitignore...${NC}"

if [ ! -f ".gitignore" ]; then
    echo "   📝 創建: .gitignore"
    cat > .gitignore << 'EOF'
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg
MANIFEST

# Virtual Environment
.venv/
venv/
ENV/
env/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Testing
.pytest_cache/
.mypy_cache/
.coverage
htmlcov/
test_*.py

# Database
*.db
*.sqlite3
chroma_db/
vectors/
test_chroma_db/
test_vectors/

# Environment Variables
.env
.env.local
.env.*.local

# Logs
*.log
logs/

# Node
node_modules/
.npm
.vite/
dist/

# OS
.DS_Store
Thumbs.db

# Temporary files
*.tmp
*.bak
*.swp
EOF
else
    echo "   ✓ .gitignore 已存在"
fi

echo ""

# 完成
echo "================================"
echo -e "${GREEN}✅ 清理完成！${NC}"
echo "================================"
echo ""
echo -e "${GREEN}已刪除/更新 $DELETED_COUNT 個項目${NC}"
echo ""
echo -e "${BLUE}下一步:${NC}"
echo "1. 檢查清理結果: git status"
echo "2. 創建環境變數: cp backend/.env.example backend/.env"
echo "3. 編輯 backend/.env 填入真實的 API keys"
echo "4. 啟動系統: ./start.sh"
echo ""
echo -e "${YELLOW}注意:${NC}"
echo "- 所有測試文件已刪除"
echo "- ngrok 相關功能已移除"
echo "- 數據庫和向量庫已清空"
echo "- 環境變數文件已刪除（請使用 .env.example 重新創建）"
echo ""
