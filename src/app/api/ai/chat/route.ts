import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { env, isAIConfigured } from '@/env'
import { db, schema } from '@/lib/db'
import { generateAIResponse, type ChatMessage } from '@/lib/ai'
import { and, desc, eq, sql } from 'drizzle-orm'
import { auth } from '@clerk/nextjs/server'
import { headers } from 'next/headers'

const bodySchema = z.object({
  conversationId: z.string().uuid().optional(),
  title: z.string().min(1).max(200).optional(),
  model: z.string().optional(),
  provider: z
    .enum(['openai', 'anthropic', 'google', 'xai', 'deepseek'])
    .optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string().min(1),
      })
    )
    .min(1),
  temperature: z.number().min(0).max(2).optional(),
})

export async function POST(req: NextRequest) {
  try {
    // Next.js 动态 API：需先 await headers() 再调用 auth()
    await headers()
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 功能开关：若未配置任一 AI Key 或关闭开关，则返回 500
    if (!isAIConfigured()) {
      return NextResponse.json({ error: 'AI not configured' }, { status: 500 })
    }

    // 解析并校验请求体
    const json = await req.json()
    const input = bodySchema.parse(json)

    // 确保存在会话：未传 conversationId 则新建，已传则校验归属并可继承模型
    let conversationId = input.conversationId
    let model = input.model ?? 'gpt-4o-mini'
    const provider = input.provider ?? 'openai'

    if (!conversationId) {
      const [conv] = await db
        .insert(schema.conversations)
        .values({
          userId,
          title: input.title ?? 'New Chat',
          model,
          type: 'chat',
        })
        .returning({ id: schema.conversations.id })
      if (!conv) {
        return NextResponse.json(
          { error: 'Failed to create conversation' },
          { status: 500 }
        )
      }
      conversationId = conv.id
    } else {
      // fetch model from existing conv if not provided
      const [conv] = await db
        .select({ model: schema.conversations.model })
        .from(schema.conversations)
        .where(
          and(
            eq(schema.conversations.id, conversationId),
            eq(schema.conversations.userId, userId)
          )
        )
        .limit(1)
      if (!conv) {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        )
      }
      if (!input.model) {
        model = conv.model
      }
    }

    // 持久化用户消息（使用最后一条消息作为用户输入）
    const lastUser = input.messages[input.messages.length - 1]
    if (!lastUser) {
      return NextResponse.json({ error: 'Empty messages' }, { status: 400 })
    }
    await db.insert(schema.messages).values({
      conversationId: conversationId!,
      role: lastUser.role,
      content: lastUser.content,
      model,
    })

    // 调用统一的 AI 生成方法（当前支持 openai/deepseek，其他可扩展）
    const ai = await generateAIResponse({
      provider,
      model,
      messages: input.messages as ChatMessage[],
      temperature: input.temperature,
    })

    const choice = ai.choices[0]
    if (!choice) {
      return NextResponse.json(
        { error: 'AI returned no choices' },
        { status: 500 }
      )
    }

    // 事务：写入助手回复，并更新会话统计（消息数/Token/时间）
    await db.transaction(async tx => {
      await tx.insert(schema.messages).values({
        conversationId: conversationId!,
        role: 'assistant',
        content: choice.content,
        model,
        tokens: ai.usage?.totalTokens ?? 0,
      })

      await tx
        .update(schema.conversations)
        .set({
          messageCount: sql`${schema.conversations.messageCount} + 2`,
          totalTokens: sql`${schema.conversations.totalTokens} + ${ai.usage?.totalTokens ?? 0}`,
          lastMessageAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(schema.conversations.id, conversationId!))
    })

    return NextResponse.json({
      conversationId,
      model: ai.model,
      provider: ai.provider,
      message: choice,
      usage: ai.usage,
    })
  } catch (err: any) {
    // 兜底错误处理：返回错误信息，避免泄露堆栈
    return NextResponse.json(
      { error: err.message ?? 'AI request failed' },
      { status: 500 }
    )
  }
}
