'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { PAYMENT_STATUS, formatPrice } from '@/constants/payment'
import { trpc } from '@/lib/trpc/client'
import { useUser } from '@clerk/nextjs'
import { useAuth as useAuthHook } from '@/hooks/use-trpc'
import { toast } from 'sonner'
import { CreditCard, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export function PaymentHistoryClient() {
  const { isSignedIn } = useUser()
  const { isAdmin } = useAuthHook()
  const { data, isLoading, error } = trpc.payments.getPaymentHistory.useQuery(
    { limit: 5 },
    {
      enabled: isSignedIn,
      staleTime: 5 * 60 * 1000, // 5分钟缓存
      gcTime: 10 * 60 * 1000, // 10分钟垃圾回收
    }
  )

  const refundMutation = trpc.payments.refundPayment.useMutation({
    onSuccess: () => toast.success('退款操作已提交'),
    onError: err => toast.error('退款失败', { description: err.message }),
  })

  // 退款确认对话框状态
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmTarget, setConfirmTarget] = useState<{
    provider: 'stripe' | 'creem'
    paymentId: string
    amount?: number
  } | null>(null)

  if (!isSignedIn) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            支付历史
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            请先登录查看支付记录
          </p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return <PaymentHistorySkeleton />
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            支付历史
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-destructive py-8">
            加载支付历史失败
          </div>
        </CardContent>
      </Card>
    )
  }

  const payments = data?.payments || []

  return (
    <Card>
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认退款</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">
            确认对该笔订单发起退款操作？该操作可能不可逆。
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!confirmTarget) return
                refundMutation.mutate(confirmTarget)
                setConfirmOpen(false)
              }}
            >
              确认退款
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          支付历史
        </CardTitle>
        {payments.length > 0 && (
          <Button asChild variant="outline" size="sm">
            <Link href="/payment/history">
              查看全部
              <ExternalLink className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">暂无支付记录</p>
            <Button asChild variant="outline">
              <Link href="/pricing">选择计划</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map(payment => {
              const statusConfig =
                PAYMENT_STATUS[payment.status as keyof typeof PAYMENT_STATUS]
              const paymentDate = new Date(payment.createdAt)
              const isRefunded =
                payment.status === 'refunded' || Boolean(payment.refundedAt)
              const provider = (payment.provider ||
                (payment.paymentMethod === 'creem' ? 'creem' : 'stripe')) as
                | 'stripe'
                | 'creem'
              const providerBadgeClass =
                provider === 'creem'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-blue-100 text-blue-700'

              return (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{payment.planName}</p>
                      <Badge
                        className={
                          statusConfig?.color || 'bg-gray-100 text-gray-800'
                        }
                      >
                        {statusConfig?.labelZh || payment.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span>
                        {paymentDate.toLocaleDateString('zh-CN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span>
                        {payment.durationType === 'yearly' ? '年付' : '月付'}
                      </span>
                      <Badge className={providerBadgeClass}>{provider}</Badge>
                      {payment.paymentMethod && (
                        <span className="capitalize">
                          {payment.paymentMethod}
                        </span>
                      )}
                      {payment.stripePaymentIntentId && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                className="truncate max-w-[160px] underline decoration-dotted"
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    payment.stripePaymentIntentId as string
                                  )
                                  toast.success('已复制 Intent ID')
                                }}
                                title={payment.stripePaymentIntentId as string}
                              >
                                intent: {payment.stripePaymentIntentId}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>点击复制</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {payment.creemPaymentId && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                className="truncate max-w-[160px] underline decoration-dotted"
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    payment.creemPaymentId as string
                                  )
                                  toast.success('已复制 Creem ID')
                                }}
                                title={payment.creemPaymentId as string}
                              >
                                creem: {payment.creemPaymentId}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>点击复制</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-lg">
                      {formatPrice(
                        Number(payment.amount),
                        payment.currency as 'USD' | 'CNY'
                      )}
                    </p>
                    {payment.discountAmount &&
                      Number(payment.discountAmount) > 0 && (
                        <p className="text-sm text-green-600">
                          节省{' '}
                          {formatPrice(
                            Number(payment.discountAmount),
                            payment.currency as 'USD' | 'CNY'
                          )}
                        </p>
                      )}
                    {/* 管理员快捷退款 + 二次确认 */}
                    {isSignedIn && isAdmin && (
                      <div className="pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={refundMutation.isPending || isRefunded}
                          onClick={() => {
                            const paymentId =
                              provider === 'creem'
                                ? (payment.creemPaymentId as string)
                                : (payment.stripePaymentIntentId as string)
                            if (!paymentId) {
                              toast.error('缺少交易号，无法退款')
                              return
                            }
                            setConfirmTarget({
                              provider,
                              paymentId,
                              amount: Number(payment.amount),
                            })
                            setConfirmOpen(true)
                          }}
                        >
                          {isRefunded ? '已退款' : '退款'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {data?.pagination.hasMore && (
              <div className="text-center pt-4 border-t">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/payment/history">
                    查看更多支付记录
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function PaymentHistorySkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          支付历史
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex-1">
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
              <div className="text-right">
                <Skeleton className="h-6 w-16 mb-1" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
