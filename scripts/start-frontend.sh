#!/usr/bin/env bash

set -euo pipefail

# Simple, robust launcher for the frontend dev server (Vite)
# - Works when executed from repo root or any subfolder
# - Prefers port 5173; if busy, auto-increments (5174, 5175, ...)
# - Optionally opens the browser
# - macOS/zsh friendly

BLUE="\033[0;34m"; GREEN="\033[0;32m"; YELLOW="\033[1;33m"; RED="\033[0;31m"; NC="\033[0m"

usage() {
	cat <<EOF
Usage: $0 [--port <number>] [--no-open] [--force-kill] [--help]

Options:
	--port, -p      Specify preferred port (default: 5173 or PORT env)
	--no-open       Do not auto-open the browser
	--force-kill    Kill any process using the chosen port before start
	--help, -h      Show this help text
EOF
}

PORT_ARG=""
OPEN_BROWSER=1
FORCE_KILL=0

while [[ $# -gt 0 ]]; do
	case "$1" in
		--port|-p)
			if [[ $# -lt 2 ]]; then echo -e "${RED}Missing value for --port${NC}"; usage; exit 1; fi
			PORT_ARG="$2"; shift 2;;
		--no-open)
			OPEN_BROWSER=0; shift;;
		--force-kill)
			FORCE_KILL=1; shift;;
		--help|-h)
			usage; exit 0;;
		*)
			echo -e "${YELLOW}Unknown option:${NC} $1"; usage; exit 1;;
	esac
done

# Resolve repo root and frontend directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
FRONTEND_DIR="${ROOT_DIR}/frontend"

if [[ ! -d "${FRONTEND_DIR}" ]]; then
	echo -e "${RED}Error:${NC} Frontend directory not found at ${FRONTEND_DIR}"
	exit 1
fi

cd "${FRONTEND_DIR}"

# Basic prerequisites
if ! command -v npm >/dev/null 2>&1; then
	echo -e "${RED}Error:${NC} npm not found. Please install Node.js (npm)."
	exit 1
fi

if [[ ! -f package.json ]]; then
	echo -e "${RED}Error:${NC} package.json not found in ${FRONTEND_DIR}"
	exit 1
fi

# Decide preferred port
DEFAULT_PORT="${PORT_ARG:-${PORT:-5173}}"

port_in_use() {
	# macOS: lsof is available by default
	lsof -ti :"$1" >/dev/null 2>&1
}

if [[ "${FORCE_KILL}" -eq 1 ]] && port_in_use "${DEFAULT_PORT}"; then
	echo -e "${YELLOW}Force killing process on port ${DEFAULT_PORT}...${NC}"
	# shellcheck disable=SC2009
	lsof -ti :"${DEFAULT_PORT}" | xargs -r kill -9 || true
	# Give the OS a moment to release the port
	sleep 0.5
fi

PORT="${DEFAULT_PORT}"
MAX_PORT=$((DEFAULT_PORT + 10))
while port_in_use "${PORT}"; do
	echo -e "${YELLOW}Port ${PORT} is in use, trying another one...${NC}"
	PORT=$((PORT + 1))
	if (( PORT > MAX_PORT )); then
		echo -e "${RED}Error:${NC} No free port found in range ${DEFAULT_PORT}-${MAX_PORT}"
		exit 1
	fi
done

echo -e "${BLUE}Repo:${NC}      ${ROOT_DIR}"
echo -e "${BLUE}Frontend:${NC}  ${FRONTEND_DIR}"
echo -e "${BLUE}Port:${NC}      ${PORT}"

# Prepare flags for vite
OPEN_FLAG=""
if [[ "${OPEN_BROWSER}" -eq 1 ]]; then
	OPEN_FLAG="--open"
fi

echo -e "${GREEN}Starting Vite dev server...${NC}"
echo -e "${BLUE}Command:${NC} npm run dev -- --port ${PORT} ${OPEN_FLAG}"

# Some apps may read VITE_PORT
export VITE_PORT="${PORT}"

# Hand over to npm (foreground). If you want background, invoke this script with `&`.
exec npm run dev -- --port "${PORT}" ${OPEN_FLAG}

