import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import type { AuthState, LoginForm, RegisterForm, AuthError } from '@/types/auth'
import type { User, Session } from '@supabase/supabase-js'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const loading = ref(false)
  const initialized = ref(false)

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
    resetPassword
  }
})