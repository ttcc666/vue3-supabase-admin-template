import type { User, Session } from '@supabase/supabase-js'

// 认证状态接口
export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  initialized: boolean
}

// 登录表单数据接口
export interface LoginForm {
  email: string
  password: string
}

// 注册表单数据接口
export interface RegisterForm {
  email: string
  password: string
  confirmPassword: string
}

// 用户配置文件接口
export interface UserProfile {
  id: string
  email: string
  username?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

// 认证错误接口
export interface AuthError {
  message: string
  status?: number
}