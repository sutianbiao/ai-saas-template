import { useEffect, useState } from 'react'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)

    // 初始检查
    setMatches(mediaQuery.matches)

    // 创建回调函数来处理变化
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // 添加监听器
    mediaQuery.addEventListener('change', handleChange)

    // 清理
    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [query])

  return matches
}
