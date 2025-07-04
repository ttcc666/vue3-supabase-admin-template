/**
 * 设置验证工具函数
 * 提供严格的类型约束和验证逻辑
 */

import type {
  SettingCategory,
  SettingValidationRule,
  SettingValidationSchema,
  SystemSettings,
  NotificationSettings,
  PrivacySettings
} from '@/types/settings'
import {
  SETTINGS_VALIDATION_SCHEMA
} from '@/types/settings'

// =====================================================
// 验证错误类型
// =====================================================

export class SettingValidationError extends Error {
  constructor(
    public category: SettingCategory,
    public key: string,
    public value: any,
    public rule: string,
    message: string
  ) {
    super(`Setting validation failed for ${category}.${key}: ${message}`)
    this.name = 'SettingValidationError'
  }
}

// =====================================================
// 基础验证函数
// =====================================================

/**
 * 验证单个设置值
 */
export function validateSettingValue(
  category: SettingCategory,
  key: string,
  value: any,
  rule: SettingValidationRule
): boolean | string {
  // 必填验证
  if (rule.required && (value === null || value === undefined || value === '')) {
    return `${category}.${key} is required`
  }

  // 如果值为空且非必填，跳过其他验证
  if (!rule.required && (value === null || value === undefined || value === '')) {
    return true
  }

  // 类型验证
  if (rule.type) {
    const actualType = typeof value
    if (actualType !== rule.type) {
      return `${category}.${key} must be of type ${rule.type}, got ${actualType}`
    }
  }

  // 枚举值验证
  if (rule.enum && !rule.enum.includes(value)) {
    return `${category}.${key} must be one of: ${rule.enum.join(', ')}`
  }

  // 字符串长度验证
  if (rule.type === 'string' && typeof value === 'string') {
    if (rule.minLength && value.length < rule.minLength) {
      return `${category}.${key} must be at least ${rule.minLength} characters long`
    }
    if (rule.maxLength && value.length > rule.maxLength) {
      return `${category}.${key} must be at most ${rule.maxLength} characters long`
    }
  }

  // 正则表达式验证
  if (rule.pattern && typeof value === 'string') {
    if (!rule.pattern.test(value)) {
      return `${category}.${key} does not match the required pattern`
    }
  }

  // 自定义验证
  if (rule.custom) {
    const customResult = rule.custom(value)
    if (customResult !== true) {
      return typeof customResult === 'string' ? customResult : `${category}.${key} failed custom validation`
    }
  }

  return true
}

/**
 * 验证设置对象
 */
export function validateSettings(
  category: SettingCategory,
  settings: Record<string, any>,
  schema: SettingValidationSchema = SETTINGS_VALIDATION_SCHEMA
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  const categorySchema = schema[category]

  if (!categorySchema) {
    errors.push(`Unknown setting category: ${category}`)
    return { isValid: false, errors }
  }

  // 验证每个设置项
  for (const [key, value] of Object.entries(settings)) {
    const rule = categorySchema[key]
    if (!rule) {
      errors.push(`Unknown setting key: ${category}.${key}`)
      continue
    }

    const result = validateSettingValue(category, key, value, rule)
    if (typeof result === 'string') {
      errors.push(result)
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// =====================================================
// 类型守卫函数
// =====================================================

/**
 * 检查是否为有效的设置分类
 */
export function isValidSettingCategory(category: string): category is SettingCategory {
  return ['system', 'notification', 'privacy'].includes(category)
}

/**
 * 检查是否为有效的系统设置键
 */
export function isValidSystemSettingKey(key: string): key is keyof SystemSettings {
  return ['language', 'timezone', 'dateFormat'].includes(key)
}

/**
 * 检查是否为有效的通知设置键
 */
export function isValidNotificationSettingKey(key: string): key is keyof NotificationSettings {
  return ['email', 'browser', 'sms', 'marketing'].includes(key)
}

/**
 * 检查是否为有效的隐私设置键
 */
export function isValidPrivacySettingKey(key: string): key is keyof PrivacySettings {
  return ['profileVisibility', 'showOnlineStatus', 'allowAnalytics'].includes(key)
}

/**
 * 检查设置键是否属于指定分类
 */
export function isValidSettingKey(category: SettingCategory, key: string): boolean {
  switch (category) {
    case 'system':
      return isValidSystemSettingKey(key)
    case 'notification':
      return isValidNotificationSettingKey(key)
    case 'privacy':
      return isValidPrivacySettingKey(key)
    default:
      return false
  }
}

// =====================================================
// 设置值转换函数
// =====================================================

/**
 * 安全地转换设置值为指定类型
 */
export function convertSettingValue(value: any, targetType: string): any {
  switch (targetType) {
    case 'boolean':
      if (typeof value === 'boolean') return value
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true'
      }
      return Boolean(value)

    case 'number':
      if (typeof value === 'number') return value
      if (typeof value === 'string') {
        const num = Number(value)
        return isNaN(num) ? 0 : num
      }
      return 0

    case 'string':
      return String(value)

    case 'object':
      if (typeof value === 'object' && value !== null) return value
      try {
        return JSON.parse(String(value))
      } catch {
        return {}
      }

    default:
      return value
  }
}

/**
 * 清理和标准化设置值
 */
export function sanitizeSettingValue(
  category: SettingCategory,
  key: string,
  value: any,
  schema: SettingValidationSchema = SETTINGS_VALIDATION_SCHEMA
): any {
  const rule = schema[category]?.[key]
  if (!rule) return value

  // 转换为目标类型
  if (rule.type) {
    value = convertSettingValue(value, rule.type)
  }

  // 字符串修剪
  if (typeof value === 'string') {
    value = value.trim()
  }

  return value
}

// =====================================================
// 批量验证函数
// =====================================================

/**
 * 验证多个设置项
 */
export function validateMultipleSettings(
  items: Array<{ category: SettingCategory; key: string; value: any }>,
  schema: SettingValidationSchema = SETTINGS_VALIDATION_SCHEMA
): { isValid: boolean; errors: SettingValidationError[] } {
  const errors: SettingValidationError[] = []

  for (const item of items) {
    const { category, key, value } = item
    const rule = schema[category]?.[key]

    if (!rule) {
      errors.push(new SettingValidationError(
        category,
        key,
        value,
        'unknown',
        `Unknown setting: ${category}.${key}`
      ))
      continue
    }

    const result = validateSettingValue(category, key, value, rule)
    if (typeof result === 'string') {
      errors.push(new SettingValidationError(
        category,
        key,
        value,
        'validation',
        result
      ))
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// =====================================================
// 设置完整性检查
// =====================================================

/**
 * 检查设置对象的完整性
 */
export function checkSettingsCompleteness(
  category: SettingCategory,
  settings: Record<string, any>,
  schema: SettingValidationSchema = SETTINGS_VALIDATION_SCHEMA
): { isComplete: boolean; missingKeys: string[] } {
  const categorySchema = schema[category]
  if (!categorySchema) {
    return { isComplete: false, missingKeys: [] }
  }

  const missingKeys: string[] = []
  
  for (const [key, rule] of Object.entries(categorySchema)) {
    if (rule.required && !(key in settings)) {
      missingKeys.push(key)
    }
  }

  return {
    isComplete: missingKeys.length === 0,
    missingKeys
  }
}

/**
 * 获取设置的默认值
 */
export function getDefaultSettingValue(category: SettingCategory, key: string): any {
  const defaults = {
    system: {
      language: 'zh-CN',
      timezone: 'Asia/Shanghai',
      dateFormat: 'YYYY-MM-DD'
    },
    notification: {
      email: true,
      browser: true,
      sms: false,
      marketing: false
    },
    privacy: {
      profileVisibility: 'public',
      showOnlineStatus: true,
      allowAnalytics: true
    }
  }

  return (defaults as any)[category]?.[key] ?? null
}
