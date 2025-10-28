'use client'

// 计划管理页面（Admin）：支持列表展示、创建/编辑、上下线与排序

import { AdminGuardClient } from '@/components/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { trpc } from '@/lib/trpc/client'
import { Loader2, Plus, Save, Trash, ArrowUp, ArrowDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

// 表单数据结构（包含多语言、价格、Stripe、配额与展示控制）
interface PlanFormState {
  id?: string
  name: string
  nameZh?: string
  description?: string
  descriptionZh?: string
  priceUSDMonthly: string
  priceCNYMonthly?: string | null
  priceUSDYearly?: string | null
  priceCNYYearly?: string | null
  yearlyDiscountPercent?: number
  stripePriceIdUSDMonthly?: string | null
  stripePriceIdCNYMonthly?: string | null
  stripePriceIdUSDYearly?: string | null
  stripePriceIdCNYYearly?: string | null
  // Creem 价格ID
  creemPriceIdUSDMonthly?: string | null
  creemPriceIdCNYMonthly?: string | null
  creemPriceIdUSDYearly?: string | null
  creemPriceIdCNYYearly?: string | null
  features: string[]
  featuresZh?: string[]
  maxUseCases?: number
  maxTutorials?: number
  maxBlogs?: number
  maxApiCalls?: number
  permissions?: {
    apiAccess?: boolean
    customModels?: boolean
    prioritySupport?: boolean
    exportData?: boolean
    bulkOperations?: boolean
    advancedAnalytics?: boolean
  }
  monthlyDurationDays?: number
  yearlyDurationDays?: number
  isActive?: boolean
  isPopular?: boolean
  isFeatured?: boolean
  sortOrder?: number
}

// 表单默认值（包含合理的布尔与数值初始状态）
function defaultForm(): PlanFormState {
  return {
    name: '',
    nameZh: '',
    description: '',
    descriptionZh: '',
    priceUSDMonthly: '0',
    priceCNYMonthly: null,
    priceUSDYearly: null,
    priceCNYYearly: null,
    yearlyDiscountPercent: 0,
    stripePriceIdUSDMonthly: null,
    stripePriceIdCNYMonthly: null,
    stripePriceIdUSDYearly: null,
    stripePriceIdCNYYearly: null,
    creemPriceIdUSDMonthly: null,
    creemPriceIdCNYMonthly: null,
    creemPriceIdUSDYearly: null,
    creemPriceIdCNYYearly: null,
    features: [],
    featuresZh: [],
    maxUseCases: -1,
    maxTutorials: -1,
    maxBlogs: -1,
    maxApiCalls: -1,
    permissions: {
      apiAccess: false,
      customModels: false,
      prioritySupport: false,
      exportData: true,
      bulkOperations: false,
      advancedAnalytics: false,
    },
    monthlyDurationDays: 30,
    yearlyDurationDays: 365,
    isActive: true,
    isPopular: false,
    isFeatured: false,
    sortOrder: 0,
  }
}

export default function AdminPlansPage() {
  return (
    <AdminGuardClient>
      <PlansContent />
    </AdminGuardClient>
  )
}

// 列表骨架屏（加载态占位），与其他模块风格一致
function PlanListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center py-3 gap-4">
          <div className="flex-1">
            <Skeleton className="h-4 w-40 mb-2" />
            <Skeleton className="h-3 w-56" />
            <div className="mt-3 flex items-center gap-4">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      ))}
    </div>
  )
}

function PlansContent() {
  const utils = trpc.useUtils()
  const { data: plans, isLoading } = trpc.payments.getMembershipPlans.useQuery({
    isActive: false,
  })

  const [items, setItems] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<PlanFormState>(defaultForm())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (plans) setItems(plans)
  }, [plans])

  const createMutation = trpc.payments.createMembershipPlan.useMutation({
    onSuccess: () => {
      toast.success('创建成功')
      utils.payments.getMembershipPlans.invalidate()
      setOpen(false)
    },
    onError: err => toast.error('创建失败', { description: err.message }),
  })

  const updateMutation = trpc.payments.updateMembershipPlan.useMutation({
    onSuccess: () => {
      toast.success('保存成功')
      utils.payments.getMembershipPlans.invalidate()
      setOpen(false)
    },
    onError: err => toast.error('保存失败', { description: err.message }),
  })

  const deleteMutation = trpc.payments.deleteMembershipPlan.useMutation({
    onSuccess: () => {
      toast.success('已删除')
      utils.payments.getMembershipPlans.invalidate()
    },
    onError: err => toast.error('删除失败', { description: err.message }),
  })

  const reorderMutation = trpc.payments.reorderMembershipPlans.useMutation({
    onSuccess: () => {
      utils.payments.getMembershipPlans.invalidate()
    },
  })

  const toggleFlagsMutation =
    trpc.payments.toggleMembershipPlanFlags.useMutation({
      onSuccess: () => utils.payments.getMembershipPlans.invalidate(),
    })

  // 新建弹窗
  function handleAdd() {
    setForm(defaultForm())
    setOpen(true)
  }

  // 编辑弹窗
  function handleEdit(p: any) {
    setForm({ ...p })
    setOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      // 基础必填校验：名称 + USD 月付价格
      if (!form.name || !form.priceUSDMonthly) {
        toast.error('请填写必填项：名称、月付USD价格')
        return
      }
      if (form.id) {
        await updateMutation.mutateAsync({ id: form.id, data: { ...form } })
      } else {
        const { id, ...data } = form as any
        await createMutation.mutateAsync({ ...data })
      }
    } finally {
      setSaving(false)
    }
  }

  // 删除计划
  function handleDelete(id: string) {
    deleteMutation.mutate({ id })
  }

  // 简单的上/下移动并提交排序到后端（无需拖拽依赖）
  function moveItem(id: string, direction: 'up' | 'down') {
    const index = items.findIndex(i => i.id === id)
    if (index < 0) return
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= items.length) return
    const newItems = [...items]
    const temp = newItems[index]
    newItems[index] = newItems[targetIndex]
    newItems[targetIndex] = temp
    const withOrder = newItems.map((it: any, idx: number) => ({
      ...it,
      sortOrder: idx,
    }))
    setItems(withOrder)
    reorderMutation.mutate({
      orders: withOrder.map((i: any) => ({
        id: i.id as string,
        sortOrder: (i.sortOrder as number) || 0,
      })),
    })
  }

  return (
    <div className="container mx-auto py-2 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">计划管理</h1>
          <p className="text-muted-foreground">配置与维护订阅计划</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" /> 新建计划
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            计划列表{' '}
            {isLoading && (
              <Loader2 className="inline h-4 w-4 animate-spin ml-2" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <PlanListSkeleton />
          ) : (
            <div className="divide-y">
              {items.map((item: any, idx: number) => (
                <div key={item.id} className="flex items-center py-3 gap-4">
                  <div className="flex-1">
                    <div className="font-medium">
                      {item.name}{' '}
                      {item.nameZh && (
                        <span className="text-muted-foreground ml-2">
                          {item.nameZh}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {/* 行内信息：价格与排序 */}
                      月: ${item.priceUSDMonthly} / 年: $
                      {item.priceUSDYearly ?? '-'} | 排序:{' '}
                      {item.sortOrder ?? idx}
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-sm">
                      {/* 上/下线、热门、推荐快捷开关 */}
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={!!item.isActive}
                          onCheckedChange={v =>
                            toggleFlagsMutation.mutate({
                              id: item.id,
                              isActive: v,
                            })
                          }
                        />
                        <span>上架</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={!!item.isPopular}
                          onCheckedChange={v =>
                            toggleFlagsMutation.mutate({
                              id: item.id,
                              isPopular: v,
                            })
                          }
                        />
                        <span>热门</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={!!item.isFeatured}
                          onCheckedChange={v =>
                            toggleFlagsMutation.mutate({
                              id: item.id,
                              isFeatured: v,
                            })
                          }
                        />
                        <span>推荐</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* 排序按钮：上移/下移 */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveItem(item.id, 'up')}
                      disabled={idx === 0}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveItem(item.id, 'down')}
                      disabled={idx === items.length - 1}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    {/* 行内编辑与删除 */}
                    <Button variant="ghost" onClick={() => handleEdit(item)}>
                      编辑
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash className="h-4 w-4 mr-1" /> 删除
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{form.id ? '编辑计划' : '新建计划'}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>名称</Label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <Label>名称（中文）</Label>
              <Input
                value={form.nameZh || ''}
                onChange={e => setForm(f => ({ ...f, nameZh: e.target.value }))}
              />
            </div>

            <div className="md:col-span-2">
              <Label>描述</Label>
              <Textarea
                value={form.description || ''}
                onChange={e =>
                  setForm(f => ({ ...f, description: e.target.value }))
                }
              />
            </div>
            <div className="md:col-span-2">
              <Label>描述（中文）</Label>
              <Textarea
                value={form.descriptionZh || ''}
                onChange={e =>
                  setForm(f => ({ ...f, descriptionZh: e.target.value }))
                }
              />
            </div>

            <div>
              <Label>USD 月付</Label>
              <Input
                value={form.priceUSDMonthly}
                onChange={e =>
                  setForm(f => ({ ...f, priceUSDMonthly: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>USD 年付</Label>
              <Input
                value={form.priceUSDYearly || ''}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    priceUSDYearly: e.target.value || null,
                  }))
                }
              />
            </div>
            <div>
              <Label>CNY 月付</Label>
              <Input
                value={form.priceCNYMonthly || ''}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    priceCNYMonthly: e.target.value || null,
                  }))
                }
              />
            </div>
            <div>
              <Label>CNY 年付</Label>
              <Input
                value={form.priceCNYYearly || ''}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    priceCNYYearly: e.target.value || null,
                  }))
                }
              />
            </div>

            <div>
              <Label>年付折扣%</Label>
              <Input
                type="number"
                value={form.yearlyDiscountPercent ?? 0}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    yearlyDiscountPercent: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div>
              <Label>排序</Label>
              <Input
                type="number"
                value={form.sortOrder ?? 0}
                onChange={e =>
                  setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))
                }
              />
            </div>

            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Stripe Price USD 月付</Label>
                <Input
                  value={form.stripePriceIdUSDMonthly || ''}
                  onChange={e =>
                    setForm(f => ({
                      ...f,
                      stripePriceIdUSDMonthly: e.target.value || null,
                    }))
                  }
                />
              </div>
              <div>
                <Label>Stripe Price USD 年付</Label>
                <Input
                  value={form.stripePriceIdUSDYearly || ''}
                  onChange={e =>
                    setForm(f => ({
                      ...f,
                      stripePriceIdUSDYearly: e.target.value || null,
                    }))
                  }
                />
              </div>
              <div>
                <Label>Stripe Price CNY 月付</Label>
                <Input
                  value={form.stripePriceIdCNYMonthly || ''}
                  onChange={e =>
                    setForm(f => ({
                      ...f,
                      stripePriceIdCNYMonthly: e.target.value || null,
                    }))
                  }
                />
              </div>
              <div>
                <Label>Stripe Price CNY 年付</Label>
                <Input
                  value={form.stripePriceIdCNYYearly || ''}
                  onChange={e =>
                    setForm(f => ({
                      ...f,
                      stripePriceIdCNYYearly: e.target.value || null,
                    }))
                  }
                />
              </div>

              <div>
                <Label>Creem Price USD 月付</Label>
                <Input
                  value={form.creemPriceIdUSDMonthly || ''}
                  onChange={e =>
                    setForm(f => ({
                      ...f,
                      creemPriceIdUSDMonthly: e.target.value || null,
                    }))
                  }
                />
              </div>
              <div>
                <Label>Creem Price USD 年付</Label>
                <Input
                  value={form.creemPriceIdUSDYearly || ''}
                  onChange={e =>
                    setForm(f => ({
                      ...f,
                      creemPriceIdUSDYearly: e.target.value || null,
                    }))
                  }
                />
              </div>
              <div>
                <Label>Creem Price CNY 月付</Label>
                <Input
                  value={form.creemPriceIdCNYMonthly || ''}
                  onChange={e =>
                    setForm(f => ({
                      ...f,
                      creemPriceIdCNYMonthly: e.target.value || null,
                    }))
                  }
                />
              </div>
              <div>
                <Label>Creem Price CNY 年付</Label>
                <Input
                  value={form.creemPriceIdCNYYearly || ''}
                  onChange={e =>
                    setForm(f => ({
                      ...f,
                      creemPriceIdCNYYearly: e.target.value || null,
                    }))
                  }
                />
              </div>
            </div>

            <div className="md:col-span-2 grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={!!form.isActive}
                  onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))}
                />{' '}
                <Label>上架</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={!!form.isPopular}
                  onCheckedChange={v => setForm(f => ({ ...f, isPopular: v }))}
                />{' '}
                <Label>热门</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={!!form.isFeatured}
                  onCheckedChange={v => setForm(f => ({ ...f, isFeatured: v }))}
                />{' '}
                <Label>推荐</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Save className="h-4 w-4 mr-2" /> 保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
