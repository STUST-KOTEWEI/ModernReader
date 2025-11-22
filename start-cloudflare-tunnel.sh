#!/usr/bin/env bash

# Cloudflare Named Tunnel helper for ModernReader
# This script creates (if needed), configures, and runs a Cloudflare Named Tunnel
# to expose your local frontend (5173) and backend (8001) on permanent HTTPS hostnames.

set -euo pipefail

# --- User-overridable env vars ---
# Tunnel name (stable handle inside your Cloudflare account)
: "${TUNNEL_NAME:=modernreader}"

# Public hostnames you want under your Cloudflare-managed domain (zone)
# Example: app.example.com and api.example.com
: "${APP_HOST:=}"
: "${API_HOST:=}"

# Local services to expose
: "${LOCAL_APP_URL:=http://localhost:5173}"
: "${LOCAL_API_URL:=http://localhost:8001}"

# Where to write a project-local config (we pass this to cloudflared with --config)
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
CONFIG_DIR="$PROJECT_ROOT/ops/cloudflared"
CONFIG_PATH="$CONFIG_DIR/config.yml"

LOG_FILE="/tmp/cloudflared-tunnel.log"

echo "🚀 Cloudflare Named Tunnel setup starting..."

if ! command -v cloudflared >/dev/null 2>&1; then
	echo "❌ cloudflared 未安裝。請先安裝: brew install cloudflare/cloudflare/cloudflared" >&2
	exit 1
fi

# 1) Require Cloudflare login first (creates ~/.cloudflared/cert.pem)
if [[ ! -f "$HOME/.cloudflared/cert.pem" ]]; then
	cat <<EOF
❌ 尚未登入 Cloudflare。

請在終端機執行以下指令登入並授權帳號/網域(zone)：

	cloudflared tunnel login

瀏覽器會開啟 Cloudflare 頁面，選擇你的帳號與要授權的網域。
授權完成後，回來重新執行本腳本。
EOF
	exit 2
fi

mkdir -p "$CONFIG_DIR"

# 2) Create the tunnel if it doesn't exist yet
if ! cloudflared tunnel list 2>/dev/null | awk 'NR>1{print $1}' | grep -qx "$TUNNEL_NAME"; then
	echo "🧭 建立 Named Tunnel：$TUNNEL_NAME"
	cloudflared tunnel create "$TUNNEL_NAME"
else
	echo "ℹ️ 已存在 Named Tunnel：$TUNNEL_NAME"
fi

# 3) Resolve Tunnel UUID and credentials file
TUNNEL_ID=$(cloudflared tunnel list | awk -v name="$TUNNEL_NAME" 'NR>1 && $1==name {print $2; exit}')
if [[ -z "${TUNNEL_ID:-}" ]]; then
	echo "❌ 無法取得 Tunnel UUID。請執行 cloudflared tunnel list 檢查。" >&2
	exit 3
fi

CRED_FILE="$HOME/.cloudflared/${TUNNEL_ID}.json"
if [[ ! -f "$CRED_FILE" ]]; then
	echo "❌ 缺少憑證檔：$CRED_FILE" >&2
	echo "請執行：cloudflared tunnel create $TUNNEL_NAME (會重新產生憑證)" >&2
	exit 4
fi

# 4) Write config with ingress rules
echo "📝 產生設定檔：$CONFIG_PATH"
cat > "$CONFIG_PATH" <<YAML
tunnel: $TUNNEL_ID
credentials-file: $CRED_FILE

ingress:
YAML

if [[ -n "${APP_HOST}" ]]; then
	cat >> "$CONFIG_PATH" <<YAML
	- hostname: ${APP_HOST}
		service: ${LOCAL_APP_URL}
YAML
fi

if [[ -n "${API_HOST}" ]]; then
	cat >> "$CONFIG_PATH" <<YAML
	- hostname: ${API_HOST}
		service: ${LOCAL_API_URL}
YAML
fi

# Fallback rule (404) must be last
cat >> "$CONFIG_PATH" <<'YAML'
	- service: http_status:404
YAML

# 5) Optionally create DNS routes if hostnames were provided
if [[ -n "${APP_HOST}" ]]; then
	echo "🌐 建立 DNS：$APP_HOST"
	if ! cloudflared tunnel route dns "$TUNNEL_NAME" "$APP_HOST"; then
		echo "⚠️ 無法為 $APP_HOST 建立 DNS。請確認該主機名屬於你在 Cloudflare 的網域(zone)。" >&2
	fi
fi

if [[ -n "${API_HOST}" ]]; then
	echo "🌐 建立 DNS：$API_HOST"
	if ! cloudflared tunnel route dns "$TUNNEL_NAME" "$API_HOST"; then
		echo "⚠️ 無法為 $API_HOST 建立 DNS。請確認該主機名屬於你在 Cloudflare 的網域(zone)。" >&2
	fi
fi

# 6) Start the tunnel (background)
echo "▶️ 啟動 Tunnel：$TUNNEL_NAME (背景運行)"
nohup cloudflared --config "$CONFIG_PATH" tunnel run "$TUNNEL_NAME" \
	>"$LOG_FILE" 2>&1 &
CF_PID=$!

sleep 3 || true

echo "✅ 已啟動，PID=$CF_PID，Log：$LOG_FILE"

if [[ -n "${APP_HOST}" ]]; then
	echo "前端：https://${APP_HOST}  → ${LOCAL_APP_URL}"
fi
if [[ -n "${API_HOST}" ]]; then
	echo "後端：https://${API_HOST}  → ${LOCAL_API_URL}"
	echo "Google OAuth 重新導向 URI：https://${API_HOST}/api/v1/auth/oauth/google/callback"
fi

cat <<EOF

說明：
- 若你在瀏覽器剛看到「選擇帳號/授權 Cloudflare Tunnel」頁面但沒有可選擇的網域清單，代表你的帳號尚未有任何已接管的網域(zone)。
- 你可以：
	1) 先到 Cloudflare 新增或購買一個網域，完成 Nameserver 切換；
	2) 或暫時不填 APP_HOST/API_HOST，先啟用 Tunnel，之後再補 DNS 掛載（永久域名需要第 1 步）。

快速使用方法：
	APP_HOST=app.<你的網域> API_HOST=api.<你的網域> \
	./start-cloudflare-tunnel.sh

EOF

exit 0