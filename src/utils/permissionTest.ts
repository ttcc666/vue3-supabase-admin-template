/**
 * 权限控制测试工具
 * 验证 RLS 策略确保用户只能访问自己的设置
 */

import { supabase } from '@/lib/supabase'
import type { SettingCategory } from '@/types/settings'

// =====================================================
// 测试结果接口
// =====================================================

interface PermissionTestResult {
  testName: string
  success: boolean
  message: string
  details?: any
}

interface PermissionTestSuite {
  totalTests: number
  passedTests: number
  failedTests: number
  results: PermissionTestResult[]
}

// =====================================================
// 权限测试类
// =====================================================

export class PermissionTester {
  private results: PermissionTestResult[] = []

  /**
   * 运行完整的权限测试套件
   */
  async runFullTestSuite(): Promise<PermissionTestSuite> {
    console.log('🔒 Starting permission control tests...')
    this.results = []

    // 1. 测试基础认证
    await this.testAuthentication()

    // 2. 测试 RLS 策略
    await this.testRLSPolicies()

    // 3. 测试数据隔离
    await this.testDataIsolation()

    // 4. 测试函数权限
    await this.testFunctionPermissions()

    // 5. 测试恶意访问防护
    await this.testMaliciousAccessPrevention()

    return this.generateReport()
  }

  /**
   * 测试基础认证
   */
  private async testAuthentication(): Promise<void> {
    try {
      // 检查当前用户认证状态
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error) {
        this.addResult('Authentication Check', false, `Authentication error: ${error.message}`)
        return
      }

      if (!user) {
        this.addResult('Authentication Check', false, 'No authenticated user found')
        return
      }

      this.addResult('Authentication Check', true, `User authenticated: ${user.id}`)

      // 检查会话有效性
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        this.addResult('Session Check', false, `Session error: ${sessionError.message}`)
        return
      }

      if (!session) {
        this.addResult('Session Check', false, 'No active session found')
        return
      }

      this.addResult('Session Check', true, 'Valid session found')

    } catch (error) {
      this.addResult('Authentication Check', false, `Unexpected error: ${error}`)
    }
  }

  /**
   * 测试 RLS 策略
   */
  private async testRLSPolicies(): Promise<void> {
    try {
      // 测试查看权限 - 应该只能看到自己的设置
      const { data: ownSettings, error: selectError } = await supabase
        .from('user_settings')
        .select('*')

      if (selectError) {
        this.addResult('RLS Select Policy', false, `Select error: ${selectError.message}`)
      } else {
        const { data: { user } } = await supabase.auth.getUser()
        const allBelongToUser = ownSettings?.every(setting => setting.user_id === user?.id)
        
        if (allBelongToUser) {
          this.addResult('RLS Select Policy', true, `Can only view own settings (${ownSettings?.length || 0} records)`)
        } else {
          this.addResult('RLS Select Policy', false, 'Can view settings from other users')
        }
      }

      // 测试插入权限 - 应该只能为自己插入设置
      const testSetting = {
        category: 'system' as SettingCategory,
        setting_key: 'rls_test_insert',
        setting_value: { test: true }
      }

      const { error: insertError } = await supabase
        .from('user_settings')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          ...testSetting
        })

      if (insertError) {
        this.addResult('RLS Insert Policy', false, `Insert error: ${insertError.message}`)
      } else {
        this.addResult('RLS Insert Policy', true, 'Can insert own settings')
        
        // 清理测试数据
        await supabase
          .from('user_settings')
          .delete()
          .eq('setting_key', 'rls_test_insert')
      }

      // 测试更新权限 - 应该只能更新自己的设置
      const { data: existingSettings } = await supabase
        .from('user_settings')
        .select('id')
        .limit(1)

      if (existingSettings && existingSettings.length > 0) {
        const { error: updateError } = await supabase
          .from('user_settings')
          .update({ setting_value: { updated: true } })
          .eq('id', existingSettings[0].id)

        if (updateError) {
          this.addResult('RLS Update Policy', false, `Update error: ${updateError.message}`)
        } else {
          this.addResult('RLS Update Policy', true, 'Can update own settings')
        }
      }

    } catch (error) {
      this.addResult('RLS Policies', false, `Unexpected error: ${error}`)
    }
  }

  /**
   * 测试数据隔离
   */
  private async testDataIsolation(): Promise<void> {
    try {
      // 尝试直接查询其他用户的数据（应该失败或返回空）
      const { data: allSettings, error } = await supabase
        .from('user_settings')
        .select('user_id')

      if (error) {
        this.addResult('Data Isolation', false, `Query error: ${error.message}`)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      const currentUserId = user?.id

      // 检查是否只能看到自己的数据
      const uniqueUserIds = new Set(allSettings?.map(s => s.user_id) || [])
      
      if (uniqueUserIds.size === 1 && uniqueUserIds.has(currentUserId)) {
        this.addResult('Data Isolation', true, 'Can only access own data')
      } else if (uniqueUserIds.size === 0) {
        this.addResult('Data Isolation', true, 'No data accessible (empty result)')
      } else {
        this.addResult('Data Isolation', false, `Can access data from ${uniqueUserIds.size} users`, {
          userIds: Array.from(uniqueUserIds)
        })
      }

    } catch (error) {
      this.addResult('Data Isolation', false, `Unexpected error: ${error}`)
    }
  }

  /**
   * 测试函数权限
   */
  private async testFunctionPermissions(): Promise<void> {
    try {
      // 测试 get_user_setting 函数
      const { data, error: getError } = await supabase
        .rpc('get_user_setting', {
          p_category: 'system',
          p_setting_key: 'language',
          p_default_value: 'zh-CN'
        })

      if (getError) {
        this.addResult('Function Permission - get_user_setting', false, `Function error: ${getError.message}`)
      } else {
        this.addResult('Function Permission - get_user_setting', true, 'Can call get_user_setting function')
      }

      // 测试 set_user_setting 函数
      const { error: setError } = await supabase
        .rpc('set_user_setting', {
          p_category: 'system',
          p_setting_key: 'permission_test',
          p_setting_value: 'test_value'
        })

      if (setError) {
        this.addResult('Function Permission - set_user_setting', false, `Function error: ${setError.message}`)
      } else {
        this.addResult('Function Permission - set_user_setting', true, 'Can call set_user_setting function')
        
        // 清理测试数据
        await supabase
          .from('user_settings')
          .delete()
          .eq('setting_key', 'permission_test')
      }

      // 测试 get_user_settings_by_category 函数
      const { data: categoryData, error: categoryError } = await supabase
        .rpc('get_user_settings_by_category', {
          p_category: 'system'
        })

      if (categoryError) {
        this.addResult('Function Permission - get_user_settings_by_category', false, `Function error: ${categoryError.message}`)
      } else {
        this.addResult('Function Permission - get_user_settings_by_category', true, `Can call get_user_settings_by_category function (${categoryData?.length || 0} results)`)
      }

    } catch (error) {
      this.addResult('Function Permissions', false, `Unexpected error: ${error}`)
    }
  }

  /**
   * 测试恶意访问防护
   */
  private async testMaliciousAccessPrevention(): Promise<void> {
    try {
      // 尝试 SQL 注入攻击
      const maliciousInputs = [
        "'; DROP TABLE user_settings; --",
        "1' OR '1'='1",
        "admin'; --",
        "<script>alert('xss')</script>",
        "../../etc/passwd"
      ]

      let allBlocked = true
      const blockedInputs: string[] = []
      const allowedInputs: string[] = []

      for (const input of maliciousInputs) {
        try {
          const { error } = await supabase
            .rpc('set_user_setting', {
              p_category: 'system',
              p_setting_key: 'malicious_test',
              p_setting_value: input
            })

          if (error) {
            blockedInputs.push(input)
          } else {
            allowedInputs.push(input)
            allBlocked = false
            
            // 清理可能插入的恶意数据
            await supabase
              .from('user_settings')
              .delete()
              .eq('setting_key', 'malicious_test')
          }
        } catch (err) {
          blockedInputs.push(input)
        }
      }

      if (allBlocked) {
        this.addResult('Malicious Access Prevention', true, 'All malicious inputs blocked')
      } else {
        this.addResult('Malicious Access Prevention', false, `Some malicious inputs allowed`, {
          blocked: blockedInputs.length,
          allowed: allowedInputs.length,
          allowedInputs
        })
      }

      // 测试无效的分类值
      const { error: invalidCategoryError } = await supabase
        .rpc('set_user_setting', {
          p_category: 'invalid_category' as any,
          p_setting_key: 'test',
          p_setting_value: 'test'
        })

      if (invalidCategoryError) {
        this.addResult('Invalid Category Prevention', true, 'Invalid category rejected')
      } else {
        this.addResult('Invalid Category Prevention', false, 'Invalid category accepted')
      }

    } catch (error) {
      this.addResult('Malicious Access Prevention', false, `Unexpected error: ${error}`)
    }
  }

  /**
   * 添加测试结果
   */
  private addResult(testName: string, success: boolean, message: string, details?: any): void {
    this.results.push({
      testName,
      success,
      message,
      details
    })

    const status = success ? '✅' : '❌'
    console.log(`${status} ${testName}: ${message}`, details || '')
  }

  /**
   * 生成测试报告
   */
  private generateReport(): PermissionTestSuite {
    const totalTests = this.results.length
    const passedTests = this.results.filter(r => r.success).length
    const failedTests = totalTests - passedTests

    const report: PermissionTestSuite = {
      totalTests,
      passedTests,
      failedTests,
      results: this.results
    }

    console.log('🔒 Permission Test Report:', report)
    return report
  }
}

// =====================================================
// 导出便捷函数
// =====================================================

/**
 * 快速运行权限测试
 */
export async function runPermissionTest(): Promise<PermissionTestSuite> {
  const tester = new PermissionTester()
  return await tester.runFullTestSuite()
}

/**
 * 在浏览器控制台中运行权限测试
 */
export function runPermissionTestInConsole(): void {
  if (typeof window !== 'undefined') {
    (window as any).runPermissionTest = runPermissionTest
    console.log('💡 Run permission test with: runPermissionTest()')
  }
}
