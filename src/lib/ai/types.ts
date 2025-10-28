export type AIProvider = 'openai' | 'anthropic' | 'google' | 'xai' | 'deepseek'

export type ChatRole = 'user' | 'assistant' | 'system'

export interface ChatMessage {
  role: ChatRole
  content: string
}

export interface ChatRequest {
  provider?: AIProvider
  model?: string
  messages: ChatMessage[]
  temperature?: number
  stream?: boolean
}

export interface ChatUsage {
  promptTokens?: number
  completionTokens?: number
  totalTokens?: number
}

export interface ChatResponseChoice {
  role: ChatRole
  content: string
}

export interface ChatResponse {
  model: string
  provider: AIProvider
  choices: ChatResponseChoice[]
  usage?: ChatUsage
}
