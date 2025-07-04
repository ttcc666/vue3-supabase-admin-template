/**
 * 设置缓存管理工具
 * 提供本地缓存和批量更新优化功能
 */

import type { SettingCategory, SettingItem } from '@/types/settings'

// =====================================================
// 缓存接口定义
// =====================================================

interface CachedSetting {
  category: SettingCategory
  key: string
  value: any
  timestamp: number
  dirty: boolean // 是否需要同步到服务器
}

interface BatchUpdateQueue {
  items: SettingItem[]
  timeout: number | null
  promise: Promise<void> | null
}

// =====================================================
// 缓存管理类
// =====================================================

export class SettingsCache {
  private cache = new Map<string, CachedSetting>()
  private batchQueue: BatchUpdateQueue = {
    items: [],
    timeout: null,
    promise: null
  }
  private readonly BATCH_DELAY = 1000 // 1秒批量延迟
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5分钟缓存过期时间

  /**
   * 生成缓存键
   */
  private getCacheKey(category: SettingCategory, key: string): string {
    return `${category}.${key}`
  }

  /**
   * 设置缓存项
   */
  set(category: SettingCategory, key: string, value: any, dirty = false): void {
    const cacheKey = this.getCacheKey(category, key)
    this.cache.set(cacheKey, {
      category,
      key,
      value,
      timestamp: Date.now(),
      dirty
    })
  }

  /**
   * 获取缓存项
   */
  get(category: SettingCategory, key: string): any | null {
    const cacheKey = this.getCacheKey(category, key)
    const cached = this.cache.get(cacheKey)

    if (!cached) {
      return null
    }

    // 检查是否过期
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(cacheKey)
      return null
    }

    return cached.value
  }

  /**
   * 检查缓存是否存在且有效
   */
  has(category: SettingCategory, key: string): boolean {
    const cacheKey = this.getCacheKey(category, key)
    const cached = this.cache.get(cacheKey)

    if (!cached) {
      return false
    }

    // 检查是否过期
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(cacheKey)
      return false
    }

    return true
  }

  /**
   * 标记缓存项为脏数据（需要同步）
   */
  markDirty(category: SettingCategory, key: string): void {
    const cacheKey = this.getCacheKey(category, key)
    const cached = this.cache.get(cacheKey)

    if (cached) {
      cached.dirty = true
    }
  }

  /**
   * 标记缓存项为已同步
   */
  markClean(category: SettingCategory, key: string): void {
    const cacheKey = this.getCacheKey(category, key)
    const cached = this.cache.get(cacheKey)

    if (cached) {
      cached.dirty = false
    }
  }

  /**
   * 获取所有脏数据
   */
  getDirtyItems(): SettingItem[] {
    const dirtyItems: SettingItem[] = []

    for (const cached of this.cache.values()) {
      if (cached.dirty) {
        dirtyItems.push({
          category: cached.category,
          key: cached.key,
          value: cached.value
        })
      }
    }

    return dirtyItems
  }

  /**
   * 清除指定分类的缓存
   */
  clearCategory(category: SettingCategory): void {
    for (const [key, cached] of this.cache.entries()) {
      if (cached.category === category) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * 清除所有缓存
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * 清除过期缓存
   */
  clearExpired(): void {
    const now = Date.now()
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > this.CACHE_TTL) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * 添加到批量更新队列
   */
  addToBatchQueue(item: SettingItem): Promise<void> {
    // 检查是否已经在队列中
    const existingIndex = this.batchQueue.items.findIndex(
      queueItem => queueItem.category === item.category && queueItem.key === item.key
    )

    if (existingIndex >= 0) {
      // 更新现有项
      this.batchQueue.items[existingIndex] = item
    } else {
      // 添加新项
      this.batchQueue.items.push(item)
    }

    // 标记为脏数据
    this.markDirty(item.category, item.key)

    // 如果已有批量更新在进行，返回现有的 Promise
    if (this.batchQueue.promise) {
      return this.batchQueue.promise
    }

    // 创建新的批量更新 Promise
    this.batchQueue.promise = new Promise((resolve, reject) => {
      // 清除之前的定时器
      if (this.batchQueue.timeout) {
        clearTimeout(this.batchQueue.timeout)
      }

      // 设置新的定时器
      this.batchQueue.timeout = window.setTimeout(async () => {
        try {
          await this.executeBatchUpdate()
          resolve()
        } catch (error) {
          reject(error)
        } finally {
          // 重置队列状态
          this.batchQueue.items = []
          this.batchQueue.timeout = null
          this.batchQueue.promise = null
        }
      }, this.BATCH_DELAY)
    })

    return this.batchQueue.promise
  }

  /**
   * 执行批量更新（需要外部提供更新函数）
   */
  private async executeBatchUpdate(): Promise<void> {
    // 这个方法需要在 store 中被重写或通过回调函数提供
    throw new Error('executeBatchUpdate must be implemented by the store')
  }

  /**
   * 设置批量更新执行器
   */
  setBatchUpdateExecutor(executor: (items: SettingItem[]) => Promise<void>): void {
    this.executeBatchUpdate = async () => {
      if (this.batchQueue.items.length > 0) {
        await executor([...this.batchQueue.items])
        
        // 标记所有项为已同步
        for (const item of this.batchQueue.items) {
          this.markClean(item.category, item.key)
        }
      }
    }
  }

  /**
   * 立即执行批量更新
   */
  async flushBatchQueue(): Promise<void> {
    if (this.batchQueue.timeout) {
      clearTimeout(this.batchQueue.timeout)
      this.batchQueue.timeout = null
    }

    if (this.batchQueue.promise) {
      await this.batchQueue.promise
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): {
    totalItems: number
    dirtyItems: number
    expiredItems: number
    queuedItems: number
  } {
    const now = Date.now()
    let dirtyCount = 0
    let expiredCount = 0

    for (const cached of this.cache.values()) {
      if (cached.dirty) {
        dirtyCount++
      }
      if (now - cached.timestamp > this.CACHE_TTL) {
        expiredCount++
      }
    }

    return {
      totalItems: this.cache.size,
      dirtyItems: dirtyCount,
      expiredItems: expiredCount,
      queuedItems: this.batchQueue.items.length
    }
  }

  /**
   * 预加载设置到缓存
   */
  preload(settings: Record<SettingCategory, Record<string, any>>): void {
    for (const [category, categorySettings] of Object.entries(settings)) {
      for (const [key, value] of Object.entries(categorySettings)) {
        this.set(category as SettingCategory, key, value, false)
      }
    }
  }
}

// =====================================================
// 单例实例
// =====================================================

export const settingsCache = new SettingsCache()
