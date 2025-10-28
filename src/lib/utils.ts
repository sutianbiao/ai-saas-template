import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * 合并和优化 CSS 类名的工具函数
 * 结合了 clsx 的条件类名处理和 tailwind-merge 的 Tailwind CSS 类名去重功能
 *
 * @param inputs - 可变数量的类名参数，支持字符串、对象、数组等格式
 * @returns 合并后的优化类名字符串
 *
 * @example
 * // 基本用法
 * cn('px-2 py-1', 'bg-red-500')
 *
 * // 条件类名
 * cn('base-class', { 'active': isActive, 'disabled': isDisabled })
 *
 * // Tailwind 类名冲突处理（后面的会覆盖前面的）
 * cn('px-2 px-4') // 结果: 'px-4'
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
