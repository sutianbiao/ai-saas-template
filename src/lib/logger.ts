/**
 * 日志上下文接口
 * 用于传递额外的日志信息，如用户ID、操作类型等
 */
interface LogContext {
  category?: string // 日志分类
  userId?: string // 用户ID
  action?: string // 操作类型
  [key: string]: any // 其他自定义字段
}

/**
 * 日志记录器类
 * 提供统一的日志输出接口，支持不同级别的日志记录
 */
class Logger {
  /**
   * 记录信息级别日志
   * @param message - 日志消息
   * @param context - 可选的上下文信息
   */
  info(message: string, context?: LogContext) {
    console.log(`[INFO] ${message}`, context)
  }

  /**
   * 记录错误级别日志
   * @param message - 错误消息
   * @param error - 可选的错误对象
   * @param context - 可选的上下文信息
   */
  error(message: string, error?: Error, context?: LogContext) {
    console.error(`[ERROR] ${message}`, error, context)
  }

  /**
   * 记录调试级别日志
   * 仅在开发环境下输出，生产环境会被忽略
   * @param message - 调试消息
   * @param context - 可选的上下文信息
   */
  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, context)
    }
  }

  /**
   * 记录警告级别日志
   * @param message - 警告消息
   * @param context - 可选的上下文信息
   */
  warn(message: string, context?: LogContext) {
    console.warn(`[WARN] ${message}`, context)
  }
}

// 导出单例实例，供全局使用
export const logger = new Logger()
