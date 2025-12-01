#!/bin/bash
# ModernReader Tunnel 啟動腳本
# 使用 nohup 讓 tunnel 在背景持續運行，即使關閉終端也不會斷

echo "🚀 啟動 localhost.run tunnel (背景運行)..."

# 停止舊的 tunnel
pkill -f "localhost.run" 2>/dev/null

# 啟動 tunnel 並讓它在背景持續運行
# nohup: 不會因為關閉終端而停止
# </dev/null: 不需要標準輸入
# >/tmp/tunnel.log: 輸出到日誌檔
# 2>&1: 錯誤也輸出到日誌
# &: 在背景執行
# disown: 完全脫離當前 shell，即使登出也繼續運行
nohup ssh -o ServerAliveInterval=60 \
          -o ServerAliveCountMax=3 \
          -o StrictHostKeyChecking=no \
          -R 80:localhost:3000 localhost.run \
          </dev/null >/tmp/tunnel.log 2>&1 &

TUNNEL_PID=$!

# 等待 tunnel 建立連線
sleep 8

# 檢查 tunnel 是否成功啟動
if ps -p $TUNNEL_PID > /dev/null 2>&1; then
    echo "✅ Tunnel 已啟動 (PID: $TUNNEL_PID)"
    
    # 提取域名
    TUNNEL_URL=$(grep -oE 'https://[a-z0-9]+\.lhr\.life' /tmp/tunnel.log 2>/dev/null | head -1)
    
    if [ -n "$TUNNEL_URL" ]; then
        echo "🌐 Tunnel URL: $TUNNEL_URL"
        echo ""
        echo "已認證用戶的固定域名："
        echo "  https://04ab02bde722a4.lhr.life"
    else
        echo "⏳ Tunnel 正在建立連線..."
        echo "   請稍後執行: tail -f /tmp/tunnel.log"
    fi
    
    echo ""
    echo "📝 查看日誌: tail -f /tmp/tunnel.log"
    echo "🛑 停止 tunnel: pkill -f 'localhost.run'"
    echo "🔍 檢查狀態: ps aux | grep localhost.run"
    echo ""
    echo "💡 現在可以關閉這個終端機，tunnel 會繼續在背景運行！"
else
    echo "❌ Tunnel 啟動失敗"
    echo "請檢查日誌: cat /tmp/tunnel.log"
    exit 1
fi
