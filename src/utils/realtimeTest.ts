/**
 * 实时同步功能测试工具
 * 用于验证设置在不同设备/会话之间的实时同步
 */

import { supabase } from '@/lib/supabase'
import type { SettingCategory } from '@/types/settings'

// =====================================================
// 测试配置
// =====================================================

interface TestConfig {
  testDuration: number // 测试持续时间（毫秒）
  updateInterval: number // 更新间隔（毫秒）
  categories: SettingCategory[] // 要测试的设置分类
}

const DEFAULT_TEST_CONFIG: TestConfig = {
  testDuration: 30000, // 30秒
  updateInterval: 2000, // 2秒
  categories: ['system', 'notification', 'privacy']
}

// =====================================================
// 测试结果接口
// =====================================================

interface TestResult {
  success: boolean
  message: string
  details?: any
}

interface SyncTestResult {
  totalTests: number
  successfulTests: number
  failedTests: number
  averageLatency: number
  results: TestResult[]
}

// =====================================================
// 实时同步测试类
// =====================================================

export class RealtimeSyncTester {
  private config: TestConfig
  private testResults: TestResult[] = []
  private startTime: number = 0
  private isRunning: boolean = false

  constructor(config: Partial<TestConfig> = {}) {
    this.config = { ...DEFAULT_TEST_CONFIG, ...config }
  }

  /**
   * 开始实时同步测试
   */
  async startTest(): Promise<SyncTestResult> {
    if (this.isRunning) {
      throw new Error('Test is already running')
    }

    console.log('🚀 Starting realtime sync test...')
    this.isRunning = true
    this.testResults = []
    this.startTime = Date.now()

    try {
      // 1. 测试基础连接
      await this.testBasicConnection()

      // 2. 测试实时订阅
      await this.testRealtimeSubscription()

      // 3. 测试数据同步
      await this.testDataSync()

      // 4. 测试并发更新
      await this.testConcurrentUpdates()

      // 5. 测试网络恢复
      await this.testNetworkRecovery()

    } catch (error) {
      this.addTestResult(false, `Test failed: ${error}`)
    } finally {
      this.isRunning = false
    }

    return this.generateReport()
  }

  /**
   * 测试基础连接
   */
  private async testBasicConnection(): Promise<void> {
    try {
      const { data, error } = await supabase.auth.getUser()
      
      if (error || !data.user) {
        throw new Error('User not authenticated')
      }

      this.addTestResult(true, 'Basic connection test passed')
    } catch (error) {
      this.addTestResult(false, `Basic connection test failed: ${error}`)
    }
  }

  /**
   * 测试实时订阅
   */
  private async testRealtimeSubscription(): Promise<void> {
    return new Promise((resolve) => {
      let subscriptionEstablished = false
      let timeout: NodeJS.Timeout

      const channel = supabase
        .channel('test-channel')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_settings'
          },
          () => {
            if (!subscriptionEstablished) {
              subscriptionEstablished = true
              clearTimeout(timeout)
              this.addTestResult(true, 'Realtime subscription established')
              supabase.removeChannel(channel)
              resolve()
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            // 触发一个测试更新来验证订阅
            this.triggerTestUpdate()
          }
        })

      // 10秒超时
      timeout = setTimeout(() => {
        if (!subscriptionEstablished) {
          this.addTestResult(false, 'Realtime subscription timeout')
          supabase.removeChannel(channel)
          resolve()
        }
      }, 10000)
    })
  }

  /**
   * 测试数据同步
   */
  private async testDataSync(): Promise<void> {
    const testData = [
      { category: 'system' as SettingCategory, key: 'test_sync_1', value: 'value1' },
      { category: 'notification' as SettingCategory, key: 'test_sync_2', value: true },
      { category: 'privacy' as SettingCategory, key: 'test_sync_3', value: 'private' }
    ]

    for (const item of testData) {
      try {
        const startTime = Date.now()

        // 写入数据
        const { error } = await supabase
          .rpc('set_user_setting', {
            p_category: item.category,
            p_setting_key: item.key,
            p_setting_value: item.value
          })

        if (error) {
          throw error
        }

        // 验证数据
        const { data, error: readError } = await supabase
          .rpc('get_user_setting', {
            p_category: item.category,
            p_setting_key: item.key
          })

        if (readError) {
          throw readError
        }

        const latency = Date.now() - startTime

        if (JSON.stringify(data) === JSON.stringify(item.value)) {
          this.addTestResult(true, `Data sync test passed for ${item.category}.${item.key}`, { latency })
        } else {
          this.addTestResult(false, `Data sync test failed for ${item.category}.${item.key}`, { 
            expected: item.value, 
            actual: data 
          })
        }

      } catch (error) {
        this.addTestResult(false, `Data sync test error for ${item.category}.${item.key}: ${error}`)
      }
    }
  }

  /**
   * 测试并发更新
   */
  private async testConcurrentUpdates(): Promise<void> {
    const concurrentUpdates = Array.from({ length: 5 }, (_, i) => ({
      category: 'system' as SettingCategory,
      key: `concurrent_test_${i}`,
      value: `value_${i}_${Date.now()}`
    }))

    try {
      const startTime = Date.now()

      // 并发执行更新
      const promises = concurrentUpdates.map(item =>
        supabase.rpc('set_user_setting', {
          p_category: item.category,
          p_setting_key: item.key,
          p_setting_value: item.value
        })
      )

      const results = await Promise.allSettled(promises)
      const latency = Date.now() - startTime

      const successCount = results.filter(r => r.status === 'fulfilled').length
      const failureCount = results.filter(r => r.status === 'rejected').length

      if (failureCount === 0) {
        this.addTestResult(true, `Concurrent updates test passed (${successCount}/${concurrentUpdates.length})`, { latency })
      } else {
        this.addTestResult(false, `Concurrent updates test failed (${successCount}/${concurrentUpdates.length})`, { 
          failures: results.filter(r => r.status === 'rejected').map(r => (r as PromiseRejectedResult).reason)
        })
      }

    } catch (error) {
      this.addTestResult(false, `Concurrent updates test error: ${error}`)
    }
  }

  /**
   * 测试网络恢复
   */
  private async testNetworkRecovery(): Promise<void> {
    // 这个测试需要手动模拟网络中断，这里只做基础检查
    try {
      // 检查连接状态
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        throw error
      }

      if (data.session) {
        this.addTestResult(true, 'Network recovery test - connection stable')
      } else {
        this.addTestResult(false, 'Network recovery test - no active session')
      }

    } catch (error) {
      this.addTestResult(false, `Network recovery test error: ${error}`)
    }
  }

  /**
   * 触发测试更新
   */
  private async triggerTestUpdate(): Promise<void> {
    try {
      await supabase.rpc('set_user_setting', {
        p_category: 'system',
        p_setting_key: 'test_trigger',
        p_setting_value: Date.now()
      })
    } catch (error) {
      console.error('Failed to trigger test update:', error)
    }
  }

  /**
   * 添加测试结果
   */
  private addTestResult(success: boolean, message: string, details?: any): void {
    this.testResults.push({
      success,
      message,
      details
    })

    const status = success ? '✅' : '❌'
    console.log(`${status} ${message}`, details || '')
  }

  /**
   * 生成测试报告
   */
  private generateReport(): SyncTestResult {
    const totalTests = this.testResults.length
    const successfulTests = this.testResults.filter(r => r.success).length
    const failedTests = totalTests - successfulTests

    // 计算平均延迟
    const latencies = this.testResults
      .filter(r => r.details?.latency)
      .map(r => r.details.latency)
    
    const averageLatency = latencies.length > 0 
      ? latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length 
      : 0

    const report: SyncTestResult = {
      totalTests,
      successfulTests,
      failedTests,
      averageLatency,
      results: this.testResults
    }

    console.log('📊 Test Report:', report)
    return report
  }

  /**
   * 停止测试
   */
  stopTest(): void {
    this.isRunning = false
  }
}

// =====================================================
// 导出便捷函数
// =====================================================

/**
 * 快速运行实时同步测试
 */
export async function runRealtimeSyncTest(config?: Partial<TestConfig>): Promise<SyncTestResult> {
  const tester = new RealtimeSyncTester(config)
  return await tester.startTest()
}

/**
 * 在浏览器控制台中运行测试
 */
export function runTestInConsole(): void {
  if (typeof window !== 'undefined') {
    (window as any).runRealtimeSyncTest = runRealtimeSyncTest
    console.log('💡 Run realtime sync test with: runRealtimeSyncTest()')
  }
}
