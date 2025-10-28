#!/bin/bash

# 杀掉占用指定端口的进程
# 使用方法: ./kill-port.sh <端口号>

# 检查是否提供了端口号参数
if [ -z "$1" ]; then
    echo "❌ 错误: 请提供端口号"
    echo ""
    echo "使用方法:"
    echo "  ./scripts/kill-port.sh <端口号>"
    echo ""
    echo "示例:"
    echo "  ./scripts/kill-port.sh 3000"
    echo "  ./scripts/kill-port.sh 8080"
    exit 1
fi

PORT=$1

# 检查端口号是否是数字
if ! [[ "$PORT" =~ ^[0-9]+$ ]]; then
    echo "❌ 错误: 端口号必须是数字"
    exit 1
fi

echo "🔍 正在查找占用端口 $PORT 的进程..."

# 尝试多种方法查找进程
PID=$(lsof -ti:$PORT 2>/dev/null)

if [ -z "$PID" ]; then
    echo "✅ 端口 $PORT 未被占用"
    exit 0
fi

echo "📋 找到进程 PID: $PID"
echo "   $(ps -p $PID -o pid,comm,args)"

# 确认是否要杀掉进程
read -p "⚠️  确定要杀掉此进程吗? (y/N): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 操作已取消"
    exit 0
fi

# 杀掉进程
echo "🔪 正在终止进程 $PID..."
kill -9 $PID 2>/dev/null

# 等待一下让系统处理
sleep 0.5

# 验证是否成功
if lsof -ti:$PORT >/dev/null 2>&1; then
    echo "❌ 进程终止失败，端口 $PORT 仍被占用"
    exit 1
else
    echo "✅ 成功释放端口 $PORT"
    exit 0
fi

