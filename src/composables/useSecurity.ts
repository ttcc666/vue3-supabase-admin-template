import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import type { SecuritySettings, LoginHistoryItem } from '@/types/profile'

/**
 * 账户安全管理 Composable
 */
export function useSecurity() {
  const authStore = useAuthStore()
  
  // 状态
  const loading = ref(false)
  const loginHistory = ref<LoginHistoryItem[]>([])
  
  // 计算属性
  const securitySettings = computed<SecuritySettings>(() => {
    const user = authStore.user
    
    return {
      emailVerified: !!user?.email_confirmed_at,
      phoneVerified: !!user?.phone_confirmed_at,
      lastPasswordChange: user?.updated_at,
      loginHistory: loginHistory.value
    }
  })
  
  // 邮箱验证状态
  const emailVerificationStatus = computed(() => {
    if (securitySettings.value.emailVerified) {
      return {
        color: 'green',
        text: '已验证',
        description: '已验证的邮箱可以用于找回密码'
      }
    } else {
      return {
        color: 'orange',
        text: '待验证',
        description: '请验证您的邮箱以提高账户安全性'
      }
    }
  })
  
  // 账户安全评分
  const securityScore = computed(() => {
    let score = 0
    
    // 邮箱验证 +30分
    if (securitySettings.value.emailVerified) {
      score += 30
    }
    
    // 手机验证 +20分
    if (securitySettings.value.phoneVerified) {
      score += 20
    }
    
    // 最近修改过密码 +25分
    if (securitySettings.value.lastPasswordChange) {
      const lastChange = new Date(securitySettings.value.lastPasswordChange)
      const now = new Date()
      const daysSinceChange = (now.getTime() - lastChange.getTime()) / (1000 * 60 * 60 * 24)
      
      if (daysSinceChange <= 90) { // 90天内修改过密码
        score += 25
      } else if (daysSinceChange <= 180) { // 180天内修改过密码
        score += 15
      }
    }
    
    // 有登录历史记录 +25分
    if (loginHistory.value.length > 0) {
      score += 25
    }
    
    return Math.min(100, score)
  })
  
  // 安全等级
  const securityLevel = computed(() => {
    const score = securityScore.value
    
    if (score >= 80) {
      return { level: 'high', text: '高', color: '#52c41a' }
    } else if (score >= 60) {
      return { level: 'medium', text: '中等', color: '#faad14' }
    } else {
      return { level: 'low', text: '低', color: '#ff4d4f' }
    }
  })
  
  // 安全建议
  const securityRecommendations = computed(() => {
    const recommendations: string[] = []
    
    if (!securitySettings.value.emailVerified) {
      recommendations.push('验证您的邮箱地址')
    }
    
    if (!securitySettings.value.phoneVerified) {
      recommendations.push('绑定并验证手机号码')
    }
    
    if (securitySettings.value.lastPasswordChange) {
      const lastChange = new Date(securitySettings.value.lastPasswordChange)
      const now = new Date()
      const daysSinceChange = (now.getTime() - lastChange.getTime()) / (1000 * 60 * 60 * 24)
      
      if (daysSinceChange > 90) {
        recommendations.push('定期更换密码（建议每90天更换一次）')
      }
    } else {
      recommendations.push('设置一个强密码')
    }
    
    return recommendations
  })
  
  // 方法
  
  /**
   * 获取登录历史
   */
  const fetchLoginHistory = async () => {
    try {
      loading.value = true
      
      // 这里应该调用实际的API获取登录历史
      // 目前使用模拟数据
      const mockHistory: LoginHistoryItem[] = [
        {
          id: '1',
          timestamp: new Date().toISOString(),
          ipAddress: '192.168.1.100',
          userAgent: 'Chrome 120.0.0.0',
          location: '北京, 中国',
          success: true
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          ipAddress: '192.168.1.100',
          userAgent: 'Chrome 120.0.0.0',
          location: '北京, 中国',
          success: true
        }
      ]
      
      loginHistory.value = mockHistory
    } catch (error) {
      console.error('Failed to fetch login history:', error)
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 发送邮箱验证
   */
  const sendEmailVerification = async () => {
    try {
      loading.value = true
      
      // 这里应该调用 Supabase 的邮箱验证API
      // const { error } = await supabase.auth.resend({
      //   type: 'signup',
      //   email: authStore.user?.email
      // })
      
      return { success: true, message: '验证邮件已发送' }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '发送验证邮件失败' 
      }
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 格式化登录时间
   */
  const formatLoginTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (minutes < 60) {
      return `${minutes}分钟前`
    } else if (hours < 24) {
      return `${hours}小时前`
    } else if (days < 7) {
      return `${days}天前`
    } else {
      return date.toLocaleDateString('zh-CN')
    }
  }
  
  /**
   * 获取设备信息
   */
  const getDeviceInfo = (userAgent: string) => {
    if (userAgent.includes('Chrome')) {
      return { browser: 'Chrome', icon: '🌐' }
    } else if (userAgent.includes('Firefox')) {
      return { browser: 'Firefox', icon: '🦊' }
    } else if (userAgent.includes('Safari')) {
      return { browser: 'Safari', icon: '🧭' }
    } else if (userAgent.includes('Edge')) {
      return { browser: 'Edge', icon: '🔷' }
    } else {
      return { browser: '未知浏览器', icon: '❓' }
    }
  }
  
  return {
    // 状态
    loading,
    loginHistory,
    
    // 计算属性
    securitySettings,
    emailVerificationStatus,
    securityScore,
    securityLevel,
    securityRecommendations,
    
    // 方法
    fetchLoginHistory,
    sendEmailVerification,
    formatLoginTime,
    getDeviceInfo
  }
}
