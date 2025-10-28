'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { marked } from 'marked'
import hljs from 'highlight.js'

type Message = {
  role: 'user' | 'assistant' | 'system'
  content: string
}

type ChatClientProps = {
  conversationId?: string
  title?: string
  model?: string
  provider?: string
}

export function ChatClient(props: ChatClientProps) {
  // 聊天消息列表，默认插入一条 system 提示
  const [messages, setMessages] = useState<Message[]>([
    { role: 'system', content: 'You are a helpful assistant.' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | undefined>(
    props.conversationId
  )
  const [provider, setProvider] = useState<string>(props.provider ?? 'openai')
  const [model, setModel] = useState<string>(
    props.model ?? (provider === 'deepseek' ? 'deepseek-chat' : 'gpt-4o-mini')
  )

  const endRef = useRef<HTMLDivElement | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  useEffect(() => {
    // 消息更新后自动滚动到最底部
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    // 配置 marked（GFM + 换行 + 代码高亮）。注意：仅对 Assistant 内容渲染 Markdown
    ;(marked as any).setOptions({
      gfm: true,
      breaks: true,
      highlight: (code: string, lang?: string) => {
        if (lang && hljs.getLanguage(lang)) {
          return hljs.highlight(code, { language: lang }).value
        }
        return hljs.highlightAuto(code).value
      },
    })
  }, [])

  const canSend = useMemo(
    () => !loading && input.trim().length > 0,
    [loading, input]
  )

  async function onSend(content?: string) {
    if (!canSend) return
    // 提交用户输入，先本地追加 user 消息，清空输入框
    setLoading(true)
    setError(null)

    const userContent = (content ?? input).trim()
    const newMessages: Message[] = [
      ...messages,
      { role: 'user', content: userContent },
    ]
    setMessages(newMessages)
    setInput('')

    try {
      const useStream = true
      if (!useStream) {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId,
            title: props.title,
            model,
            provider,
            messages: newMessages,
          }),
        })
        if (!res.ok) {
          const j = await res.json().catch(() => ({}))
          throw new Error(j.error || `Request failed: ${res.status}`)
        }
        const data = await res.json()
        setConversationId(data.conversationId)
        setMessages(m => [...m, data.message])
      } else {
        // 开启流式：使用 AbortController 支持取消
        const controller = new AbortController()
        abortRef.current = controller
        const res = await fetch('/api/ai/chat/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId,
            title: props.title,
            model,
            provider,
            messages: newMessages,
          }),
          signal: controller.signal,
        })
        if (!res.ok || !res.body) {
          const j = await res.json().catch(() => ({}))
          throw new Error(j.error || `Stream request failed: ${res.status}`)
        }
        // 预置 assistant 空消息占位，后续逐块填充内容
        setMessages(m => [...m, { role: 'assistant', content: '' }])
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let assistantText = ''
        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          // 解析 SSE：按空行分块，每行形如 `data: <delta>`，将 delta 追加到文本
          const blocks = chunk.split(/\n\n/)
          for (const block of blocks) {
            if (!block) continue
            const lines = block.split('\n')
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                assistantText += data
              }
              // ignore other lines or event headers
            }
          }
          setMessages(m => {
            const copy = [...m]
            // 实时更新最后一条 assistant 消息内容
            const lastIdx = copy.length - 1
            if (
              lastIdx >= 0 &&
              (copy[lastIdx] as Message).role === 'assistant'
            ) {
              copy[lastIdx] = {
                ...(copy[lastIdx] as Message),
                content: assistantText,
              } as Message
            }
            return copy
          })
        }
        abortRef.current = null
        // 兜底：确保最后一条 assistant 消息的 role 正确
        setMessages(m => {
          const copy = [...m]
          const lastIdx = copy.length - 1
          if (lastIdx >= 0) {
            const last = copy[lastIdx] as Message
            copy[lastIdx] = {
              role: last.role ?? 'assistant',
              content: last.content,
            } as Message
          }
          return copy
        })
      }
    } catch (e: any) {
      setError(e.message || 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  async function onRegenerate() {
    const lastUser = [...messages].reverse().find(m => m.role === 'user')
    if (!lastUser) return
    await onSend(lastUser.content)
  }

  function onClear() {
    // 清空对话（仅本地状态），新一轮对话将创建新的 conversationId
    setMessages([{ role: 'system', content: 'You are a helpful assistant.' }])
    setConversationId(undefined)
  }

  function onCancel() {
    // 取消当前流式请求
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>AI Chat</CardTitle>
          <div className="flex items-center gap-2">
            {/* 提供商选择（影响默认模型） */}
            <Select
              value={provider}
              onValueChange={val => {
                setProvider(val)
                setModel(val === 'deepseek' ? 'deepseek-chat' : 'gpt-4o-mini')
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="deepseek">DeepSeek</SelectItem>
              </SelectContent>
            </Select>
            {/* 模型选择 */}
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Model" />
              </SelectTrigger>
              <SelectContent>
                {provider === 'deepseek' ? (
                  <>
                    <SelectItem value="deepseek-chat">deepseek-chat</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="gpt-4o-mini">gpt-4o-mini</SelectItem>
                    <SelectItem value="gpt-4o">gpt-4o</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
            <Button variant="secondary" onClick={onClear} disabled={loading}>
              清空
            </Button>
            <Button variant="outline" onClick={onRegenerate} disabled={loading}>
              重试
            </Button>
            <Button
              variant="destructive"
              onClick={onCancel}
              disabled={!loading}
            >
              取消
            </Button>
          </div>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="space-y-4">
        {/* 固定高度滚动容器，避免影响外层滚动条 */}
        <div className="space-y-3 max-h-[60vh] min-h-[40vh] overflow-y-auto pr-2 pt-3">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role !== 'user' && (
                <Avatar className="h-7 w-7">
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
              )}
              <div
                className={
                  m.role === 'user'
                    ? 'rounded-lg bg-primary text-primary-foreground px-3 py-2 max-w-[80%]'
                    : 'rounded-lg bg-muted px-3 py-2 max-w-[80%]'
                }
              >
                <div className="text-[11px] opacity-60 mb-1">
                  {m.role === 'user'
                    ? 'You'
                    : m.role === 'assistant'
                      ? 'AI'
                      : 'System'}
                </div>
                {m.role === 'assistant' ? (
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none break-words [&_*]:text-inherit [&_code]:text-inherit [&_pre]:text-inherit"
                    dangerouslySetInnerHTML={{
                      __html: marked.parse(m.content) as string,
                    }}
                  />
                ) : (
                  // 用户/系统消息：直接渲染纯文本以继承气泡前景色
                  <div className="whitespace-pre-wrap break-words">
                    {m.content}
                  </div>
                )}
                {loading && m.role === 'assistant' && (
                  <span className="inline-block w-2 h-4 align-baseline animate-pulse bg-current ml-1" />
                )}
                {m.role !== 'system' && (
                  <div className="mt-2 flex gap-2 text-xs opacity-70">
                    <button
                      className="underline"
                      onClick={() => navigator.clipboard.writeText(m.content)}
                    >
                      复制
                    </button>
                  </div>
                )}
              </div>
              {m.role === 'user' && (
                <Avatar className="h-7 w-7">
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {loading && (
            <div className="text-sm text-muted-foreground">Thinking…</div>
          )}
          {error && <div className="text-sm text-destructive">{error}</div>}
          <div ref={endRef} />
        </div>

        <div className="flex gap-2 items-end">
          <Textarea
            value={input}
            rows={3}
            placeholder="输入你的问题… 按 Enter 发送，Shift+Enter 换行"
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={loading}
          />
          <Button onClick={() => onSend()} disabled={!canSend}>
            发送
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default ChatClient
