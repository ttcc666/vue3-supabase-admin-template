<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <h1 class="auth-title">{{ appTitle }}</h1>
        <p class="auth-subtitle">登录您的账户</p>
      </div>

      <a-tabs v-model:activeKey="activeTab" centered @change="handleTabChange">
        <a-tab-pane key="login" tab="登录">
          <a-form
            :model="loginForm"
            layout="vertical"
            class="auth-form"
            @finish="handleLogin"
          >
            <a-form-item
              name="email"
              :rules="[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]"
            >
              <a-input
                v-model:value="loginForm.email"
                :prefix="h(MailOutlined)"
                placeholder="邮箱"
                size="large"
              />
            </a-form-item>

            <a-form-item
              name="password"
              :rules="[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6位' }
              ]"
            >
              <a-input-password
                v-model:value="loginForm.password"
                :prefix="h(LockOutlined)"
                placeholder="密码"
                size="large"
              />
            </a-form-item>

            <a-form-item>
              <a-button
                type="primary"
                html-type="submit"
                size="large"
                block
                :loading="authStore.loading"
              >
                登 录
              </a-button>
            </a-form-item>

            <a-form-item>
              <a-button
                type="link"
                block
                @click="handleForgotPassword"
              >
                忘记密码？
              </a-button>
            </a-form-item>
          </a-form>
        </a-tab-pane>

        <a-tab-pane key="register" tab="注册">
          <a-form
            :model="registerForm"
            layout="vertical"
            class="auth-form"
            @finish="handleRegister"
          >
            <a-form-item
              name="email"
              :rules="[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]"
            >
              <a-input
                v-model:value="registerForm.email"
                :prefix="h(MailOutlined)"
                placeholder="邮箱"
                size="large"
              />
            </a-form-item>

            <a-form-item
              name="password"
              :rules="[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6位' }
              ]"
            >
              <a-input-password
                v-model:value="registerForm.password"
                :prefix="h(LockOutlined)"
                placeholder="密码"
                size="large"
              />
            </a-form-item>

            <a-form-item
              name="confirmPassword"
              :rules="[
                { required: true, message: '请确认密码' },
                { validator: validateConfirmPassword }
              ]"
            >
              <a-input-password
                v-model:value="registerForm.confirmPassword"
                :prefix="h(LockOutlined)"
                placeholder="确认密码"
                size="large"
              />
            </a-form-item>

            <a-form-item>
              <a-button
                type="primary"
                html-type="submit"
                size="large"
                block
                :loading="authStore.loading"
              >
                注 册
              </a-button>
            </a-form-item>
          </a-form>
        </a-tab-pane>

        <a-tab-pane key="reset" tab="重置密码">
          <a-form
            :model="resetForm"
            layout="vertical"
            class="auth-form"
            @finish="handleResetPassword"
          >
            <a-form-item
              name="email"
              :rules="[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]"
            >
              <a-input
                v-model:value="resetForm.email"
                :prefix="h(MailOutlined)"
                placeholder="邮箱"
                size="large"
              />
            </a-form-item>

            <a-form-item>
              <a-button
                type="primary"
                html-type="submit"
                size="large"
                block
                :loading="authStore.loading"
              >
                发送重置邮件
              </a-button>
            </a-form-item>

            <div class="reset-tip">
              我们将向您的邮箱发送密码重置链接
            </div>
          </a-form>
        </a-tab-pane>
      </a-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, h } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { MailOutlined, LockOutlined } from '@ant-design/icons-vue'
import { useAuthStore } from '@/stores/auth'
import type { LoginForm, RegisterForm } from '@/types/auth'

// 重置密码表单接口
interface ResetPasswordForm {
  email: string
}

const router = useRouter()
const authStore = useAuthStore()

// 应用标题
const appTitle = import.meta.env.VITE_APP_TITLE || 'Supabase Web App'

// 当前激活的标签页
const activeTab = ref('login')

// 表单数据
const loginForm = reactive<LoginForm>({
  email: '',
  password: ''
})

const registerForm = reactive<RegisterForm>({
  email: '',
  password: '',
  confirmPassword: ''
})

const resetForm = reactive<ResetPasswordForm>({
  email: ''
})

// 确认密码验证
const validateConfirmPassword = (_rule: any, value: string) => {
  if (value && value !== registerForm.password) {
    return Promise.reject('两次输入的密码不一致')
  }
  return Promise.resolve()
}

// 处理标签页切换
const handleTabChange = (key: string) => {
  // 清空表单
  Object.assign(loginForm, { email: '', password: '' })
  Object.assign(registerForm, { email: '', password: '', confirmPassword: '' })
  Object.assign(resetForm, { email: '' })
}

// 处理登录
const handleLogin = async () => {
  try {
    const result = await authStore.signIn(loginForm)
    
    if (result.success) {
      message.success('登录成功！')
      // 等待认证状态更新后跳转
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // 检查认证状态并跳转
      if (authStore.isAuthenticated) {
        await router.push('/')
      }
    } else {
      message.error(result.error?.message || '登录失败')
    }
  } catch (error) {
    console.error('Login error:', error)
    message.error('登录过程中发生错误')
  }
}

// 处理注册
const handleRegister = async () => {
  const result = await authStore.signUp(registerForm)
  
  if (result.success) {
    message.success('注册成功！请检查您的邮箱进行验证。')
    activeTab.value = 'login'
  } else {
    message.error(result.error?.message || '注册失败')
  }
}

// 处理密码重置
const handleResetPassword = async () => {
  const result = await authStore.resetPassword(resetForm.email)
  
  if (result.success) {
    message.success('重置邮件已发送！请检查您的邮箱。')
  } else {
    message.error(result.error?.message || '发送重置邮件失败')
  }
}

// 处理忘记密码
const handleForgotPassword = () => {
  activeTab.value = 'reset'
}
</script>

<style scoped>
.auth-container {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  margin: 0;
  box-sizing: border-box;
}

.auth-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 40px;
  width: 100%;
  max-width: 400px;
}

.auth-header {
  text-align: center;
  margin-bottom: 32px;
}

.auth-title {
  font-size: 28px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
}

.auth-subtitle {
  color: #6b7280;
  font-size: 16px;
  margin: 0;
}

.auth-form {
  margin-top: 24px;
}

.auth-links {
  text-align: center;
  margin-top: 16px;
}

.reset-tip {
  color: #6b7280;
  font-size: 14px;
  margin-top: 12px;
}

@media (max-width: 768px) {
  .auth-card {
    padding: 24px;
    margin: 0 16px;
  }
  
  .auth-title {
    font-size: 24px;
  }
}
</style>