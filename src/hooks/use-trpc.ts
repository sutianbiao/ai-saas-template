import { trpc } from '@/lib/trpc/client'

/**
 * 认证相关hooks
 * 提供用户认证状态、用户信息更新等功能
 */
export function useAuth() {
  // 获取 tRPC 工具函数，用于缓存管理
  const utils = trpc.useUtils()

  // 获取当前用户信息
  const { data: user, isLoading } = trpc.auth.getCurrentUser.useQuery()

  // 检查用户认证状态（是否登录、是否为管理员）
  const { data: authStatus } = trpc.auth.checkAuthStatus.useQuery()

  // 更新用户资料
  const updateProfile = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      // 更新成功后刷新用户数据缓存
      utils.auth.getCurrentUser.invalidate()
    },
  })

  // 从 Clerk 同步用户数据
  const syncUser = trpc.auth.syncUserFromClerk.useMutation()

  return {
    user, // 当前用户信息
    isLoading, // 加载状态
    isAuthenticated: Boolean(authStatus?.isAuthenticated), // 是否已认证
    isAdmin: Boolean(authStatus?.isAdmin), // 是否为管理员
    updateProfile, // 更新用户资料方法
    syncUser, // 同步用户数据方法
  }
}

/**
 * 用户管理hooks（管理员专用）
 * 提供用户列表查询、统计、更新、删除等管理功能
 */
export function useUsers() {
  // 获取 tRPC 工具函数，用于缓存管理
  const utils = trpc.useUtils()

  // 获取用户列表查询函数（支持参数传递）
  const getUsersQuery = (
    params?: Parameters<typeof trpc.users.getUsers.useQuery>[0]
  ) => trpc.users.getUsers.useQuery(params || {})

  // 获取用户统计数据
  const getUserStats = () => trpc.users.getUserStats.useQuery()

  // 更新用户信息
  const updateUser = trpc.users.updateUser.useMutation({
    onSuccess: () => {
      // 更新成功后刷新相关缓存
      utils.users.getUsers.invalidate()
      utils.users.getUserStats.invalidate()
    },
  })

  // 切换用户状态（启用/禁用）
  const toggleUserStatus = trpc.users.toggleUserStatus.useMutation({
    onSuccess: () => {
      // 状态变更后刷新缓存
      utils.users.getUsers.invalidate()
      utils.users.getUserStats.invalidate()
    },
  })

  // 删除用户
  const deleteUser = trpc.users.deleteUser.useMutation({
    onSuccess: () => {
      // 删除后刷新缓存
      utils.users.getUsers.invalidate()
      utils.users.getUserStats.invalidate()
    },
  })

  // 批量更新用户
  const bulkUpdateUsers = trpc.users.bulkUpdateUsers.useMutation({
    onSuccess: () => {
      // 批量更新后刷新缓存
      utils.users.getUsers.invalidate()
      utils.users.getUserStats.invalidate()
    },
  })

  return {
    getUsersQuery, // 用户列表查询函数
    getUserStats, // 用户统计查询函数
    updateUser, // 更新用户方法
    toggleUserStatus, // 切换用户状态方法
    deleteUser, // 删除用户方法
    bulkUpdateUsers, // 批量更新用户方法
  }
}

/**
 * 支付和会员相关hooks
 * 提供会员计划查询、会员状态管理、支付会话创建等功能
 */
export function usePayments() {
  // 获取 tRPC 工具函数，用于缓存管理
  const utils = trpc.useUtils()

  // 获取会员计划列表
  const { data: membershipPlans, isLoading: plansLoading } =
    trpc.payments.getMembershipPlans.useQuery()

  // 获取用户当前会员状态
  const { data: membershipStatus, isLoading: statusLoading } =
    trpc.payments.getUserMembershipStatus.useQuery()

  // 创建支付会话（用于 Stripe 结账）
  const createCheckoutSession =
    trpc.payments.createCheckoutSession.useMutation()

  // 激活会员资格
  const activateMembership = trpc.payments.activateMembership.useMutation({
    onSuccess: () => {
      // 激活成功后刷新会员状态缓存
      utils.payments.getUserMembershipStatus.invalidate()
    },
  })

  return {
    membershipPlans, // 会员计划列表
    plansLoading, // 计划加载状态
    membershipStatus, // 用户会员状态
    statusLoading, // 状态加载状态
    createCheckoutSession, // 创建支付会话方法
    activateMembership, // 激活会员方法
    // 便捷访问器
    hasActiveMembership: Boolean(membershipStatus?.hasActiveMembership), // 是否有有效会员
    currentPlan: membershipStatus?.currentPlan, // 当前会员计划
    remainingDays: membershipStatus?.remainingDays || 0, // 剩余天数
  }
}
