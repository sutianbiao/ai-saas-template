'use client'

import { SignInButton } from '@/components/auth/SignInButton'
import { Logo } from '@/components/common/logo'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useUserMembership } from '@/hooks/use-membership'
import { logger } from '@/lib/logger'
import { cn } from '@/lib/utils'
import { useClerk, useUser } from '@clerk/nextjs'
import {
  Crown,
  Laptop,
  LogOut,
  Menu,
  Moon,
  Settings,
  Shield,
  Star,
  Sun,
  User,
  X,
} from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function Navigation() {
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()

  // 使用tRPC查询会员状态，带性能优化
  const { hasActiveMembership, currentPlan } = useUserMembership(user?.id)

  const loading = !isLoaded
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const locale = useLocale()
  const router = useRouter()
  const t = useTranslations('navigation')
  const localeT = useTranslations('locale')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // 确保组件在客户端挂载后才显示用户相关内容
  useEffect(() => {
    setIsMounted(true)
    const timer = setTimeout(() => {
      // 延迟设置初始化状态，确保Clerk完全加载
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // 检查用户是否是管理员
  const isUserAdmin =
    user?.publicMetadata?.isAdmin === true ||
    (typeof user?.publicMetadata?.adminLevel === 'number' &&
      user.publicMetadata.adminLevel > 0)

  const handleSignOut = async () => {
    try {
      // 使用 Clerk 的登出功能
      await signOut({ redirectUrl: `/${locale}` })
      logger.info('User signed out successfully', {
        category: 'auth',
        userId: user?.id,
        action: 'sign_out',
      })
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error))
      logger.error('Sign out failed', errorObj, {
        category: 'auth',
        userId: user?.id,
        action: 'sign_out',
      })
    }
  }

  // 更新语言切换逻辑，使用路由跳转
  const handleLanguageChange = (newLocale: 'zh' | 'en') => {
    const currentPath = pathname
    // 移除当前语言前缀
    const pathWithoutLocale = currentPath.replace(`/${locale}`, '') || '/'
    // 跳转到新语言的路径
    router.push(`/${newLocale}${pathWithoutLocale}`)
  }

  // 构建带语言前缀的路径
  const localePath = (path: string) => `/${locale}${path}`

  const getUserInitials = (user: any) => {
    if (user?.fullName) {
      const names = user.fullName.split(' ')
      if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase()
      }
      return user.fullName[0].toUpperCase()
    }
    if (user?.primaryEmailAddress?.emailAddress) {
      return user.primaryEmailAddress.emailAddress[0].toUpperCase()
    }
    return 'U'
  }

  const getUserDisplayName = (user: any) => {
    return user?.fullName || user?.primaryEmailAddress?.emailAddress || 'User'
  }

  // 更新导航项使用语言路由
  const navItems = [
    {
      href: localePath('/'),
      label: t('home'),
      active: pathname === localePath('/') || pathname === `/${locale}`,
    },
    {
      href: localePath('/blog'),
      label: t('blogs'),
      active: pathname.startsWith(localePath('/blog')),
    },
    {
      href: localePath('/docs'),
      label: t('docs'),
      active: pathname.startsWith(localePath('/docs')),
    },
    {
      href: localePath('/blocks'),
      label: t('blocks'),
      active: pathname.startsWith(localePath('/blocks')),
    },
    {
      href: localePath('/pricing'),
      label: t('pricing'),
      active: pathname.startsWith(localePath('/pricing')),
    },
    {
      href: localePath('/contact'),
      label: t('contact'),
      active: pathname.startsWith(localePath('/contact')),
    },
  ]

  return (
    <nav className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800 supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-900/60 transition-colors duration-300">
      <div className="relative z-10 max-w-none mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center group">
              <Logo />
            </div>
          </div>

          {/* 桌面端导航菜单 */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative px-3 py-2 text-sm font-medium transition-colors duration-200',
                  item.active
                    ? 'text-blue-600 dark:text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-white'
                )}
                style={{
                  transformStyle: 'preserve-3d',
                }}
              >
                <span className="relative z-10">{item.label}</span>
                {item.active && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-blue-500/80 rounded-full" />
                )}
              </Link>
            ))}
          </div>

          {/* 右侧操作区域 */}
          <div className="flex items-center space-x-2">
            {/* 桌面端语言切换器 */}
            <div className="hidden md:block">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleLanguageChange(locale === 'zh' ? 'en' : 'zh')
                }
              >
                {locale === 'zh' ? 'EN' : '中文'}
              </Button>
            </div>

            {/* 桌面端主题切换器 */}
            <div className="hidden md:block">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* 移动端菜单按钮 */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>

            {/* 用户菜单区域 - 优化渲染 */}
            {!isMounted ? (
              // 服务器端和初始客户端渲染显示简单的占位符
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-muted/30 rounded-full" />
              </div>
            ) : loading ? (
              // 加载中状态
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-muted animate-pulse rounded-full" />
              </div>
            ) : user ? (
              // 已登录用户菜单
              <div className="flex items-center space-x-2">
                {/* 会员标识 */}
                {hasActiveMembership && currentPlan && (
                  <div className="hidden md:flex items-center">
                    {currentPlan.name === 'Professional' && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-medium rounded-full">
                        <Star className="h-3 w-3" />
                        <span>{localeT('professional')}</span>
                      </div>
                    )}
                    {currentPlan.name === 'Enterprise' && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-medium rounded-full">
                        <Crown className="h-3 w-3" />
                        <span>{localeT('enterprise')}</span>
                      </div>
                    )}
                  </div>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-10 w-10 rounded-full p-0 transform transition-all duration-300 hover:scale-110 hover:shadow-[0_0_25px_rgba(59,130,246,0.4)]"
                    >
                      <div className="relative">
                        <Avatar className="h-9 w-9 border-2 border-gradient-to-r from-blue-400 to-purple-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                          <AvatarImage
                            src={user?.imageUrl || ''}
                            alt={getUserDisplayName(user)}
                          />
                          <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                            {getUserInitials(user)}
                          </AvatarFallback>
                        </Avatar>
                        {/* 发光环效果 */}
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-sm animate-pulse" />
                      </div>
                      {/* 会员状态小标识 - 增强版 */}
                      {hasActiveMembership && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(251,191,36,0.6)] animate-pulse">
                          <Crown className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium leading-none">
                            {getUserDisplayName(user)}
                          </p>
                          {/* 菜单中的会员标识 */}
                          {hasActiveMembership && currentPlan && (
                            <div className="flex items-center gap-1">
                              {currentPlan.name === 'Professional' && (
                                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                                  <Star className="h-2.5 w-2.5" />
                                  <span>{localeT('pro')}</span>
                                </div>
                              )}
                              {currentPlan.name === 'Enterprise' && (
                                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded">
                                  <Crown className="h-2.5 w-2.5" />
                                  <span>{localeT('enterprise')}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user?.primaryEmailAddress?.emailAddress}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    <DropdownMenuItem asChild>
                      <Link
                        href={localePath('/dashboard')}
                        className="flex items-center"
                      >
                        <User className="mr-2 h-4 w-4" />
                        <span>{t('dashboard')}</span>
                      </Link>
                    </DropdownMenuItem>

                    {/* 会员用户显示会员中心入口 */}
                    {hasActiveMembership && (
                      <DropdownMenuItem asChild>
                        <Link
                          href={localePath('/membership')}
                          className="flex items-center text-blue-600 dark:text-blue-400"
                        >
                          <Crown className="mr-2 h-4 w-4" />
                          <span>
                            {locale === 'zh' ? '会员中心' : 'Membership Center'}
                          </span>
                        </Link>
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuItem asChild>
                      <Link
                        href={localePath('/settings')}
                        className="flex items-center"
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        <span>{t('settings')}</span>
                      </Link>
                    </DropdownMenuItem>

                    {/* 管理员入口 */}
                    {isUserAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link
                            href={localePath('/admin')}
                            className="text-amber-600 dark:text-amber-400"
                          >
                            <Shield className="mr-2 h-4 w-4" />
                            <span>{t('adminPanel')}</span>
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>{t('signOut')}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              // 未登录状态
              <div className="flex items-center space-x-2">
                <SignInButton />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 移动端菜单 - 3D科技风格 */}
      {isMenuOpen && (
        <div className="md:hidden relative">
          <div className="relative z-10 px-4 py-6 space-y-4">
            {/* 导航链接 */}
            <div className="space-y-2">
              {navItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'relative block px-2 py-2 text-base font-medium transition-colors duration-200',
                    item.active
                      ? 'text-blue-600 dark:text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-white'
                  )}
                  style={{ transformStyle: 'preserve-3d' }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="relative z-10">{item.label}</span>
                  {item.active && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500/80" />
                  )}
                </Link>
              ))}
            </div>

            {/* 移动端工具 */}
            <div className="pt-4 border-t border-border/40">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  {localeT('label')}
                </span>
                <div className="flex space-x-2">
                  <Button
                    variant={locale === 'zh' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      handleLanguageChange('zh')
                      setIsMenuOpen(false)
                    }}
                  >
                    中文
                  </Button>
                  <Button
                    variant={locale === 'en' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      handleLanguageChange('en')
                      setIsMenuOpen(false)
                    }}
                  >
                    EN
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <span className="text-sm font-medium text-muted-foreground">
                  主题
                </span>
                <div className="flex space-x-2">
                  <Button
                    variant={theme === 'light' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTheme('light')}
                    className="transition-all duration-200"
                  >
                    <Sun className="h-4 w-4 mr-1" />
                    <span className="text-xs">亮色</span>
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTheme('dark')}
                    className="transition-all duration-200"
                  >
                    <Moon className="h-4 w-4 mr-1" />
                    <span className="text-xs">深色</span>
                  </Button>
                  <Button
                    variant={theme === 'system' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTheme('system')}
                    className="transition-all duration-200"
                  >
                    <Laptop className="h-4 w-4 mr-1" />
                    <span className="text-xs">系统</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
