'use client'

import { AdminGuardClient } from '@/components/auth'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc/client'
import { cn } from '@/lib/utils'
import { Download, RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

export default function AdminPaymentsPage() {
  return (
    <AdminGuardClient>
      <PaymentsContent />
    </AdminGuardClient>
  )
}

function PaymentsContent() {
  const [provider, setProvider] = useState<'stripe' | 'creem' | 'all'>('all')
  const [status, setStatus] = useState<
    'all' | 'pending' | 'succeeded' | 'failed' | 'refunded' | 'cancelled'
  >('all')
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [userId, setUserId] = useState('')
  const [planName, setPlanName] = useState('')
  const [from, setFrom] = useState<string>('')
  const [to, setTo] = useState<string>('')

  const queryInput = useMemo(() => {
    return {
      provider:
        provider === 'all' ? undefined : (provider as 'stripe' | 'creem'),
      status: status === 'all' ? undefined : status,
      userId: userId.trim() || undefined,
      planName: planName.trim() || undefined,
      from: from || undefined,
      to: to || undefined,
      page,
      limit,
    }
  }, [provider, status, userId, planName, from, to, page, limit])

  const { data, isLoading, refetch, isFetching } =
    trpc.payments.getAllPayments.useQuery(queryInput)
  const refundMutation = trpc.payments.refundPayment.useMutation({
    onSuccess: () => {
      toast.success('退款操作成功')
      refetch()
    },
    onError: err => toast.error('退款失败', { description: err.message }),
  })

  const payments = data?.payments || []
  const pagination = data?.pagination

  function setQuickRange(days: number) {
    const now = new Date()
    const end = new Date(now)
    const start = new Date(now)
    if (days === 0) {
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
    } else {
      start.setDate(start.getDate() - (days - 1))
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
    }
    const toLocal = (d: Date) => {
      const pad = (n: number) => n.toString().padStart(2, '0')
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    }
    setFrom(toLocal(start))
    setTo(toLocal(end))
    setPage(1)
  }

  function exportCsv() {
    const header = [
      'id',
      'userId',
      'provider',
      'status',
      'amount',
      'currency',
      'planName',
      'durationType',
      'membershipDurationDays',
      'createdAt',
    ]
    const rows = payments.map(p => [
      p.id,
      p.userId,
      p.provider || '',
      p.status,
      p.amount,
      p.currency,
      p.planName,
      p.durationType,
      p.membershipDurationDays,
      new Date(p.createdAt).toISOString(),
    ])
    const csv = [header, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payments-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="container mx-auto py-2 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">支付记录</h1>
          <p className="text-muted-foreground">查看与管理所有支付记录</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={cn('h-4 w-4 mr-2', isFetching && 'animate-spin')}
            />{' '}
            刷新
          </Button>
          <Button onClick={exportCsv}>
            <Download className="h-4 w-4 mr-2" /> 导出 CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>筛选</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>支付渠道</Label>
            <Select value={provider} onValueChange={v => setProvider(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="全部" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="stripe">Stripe</SelectItem>
                <SelectItem value="creem">Creem</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>支付状态</Label>
            <Select value={status} onValueChange={v => setStatus(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="全部" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="pending">pending</SelectItem>
                <SelectItem value="succeeded">succeeded</SelectItem>
                <SelectItem value="failed">failed</SelectItem>
                <SelectItem value="refunded">refunded</SelectItem>
                <SelectItem value="cancelled">cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>用户ID</Label>
            <input
              className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
              placeholder="精确匹配"
              value={userId}
              onChange={e => setUserId(e.target.value)}
            />
          </div>
          <div>
            <Label>计划名</Label>
            <input
              className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
              placeholder="如: Pro/Basic"
              value={planName}
              onChange={e => setPlanName(e.target.value)}
            />
          </div>
          <div>
            <Label>开始时间</Label>
            <input
              type="datetime-local"
              className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
              value={from}
              onChange={e => setFrom(e.target.value)}
            />
          </div>
          <div>
            <Label>结束时间</Label>
            <input
              type="datetime-local"
              className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
              value={to}
              onChange={e => setTo(e.target.value)}
            />
          </div>
          <div className="md:col-span-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">快捷选择:</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuickRange(0)}
              >
                今天
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuickRange(7)}
              >
                近7天
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuickRange(30)}
              >
                近30天
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            列表{' '}
            {isLoading && (
              <span className="text-xs text-muted-foreground ml-2">
                加载中...
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <PaymentsSkeleton />
          ) : (
            <div className="space-y-3">
              {payments.map(p => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{p.planName}</span>
                      <Badge
                        className={cn(
                          'capitalize',
                          p.provider === 'creem'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-blue-100 text-blue-700'
                        )}
                      >
                        {p.provider || 'stripe'}
                      </Badge>
                      <Badge variant="outline" className="lowercase">
                        {p.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground flex flex-wrap gap-4">
                      <span>用户: {p.userId}</span>
                      <span>
                        金额: {p.amount} {p.currency}
                      </span>
                      <span>
                        周期: {p.durationType} ({p.membershipDurationDays}d)
                      </span>
                      <span>
                        时间: {new Date(p.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={
                        p.status === 'refunded' || refundMutation.isPending
                      }
                      onClick={() => {
                        const provider = (p.provider || 'stripe') as
                          | 'stripe'
                          | 'creem'
                        const paymentId =
                          provider === 'creem'
                            ? (p as any).creemPaymentId
                            : (p as any).stripePaymentIntentId
                        if (!paymentId) {
                          toast.error('缺少交易号，无法退款')
                          return
                        }
                        refundMutation.mutate({ provider, paymentId })
                      }}
                    >
                      退款
                    </Button>
                  </div>
                </div>
              ))}

              {pagination && (
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="text-sm text-muted-foreground">
                    共 {pagination.total} 条 · 第 {pagination.page}/
                    {pagination.totalPages} 页
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                    >
                      上一页
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!pagination.hasMore}
                      onClick={() => setPage(p => p + 1)}
                    >
                      下一页
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function PaymentsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between p-4 border rounded-lg"
        >
          <div className="flex-1">
            <Skeleton className="h-4 w-40 mb-2" />
            <Skeleton className="h-3 w-64" />
          </div>
          <div className="w-28">
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
