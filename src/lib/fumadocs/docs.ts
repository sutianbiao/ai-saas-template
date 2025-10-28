import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { docs } from '@/.source'
import { loader } from 'fumadocs-core/source'
import type { InferMetaType, InferPageType } from 'fumadocs-core/source'

/**
 * 文档源配置
 * 使用 fumadocs-core 的 loader 创建文档源实例
 */
export const docsSource = loader({
  baseUrl: '/docs', // 文档基础路径
  source: docs.toFumadocsSource(), // 转换为 fumadocs 格式的源数据
})

// 导出类型定义
export type DocsMeta = InferMetaType<typeof docsSource>
export type DocsPage = InferPageType<typeof docsSource>

/**
 * 文档前置元数据接口
 * 定义文档文件头部可包含的元信息
 */
interface DocsFrontmatter {
  title: string // 文档标题
  description?: string // 文档描述
  author?: string // 作者
  date?: string // 创建日期
  tags?: string[] // 标签
}

/**
 * 元配置文件接口
 * 用于定义文件夹的配置信息
 */
interface MetaConfig {
  title?: string // 文件夹标题
  pages?: string[] // 页面顺序列表
  defaultOpen?: boolean // 是否默认展开
}

/**
 * 文档树节点接口
 * 支持嵌套文件夹结构的文档树
 */
export interface DocsTreeItem {
  type: 'page' | 'folder' // 节点类型：页面或文件夹
  name: string // 显示名称
  url?: string // 页面链接（仅页面类型）
  children?: DocsTreeItem[] // 子节点（仅文件夹类型）
  defaultOpen?: boolean // 是否默认展开（仅文件夹类型）
}

/**
 * 获取元配置文件内容
 * 读取指定语言和路径下的 meta.json 配置文件
 * @param locale - 语言代码（如 'en', 'zh'）
 * @param folderPath - 文件夹路径，默认为空（根目录）
 * @returns 元配置对象或 null（文件不存在时）
 */
function getMetaConfig(locale: string, folderPath = ''): MetaConfig | null {
  try {
    // 构建 meta.json 文件路径
    const metaPath = join(
      process.cwd(),
      'src/content/docs',
      locale,
      folderPath,
      'meta.json'
    )
    // 读取并解析配置文件
    const metaContent = readFileSync(metaPath, 'utf-8')
    const config = JSON.parse(metaContent) as MetaConfig
    return config
  } catch (error) {
    // 文件不存在或解析失败时返回 null
    return null
  }
}

/**
 * 获取指定语言的文档页面列表
 * 根据 meta.json 配置进行排序，支持自定义页面顺序
 * @param locale - 语言代码，默认为 'en'
 * @returns 排序后的文档页面数组
 */
export function getDocsPages(locale = 'en'): DocsPage[] {
  // 获取所有页面
  const allPages = docsSource.getPages()

  // 过滤出指定语言的页面，排除 meta 文件
  const filteredPages = allPages.filter(page => {
    const urlParts = page.url.split('/')
    const pageLocale = urlParts[2]
    return pageLocale === locale && page.file.name !== 'meta'
  })

  // 获取根目录的元配置用于排序
  const metaConfig = getMetaConfig(locale)

  if (metaConfig?.pages) {
    // 创建页面映射表以便快速查找
    const pageMap = new Map<string, DocsPage>()
    for (const page of filteredPages) {
      // 对于首页，slug 数组是 ['en'] 或 ['zh']，需要映射为 'index'
      if (page.slugs.length === 1 && page.file.name === 'index') {
        pageMap.set('index', page)
      } else {
        const pageSlug = page.slugs[page.slugs.length - 1]
        if (pageSlug) {
          pageMap.set(pageSlug, page)
        }
      }
    }

    // 根据 meta.json 中的顺序排列页面
    const orderedPages: DocsPage[] = []
    for (const pageSlug of metaConfig.pages) {
      const page = pageMap.get(pageSlug)
      if (page) {
        orderedPages.push(page)
        pageMap.delete(pageSlug)
      }
    }

    // 添加 meta.json 中未列出的剩余页面
    for (const remainingPage of pageMap.values()) {
      orderedPages.push(remainingPage)
    }

    return orderedPages
  }

  // 如果没有 meta.json，使用默认排序
  return filteredPages.sort((a, b) => {
    // 首页优先
    if (a.slugs.includes('index')) return -1
    if (b.slugs.includes('index')) return 1

    // 然后按标题排序
    const titleA = a.data.title || ''
    const titleB = b.data.title || ''
    return titleA.localeCompare(titleB)
  })
}

/**
 * 根据 slug 获取单个文档页面
 * @param slug - 页面 slug 数组
 * @param locale - 语言代码，默认为 'en'
 * @returns 文档页面对象或 undefined
 */
export function getDocsPage(
  slug: string[],
  locale = 'en'
): DocsPage | undefined {
  // 构建完整的 slug 路径（包含语言前缀）
  const fullSlug = [locale, ...slug]
  return docsSource.getPage(fullSlug)
}

/**
 * 获取文档页面树（简化版本）
 * @param locale - 语言代码，默认为 'en'
 * @returns 文档页面数组
 */
export function getDocsPageTree(locale = 'en') {
  const pages = getDocsPages(locale)
  return pages
}

/**
 * 构建嵌套文件夹结构的文档树
 * 支持多级文件夹和页面的层次结构展示
 * @param locale - 语言代码，默认为 'en'
 * @returns 文档树节点数组
 */
export function buildDocsTree(locale = 'en'): DocsTreeItem[] {
  // 获取所有页面
  const allPages = docsSource.getPages()

  // 过滤出指定语言的页面，排除 meta 文件
  const filteredPages = allPages.filter(page => {
    const urlParts = page.url.split('/')
    const pageLocale = urlParts[2]
    return pageLocale === locale && page.file.name !== 'meta'
  })

  // 获取根目录元配置
  const rootMetaConfig = getMetaConfig(locale)
  const tree: DocsTreeItem[] = []

  if (rootMetaConfig?.pages) {
    // 处理根目录 meta.json 中的每个项目
    for (const pageSlug of rootMetaConfig.pages) {
      // 检查是否为文件夹：查找 slug 长度大于 2 且第二个 slug 匹配的项目
      const folderPages = filteredPages.filter(
        page => page.slugs.length > 2 && page.slugs[1] === pageSlug
      )

      if (folderPages.length > 0) {
        // 这是一个文件夹
        const folderMetaConfig = getMetaConfig(locale, pageSlug)
        const folderItem: DocsTreeItem = {
          type: 'folder',
          name: folderMetaConfig?.title || pageSlug,
          defaultOpen: folderMetaConfig?.defaultOpen || false,
          children: [],
        }

        // 处理文件夹内容
        if (folderMetaConfig?.pages) {
          for (const subPageSlug of folderMetaConfig.pages) {
            const subPage = folderPages.find(
              page => page.slugs[page.slugs.length - 1] === subPageSlug
            )
            if (subPage) {
              if (folderItem.children) {
                folderItem.children.push({
                  type: 'page',
                  name: subPage.data.title || subPageSlug,
                  url: `/docs/${pageSlug}/${subPageSlug}`,
                })
              }
            }
          }
        }

        tree.push(folderItem)
      } else {
        // 这是一个普通页面
        const page = filteredPages.find(p => {
          if (pageSlug === 'index') {
            return p.slugs.length === 1 && p.file.name === 'index'
          }
          return p.slugs.length === 2 && p.slugs[1] === pageSlug
        })

        if (page) {
          const url = pageSlug === 'index' ? '/docs' : `/docs/${pageSlug}`
          tree.push({
            type: 'page',
            name: page.data.title || pageSlug,
            url,
          })
        }
      }
    }
  }

  return tree
}
