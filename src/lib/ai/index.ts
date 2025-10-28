import { isAIConfigured } from '@/env'
import { openaiChat } from './openai'
import { deepseekChat } from './deepseek'
import { type ChatRequest, type ChatResponse } from './types'

export async function generateAIResponse(
  req: ChatRequest
): Promise<ChatResponse> {
  if (!isAIConfigured()) {
    throw new Error('AI features are not configured')
  }

  const provider = req.provider ?? 'openai'

  switch (provider) {
    case 'openai':
      return await openaiChat(req)
    case 'deepseek':
      return await deepseekChat(req)
    default:
      throw new Error(`Provider not implemented: ${provider}`)
  }
}

export * from './types'
