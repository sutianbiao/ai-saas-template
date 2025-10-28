import { type NextRequest } from 'next/server'
import { headers } from 'next/headers'
import { z } from 'zod'
import { auth } from '@clerk/nextjs/server'
import { db, schema } from '@/lib/db'
import { isAIConfigured } from '@/env'
import OpenAI from 'openai'
import { env } from '@/env'
import { and, eq, sql } from 'drizzle-orm'

const bodySchema = z.object({
  conversationId: z.string().uuid().optional(),
  title: z.string().min(1).max(200).optional(),
  model: z.string().optional(),
  provider: z.enum(['openai', 'deepseek']).default('openai'),
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

function getOpenAIClient(provider: 'openai' | 'deepseek') {
  if (provider === 'deepseek') {
    if (!env.DEEPSEEK_API_KEY)
      throw new Error('DEEPSEEK_API_KEY is not configured')
    return new OpenAI({
      apiKey: env.DEEPSEEK_API_KEY,
      baseURL: env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
    })
  }
  if (!env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not configured')
  return new OpenAI({ apiKey: env.OPENAI_API_KEY })
}

export async function POST(req: NextRequest) {
  try {
    // Next.js 动态 API：需先 await headers() 再使用 auth()
    await headers()
    const { userId } = await auth()
    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }
    if (!isAIConfigured()) {
      return new Response('AI not configured', { status: 500 })
    }

    const json = await req.json()
    const input = bodySchema.parse(json)

    const provider = input.provider
    const model =
      input.model ?? (provider === 'deepseek' ? 'deepseek-chat' : 'gpt-4o-mini')

    // 确保会话存在：如果没有传入 conversationId 则新建
    let conversationId = input.conversationId
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
      if (!conv)
        return new Response('Failed to create conversation', { status: 500 })
      conversationId = conv.id
    } else {
      const [conv] = await db
        .select({ id: schema.conversations.id })
        .from(schema.conversations)
        .where(
          and(
            eq(schema.conversations.id, conversationId),
            eq(schema.conversations.userId, userId)
          )
        )
        .limit(1)
      if (!conv) return new Response('Conversation not found', { status: 404 })
    }

    // 持久化用户最新一条消息（假设数组最后一个为用户输入）
    const lastUser = input.messages[input.messages.length - 1]
    if (!lastUser) {
      return new Response('Empty messages', { status: 400 })
    }
    await db.insert(schema.messages).values({
      conversationId: conversationId!,
      role: lastUser.role,
      content: lastUser.content,
      model,
    })

    const encoder = new TextEncoder()
    const client = getOpenAIClient(provider)

    // 调用大模型并开启流式输出（chat.completions）
    const stream = await client.chat.completions.create({
      model,
      temperature: input.temperature ?? 0.7,
      messages: input.messages.map(m => ({
        role: m.role as any,
        content: m.content,
      })),
      stream: true,
    } as any)

    let fullText = ''
    let totalTokens = 0

    // 将上游流转为 Server-Sent Events（SSE）输出到客户端
    const readable = new ReadableStream<Uint8Array>({
      start(controller) {
        ;(async () => {
          try {
            for await (const chunk of stream as any) {
              const delta = (chunk as any)?.choices?.[0]?.delta?.content ?? ''
              if (delta) {
                fullText += delta
                controller.enqueue(encoder.encode(`data: ${delta}\n\n`))
              }
              if ((chunk as any)?.usage?.total_tokens) {
                totalTokens = (chunk as any).usage.total_tokens
              }
            }
            // 流结束后：写入助手完整消息，并更新会话统计（消息数/Token/时间）
            await db.transaction(async tx => {
              await tx.insert(schema.messages).values({
                conversationId: conversationId!,
                role: 'assistant',
                content: fullText,
                model,
                tokens: totalTokens || 0,
              })
              await tx
                .update(schema.conversations)
                .set({
                  messageCount: sql`${schema.conversations.messageCount} + 2`,
                  totalTokens: sql`${schema.conversations.totalTokens} + ${totalTokens || 0}`,
                  lastMessageAt: new Date(),
                  updatedAt: new Date(),
                })
                .where(eq(schema.conversations.id, conversationId!))
            })
            // 发送完成事件，方便前端感知结束
            controller.enqueue(
              encoder.encode(
                `event: done\ndata: ${JSON.stringify({ conversationId })}\n\n`
              )
            )
            controller.close()
          } catch (err) {
            controller.error(err)
          }
        })()
      },
      cancel() {},
    })

    return new Response(readable, {
      headers: {
        // SSE 响应头：禁用中间缓存与缓冲，保持连接
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (err: any) {
    return new Response(err.message || 'Stream failed', { status: 500 })
  }
}
