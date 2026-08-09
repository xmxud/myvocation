#!/bin/bash
#
# start.sh - 同时启动 myvocation2026 前后端服务（调试模式）
#

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "========================================="
echo "  MyVocation 2026 - 启动前后端服务"
echo "========================================="
echo ""

# ---------- 后端 (Python/FastAPI) ----------
echo "[1/4] 检查 Python 后端依赖..."
pushd "$SCRIPT_DIR/backend" > /dev/null
if [ ! -d "venv" ] && [ ! -f ".deps_installed" ]; then
    echo "      安装 Python 依赖..."
    pip install -q fastapi uvicorn aiosqlite pydantic pydantic-settings python-jose passlib python-multipart openpyxl
    touch .deps_installed
fi
echo "[2/4] 启动后端 (FastAPI @ http://localhost:3001) ..."
uvicorn app.main:app --host 0.0.0.0 --port 3001 --reload &
BACKEND_PID=$!
popd > /dev/null

sleep 1

# ---------- 前端 (Vite/React) ----------
echo "[3/4] 检查前端依赖..."
pushd "$SCRIPT_DIR/frontend" > /dev/null
[ -d node_modules ] || npm install
echo "[4/4] 启动前端 (Vite @ http://localhost:5173) ..."
npm run dev &
FRONTEND_PID=$!
popd > /dev/null

echo ""
echo "========================================="
echo "  后端 API : http://localhost:3001"
echo "  API 文档 : http://localhost:3001/docs"
echo "  前端页面 : http://localhost:5173"
echo "========================================="
echo "  按 Ctrl+C 停止所有服务"
echo ""

# 捕获 Ctrl+C，一并结束子进程
cleanup() {
    echo ""
    echo "正在停止服务..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    wait $BACKEND_PID $FRONTEND_PID 2>/dev/null
    echo "服务已停止。"
}
trap cleanup SIGINT SIGTERM

wait
