'use client'

import { AdminGuardClient } from '@/components/auth'
import { SystemConfigManager } from '@/components/system'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Suspense } from 'react'

function AdminSettingsContent() {
  return (
    <div className="container mx-auto py-2 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">系统设置</h1>
        <p className="text-muted-foreground">管理系统配置和参数</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">基础设置</TabsTrigger>
          <TabsTrigger value="payment">支付配置</TabsTrigger>
          <TabsTrigger value="ai">AI配置</TabsTrigger>
          <TabsTrigger value="notification">通知设置</TabsTrigger>
          <TabsTrigger value="security">安全配置</TabsTrigger>
          <TabsTrigger value="feature">功能开关</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>基础配置</CardTitle>
              <CardDescription>网站基本信息和通用设置</CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<ConfigSkeleton />}>
                <SystemConfigManager category="general" />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>支付配置</CardTitle>
              <CardDescription>Stripe支付相关配置和参数</CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<ConfigSkeleton />}>
                <SystemConfigManager category="payment" />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI配置</CardTitle>
              <CardDescription>AI模型和API相关配置</CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<ConfigSkeleton />}>
                <SystemConfigManager category="ai" />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notification" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>通知设置</CardTitle>
              <CardDescription>邮件、短信等通知相关配置</CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<ConfigSkeleton />}>
                <SystemConfigManager category="notification" />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>安全配置</CardTitle>
              <CardDescription>安全策略和访问控制配置</CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<ConfigSkeleton />}>
                <SystemConfigManager category="security" />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feature" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>功能开关</CardTitle>
              <CardDescription>各种功能模块的启用/禁用控制</CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<ConfigSkeleton />}>
                <SystemConfigManager category="feature" />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ConfigSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-10 w-24" />
          </div>
          <div className="border-t pt-3">
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function AdminSettingsPage() {
  return (
    <AdminGuardClient>
      <AdminSettingsContent />
    </AdminGuardClient>
  )
}
