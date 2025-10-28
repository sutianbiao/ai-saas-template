#!/bin/bash

# 强制杀掉占用指定端口的进程（无需确认）
# 使用方法: ./kill-port-force.sh <端口号>

# 检查是否提供了端口号参数
if [ -z "$1" ]; then
    echo "❌ 错误: 请提供端口号"
    echo ""
    echo "使用方法:"
    echo "  ./scripts/kill-port-force.sh <端口号>"
    echo ""
    echo "示例:"
    echo "  ./scripts/kill-port-force.sh 3000"
    exit 1
fi

PORT=$1

# 检查端口号是否是数字
if ! [[ "$PORT" =~ ^[0-9]+$ ]]; then
    echo "❌ 错误: 端口号必须是数字"
    exit 1
fi

# 查找占用端口的进程
PIDS=$(lsof -ti:$PORT 2>/dev/null)

if [ -z "$PIDS" ]; then
    echo "✅ 端口 $PORT 未被占用"
    exit 0
fi

# 显示找到的进程
echo "🔍 找到占用端口 $PORT 的进程:"
for PID in $PIDS; do
    echo "   PID: $PID - $(ps -p $PID -o comm=)"
done

# 杀掉所有相关进程
echo "🔪 正在终止进程..."
for PID in $PIDS; do
    kill -9 $PID 2>/dev/null
    echo "   ✅ 已终止进程 $PID"
done

# 等待系统处理
sleep 0.5

# 验证结果
if lsof -ti:$PORT >/dev/null 2>&1; then
    echo "⚠️  警告: 端口 $PORT 可能仍被占用"
    exit 1
else
    echo "✅ 成功释放端口 $PORT"
    exit 0
fi

