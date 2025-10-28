import OpenAI from 'openai'
import { env } from '@/env'
import { type ChatMessage, type ChatRequest, type ChatResponse } from './types'

let client: OpenAI | null = null

function getClient(): OpenAI {
  if (!client) {
    if (!env.DEEPSEEK_API_KEY) {
      throw new Error('DEEPSEEK_API_KEY is not configured')
    }
    client = new OpenAI({
      apiKey: env.DEEPSEEK_API_KEY,
      baseURL: env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
    })
  }
  return client
}

export async function deepseekChat(
  request: ChatRequest
): Promise<ChatResponse> {
  const model = request.model ?? 'deepseek-chat'
  const temperature = request.temperature ?? 0.7
  const messages = request.messages as ChatMessage[]

  const api = getClient()

  const completion = await api.chat.completions.create({
    model,
    temperature,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
  })

  const first = completion.choices?.[0]

  return {
    provider: 'deepseek',
    model: completion.model ?? model,
    choices: [
      {
        role: ((first && (first as any).message?.role) as any) ?? 'assistant',
        content: (first && (first as any).message?.content) ?? '',
      },
    ],
    usage: {
      promptTokens: completion.usage?.prompt_tokens,
      completionTokens: completion.usage?.completion_tokens,
      totalTokens: completion.usage?.total_tokens,
    },
  }
}
