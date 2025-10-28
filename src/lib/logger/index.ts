/**
 * 简单的日志记录器实现
 * 提供基础的日志输出功能，适用于轻量级应用
 */

/**
 * 日志上下文接口
 * 用于传递额外的日志信息，支持任意键值对
 */
interface LogContext {
  [key: string]: any // 支持任意类型的自定义字段
}

/**
 * 简单日志记录器类
 * 提供基本的日志级别输出功能
 */
class SimpleLogger {
  /**
   * 记录信息级别日志
   * @param message - 日志消息
   * @param context - 可选的上下文信息
   */
  info(message: string, context?: LogContext) {
    console.log(`[INFO] ${message}`, context || '')
  }

  /**
   * 记录错误级别日志
   * @param message - 错误消息
   * @param error - 可选的错误对象
   * @param context - 可选的上下文信息
   */
  error(message: string, error?: Error, context?: LogContext) {
    console.error(`[ERROR] ${message}`, error || '', context || '')
  }

  /**
   * 记录警告级别日志
   * @param message - 警告消息
   * @param context - 可选的上下文信息
   */
  warn(message: string, context?: LogContext) {
    console.warn(`[WARN] ${message}`, context || '')
  }

  /**
   * 记录调试级别日志
   * 仅在开发环境下输出，生产环境会被忽略
   * @param message - 调试消息
   * @param context - 可选的上下文信息
   */
  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, context || '')
    }
  }
}

// 导出单例实例，供全局使用
export const logger = new SimpleLogger()
