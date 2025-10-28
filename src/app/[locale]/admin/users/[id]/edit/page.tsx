'use client'

import { AdminGuardClient } from '@/components/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { trpc } from '@/lib/trpc/client'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

// 页面级组件在客户端环境中不再直接读取 props.params，
// 使用 useParams() 以兼容新版 Next.js params Promise 行为

function UserEditContent({ userId }: { userId: string }) {
  const router = useRouter()

  const {
    data: user,
    isLoading,
    error,
  } = trpc.users.getUserById.useQuery(
    { id: userId },
    { staleTime: 2 * 60 * 1000, gcTime: 5 * 60 * 1000 }
  )

  const [form, setForm] = useState({
    fullName: '',
    isActive: true,
    isAdmin: false,
    adminLevel: 0,
  })

  useMemo(() => {
    if (user) {
      setForm({
        fullName: user.fullName || '',
        isActive: Boolean(user.isActive),
        isAdmin: Boolean(user.isAdmin),
        adminLevel: Number(user.adminLevel || 0),
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const utils = trpc.useUtils()
  const updateUser = trpc.users.updateUser.useMutation({
    onSuccess: () => {
      utils.users.getUserById.invalidate({ id: userId })
      utils.users.getUsers.invalidate()
      utils.users.getUserStats.invalidate()
      router.push(`/admin/users/${userId}`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateUser.mutate({ id: userId, ...form })
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 正在加载...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !user) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">
            {error ? '加载用户信息失败' : '用户不存在或已被删除'}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/users/${userId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" /> 返回详情
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">编辑用户</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2 max-w-lg">
              <Label htmlFor="fullName">姓名</Label>
              <Input
                id="fullName"
                value={form.fullName}
                onChange={e => setForm({ ...form, fullName: e.target.value })}
                placeholder="请输入用户姓名"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
              <div className="flex items-center justify-between rounded-md border p-4">
                <div>
                  <Label>账户状态</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    控制用户是否可以登录
                  </p>
                </div>
                <Switch
                  checked={form.isActive}
                  onCheckedChange={checked =>
                    setForm({ ...form, isActive: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between rounded-md border p-4">
                <div>
                  <Label>管理员权限</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    授予或取消管理员权限
                  </p>
                </div>
                <Switch
                  checked={form.isAdmin}
                  onCheckedChange={checked =>
                    setForm({
                      ...form,
                      isAdmin: checked,
                      adminLevel: checked ? Math.max(1, form.adminLevel) : 0,
                    })
                  }
                />
              </div>
            </div>

            {form.isAdmin && (
              <div className="space-y-2 max-w-xs">
                <Label htmlFor="adminLevel">管理员级别 (0-2)</Label>
                <Input
                  id="adminLevel"
                  type="number"
                  min={0}
                  max={2}
                  value={form.adminLevel}
                  onChange={e =>
                    setForm({ ...form, adminLevel: Number(e.target.value) })
                  }
                />
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                取消
              </Button>
              <Button type="submit" disabled={updateUser.isPending}>
                {updateUser.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Save className="mr-2 h-4 w-4" /> 保存更改
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function UserEditPage() {
  const routeParams = useParams<{ id: string }>()
  const id = routeParams?.id
  return (
    <AdminGuardClient>
      <UserEditContent userId={String(id)} />
    </AdminGuardClient>
  )
}
