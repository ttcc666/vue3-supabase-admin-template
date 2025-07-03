/**
 * 个人资料相关的 TypeScript 类型定义
 */

import type { Database } from './database'

// 从数据库类型中提取 profiles 表类型
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

// 个人资料表单数据类型
export interface ProfileFormData {
  username?: string
  first_name?: string
  last_name?: string
  phone?: string
  website?: string
  bio?: string
  avatar_url?: string
  birthday?: string | null
  country?: string
  city?: string
  address?: string
  github_url?: string
  linkedin_url?: string
  twitter_url?: string
}

// 个人资料显示数据类型（包含计算字段）
export interface ProfileWithStats extends Profile {
  age?: number
  activity_status?: 'active' | 'inactive' | 'dormant'
}

// 头像上传相关类型
export interface AvatarUploadOptions {
  file: File
  userId: string
  bucket?: string
  quality?: number
  maxSize?: number
}

export interface AvatarUploadResult {
  success: boolean
  url?: string
  error?: string
  path?: string
}

// 个人资料操作结果类型
export interface ProfileOperationResult {
  success: boolean
  data?: Profile
  error?: string
  message?: string
}

// 个人资料验证错误类型
export interface ProfileValidationError {
  field: keyof ProfileFormData
  message: string
  code?: string
}

// 个人资料统计信息类型
export interface ProfileStats {
  totalProfiles: number
  activeUsers: number
  newUsersThisMonth: number
  averageAge?: number
}

// 个人资料搜索参数类型
export interface ProfileSearchParams {
  query?: string
  country?: string
  city?: string
  ageMin?: number
  ageMax?: number
  hasAvatar?: boolean
  isActive?: boolean
  limit?: number
  offset?: number
  sortBy?: 'created_at' | 'updated_at' | 'username' | 'age'
  sortOrder?: 'asc' | 'desc'
}

// 个人资料搜索结果类型
export interface ProfileSearchResult {
  profiles: ProfileWithStats[]
  total: number
  hasMore: boolean
  nextOffset?: number
}

// 社交媒体链接类型
export interface SocialMediaLinks {
  github_url?: string
  linkedin_url?: string
  twitter_url?: string
  website?: string
}

// 地址信息类型
export interface AddressInfo {
  country?: string
  city?: string
  address?: string
}

// 个人资料完整度类型
export interface ProfileCompleteness {
  percentage: number
  missingFields: (keyof ProfileFormData)[]
  suggestions: string[]
}

// 个人资料历史记录类型
export interface ProfileHistory {
  id: string
  profile_id: string
  field_name: string
  old_value?: string
  new_value?: string
  changed_at: string
  changed_by: string
}

// 个人资料设置类型
export interface ProfileSettings {
  isPublic: boolean
  showEmail: boolean
  showPhone: boolean
  showBirthday: boolean
  showLocation: boolean
  allowMessages: boolean
  emailNotifications: boolean
}

// 个人资料导出数据类型
export interface ProfileExportData {
  profile: Profile
  settings: ProfileSettings
  history: ProfileHistory[]
  exportedAt: string
  format: 'json' | 'csv' | 'pdf'
}

// 批量操作类型
export interface ProfileBatchOperation {
  operation: 'update' | 'delete' | 'export'
  profileIds: string[]
  data?: Partial<ProfileFormData>
}

export interface ProfileBatchResult {
  success: boolean
  processed: number
  failed: number
  errors: Array<{
    profileId: string
    error: string
  }>
}

// 个人资料活动日志类型
export interface ProfileActivity {
  id: string
  profile_id: string
  action: 'created' | 'updated' | 'viewed' | 'deleted'
  details?: Record<string, any>
  ip_address?: string
  user_agent?: string
  created_at: string
}

// 个人资料通知类型
export interface ProfileNotification {
  id: string
  profile_id: string
  type: 'profile_updated' | 'avatar_changed' | 'settings_changed'
  title: string
  message: string
  read: boolean
  created_at: string
}

// 个人资料 API 响应类型
export interface ProfileApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  meta?: {
    total?: number
    page?: number
    limit?: number
    hasMore?: boolean
  }
}

// 个人资料缓存类型
export interface ProfileCache {
  profile: Profile | null
  lastFetched: number
  isLoading: boolean
  error: string | null
}

// 个人资料表单验证规则类型
export interface ProfileValidationRules {
  username: {
    required: boolean
    minLength: number
    maxLength: number
    pattern: RegExp
  }
  phone: {
    required: boolean
    pattern: RegExp
  }
  website: {
    required: boolean
    pattern: RegExp
  }
  bio: {
    required: boolean
    maxLength: number
  }
}

// 默认验证规则
export const DEFAULT_PROFILE_VALIDATION_RULES: ProfileValidationRules = {
  username: {
    required: false,
    minLength: 3,
    maxLength: 30,
    pattern: /^[a-zA-Z0-9_-]+$/
  },
  phone: {
    required: false,
    pattern: /^\+?[1-9]\d{1,14}$/
  },
  website: {
    required: false,
    pattern: /^https?:\/\/.+/
  },
  bio: {
    required: false,
    maxLength: 500
  }
}

// 个人资料字段标签映射
export const PROFILE_FIELD_LABELS: Record<keyof ProfileFormData, string> = {
  username: '用户名',
  first_name: '名字',
  last_name: '姓氏',
  phone: '手机号',
  website: '个人网站',
  bio: '个人简介',
  avatar_url: '头像',
  birthday: '生日',
  country: '国家',
  city: '城市',
  address: '详细地址',
  github_url: 'GitHub',
  linkedin_url: 'LinkedIn',
  twitter_url: 'Twitter'
}

// 账户安全相关类型
export interface PasswordChangeData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface PasswordValidationResult {
  isValid: boolean
  errors: string[]
  strength: 'weak' | 'medium' | 'strong'
  score: number
}

export interface PasswordChangeResult {
  success: boolean
  error?: string
  message?: string
}

export interface SecuritySettings {
  emailVerified: boolean
  phoneVerified: boolean
  lastPasswordChange?: string
  loginHistory: LoginHistoryItem[]
}

export interface LoginHistoryItem {
  id: string
  timestamp: string
  ipAddress: string
  userAgent: string
  location?: string
  success: boolean
}

// 密码强度要求配置
export interface PasswordRequirements {
  minLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
  forbiddenPasswords: string[]
}

// 默认密码要求
export const DEFAULT_PASSWORD_REQUIREMENTS: PasswordRequirements = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  forbiddenPasswords: [
    'password', '123456', '12345678', 'qwerty', 'abc123',
    'password123', '111111', '123123', 'admin', 'root'
  ]
}

// 导出所有类型
export type {
  Database
}
