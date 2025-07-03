/**
 * 用户活动记录相关的TypeScript类型定义
 * 对应数据库中的user_activities表和相关枚举
 */

/**
 * 活动类型枚举
 * 对应数据库中的activity_type枚举
 */
export enum ActivityType {
  LOGIN = 'login',
  LOGOUT = 'logout',
  PROFILE_UPDATE = 'profile_update',
  PASSWORD_CHANGE = 'password_change',
  AVATAR_UPLOAD = 'avatar_upload',
  EMAIL_CHANGE = 'email_change',
  PHONE_UPDATE = 'phone_update',
  SECURITY_SETTING = 'security_setting',
  ACCOUNT_SETTING = 'account_setting'
}

/**
 * 活动类型显示名称映射
 */
export const ActivityTypeDisplayNames: Record<ActivityType, string> = {
  [ActivityType.LOGIN]: '登录系统',
  [ActivityType.LOGOUT]: '退出登录',
  [ActivityType.PROFILE_UPDATE]: '更新资料',
  [ActivityType.PASSWORD_CHANGE]: '修改密码',
  [ActivityType.AVATAR_UPLOAD]: '上传头像',
  [ActivityType.EMAIL_CHANGE]: '修改邮箱',
  [ActivityType.PHONE_UPDATE]: '更新手机',
  [ActivityType.SECURITY_SETTING]: '安全设置',
  [ActivityType.ACCOUNT_SETTING]: '账户设置'
}

/**
 * 活动类型图标映射
 */
export const ActivityTypeIcons: Record<ActivityType, string> = {
  [ActivityType.LOGIN]: 'login',
  [ActivityType.LOGOUT]: 'logout',
  [ActivityType.PROFILE_UPDATE]: 'user',
  [ActivityType.PASSWORD_CHANGE]: 'lock',
  [ActivityType.AVATAR_UPLOAD]: 'picture',
  [ActivityType.EMAIL_CHANGE]: 'mail',
  [ActivityType.PHONE_UPDATE]: 'phone',
  [ActivityType.SECURITY_SETTING]: 'safety-certificate',
  [ActivityType.ACCOUNT_SETTING]: 'setting'
}

/**
 * 用户活动记录接口
 * 对应数据库中的user_activities表
 */
export interface UserActivity {
  /** 活动记录唯一标识 */
  id: string
  /** 用户ID */
  user_id: string
  /** 活动类型 */
  activity_type: ActivityType
  /** 活动标题 */
  activity_title: string
  /** 活动详细描述 */
  activity_description?: string
  /** 用户IP地址 */
  ip_address?: string
  /** 用户代理字符串 */
  user_agent?: string
  /** 额外的元数据 */
  metadata?: Record<string, any>
  /** 活动发生时间 */
  created_at: string
}

/**
 * 用户活动记录（包含显示信息）
 * 对应数据库视图recent_user_activities
 */
export interface UserActivityWithDisplay extends UserActivity {
  /** 友好的时间显示 */
  time_ago: string
  /** 活动类型的中文显示名称 */
  activity_type_display: string
}

/**
 * 创建活动记录的请求参数
 */
export interface CreateActivityRequest {
  /** 活动类型 */
  activity_type: ActivityType
  /** 活动标题 */
  activity_title: string
  /** 活动详细描述 */
  activity_description?: string
  /** 用户IP地址 */
  ip_address?: string
  /** 用户代理字符串 */
  user_agent?: string
  /** 额外的元数据 */
  metadata?: Record<string, any>
}

/**
 * 用户活动统计信息
 */
export interface UserActivityStats {
  /** 总活动数量 */
  total_activities: number
  /** 今日活动数量 */
  activities_today: number
  /** 本周活动数量 */
  activities_this_week: number
  /** 本月活动数量 */
  activities_this_month: number
  /** 最常见的活动类型 */
  most_common_activity: ActivityType
  /** 最后活动时间 */
  last_activity_time: string
}

/**
 * 查询活动记录的参数
 */
export interface QueryActivitiesParams {
  /** 页码（从1开始） */
  page?: number
  /** 每页数量 */
  limit?: number
  /** 活动类型过滤 */
  activity_type?: ActivityType
  /** 开始时间 */
  start_date?: string
  /** 结束时间 */
  end_date?: string
  /** 搜索关键词 */
  search?: string
}

/**
 * 分页查询结果
 */
export interface PaginatedActivities {
  /** 活动记录列表 */
  data: UserActivityWithDisplay[]
  /** 总记录数 */
  total: number
  /** 当前页码 */
  page: number
  /** 每页数量 */
  limit: number
  /** 总页数 */
  total_pages: number
  /** 是否有下一页 */
  has_next: boolean
  /** 是否有上一页 */
  has_prev: boolean
}

/**
 * API响应基础接口
 */
export interface ApiResponse<T = any> {
  /** 是否成功 */
  success: boolean
  /** 响应数据 */
  data?: T
  /** 错误信息 */
  error?: string
  /** 错误代码 */
  code?: string
}

/**
 * 活动记录操作结果
 */
export interface ActivityOperationResult {
  /** 是否成功 */
  success: boolean
  /** 活动记录ID（创建成功时返回） */
  activity_id?: string
  /** 错误信息 */
  error?: string
}

/**
 * 常用的活动记录模板
 */
export const ActivityTemplates = {
  /** 登录成功 */
  LOGIN_SUCCESS: {
    activity_type: ActivityType.LOGIN,
    activity_title: '用户登录',
    activity_description: '通过邮箱和密码成功登录系统'
  },
  
  /** 登出 */
  LOGOUT: {
    activity_type: ActivityType.LOGOUT,
    activity_title: '用户登出',
    activity_description: '用户主动退出登录'
  },
  
  /** 修改密码 */
  PASSWORD_CHANGED: {
    activity_type: ActivityType.PASSWORD_CHANGE,
    activity_title: '修改登录密码',
    activity_description: '用户成功修改了登录密码'
  },
  
  /** 更新个人资料 */
  PROFILE_UPDATED: {
    activity_type: ActivityType.PROFILE_UPDATE,
    activity_title: '更新个人资料',
    activity_description: '用户修改了个人资料信息'
  },
  
  /** 上传头像 */
  AVATAR_UPLOADED: {
    activity_type: ActivityType.AVATAR_UPLOAD,
    activity_title: '上传头像',
    activity_description: '用户上传了新的头像图片'
  }
} as const

/**
 * 活动记录相关的常量
 */
export const ACTIVITY_CONSTANTS = {
  /** 默认每页显示数量 */
  DEFAULT_PAGE_SIZE: 10,
  /** 最大每页显示数量 */
  MAX_PAGE_SIZE: 50,
  /** 活动记录保留天数 */
  RETENTION_DAYS: 3,
  /** 最近活动显示数量 */
  RECENT_ACTIVITIES_LIMIT: 20
} as const
