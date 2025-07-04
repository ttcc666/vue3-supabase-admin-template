/**
 * 用户设置相关的 TypeScript 类型定义
 * 这个文件定义了用户设置系统的所有类型和接口
 */

import type { Database } from './database'

// 从数据库类型中提取设置相关类型
export type UserSetting = Database['public']['Tables']['user_settings']['Row']
export type UserSettingInsert = Database['public']['Tables']['user_settings']['Insert']
export type UserSettingUpdate = Database['public']['Tables']['user_settings']['Update']
export type SettingCategory = Database['public']['Enums']['setting_category']

// =====================================================
// 设置分类枚举
// =====================================================

export const SETTING_CATEGORIES = {
  SYSTEM: 'system',
  NOTIFICATION: 'notification',
  PRIVACY: 'privacy'
} as const

// =====================================================
// 系统设置相关类型
// =====================================================

export interface SystemSettings {
  language: string
  timezone: string
  dateFormat: string
}

export const SYSTEM_SETTING_KEYS = {
  LANGUAGE: 'language',
  TIMEZONE: 'timezone',
  DATE_FORMAT: 'dateFormat'
} as const

export const LANGUAGE_OPTIONS = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'en-US', label: 'English' }
] as const

export const TIMEZONE_OPTIONS = [
  { value: 'Asia/Shanghai', label: '北京时间 (UTC+8)' },
  { value: 'America/New_York', label: '纽约时间 (UTC-5)' },
  { value: 'Europe/London', label: '伦敦时间 (UTC+0)' }
] as const

export const DATE_FORMAT_OPTIONS = [
  { value: 'YYYY-MM-DD', label: '2024-01-01' },
  { value: 'DD/MM/YYYY', label: '01/01/2024' },
  { value: 'MM/DD/YYYY', label: '01/01/2024' }
] as const

// =====================================================
// 通知设置相关类型
// =====================================================

export interface NotificationSettings {
  email: boolean
  browser: boolean
  sms: boolean
  marketing: boolean
}

export const NOTIFICATION_SETTING_KEYS = {
  EMAIL: 'email',
  BROWSER: 'browser',
  SMS: 'sms',
  MARKETING: 'marketing'
} as const

export interface NotificationOption {
  key: keyof NotificationSettings
  title: string
  description: string
}

export const NOTIFICATION_OPTIONS: NotificationOption[] = [
  {
    key: 'email',
    title: '邮件通知',
    description: '接收重要系统通知和更新'
  },
  {
    key: 'browser',
    title: '浏览器通知',
    description: '在浏览器中显示实时通知'
  },
  {
    key: 'sms',
    title: '短信通知',
    description: '接收重要安全提醒短信'
  },
  {
    key: 'marketing',
    title: '营销邮件',
    description: '接收产品更新和营销信息'
  }
]

// =====================================================
// 隐私设置相关类型
// =====================================================

export interface PrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private'
  showOnlineStatus: boolean
  allowAnalytics: boolean
}

export const PRIVACY_SETTING_KEYS = {
  PROFILE_VISIBILITY: 'profileVisibility',
  SHOW_ONLINE_STATUS: 'showOnlineStatus',
  ALLOW_ANALYTICS: 'allowAnalytics'
} as const

export const PROFILE_VISIBILITY_OPTIONS = [
  { value: 'public', label: '公开' },
  { value: 'friends', label: '仅好友' },
  { value: 'private', label: '私密' }
] as const

export interface PrivacyOption {
  key: keyof PrivacySettings
  title: string
  description: string
  type: 'switch' | 'select'
  options?: Array<{ value: string; label: string }>
}

export const PRIVACY_OPTIONS: PrivacyOption[] = [
  {
    key: 'profileVisibility',
    title: '个人资料可见性',
    description: '控制其他用户是否可以查看您的个人资料',
    type: 'select',
    options: PROFILE_VISIBILITY_OPTIONS
  },
  {
    key: 'showOnlineStatus',
    title: '活动状态',
    description: '显示您的在线状态',
    type: 'switch'
  },
  {
    key: 'allowAnalytics',
    title: '数据分析',
    description: '允许收集匿名使用数据以改进服务',
    type: 'switch'
  }
]

// =====================================================
// 设置操作相关类型
// =====================================================

export interface SettingItem {
  category: SettingCategory
  key: string
  value: any
  description?: string
}

export interface SettingsState {
  system: SystemSettings
  notification: NotificationSettings
  privacy: PrivacySettings
  loading: boolean
  error: string | null
}

export interface SettingsActions {
  // 获取设置
  getSettings: (category?: SettingCategory) => Promise<void>
  getSetting: (category: SettingCategory, key: string, defaultValue?: any) => Promise<any>
  
  // 设置操作
  setSetting: (category: SettingCategory, key: string, value: any, description?: string) => Promise<void>
  updateSettings: (category: SettingCategory, settings: Record<string, any>) => Promise<void>
  
  // 批量操作
  batchUpdateSettings: (items: SettingItem[]) => Promise<void>
  
  // 重置操作
  resetSettings: (category?: SettingCategory) => Promise<void>
  
  // 初始化
  initializeSettings: () => Promise<void>
}

// =====================================================
// 默认设置值
// =====================================================

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  language: 'zh-CN',
  timezone: 'Asia/Shanghai',
  dateFormat: 'YYYY-MM-DD'
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  email: true,
  browser: true,
  sms: false,
  marketing: false
}

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  profileVisibility: 'public',
  showOnlineStatus: true,
  allowAnalytics: true
}

export const DEFAULT_SETTINGS: SettingsState = {
  system: DEFAULT_SYSTEM_SETTINGS,
  notification: DEFAULT_NOTIFICATION_SETTINGS,
  privacy: DEFAULT_PRIVACY_SETTINGS,
  loading: false,
  error: null
}

// =====================================================
// 设置验证相关类型
// =====================================================

export interface SettingValidationRule {
  required?: boolean
  type?: 'string' | 'boolean' | 'number' | 'object'
  enum?: readonly string[]
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => boolean | string
}

export interface SettingValidationSchema {
  [category: string]: {
    [key: string]: SettingValidationRule
  }
}

export const SETTINGS_VALIDATION_SCHEMA: SettingValidationSchema = {
  system: {
    language: {
      required: true,
      type: 'string',
      enum: LANGUAGE_OPTIONS.map(opt => opt.value)
    },
    timezone: {
      required: true,
      type: 'string',
      enum: TIMEZONE_OPTIONS.map(opt => opt.value)
    },
    dateFormat: {
      required: true,
      type: 'string',
      enum: DATE_FORMAT_OPTIONS.map(opt => opt.value)
    }
  },
  notification: {
    email: { required: true, type: 'boolean' },
    browser: { required: true, type: 'boolean' },
    sms: { required: true, type: 'boolean' },
    marketing: { required: true, type: 'boolean' }
  },
  privacy: {
    profileVisibility: {
      required: true,
      type: 'string',
      enum: PROFILE_VISIBILITY_OPTIONS.map(opt => opt.value)
    },
    showOnlineStatus: { required: true, type: 'boolean' },
    allowAnalytics: { required: true, type: 'boolean' }
  }
}

// =====================================================
// 实用工具类型
// =====================================================

export type SettingValue<T extends SettingCategory, K extends string> = 
  T extends 'system' ? SystemSettings[K extends keyof SystemSettings ? K : never] :
  T extends 'notification' ? NotificationSettings[K extends keyof NotificationSettings ? K : never] :
  T extends 'privacy' ? PrivacySettings[K extends keyof PrivacySettings ? K : never] :
  never

export type AllSettings = SystemSettings & NotificationSettings & PrivacySettings

// 设置变更事件类型
export interface SettingChangeEvent {
  category: SettingCategory
  key: string
  oldValue: any
  newValue: any
  timestamp: Date
}

// 设置同步状态
export interface SettingSyncStatus {
  category: SettingCategory
  key: string
  status: 'pending' | 'syncing' | 'synced' | 'error'
  error?: string
  lastSyncAt?: Date
}
