import { getServerStripe } from '@/lib/payments/stripe'
import { auth } from '@clerk/nextjs/server'
import { type NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { priceId, planName, isYearly = false } = await req.json()

    console.log('🔍 API接收到的支付请求参数:', {
      priceId,
      planName,
      isYearly,
      userId,
      timestamp: new Date().toISOString(),
    })

    if (!(priceId && planName)) {
      console.error('❌ 缺少必要参数:', { priceId, planName })
      return NextResponse.json(
        {
          error:
            'Missing required parameters: priceId and planName are required',
        },
        { status: 400 }
      )
    }

    const stripe = getServerStripe()

    // 详细验证price ID
    console.log('🔍 开始验证Stripe价格ID:', priceId)

    try {
      const price = await stripe.prices.retrieve(priceId)

      console.log('📋 Stripe价格详情:', {
        id: price.id,
        type: price.type,
        recurring: price.recurring,
        currency: price.currency,
        unit_amount: price.unit_amount,
        active: price.active,
        product: price.product,
      })

      if (!price.active) {
        console.error('❌ 价格已被禁用:', price.id)
        return NextResponse.json(
          { error: `Price ${priceId} is not active` },
          { status: 400 }
        )
      }

      if (price.type !== 'recurring') {
        console.error('❌ 价格类型不是订阅:', {
          priceId: price.id,
          actualType: price.type,
          expected: 'recurring',
        })
        return NextResponse.json(
          {
            error: `Price ${priceId} is not a recurring subscription price. Type: ${price.type}`,
          },
          { status: 400 }
        )
      }

      if (!price.recurring) {
        console.error('❌ 缺少订阅配置:', price.id)
        return NextResponse.json(
          { error: `Price ${priceId} missing recurring configuration` },
          { status: 400 }
        )
      }

      console.log('✅ 价格验证通过:', {
        id: price.id,
        interval: price.recurring.interval,
        intervalCount: price.recurring.interval_count,
      })
    } catch (priceError: any) {
      console.error('❌ 获取Stripe价格失败:', {
        priceId,
        error: priceError.message,
        type: priceError.type,
        code: priceError.code,
      })
      return NextResponse.json(
        { error: `Invalid Stripe price ID: ${priceId}. ${priceError.message}` },
        { status: 400 }
      )
    }

    // 创建或获取Stripe客户
    console.log('🔍 查找或创建Stripe客户...')
    const customers = await stripe.customers.search({
      query: `metadata["userId"]:"${userId}"`,
    })

    let customerId: string

    if (customers.data.length > 0) {
      customerId = customers.data[0]!.id
      console.log('✅ 找到现有Stripe客户:', customerId)
    } else {
      const customer = await stripe.customers.create({
        metadata: {
          userId: userId,
        },
      })
      customerId = customer.id
      console.log('✅ 创建新Stripe客户:', customerId)
    }

    // 创建checkout session
    console.log('🚀 创建Stripe checkout session...')
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/success?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?canceled=true`,
      metadata: {
        userId: userId,
        planName: planName,
        isYearly: isYearly.toString(),
      },
    })

    console.log('✅ Stripe session创建成功:', {
      sessionId: session.id,
      url: `${session.url?.substring(0, 50)}...`,
      customer: session.customer,
      mode: session.mode,
    })

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url,
      },
    })
  } catch (error: any) {
    console.error('❌ 创建checkout session错误:', {
      message: error.message,
      type: error.type,
      code: error.code,
      stack: error.stack?.split('\n').slice(0, 5),
    })

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error.message,
        type: error.type,
      },
      { status: 500 }
    )
  }
}
