import { NextRequest, NextResponse } from 'next/server'
import { creemProvider } from '@/lib/payments/creem'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import {
  membershipPlans,
  paymentRecords,
  userMemberships,
} from '@/drizzle/schemas'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  const signature = req.headers.get('creem-signature') || ''
  const rawBody = await req.text()

  // 签名校验
  const ok = creemProvider.verifyWebhookSignature(rawBody, signature)
  if (!ok)
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 })

  const event = creemProvider.parseWebhookEvent(JSON.parse(rawBody))

  try {
    if (event.type === 'payment.succeeded') {
      const meta = event.data?.metadata || {}
      const userId: string | undefined = meta.userId || event.data?.userId
      const planName: string | undefined = meta.planName || event.data?.planName
      const durationType: 'monthly' | 'yearly' = (meta.durationType ||
        event.data?.durationType ||
        'monthly') as any
      const amountNum: number = Number(event.data?.amount) || 0
      const currency: string = (
        event.data?.currency ||
        meta.currency ||
        'USD'
      ).toUpperCase()

      if (!userId || !planName) {
        logger.error(
          'Creem webhook missing userId/planName',
          new Error(`event:${event.id}`)
        )
        return NextResponse.json({ error: 'missing metadata' }, { status: 400 })
      }

      // 幂等：如果已处理过该支付，直接返回成功
      const existed = await db
        .select()
        .from(paymentRecords)
        .where(eq(paymentRecords.creemPaymentId, event.id))
        .limit(1)
      if (existed.length > 0) {
        return NextResponse.json({ received: true, duplicate: true })
      }

      // 获取计划
      const [plan] = await db
        .select()
        .from(membershipPlans)
        .where(eq(membershipPlans.name, planName))
        .limit(1)

      if (!plan) {
        logger.error(
          'Creem webhook plan not found',
          new Error(`plan:${planName}`)
        )
        return NextResponse.json({ error: 'plan not found' }, { status: 400 })
      }

      const durationDays = durationType === 'yearly' ? 365 : 30

      // 写入支付记录
      await db.insert(paymentRecords).values({
        userId,
        amount: amountNum.toString(),
        currency,
        status: 'succeeded',
        paymentMethod: 'creem',
        provider: 'creem',
        planName,
        durationType,
        membershipDurationDays: durationDays,
        metadata: event.data,
        creemPaymentId: event.id,
        paidAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      // 激活会员
      const now = new Date()
      const endDate = new Date(
        now.getTime() + durationDays * 24 * 60 * 60 * 1000
      )

      const existing = await db
        .select()
        .from(userMemberships)
        .where(eq(userMemberships.userId, userId))
        .limit(1)

      if (existing.length > 0) {
        await db
          .update(userMemberships)
          .set({
            planId: plan.id,
            startDate: now,
            endDate,
            status: 'active',
            durationType,
            durationDays,
            purchaseAmount: amountNum.toString(),
            currency,
            paymentMethod: 'creem',
            updatedAt: now,
          })
          .where(eq(userMemberships.userId, userId))
      } else {
        await db.insert(userMemberships).values({
          userId,
          planId: plan.id,
          startDate: now,
          endDate,
          status: 'active',
          durationType,
          durationDays,
          purchaseAmount: amountNum.toString(),
          currency,
          paymentMethod: 'creem',
          createdAt: now,
          updatedAt: now,
        })
      }

      logger.info('Creem membership activated', { userId, planId: plan.id })
    }
  } catch (e) {
    return NextResponse.json({ error: 'processing failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
