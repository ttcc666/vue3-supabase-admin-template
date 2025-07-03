import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import type { AuthState, LoginForm, RegisterForm, AuthError } from '@/types/auth'
import type { PasswordChangeData, PasswordChangeResult } from '@/types/profile'
import type { User, Session } from '@supabase/supabase-js'
import { ActivityType } from '@/types/activities'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const loading = ref(false)
  const initialized = ref(false)

  // 记录活动的辅助函数
  const logActivity = async (activityData: {
    activity_type: ActivityType
    activity_title: string
    activity_description: string
    metadata?: Record<string, any>
  }) => {
    try {
      const { data, error } = await supabase
        .rpc('log_user_activity', {
          p_user_id: user.value?.id || null,
          p_activity_type: activityData.activity_type,
          p_activity_title: activityData.activity_title,
          p_activity_description: activityData.activity_description,
          p_ip_address: null, // 客户端无法获取真实IP
          p_user_agent: navigator.userAgent,
          p_metadata: activityData.metadata || {}
        })

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error('Failed to log activity:', error)
      throw error
    }
  }

  // 计算属性
  const isAuthenticated = computed(() => !!user.value)
  const userEmail = computed(() => user.value?.email || '')

  // 初始化认证状态
  const initialize = async () => {
    try {
      loading.value = true
      
      // 获取当前会话
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      
      if (currentSession) {
        session.value = currentSession
        user.value = currentSession.user
      }

      // 监听认证状态变化
      supabase.auth.onAuthStateChange((event, newSession) => {
        session.value = newSession
        user.value = newSession?.user || null
        
        console.log('Auth state changed:', event, newSession?.user?.email)
      })

      initialized.value = true
    } catch (error) {
      console.error('Failed to initialize auth:', error)
    } finally {
      loading.value = false
    }
  }

  // 用户注册
  const signUp = async (formData: RegisterForm): Promise<{ success: boolean; error?: AuthError }> => {
    try {
      loading.value = true
      
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })

      if (error) {
        return { success: false, error: { message: error.message } }
      }

      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: { message: error instanceof Error ? error.message : 'Registration failed' }
      }
    } finally {
      loading.value = false
    }
  }

  // 用户登录
  const signIn = async (formData: LoginForm): Promise<{ success: boolean; error?: AuthError }> => {
    try {
      loading.value = true

      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (error) {
        return { success: false, error: { message: error.message } }
      }

      // 手动更新认证状态
      if (data.session && data.user) {
        session.value = data.session
        user.value = data.user

        // 记录登录活动
        try {
          await logActivity({
            activity_type: ActivityType.LOGIN,
            activity_title: '用户登录',
            activity_description: '通过邮箱和密码成功登录系统',
            metadata: {
              login_method: 'email_password',
              user_agent: navigator.userAgent,
              timestamp: new Date().toISOString()
            }
          })
        } catch (activityError) {
          console.error('Failed to log login activity:', activityError)
          // 不影响登录流程
        }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: { message: error instanceof Error ? error.message : 'Login failed' }
      }
    } finally {
      loading.value = false
    }
  }

  // 用户登出
  const signOut = async (): Promise<{ success: boolean; error?: AuthError }> => {
    try {
      loading.value = true

      // 在登出前记录活动（因为登出后就没有用户信息了）
      if (user.value) {
        try {
          await logActivity({
            activity_type: ActivityType.LOGOUT,
            activity_title: '用户登出',
            activity_description: '用户主动退出登录',
            metadata: {
              logout_method: 'manual',
              user_agent: navigator.userAgent,
              timestamp: new Date().toISOString()
            }
          })
        } catch (activityError) {
          console.error('Failed to log logout activity:', activityError)
          // 不影响登出流程
        }
      }

      const { error } = await supabase.auth.signOut()

      if (error) {
        return { success: false, error: { message: error.message } }
      }

      // 清除本地状态
      user.value = null
      session.value = null

      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: { message: error instanceof Error ? error.message : 'Logout failed' }
      }
    } finally {
      loading.value = false
    }
  }

  // 发送密码重置邮件
  const resetPassword = async (email: string): Promise<{ success: boolean; error?: AuthError }> => {
    try {
      loading.value = true

      const { error } = await supabase.auth.resetPasswordForEmail(email)

      if (error) {
        return { success: false, error: { message: error.message } }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: { message: error instanceof Error ? error.message : 'Password reset failed' }
      }
    } finally {
      loading.value = false
    }
  }

  // 修改密码
  const changePassword = async (passwordData: PasswordChangeData): Promise<PasswordChangeResult> => {
    try {
      loading.value = true

      // 验证新密码和确认密码是否一致
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        return {
          success: false,
          error: '新密码和确认密码不一致'
        }
      }

      // 先验证当前密码
      const isCurrentPasswordValid = await verifyCurrentPassword(passwordData.currentPassword)
      if (!isCurrentPasswordValid) {
        return {
          success: false,
          error: '当前密码不正确'
        }
      }

      // 使用 Supabase 的 updateUser 方法更新密码
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })

      if (error) {
        return {
          success: false,
          error: error.message || '密码修改失败'
        }
      }

      return {
        success: true,
        message: '密码修改成功'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '密码修改失败'
      }
    } finally {
      loading.value = false
    }
  }

  // 验证当前密码（通过重新登录验证）
  const verifyCurrentPassword = async (currentPassword: string): Promise<boolean> => {
    if (!user.value?.email) {
      return false
    }

    try {
      // 使用 signInWithPassword 来验证当前密码
      // 这会更新当前会话，但这是预期的行为
      const { error } = await supabase.auth.signInWithPassword({
        email: user.value.email,
        password: currentPassword
      })

      return !error
    } catch (error) {
      // 静默处理验证错误，不抛出异常
      console.error('Password verification failed:', error)
      return false
    }
  }

  return {
    // 状态
    user,
    session,
    loading,
    initialized,

    // 计算属性
    isAuthenticated,
    userEmail,

    // 方法
    initialize,
    signUp,
    signIn,
    signOut,
    resetPassword,
    changePassword,
    verifyCurrentPassword
  }
})