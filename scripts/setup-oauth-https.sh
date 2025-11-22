#!/bin/bash

# ModernReader OAuth 本地開發 HTTPS 設定
# 使用 ngrok 建立 HTTPS 隧道

echo "🚀 ModernReader OAuth HTTPS 設定"
echo "================================"
echo ""

# 檢查 ngrok 是否安裝
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok 未安裝"
    echo ""
    echo "請安裝 ngrok："
    echo "  brew install ngrok"
    echo ""
    echo "或訪問: https://ngrok.com/download"
    exit 1
fi

# 檢查是否已設定 authtoken
if ! ngrok config check &> /dev/null; then
    echo "⚠️  ngrok authtoken 未設定"
    echo ""
    echo "請執行以下步驟："
    echo "1. 訪問 https://dashboard.ngrok.com/signup 註冊"
    echo "2. 複製你的 authtoken"
    echo "3. 執行: ngrok config add-authtoken YOUR_TOKEN"
    echo ""
    exit 1
fi

echo "✅ ngrok 已安裝並配置"
echo ""

# 啟動前端隧道
echo "📡 正在啟動 HTTPS 隧道..."
echo ""
echo "將為前端 (localhost:5173) 建立 HTTPS 隧道"
echo ""

# 啟動 ngrok（背景執行）
ngrok http 5173 > /dev/null &
NGROK_PID=$!

# 等待 ngrok 啟動
sleep 3

# 取得 ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | grep -o 'https://[^"]*' | head -1)

if [ -z "$NGROK_URL" ]; then
    echo "❌ 無法取得 ngrok URL"
    echo "請手動執行: ngrok http 5173"
    kill $NGROK_PID 2>/dev/null
    exit 1
fi

echo "✅ HTTPS 隧道已建立！"
echo ""
echo "🌐 公開 URL: $NGROK_URL"
echo "🔧 ngrok 管理介面: http://localhost:4040"
echo ""
echo "================================"
echo "📝 下一步驟"
echo "================================"
echo ""
echo "1. 在 backend/.env 添加："
echo ""
echo "   GOOGLE_CLIENT_ID=your_google_client_id"
echo "   GOOGLE_CLIENT_SECRET=your_google_client_secret"
echo "   OAUTH_REDIRECT_URL=${NGROK_URL}/api/v1/auth/oauth/google/callback"
echo ""
echo "2. 在 Google Cloud Console 設定 OAuth 2.0："
echo "   - 訪問: https://console.cloud.google.com/apis/credentials"
echo "   - Authorized redirect URIs 添加:"
echo "     ${NGROK_URL}/api/v1/auth/oauth/google/callback"
echo ""
echo "3. 在 frontend/.env.local 添加："
echo ""
echo "   VITE_OAUTH_BASE_URL=${NGROK_URL}/api/v1/auth/oauth"
echo ""
echo "4. 重新啟動前端："
echo "   cd frontend && npm run dev"
echo ""
echo "5. 訪問: ${NGROK_URL}"
echo ""
echo "================================"
echo ""
echo "按 Ctrl+C 停止 ngrok 隧道"
echo ""

# 保持 ngrok 運行
wait $NGROK_PID
