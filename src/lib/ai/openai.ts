import OpenAI from 'openai'
import { env } from '@/env'
import { type ChatMessage, type ChatRequest, type ChatResponse } from './types'

let client: OpenAI | null = null

function getClient(): OpenAI {
  if (!client) {
    if (!env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured')
    }
    client = new OpenAI({ apiKey: env.OPENAI_API_KEY })
  }
  return client
}

export async function openaiChat(request: ChatRequest): Promise<ChatResponse> {
  const model = request.model ?? 'gpt-4o-mini'
  const temperature = request.temperature ?? 0.7
  const messages = request.messages as ChatMessage[]

  const api = getClient()

  const completion = await api.chat.completions.create({
    model,
    temperature,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
  })

  if (!completion.choices?.length) {
    throw new Error('OpenAI returned no choices')
  }
  const first = completion.choices[0]

  return {
    provider: 'openai',
    model: completion.model ?? model,
    choices: [
      {
        role: ((first as any).message?.role as any) ?? 'assistant',
        content: (first as any).message?.content ?? '',
      },
    ],
    usage: {
      promptTokens: completion.usage?.prompt_tokens,
      completionTokens: completion.usage?.completion_tokens,
      totalTokens: completion.usage?.total_tokens,
    },
  }
}
