/**
 * 用户设置状态管理 Store
 * 使用 Pinia 管理用户设置的状态和操作
 */

import { defineStore } from 'pinia'
import { ref, computed, watch, onUnmounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type {
  SettingCategory,
  SettingsState,
  SystemSettings,
  NotificationSettings,
  PrivacySettings,
  SettingItem
} from '@/types/settings'
import {
  DEFAULT_SYSTEM_SETTINGS,
  DEFAULT_NOTIFICATION_SETTINGS,
  DEFAULT_PRIVACY_SETTINGS
} from '@/types/settings'
import {
  validateSettings,
  sanitizeSettingValue,
  validateMultipleSettings,
  SettingValidationError
} from '@/utils/settingsValidation'
import { settingsCache } from '@/utils/settingsCache'
import { message } from 'ant-design-vue'

export const useSettingsStore = defineStore('settings', () => {
  // =====================================================
  // 状态定义
  // =====================================================

  const system = ref<SystemSettings>({ ...DEFAULT_SYSTEM_SETTINGS })
  const notification = ref<NotificationSettings>({ ...DEFAULT_NOTIFICATION_SETTINGS })
  const privacy = ref<PrivacySettings>({ ...DEFAULT_PRIVACY_SETTINGS })
  const loading = ref(false)
  const error = ref<string | null>(null)
  const initialized = ref(false)

  // 同步状态跟踪
  const syncStatus = ref<Record<string, 'pending' | 'syncing' | 'synced' | 'error'>>({})

  // 实时订阅相关
  const realtimeChannel = ref<RealtimeChannel | null>(null)
  const isSubscribed = ref(false)

  // =====================================================
  // 缓存初始化 - 将在函数定义后设置
  // =====================================================

  // =====================================================
  // 计算属性
  // =====================================================

  const allSettings = computed(() => ({
    system: system.value,
    notification: notification.value,
    privacy: privacy.value
  }))

  const isLoading = computed(() => loading.value)
  const hasError = computed(() => error.value !== null)

  // =====================================================
  // 辅助函数
  // =====================================================

  const authStore = useAuthStore()

  /**
   * 设置同步状态
   */
  const setSyncStatus = (category: SettingCategory, key: string, status: 'pending' | 'syncing' | 'synced' | 'error') => {
    const syncKey = `${category}.${key}`
    syncStatus.value[syncKey] = status
  }

  /**
   * 清除错误状态
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * 设置错误状态
   */
  const setError = (errorMessage: string) => {
    error.value = errorMessage
    console.error('Settings Store Error:', errorMessage)
  }

  // =====================================================
  // 数据库操作方法
  // =====================================================

  /**
   * 从数据库获取单个设置（带缓存）
   */
  const getSetting = async (category: SettingCategory, key: string, defaultValue?: any): Promise<any> => {
    try {
      // 先检查缓存
      if (settingsCache.has(category, key)) {
        return settingsCache.get(category, key)
      }

      if (!authStore.user) {
        throw new Error('User not authenticated')
      }

      const { data, error: dbError } = await supabase
        .rpc('get_user_setting', {
          p_category: category,
          p_setting_key: key,
          p_default_value: defaultValue ?? null
        })

      if (dbError) {
        throw dbError
      }

      // 缓存结果
      settingsCache.set(category, key, data, false)
      return data
    } catch (err) {
      console.error(`Failed to get setting ${category}.${key}:`, err)
      return defaultValue
    }
  }

  /**
   * 设置单个设置到数据库（带缓存和批量更新）
   */
  const setSetting = async (
    category: SettingCategory,
    key: string,
    value: any,
    description?: string
  ): Promise<void> => {
    try {
      if (!authStore.user) {
        throw new Error('User not authenticated')
      }

      setSyncStatus(category, key, 'pending')

      // 验证设置值
      const sanitizedValue = sanitizeSettingValue(category, key, value)
      const validation = validateSettings(category, { [key]: sanitizedValue })

      if (!validation.isValid) {
        throw new SettingValidationError(category, key, value, 'validation', validation.errors.join(', '))
      }

      // 立即更新本地状态和缓存
      updateLocalSetting(category, key, sanitizedValue)
      settingsCache.set(category, key, sanitizedValue, true)

      // 添加到批量更新队列
      await settingsCache.addToBatchQueue({
        category,
        key,
        value: sanitizedValue,
        description
      })

      setSyncStatus(category, key, 'synced')
    } catch (err) {
      setSyncStatus(category, key, 'error')
      throw err
    }
  }

  /**
   * 内部批量更新方法（不经过缓存队列）
   */
  const batchUpdateSettingsInternal = async (items: SettingItem[]): Promise<void> => {
    try {
      if (!authStore.user) {
        throw new Error('User not authenticated')
      }

      // 批量更新到数据库
      const promises = items.map(item =>
        supabase.rpc('set_user_setting', {
          p_category: item.category,
          p_setting_key: item.key,
          p_setting_value: item.value,
          p_description: item.description
        })
      )

      const results = await Promise.allSettled(promises)

      // 检查是否有失败的更新
      const failures = results.filter(result => result.status === 'rejected')
      if (failures.length > 0) {
        console.error('Some settings failed to update:', failures)
        throw new Error(`Failed to update ${failures.length} settings`)
      }
    } catch (err) {
      console.error('Batch update failed:', err)
      throw err
    }
  }

  // 设置缓存的批量更新执行器
  settingsCache.setBatchUpdateExecutor(async (items: SettingItem[]) => {
    await batchUpdateSettingsInternal(items)
  })

  /**
   * 获取分类下的所有设置（带缓存）
   */
  const getSettingsByCategory = async (category: SettingCategory): Promise<Record<string, any>> => {
    try {
      if (!authStore.user) {
        throw new Error('User not authenticated')
      }

      const { data, error: dbError } = await supabase
        .rpc('get_user_settings_by_category', {
          p_category: category
        })

      if (dbError) {
        throw dbError
      }

      // 转换为键值对对象
      const settings: Record<string, any> = {}
      if (data && Array.isArray(data)) {
        data.forEach((item: any) => {
          settings[item.setting_key] = item.setting_value
          // 缓存每个设置项
          settingsCache.set(category, item.setting_key, item.setting_value, false)
        })
      }

      return settings
    } catch (err) {
      console.error(`Failed to get settings for category ${category}:`, err)
      return {}
    }
  }

  /**
   * 批量更新设置
   */
  const batchUpdateSettings = async (items: SettingItem[]): Promise<void> => {
    try {
      if (!authStore.user) {
        throw new Error('User not authenticated')
      }

      loading.value = true
      clearError()

      // 验证所有设置项
      const validation = validateMultipleSettings(items)
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`)
      }

      // 批量更新
      const promises = items.map(item => 
        setSetting(item.category, item.key, item.value, item.description)
      )

      await Promise.all(promises)
      message.success('设置保存成功！')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update settings'
      setError(errorMessage)
      message.error('设置保存失败：' + errorMessage)
      throw err
    } finally {
      loading.value = false
    }
  }

  // =====================================================
  // 状态更新方法
  // =====================================================

  /**
   * 更新系统设置
   */
  const updateSystemSettings = async (settings: Partial<SystemSettings>): Promise<void> => {
    try {
      const items: SettingItem[] = Object.entries(settings).map(([key, value]) => ({
        category: 'system' as SettingCategory,
        key,
        value
      }))

      await batchUpdateSettings(items)
      
      // 更新本地状态
      Object.assign(system.value, settings)
    } catch (err) {
      console.error('Failed to update system settings:', err)
      throw err
    }
  }

  /**
   * 更新通知设置
   */
  const updateNotificationSettings = async (settings: Partial<NotificationSettings>): Promise<void> => {
    try {
      const items: SettingItem[] = Object.entries(settings).map(([key, value]) => ({
        category: 'notification' as SettingCategory,
        key,
        value
      }))

      await batchUpdateSettings(items)
      
      // 更新本地状态
      Object.assign(notification.value, settings)
    } catch (err) {
      console.error('Failed to update notification settings:', err)
      throw err
    }
  }

  /**
   * 更新隐私设置
   */
  const updatePrivacySettings = async (settings: Partial<PrivacySettings>): Promise<void> => {
    try {
      const items: SettingItem[] = Object.entries(settings).map(([key, value]) => ({
        category: 'privacy' as SettingCategory,
        key,
        value
      }))

      await batchUpdateSettings(items)
      
      // 更新本地状态
      Object.assign(privacy.value, settings)
    } catch (err) {
      console.error('Failed to update privacy settings:', err)
      throw err
    }
  }

  /**
   * 加载所有设置
   */
  const loadAllSettings = async (): Promise<void> => {
    try {
      if (!authStore.user) {
        return
      }

      loading.value = true
      clearError()

      // 并行加载所有分类的设置
      const [systemSettings, notificationSettings, privacySettings] = await Promise.all([
        getSettingsByCategory('system'),
        getSettingsByCategory('notification'),
        getSettingsByCategory('privacy')
      ])

      // 合并默认值和数据库值
      system.value = { ...DEFAULT_SYSTEM_SETTINGS, ...systemSettings }
      notification.value = { ...DEFAULT_NOTIFICATION_SETTINGS, ...notificationSettings }
      privacy.value = { ...DEFAULT_PRIVACY_SETTINGS, ...privacySettings }

      initialized.value = true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load settings'
      setError(errorMessage)
      console.error('Failed to load settings:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * 初始化设置（创建默认设置）
   */
  const initializeSettings = async (): Promise<void> => {
    try {
      if (!authStore.user) {
        throw new Error('User not authenticated')
      }

      const { error: dbError } = await supabase
        .rpc('create_default_user_settings')

      if (dbError) {
        throw dbError
      }

      // 加载设置
      await loadAllSettings()
    } catch (err) {
      console.error('Failed to initialize settings:', err)
      throw err
    }
  }

  /**
   * 重置设置为默认值
   */
  const resetSettings = async (category?: SettingCategory): Promise<void> => {
    try {
      if (!authStore.user) {
        throw new Error('User not authenticated')
      }

      loading.value = true
      clearError()

      if (category) {
        // 重置指定分类
        const defaultSettings = {
          system: DEFAULT_SYSTEM_SETTINGS,
          notification: DEFAULT_NOTIFICATION_SETTINGS,
          privacy: DEFAULT_PRIVACY_SETTINGS
        }[category as keyof typeof DEFAULT_SETTINGS]

        const items: SettingItem[] = Object.entries(defaultSettings).map(([key, value]) => ({
          category,
          key,
          value
        }))

        await batchUpdateSettings(items)
        
        // 更新本地状态
        if (category === 'system') {
          system.value = { ...DEFAULT_SYSTEM_SETTINGS }
        } else if (category === 'notification') {
          notification.value = { ...DEFAULT_NOTIFICATION_SETTINGS }
        } else if (category === 'privacy') {
          privacy.value = { ...DEFAULT_PRIVACY_SETTINGS }
        }
      } else {
        // 重置所有设置
        await Promise.all([
          updateSystemSettings(DEFAULT_SYSTEM_SETTINGS),
          updateNotificationSettings(DEFAULT_NOTIFICATION_SETTINGS),
          updatePrivacySettings(DEFAULT_PRIVACY_SETTINGS)
        ])
      }

      message.success('设置已重置为默认值')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset settings'
      setError(errorMessage)
      message.error('重置设置失败：' + errorMessage)
      throw err
    } finally {
      loading.value = false
    }
  }

  // =====================================================
  // 实时订阅方法
  // =====================================================

  /**
   * 启动实时订阅
   */
  const startRealtimeSubscription = async (): Promise<void> => {
    try {
      if (!authStore.user || isSubscribed.value) {
        return
      }

      // 创建实时订阅频道
      realtimeChannel.value = supabase
        .channel(`user_settings:${authStore.user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_settings',
            filter: `user_id=eq.${authStore.user.id}`
          },
          (payload) => {
            handleRealtimeChange(payload)
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            isSubscribed.value = true
            console.log('Settings realtime subscription started')
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Settings realtime subscription error')
            isSubscribed.value = false
          }
        })
    } catch (err) {
      console.error('Failed to start realtime subscription:', err)
    }
  }

  /**
   * 停止实时订阅
   */
  const stopRealtimeSubscription = async (): Promise<void> => {
    try {
      if (realtimeChannel.value) {
        await supabase.removeChannel(realtimeChannel.value as any)
        realtimeChannel.value = null
        isSubscribed.value = false
        console.log('Settings realtime subscription stopped')
      }
    } catch (err) {
      console.error('Failed to stop realtime subscription:', err)
    }
  }

  /**
   * 处理实时数据变更
   */
  const handleRealtimeChange = (payload: any) => {
    try {
      const { eventType, new: newRecord, old: oldRecord } = payload

      if (eventType === 'INSERT' || eventType === 'UPDATE') {
        const { category, setting_key, setting_value } = newRecord
        updateLocalSetting(category, setting_key, setting_value)
      } else if (eventType === 'DELETE') {
        const { category, setting_key } = oldRecord
        resetLocalSetting(category, setting_key)
      }
    } catch (err) {
      console.error('Failed to handle realtime change:', err)
    }
  }

  /**
   * 更新本地设置状态
   */
  const updateLocalSetting = (category: SettingCategory, key: string, value: any) => {
    try {
      switch (category) {
        case 'system':
          if (key in system.value) {
            (system.value as any)[key] = value
          }
          break
        case 'notification':
          if (key in notification.value) {
            (notification.value as any)[key] = value
          }
          break
        case 'privacy':
          if (key in privacy.value) {
            (privacy.value as any)[key] = value
          }
          break
      }

      // 更新同步状态
      setSyncStatus(category, key, 'synced')
    } catch (err) {
      console.error(`Failed to update local setting ${category}.${key}:`, err)
    }
  }

  /**
   * 重置本地设置为默认值
   */
  const resetLocalSetting = (category: SettingCategory, key: string) => {
    try {
      const defaults = {
        system: DEFAULT_SYSTEM_SETTINGS,
        notification: DEFAULT_NOTIFICATION_SETTINGS,
        privacy: DEFAULT_PRIVACY_SETTINGS
      }

      const defaultValue = (defaults[category as keyof typeof defaults] as any)[key]
      if (defaultValue !== undefined) {
        updateLocalSetting(category, key, defaultValue)
      }
    } catch (err) {
      console.error(`Failed to reset local setting ${category}.${key}:`, err)
    }
  }

  // =====================================================
  // 生命周期管理
  // =====================================================

  /**
   * 监听用户认证状态变化
   */
  watch(
    () => authStore.user,
    async (newUser, oldUser) => {
      if (newUser && !oldUser) {
        // 用户登录
        await initializeSettings()
        await startRealtimeSubscription()
      } else if (!newUser && oldUser) {
        // 用户登出
        await stopRealtimeSubscription()
        // 重置状态
        system.value = { ...DEFAULT_SYSTEM_SETTINGS }
        notification.value = { ...DEFAULT_NOTIFICATION_SETTINGS }
        privacy.value = { ...DEFAULT_PRIVACY_SETTINGS }
        initialized.value = false
        clearError()
      }
    },
    { immediate: true }
  )

  /**
   * 组件卸载时清理
   */
  onUnmounted(() => {
    stopRealtimeSubscription()
  })

  return {
    // 状态
    system,
    notification,
    privacy,
    loading,
    error,
    initialized,
    syncStatus,
    isSubscribed,

    // 计算属性
    allSettings,
    isLoading,
    hasError,

    // 方法
    getSetting,
    setSetting,
    getSettingsByCategory,
    batchUpdateSettings,
    updateSystemSettings,
    updateNotificationSettings,
    updatePrivacySettings,
    loadAllSettings,
    initializeSettings,
    resetSettings,
    clearError,

    // 实时订阅方法
    startRealtimeSubscription,
    stopRealtimeSubscription
  }
})
