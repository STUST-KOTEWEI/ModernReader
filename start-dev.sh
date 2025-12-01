#!/bin/bash
# ModernReader 開發環境啟動腳本
# 用法: ./start-dev.sh

set -e

echo "🚀 啟動 ModernReader 開發環境..."

# 顏色定義
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. 啟動後端
echo -e "${BLUE}📦 啟動後端 (port 8001)...${NC}"
cd /Users/kedewei/modernreader/backend
pkill -f "uvicorn.*app.main" 2>/dev/null || true
nohup .venv/bin/uvicorn --app-dir /Users/kedewei/modernreader/backend app.main:app --reload --port 8001 --env-file /Users/kedewei/modernreader/backend/.env > /tmp/mr-backend.log 2>&1 &
BACKEND_PID=$!
sleep 2

# 檢查後端是否啟動
if curl -s http://localhost:8001/docs > /dev/null; then
    echo -e "${GREEN}✓ 後端啟動成功 (PID: $BACKEND_PID)${NC}"
else
    echo -e "${YELLOW}⚠ 後端可能還在啟動中...${NC}"
fi

# 2. 啟動前端
echo -e "${BLUE}🎨 啟動前端 (port 3000)...${NC}"
cd /Users/kedewei/modernreader/web
pkill -f "next dev" 2>/dev/null || true
nohup npm run dev > /tmp/mr-frontend.log 2>&1 &
FRONTEND_PID=$!
sleep 3

# 檢查前端是否啟動
if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✓ 前端啟動成功 (PID: $FRONTEND_PID)${NC}"
else
    echo -e "${YELLOW}⚠ 前端可能還在啟動中...${NC}"
fi

# 3. 啟動 localhost.run tunnel (已認證，使用固定域名)
echo -e "${BLUE}🌐 啟動 localhost.run tunnel...${NC}"
pkill -f "localhost.run" 2>/dev/null || true
nohup ssh -o ServerAliveInterval=60 -o ExitOnForwardFailure=yes -o StrictHostKeyChecking=no -R 80:localhost:3000 localhost.run > /tmp/tunnel.log 2>&1 &
TUNNEL_PID=$!
sleep 10

# 提取 tunnel URL (已認證用戶有固定域名)
TUNNEL_URL=$(grep -oE 'https://[a-z0-9]+\.lhr\.life' /tmp/tunnel.log | head -1)

# 如果無法取得，使用已知的固定域名
if [ -z "$TUNNEL_URL" ]; then
    TUNNEL_URL="https://04ab02bde722a4.lhr.life"
    echo -e "${YELLOW}使用已配置的固定域名: $TUNNEL_URL${NC}"
fi

if [ -n "$TUNNEL_URL" ]; then
    echo -e "${GREEN}✓ Tunnel 啟動成功${NC}"
    echo -e "${GREEN}   URL: $TUNNEL_URL${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  重要：請更新以下設定${NC}"
    echo -e "   1. backend/.env 的 OAUTH_REDIRECT_URL"
    echo -e "   2. web/.env.local 的 NEXTAUTH_URL（或對應前端 Base URL）"
    echo -e "   3. Google Console 的 Authorized redirect URIs"
    echo ""
    echo -e "   Callback URL (後端): ${TUNNEL_URL}/api/v1/auth/oauth/google/callback"
    echo -e "   Callback URL (前端): ${TUNNEL_URL}/api/auth/callback/google"
else
    echo -e "${YELLOW}⚠ Tunnel URL 尚未就緒，請稍後查看: tail -f /tmp/tunnel.log${NC}"
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ 所有服務已啟動${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "📊 服務狀態:"
echo "  • 後端:   http://localhost:8001 (PID: $BACKEND_PID)"
echo "  • 前端:   http://localhost:3000 (PID: $FRONTEND_PID)"
echo "  • Tunnel: $TUNNEL_URL (PID: $TUNNEL_PID)"
echo ""
echo "📝 日誌檔案:"
echo "  • 後端:   tail -f /tmp/mr-backend.log"
echo "  • 前端:   tail -f /tmp/mr-frontend.log"
echo "  • Tunnel: tail -f /tmp/tunnel.log"
echo ""
echo "🛑 停止所有服務:"
echo "  pkill -f 'uvicorn.*app.main'"
echo "  pkill -f 'vite'"
echo "  pkill -f 'localhost.run'"
echo ""
