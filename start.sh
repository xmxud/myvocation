#!/bin/bash
#
# start.sh - 同时启动 myvocation2026 前后端服务
#

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "========================================="
echo "  myvocation2026 - 启动前后端服务"
echo "========================================="
echo ""

# ---------- 后端 ----------
echo "[1/3] 检查并安装后端依赖..."
pushd "$SCRIPT_DIR/backend" > /dev/null
[ -d node_modules ] || npm install
echo "[2/4] 启动后端 (Express @ http://localhost:3001) ..."
npm run dev &
BACKEND_PID=$!
popd > /dev/null

# ---------- 前端 ----------
echo "[3/4] 检查并安装前端依赖..."
pushd "$SCRIPT_DIR/frontend" > /dev/null
[ -d node_modules ] || npm install
echo "[4/4] 启动前端 (Vite @ http://localhost:5173) ..."
npm run dev &
FRONTEND_PID=$!
popd > /dev/null

echo ""
echo "========================================="
echo "  后端 API : http://localhost:3001"
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
