import { env } from '@/env'
import { createHmac, timingSafeEqual as nodeTimingSafeEqual } from 'crypto'
import type {
  CreateCheckoutParams,
  CreateCheckoutResult,
  PaymentProvider,
  RefundParams,
} from './index'

// 参考 Creem 文档：创建 Checkout、退款、Webhooks 签名校验
// Docs: https://docs.creem.io/introduction

export class CreemProvider implements PaymentProvider {
  async createCheckout(
    params: CreateCheckoutParams
  ): Promise<CreateCheckoutResult> {
    const base = env.CREEM_API_BASE || 'https://api.creem.io'
    const apiKey = env.CREEM_API_KEY
    if (!apiKey) {
      throw new Error('CREEM_API_KEY not configured')
    }

    // 标准化 payload（包含 metadata）
    const body: any = {
      priceId: params.priceId,
      quantity: 1,
      currency: params.currency.toLowerCase(),
      successUrl: params.returnUrl,
      cancelUrl: `${params.returnUrl}?cancelled=1`,
      metadata: {
        userId: params.userId,
        planName: params.planName,
        durationType: params.durationType,
        currency: params.currency,
      },
    }

    const res = await fetch(`${base}/v1/checkout/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Creem createCheckout failed: ${res.status} ${text}`)
    }
    const data = await res.json()
    return {
      sessionId: data.id || data.sessionId || '',
      url: data.url || data.checkoutUrl,
      amount: data.amount || undefined,
      currency: (data.currency || params.currency)?.toUpperCase(),
    }
  }

  async refund(_params: RefundParams): Promise<{ success: boolean }> {
    const base = env.CREEM_API_BASE || 'https://api.creem.io'
    const apiKey = env.CREEM_API_KEY
    if (!apiKey) {
      throw new Error('CREEM_API_KEY not configured')
    }

    const res = await fetch(`${base}/v1/payments/${_params.paymentId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ amount: _params.amount, reason: _params.reason }),
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Creem refund failed: ${res.status} ${text}`)
    }
    return { success: true }
  }

  verifyWebhookSignature(_rawBody: string, _signature: string): boolean {
    // 假设签名头格式为: "t=timestamp,s=hex"，实际以 Creem 文档为准
    try {
      const secret = env.CREEM_WEBHOOK_SECRET
      if (!secret || !_signature) return false
      const parts = _signature.split(',')
      const sigPart = parts.find(p => p.trim().startsWith('s=')) || ''
      const provided = sigPart.replace(/^.*s=/, '').trim()
      if (!provided) return false
      const expected = createHmac('sha256', secret)
        .update(_rawBody)
        .digest('hex')
      const a = Buffer.from(expected, 'hex')
      const b = Buffer.from(provided, 'hex')
      if (a.length !== b.length) return false
      return nodeTimingSafeEqual(a, b)
    } catch {
      return false
    }
  }

  parseWebhookEvent(body: unknown): { type: string; id: string; data: any } {
    const anyBody: any = body
    return {
      type: anyBody?.type || 'unknown',
      id: anyBody?.id || 'unknown',
      data: anyBody?.data || anyBody,
    }
  }
}

export const creemProvider = new CreemProvider()

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/[^0-9a-fA-F]/g, '')
  const bytes = new Uint8Array(clean.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.substr(i * 2, 2), 16)
  }
  return bytes
}

function timingSafeEqual(
  a: Uint8Array | undefined,
  b: Uint8Array | undefined
): boolean {
  if (!a || !b) return false
  const A = Buffer.from(a)
  const B = Buffer.from(b)
  if (A.length !== B.length) return false
  return nodeTimingSafeEqual(A, B)
}
