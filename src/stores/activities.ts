/**
 * 用户活动记录 Pinia Store
 * 管理用户活动记录的状态和操作
 */

import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth'
import type {
  UserActivity,
  UserActivityWithDisplay,
  UserActivityStats,
  CreateActivityRequest,
  QueryActivitiesParams,
  PaginatedActivities,
  ActivityOperationResult,
  ActivityType
} from '@/types/activities'

export const useActivitiesStore = defineStore('activities', () => {
  // ==================== 状态 ====================
  
  /** 活动记录列表 */
  const activities = ref<UserActivityWithDisplay[]>([])
  
  /** 活动统计信息 */
  const stats = ref<UserActivityStats | null>(null)
  
  /** 加载状态 */
  const loading = ref(false)
  
  /** 错误信息 */
  const error = ref<string | null>(null)
  
  /** 是否已初始化 */
  const initialized = ref(false)
  
  /** 分页信息 */
  const pagination = ref({
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 0,
    has_next: false,
    has_prev: false
  })

  // ==================== 计算属性 ====================
  
  /** 最近的活动记录（前10条） */
  const recentActivities = computed(() => 
    activities.value.slice(0, 10)
  )
  
  /** 今日活动数量 */
  const todayActivitiesCount = computed(() => 
    stats.value?.activities_today || 0
  )
  
  /** 本周活动数量 */
  const weekActivitiesCount = computed(() => 
    stats.value?.activities_this_week || 0
  )
  
  /** 是否有活动记录 */
  const hasActivities = computed(() => 
    activities.value.length > 0
  )

  // ==================== 获取认证Store ====================
  
  const authStore = useAuthStore()

  // ==================== 核心方法 ====================
  
  /**
   * 初始化活动记录Store
   */
  const initialize = async (): Promise<void> => {
    if (!authStore.user?.id) {
      console.warn('No authenticated user found')
      return
    }

    // 防止重复初始化
    if (initialized.value) {
      return
    }

    try {
      loading.value = true
      error.value = null
      
      // 并行获取活动记录和统计信息
      await Promise.all([
        fetchRecentActivities(),
        fetchActivityStats()
      ])
      
      initialized.value = true
    } catch (err) {
      console.error('Failed to initialize activities store:', err)
      error.value = err instanceof Error ? err.message : '初始化失败'
      // 即使失败也标记为已初始化，避免无限重试
      initialized.value = true
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取最近的活动记录
   */
  const fetchRecentActivities = async (limit: number = 20): Promise<void> => {
    if (!authStore.user?.id) {
      throw new Error('用户未登录')
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('recent_user_activities')
        .select('*')
        .limit(limit)
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      activities.value = data || []
    } catch (err) {
      console.error('Failed to fetch recent activities:', err)
      throw err
    }
  }

  /**
   * 获取活动统计信息
   */
  const fetchActivityStats = async (): Promise<void> => {
    if (!authStore.user?.id) {
      throw new Error('用户未登录')
    }

    try {
      const { data, error: fetchError } = await supabase
        .rpc('get_user_activity_stats', {
          p_user_id: authStore.user.id
        })

      if (fetchError) {
        throw fetchError
      }

      if (data && data.length > 0) {
        stats.value = data[0]
      }
    } catch (err) {
      console.error('Failed to fetch activity stats:', err)
      throw err
    }
  }

  /**
   * 分页查询活动记录
   */
  const fetchActivities = async (params: QueryActivitiesParams = {}): Promise<PaginatedActivities> => {
    if (!authStore.user?.id) {
      throw new Error('用户未登录')
    }

    try {
      loading.value = true
      error.value = null

      const {
        page = 1,
        limit = 10,
        activity_type,
        start_date,
        end_date,
        search
      } = params

      let query = supabase
        .from('user_activities')
        .select('*', { count: 'exact' })
        .eq('user_id', authStore.user.id)
        .order('created_at', { ascending: false })

      // 添加过滤条件
      if (activity_type) {
        query = query.eq('activity_type', activity_type)
      }

      if (start_date) {
        query = query.gte('created_at', start_date)
      }

      if (end_date) {
        query = query.lte('created_at', end_date)
      }

      if (search) {
        query = query.or(`activity_title.ilike.%${search}%,activity_description.ilike.%${search}%`)
      }

      // 分页
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data, error: fetchError, count } = await query

      if (fetchError) {
        throw fetchError
      }

      const total = count || 0
      const total_pages = Math.ceil(total / limit)

      const result: PaginatedActivities = {
        data: data || [],
        total,
        page,
        limit,
        total_pages,
        has_next: page < total_pages,
        has_prev: page > 1
      }

      // 更新分页信息
      pagination.value = {
        page,
        limit,
        total,
        total_pages,
        has_next: result.has_next,
        has_prev: result.has_prev
      }

      return result
    } catch (err) {
      console.error('Failed to fetch activities:', err)
      error.value = err instanceof Error ? err.message : '获取活动记录失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 创建活动记录
   */
  const createActivity = async (request: CreateActivityRequest): Promise<ActivityOperationResult> => {
    if (!authStore.user?.id) {
      return {
        success: false,
        error: '用户未登录'
      }
    }

    try {
      // 获取客户端信息
      const clientInfo = getClientInfo()

      const { data, error: insertError } = await supabase
        .rpc('log_user_activity', {
          p_user_id: authStore.user.id,
          p_activity_type: request.activity_type,
          p_activity_title: request.activity_title,
          p_activity_description: request.activity_description || null,
          p_ip_address: request.ip_address || clientInfo.ip_address,
          p_user_agent: request.user_agent || clientInfo.user_agent,
          p_metadata: request.metadata || {}
        })

      if (insertError) {
        throw insertError
      }

      // 刷新最近活动记录
      await fetchRecentActivities()
      
      // 刷新统计信息
      await fetchActivityStats()

      return {
        success: true,
        activity_id: data
      }
    } catch (err) {
      console.error('Failed to create activity:', err)
      return {
        success: false,
        error: err instanceof Error ? err.message : '创建活动记录失败'
      }
    }
  }

  /**
   * 刷新数据
   */
  const refresh = async (): Promise<void> => {
    try {
      loading.value = true
      error.value = null
      
      await Promise.all([
        fetchRecentActivities(),
        fetchActivityStats()
      ])
    } catch (err) {
      console.error('Failed to refresh activities:', err)
      error.value = err instanceof Error ? err.message : '刷新失败'
    } finally {
      loading.value = false
    }
  }

  /**
   * 重置Store状态
   */
  const reset = (): void => {
    activities.value = []
    stats.value = null
    loading.value = false
    error.value = null
    initialized.value = false
    pagination.value = {
      page: 1,
      limit: 10,
      total: 0,
      total_pages: 0,
      has_next: false,
      has_prev: false
    }
  }

  // ==================== 辅助方法 ====================
  
  /**
   * 获取客户端信息
   */
  const getClientInfo = () => {
    return {
      ip_address: null, // 在客户端无法直接获取真实IP
      user_agent: navigator.userAgent
    }
  }

  // ==================== 返回Store接口 ====================
  
  return {
    // 状态
    activities: readonly(activities),
    stats: readonly(stats),
    loading: readonly(loading),
    error: readonly(error),
    initialized: readonly(initialized),
    pagination: readonly(pagination),
    
    // 计算属性
    recentActivities,
    todayActivitiesCount,
    weekActivitiesCount,
    hasActivities,
    
    // 方法
    initialize,
    fetchRecentActivities,
    fetchActivityStats,
    fetchActivities,
    createActivity,
    refresh,
    reset
  }
})
