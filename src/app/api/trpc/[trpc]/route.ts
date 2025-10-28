import { appRouter } from '@/lib/trpc/root'
import { createTRPCContext } from '@/lib/trpc/server'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import type { NextRequest } from 'next/server'

// tRPC 路由处理器：接收 Next.js 的请求并交由 tRPC 处理
const handler = (req: NextRequest) =>
  fetchRequestHandler({
    // tRPC API 的访问端点，需要与客户端保持一致
    endpoint: '/api/trpc',
    req,
    // 应用的 tRPC 根路由（定义所有可用的路由/过程）
    router: appRouter,
    // 为每个请求创建上下文（认证信息、数据库连接等）
    createContext: createTRPCContext,
    onError:
      process.env.NODE_ENV === 'development'
        ? ({ path, error }) => {
            // 仅在开发环境输出详细错误日志，便于调试
            console.error(
              `❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`
            )
          }
        : undefined,
  })

// 将同一个处理器同时导出为 GET/POST 以支持不同的 HTTP 方法
export { handler as GET, handler as POST }
