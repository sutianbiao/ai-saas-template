#!/usr/bin/env node

/**
 * Creem Webhook/Checkout 测试脚本
 * 用于快速验证 Creem Checkout 创建与本地 Webhook 端点接入
 */

const fetch = require('node-fetch')

const CREEM_API_KEY = process.env.CREEM_API_KEY
const CREEM_API_BASE = process.env.CREEM_API_BASE || 'https://api.creem.io'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

async function testCreem() {
  console.log('🧪 开始测试 Creem Checkout/Webhook...\n')

  if (!CREEM_API_KEY) {
    console.error('❌ 请设置 CREEM_API_KEY 环境变量')
    process.exit(1)
  }

  try {
    // 1) 创建 Checkout Session（请替换为你计划中的有效 priceId）
    console.log('1️⃣ 创建 Creem Checkout 会话...')
    const body = {
      priceId: process.env.CREEM_TEST_PRICE_ID || 'price_test_usd_monthly',
      quantity: 1,
      currency: 'usd',
      successUrl: `${SITE_URL}/en/payment/success`,
      cancelUrl: `${SITE_URL}/en/payment/cancelled`,
      metadata: {
        userId: 'test_user_creem_123',
        planName: 'Pro',
        durationType: 'monthly',
        currency: 'USD',
      },
    }

    const res = await fetch(`${CREEM_API_BASE}/v1/checkout/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${CREEM_API_KEY}`,
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`创建会话失败: ${res.status} ${text}`)
    }
    const data = await res.json()
    console.log(`✅ 会话创建成功: ${data.id || data.sessionId}`)
    console.log(`🔗 支付链接: ${data.url || data.checkoutUrl}\n`)

    console.log('💡 手动测试建议:')
    console.log('1. 打开上方支付链接完成一笔测试支付')
    console.log(
      '2. 在 Creem Dashboard 配置 Webhook 指向本地端点 /api/webhook/creem'
    )
    console.log('3. 使用 ngrok 暴露本地 3000 端口: ngrok http 3000')
    console.log(
      '4. 完成支付后，观察服务端日志与数据库 payment_records 是否写入，并激活会员'
    )

    // 2) 可选：模拟本地 Webhook（仅用于验证路由是否存活，不代表真实签名）
    if (process.env.SIMULATE_WEBHOOK === 'true') {
      console.log('\n2️⃣ 模拟本地 Webhook 回调 (签名占位)...')
      const mockEvent = {
        id: 'evt_creem_test_123',
        type: 'payment.succeeded',
        data: {
          amount: 9.99,
          currency: 'USD',
          metadata: body.metadata,
        },
      }
      const webhookRes = await fetch(`${SITE_URL}/api/webhook/creem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'creem-signature': 't=0,s=deadbeef', // 仅占位
        },
        body: JSON.stringify(mockEvent),
      })
      console.log(
        `Webhook 响应: ${webhookRes.status} ${await webhookRes.text()}`
      )
    }

    console.log('\n🎉 Creem 测试脚本执行完成！')
  } catch (err) {
    console.error('❌ 测试失败:', err.message)
    process.exit(1)
  }
}

testCreem()
