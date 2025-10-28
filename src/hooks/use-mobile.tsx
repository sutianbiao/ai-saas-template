import * as React from 'react'

// 移动端断点阈值（像素）
const MOBILE_BREAKPOINT = 768

/**
 * 检测当前设备是否为移动端的 Hook
 * @returns {boolean} 是否为移动端设备
 */
export function useIsMobile() {
  // 初始化状态，undefined 表示还未检测
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    // 创建媒体查询监听器
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)

    // 窗口大小变化时的回调函数
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }

    // 添加监听器
    mql.addEventListener('change', onChange)

    // 初始检测
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)

    // 清理监听器
    return () => mql.removeEventListener('change', onChange)
  }, [])

  // 返回布尔值，确保不是 undefined
  return !!isMobile
}
