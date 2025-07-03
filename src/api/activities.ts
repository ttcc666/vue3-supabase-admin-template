/**
 * 用户活动记录 API 接口
 * 封装与Supabase交互的API方法
 */

import { supabase } from '@/lib/supabase'
import type {
  UserActivity,
  UserActivityWithDisplay,
  UserActivityStats,
  CreateActivityRequest,
  QueryActivitiesParams,
  PaginatedActivities,
  ActivityOperationResult,
  ActivityType,
  ApiResponse
} from '@/types/activities'

/**
 * 活动记录API类
 */
export class ActivitiesAPI {
  /**
   * 获取当前用户的最近活动记录
   * @param limit 限制数量，默认20条
   * @returns 活动记录列表
   */
  static async getRecentActivities(limit: number = 20): Promise<UserActivityWithDisplay[]> {
    try {
      const { data, error } = await supabase
        .from('recent_user_activities')
        .select('*')
        .limit(limit)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`获取最近活动失败: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('Failed to fetch recent activities:', error)
      throw error
    }
  }

  /**
   * 分页查询用户活动记录
   * @param params 查询参数
   * @returns 分页结果
   */
  static async getActivities(params: QueryActivitiesParams = {}): Promise<PaginatedActivities> {
    try {
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

      const { data, error, count } = await query

      if (error) {
        throw new Error(`查询活动记录失败: ${error.message}`)
      }

      const total = count || 0
      const total_pages = Math.ceil(total / limit)

      return {
        data: data || [],
        total,
        page,
        limit,
        total_pages,
        has_next: page < total_pages,
        has_prev: page > 1
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error)
      throw error
    }
  }

  /**
   * 获取用户活动统计信息
   * @param userId 用户ID，不传则使用当前用户
   * @returns 统计信息
   */
  static async getActivityStats(userId?: string): Promise<UserActivityStats | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_user_activity_stats', {
          p_user_id: userId || null
        })

      if (error) {
        throw new Error(`获取活动统计失败: ${error.message}`)
      }

      return data && data.length > 0 ? data[0] : null
    } catch (error) {
      console.error('Failed to fetch activity stats:', error)
      throw error
    }
  }

  /**
   * 创建活动记录
   * @param request 创建请求参数
   * @returns 操作结果
   */
  static async createActivity(request: CreateActivityRequest): Promise<ActivityOperationResult> {
    try {
      // 获取客户端信息
      const clientInfo = this.getClientInfo()

      const { data, error } = await supabase
        .rpc('log_user_activity', {
          p_user_id: null, // 使用当前认证用户
          p_activity_type: request.activity_type,
          p_activity_title: request.activity_title,
          p_activity_description: request.activity_description || null,
          p_ip_address: request.ip_address || clientInfo.ip_address,
          p_user_agent: request.user_agent || clientInfo.user_agent,
          p_metadata: request.metadata || {}
        })

      if (error) {
        throw new Error(`创建活动记录失败: ${error.message}`)
      }

      return {
        success: true,
        activity_id: data
      }
    } catch (error) {
      console.error('Failed to create activity:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '创建活动记录失败'
      }
    }
  }

  /**
   * 批量创建活动记录
   * @param requests 创建请求参数数组
   * @returns 操作结果数组
   */
  static async createActivities(requests: CreateActivityRequest[]): Promise<ActivityOperationResult[]> {
    const results: ActivityOperationResult[] = []

    for (const request of requests) {
      try {
        const result = await this.createActivity(request)
        results.push(result)
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : '创建活动记录失败'
        })
      }
    }

    return results
  }

  /**
   * 获取特定类型的活动记录
   * @param activityType 活动类型
   * @param limit 限制数量
   * @returns 活动记录列表
   */
  static async getActivitiesByType(
    activityType: ActivityType,
    limit: number = 10
  ): Promise<UserActivity[]> {
    try {
      const { data, error } = await supabase
        .from('user_activities')
        .select('*')
        .eq('activity_type', activityType)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        throw new Error(`获取${activityType}活动记录失败: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error(`Failed to fetch ${activityType} activities:`, error)
      throw error
    }
  }

  /**
   * 获取指定时间范围内的活动记录
   * @param startDate 开始时间
   * @param endDate 结束时间
   * @param limit 限制数量
   * @returns 活动记录列表
   */
  static async getActivitiesByDateRange(
    startDate: string,
    endDate: string,
    limit: number = 50
  ): Promise<UserActivity[]> {
    try {
      const { data, error } = await supabase
        .from('user_activities')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        throw new Error(`获取时间范围内活动记录失败: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('Failed to fetch activities by date range:', error)
      throw error
    }
  }

  /**
   * 搜索活动记录
   * @param keyword 搜索关键词
   * @param limit 限制数量
   * @returns 活动记录列表
   */
  static async searchActivities(keyword: string, limit: number = 20): Promise<UserActivity[]> {
    try {
      const { data, error } = await supabase
        .from('user_activities')
        .select('*')
        .or(`activity_title.ilike.%${keyword}%,activity_description.ilike.%${keyword}%`)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        throw new Error(`搜索活动记录失败: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('Failed to search activities:', error)
      throw error
    }
  }

  /**
   * 获取客户端信息
   * @returns 客户端信息
   */
  private static getClientInfo() {
    return {
      ip_address: null, // 在客户端无法直接获取真实IP
      user_agent: navigator.userAgent
    }
  }
}

/**
 * 便捷的API方法导出
 */
export const activitiesAPI = {
  /** 获取最近活动 */
  getRecent: ActivitiesAPI.getRecentActivities,
  
  /** 分页查询活动 */
  getList: ActivitiesAPI.getActivities,
  
  /** 获取统计信息 */
  getStats: ActivitiesAPI.getActivityStats,
  
  /** 创建活动记录 */
  create: ActivitiesAPI.createActivity,
  
  /** 批量创建活动记录 */
  createBatch: ActivitiesAPI.createActivities,
  
  /** 按类型查询 */
  getByType: ActivitiesAPI.getActivitiesByType,
  
  /** 按时间范围查询 */
  getByDateRange: ActivitiesAPI.getActivitiesByDateRange,
  
  /** 搜索活动 */
  search: ActivitiesAPI.searchActivities
}

export default activitiesAPI
