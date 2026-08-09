#!/bin/bash
#
# stop.sh - 关闭 myvocation2026 前后端进程
#

echo "正在关闭 myvocation2026 服务..."

# 方法1：按端口杀进程
PORTS=(3001 5173)
KILLED=0

for PORT in "${PORTS[@]}"; do
  PID=$(netstat -ano 2>/dev/null | grep ":$PORT " | grep LISTENING | awk '{print $NF}' | head -1)
  if [ -n "$PID" ] && [ "$PID" != "0" ]; then
    taskkill //F //PID "$PID" 2>/dev/null && echo "  ✓ 已关闭端口 $PORT (PID $PID)" && KILLED=1
  fi
done

# 方法2：兜底 — 杀掉所有 node.exe（仅当上面没找到时）
if [ $KILLED -eq 0 ]; then
  echo "  未发现监听端口，尝试关闭所有 node 进程..."
  taskkill //F //IM node.exe 2>/dev/null && echo "  ✓ 已关闭所有 node 进程"
fi

echo "服务已停止。"
