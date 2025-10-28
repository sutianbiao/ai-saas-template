#!/bin/bash

# Clerk Webhook 开发环境快速设置脚本
# 使用方法: ./scripts/setup-webhook-dev.sh

set -e

echo "🔧 Clerk Webhook 开发环境设置"
echo "================================"

# 检查 ngrok 是否已安装
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok 未安装"
    echo "请先安装 ngrok:"
    echo "  npm install -g ngrok"
    echo "  或访问 https://ngrok.com/download"
    exit 1
fi

echo "✅ ngrok 已安装"

# 检查是否已配置 authtoken
if ! ngrok config check &> /dev/null; then
    echo "⚠️  ngrok authtoken 未配置"
    echo "请先注册 ngrok 账户并获取 authtoken:"
    echo "  ngrok config add-authtoken YOUR_TOKEN"
    echo ""
    read -p "请输入您的 ngrok authtoken: " authtoken
    if [ -n "$authtoken" ]; then
        ngrok config add-authtoken "$authtoken"
        echo "✅ authtoken 配置成功"
    else
        echo "❌ authtoken 不能为空"
        exit 1
    fi
else
    echo "✅ ngrok authtoken 已配置"
fi

# 检查环境变量文件
if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local 文件不存在，正在创建..."
    cp .env.example .env.local 2>/dev/null || touch .env.local
fi

echo ""
echo "🚀 启动开发环境..."
echo ""

# 启动开发服务器
echo "启动 Next.js 开发服务器..."
pnpm dev &
DEV_PID=$!

# 等待服务器启动
sleep 3

# 启动 ngrok
echo "启动 ngrok 隧道..."
ngrok http 3000 &
NGROK_PID=$!

# 等待 ngrok 启动
sleep 2

# 获取 ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$NGROK_URL" ]; then
    echo ""
    echo "🎉 设置完成！"
    echo "================================"
    echo "📱 本地应用: http://localhost:3000"
    echo "🌐 公网访问: $NGROK_URL"
    echo ""
    echo "📋 下一步操作："
    echo "1. 在 Clerk Dashboard 中配置 Webhook:"
    echo "   URL: ${NGROK_URL}/api/webhook/clerk"
    echo ""
    echo "2. 更新 .env.local 文件:"
    echo "   NEXT_PUBLIC_SITE_URL=\"$NGROK_URL\""
    echo ""
    echo "3. 获取 Webhook Secret 并添加到 .env.local:"
    echo "   CLERK_WEBHOOK_SECRET=\"whsec_...\""
    echo ""
    echo "🛑 按 Ctrl+C 停止服务"
    
    # 等待用户中断
    trap "echo ''; echo '🛑 正在停止服务...'; kill $DEV_PID $NGROK_PID 2>/dev/null; exit 0" INT
    wait
else
    echo "❌ 无法获取 ngrok URL"
    kill $DEV_PID $NGROK_PID 2>/dev/null
    exit 1
fi
