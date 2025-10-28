import { blog } from '@/.source'
import { loader } from 'fumadocs-core/source'
import type { InferMetaType, InferPageType } from 'fumadocs-core/source'

/**
 * 博客源配置
 * 使用 fumadocs-core 的 loader 创建博客源实例
 */
export const blogSource = loader({
  baseUrl: '/blog', // 博客基础路径
  source: blog.toFumadocsSource(), // 转换为 fumadocs 格式的源数据
})

// 导出类型定义
export type BlogMeta = InferMetaType<typeof blogSource>
export type BlogPage = InferPageType<typeof blogSource>

/**
 * 博客前置元数据接口
 * 定义博客文章文件头部可包含的元信息
 */
interface BlogFrontmatter {
  title: string // 文章标题
  description?: string // 文章描述
  author?: string // 作者
  date?: string // 发布日期
  tags?: string[] // 标签
}

/**
 * 获取指定语言的博客文章列表
 * 按发布日期倒序排列（最新的在前）
 * @param locale - 语言代码，默认为 'en'
 * @returns 排序后的博客文章数组
 */
export function getBlogPosts(locale = 'en'): BlogPage[] {
  // 获取所有文章
  const allPosts = blogSource.getPages()

  // 过滤出指定语言的文章
  const filteredPosts = allPosts.filter(post => {
    const urlParts = post.url.split('/')
    const postLocale = urlParts[2]
    return postLocale === locale
  })

  // 按日期降序排序（最新的在前）
  return filteredPosts.sort((a, b) => {
    const frontmatterA = a.data as BlogFrontmatter
    const frontmatterB = b.data as BlogFrontmatter
    const dateA = new Date(frontmatterA.date || '')
    const dateB = new Date(frontmatterB.date || '')
    return dateB.getTime() - dateA.getTime()
  })
}

/**
 * 根据 slug 获取单个博客文章
 * @param slug - 文章 slug 数组
 * @param locale - 语言代码，默认为 'en'
 * @returns 博客文章对象或 undefined
 */
export function getBlogPost(
  slug: string[],
  locale = 'en'
): BlogPage | undefined {
  // 构建完整的 slug 路径（包含语言前缀）
  const fullSlug = [locale, ...slug]
  return blogSource.getPage(fullSlug)
}

/**
 * 格式化日期
 * 根据指定的语言环境格式化日期显示
 * @param date - 日期字符串或 Date 对象
 * @param locale - 语言代码（'en' 或 'zh'），默认为 'en'
 * @returns 格式化后的日期字符串
 */
export function formatDate(date: string | Date, locale = 'en'): string {
  const d = new Date(date)

  // 语言代码到浏览器 locale 的映射
  const localeMap = {
    zh: 'zh-CN',
    en: 'en-US',
  }

  // 使用本地化日期格式
  return d.toLocaleDateString(
    localeMap[locale as keyof typeof localeMap] || 'en-US',
    {
      year: 'numeric', // 完整年份
      month: 'long', // 完整月份名称
      day: 'numeric', // 日期
    }
  )
}

/**
 * 计算阅读时长
 * 基于文章字数估算阅读所需时间（分钟）
 * @param content - 文章内容
 * @returns 阅读时长（分钟）
 */
export function getReadingTime(content: string): number {
  // 平均阅读速度：每分钟 200 个单词
  const wordsPerMinute = 200

  // 计算单词数量（去除空白后按空格分割）
  const words = content.trim().split(/\s+/).length

  // 向上取整到最近的整数分钟
  return Math.ceil(words / wordsPerMinute)
}
