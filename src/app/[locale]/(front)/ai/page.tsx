import { ChatClient } from '@/components/ai/ChatClient'
import { AuthGuardClient } from '@/components/auth/AuthGuardClient'
import { isAIConfigured } from '@/env'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function AIPage() {
  if (!isAIConfigured()) {
    return (
      <div className="container py-10">
        <Alert>
          <AlertTitle>AI 未启用</AlertTitle>
          <AlertDescription>
            管理员尚未配置 AI API Key 或已关闭 AI 功能。
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <AuthGuardClient>
      <div className="container py-10">
        <ChatClient model="deepseek-chat" provider="deepseek" />
      </div>
    </AuthGuardClient>
  )
}
