<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <h1 class="auth-title">{{ appTitle }}</h1>
        <p class="auth-subtitle">{{ isLogin ? '登录您的账户' : '创建新账户' }}</p>
      </div>

      <a-tabs v-model:activeKey="activeTab" centered @change="handleTabChange">
        <a-tab-pane key="login" tab="登录">
          <a-form
            :model="loginForm"
            :rules="loginRules"
            @finish="handleLogin"
            layout="vertical"
            class="auth-form"
          >
            <a-form-item label="邮箱" name="email">
              <a-input
                v-model:value="loginForm.email"
                type="email"
                placeholder="请输入您的邮箱"
                size="large"
                :prefix="h(MailOutlined)"
              />
            </a-form-item>

            <a-form-item label="密码" name="password">
              <a-input-password
                v-model:value="loginForm.password"
                placeholder="请输入您的密码"
                size="large"
                :prefix="h(LockOutlined)"
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
                登录
              </a-button>
            </a-form-item>

            <div class="auth-links">
              <a-button type="link" @click="showResetPassword = true">
                忘记密码？
              </a-button>
            </div>
          </a-form>
        </a-tab-pane>

        <a-tab-pane key="register" tab="注册">
          <a-form
            :model="registerForm"
            :rules="registerRules"
            @finish="handleRegister"
            layout="vertical"
            class="auth-form"
          >
            <a-form-item label="邮箱" name="email">
              <a-input
                v-model:value="registerForm.email"
                type="email"
                placeholder="请输入您的邮箱"
                size="large"
                :prefix="h(MailOutlined)"
              />
            </a-form-item>

            <a-form-item label="密码" name="password">
              <a-input-password
                v-model:value="registerForm.password"
                placeholder="请输入密码（至少6位）"
                size="large"
                :prefix="h(LockOutlined)"
              />
            </a-form-item>

            <a-form-item label="确认密码" name="confirmPassword">
              <a-input-password
                v-model:value="registerForm.confirmPassword"
                placeholder="请再次输入密码"
                size="large"
                :prefix="h(LockOutlined)"
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
                注册
              </a-button>
            </a-form-item>
          </a-form>
        </a-tab-pane>
      </a-tabs>
    </div>

    <!-- 密码重置模态框 -->
    <a-modal
      v-model:open="showResetPassword"
      title="重置密码"
      @ok="handleResetPassword"
      :confirm-loading="authStore.loading"
    >
      <a-form layout="vertical">
        <a-form-item label="邮箱">
          <a-input
            v-model:value="resetEmail"
            type="email"
            placeholder="请输入您的邮箱"
            size="large"
          />
        </a-form-item>
      </a-form>
      <p class="reset-tip">我们将向您的邮箱发送重置密码的链接</p>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, h } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { MailOutlined, LockOutlined } from '@ant-design/icons-vue'
import { useAuthStore } from '@/stores/auth'
import type { LoginForm, RegisterForm } from '@/types/auth'

const authStore = useAuthStore()
const router = useRouter()

// 应用标题
const appTitle = import.meta.env.VITE_APP_TITLE || 'Supabase Web App'

// 当前标签页
const activeTab = ref('login')
const isLogin = computed(() => activeTab.value === 'login')

// 密码重置
const showResetPassword = ref(false)
const resetEmail = ref('')

// 登录表单
const loginForm = reactive<LoginForm>({
  email: '',
  password: ''
})

// 注册表单
const registerForm = reactive<RegisterForm>({
  email: '',
  password: '',
  confirmPassword: ''
})

// 表单验证规则
const loginRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ]
}

const registerRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule: any, value: string) => {
        if (value !== registerForm.password) {
          return Promise.reject('两次输入的密码不一致')
        }
        return Promise.resolve()
      },
      trigger: 'blur'
    }
  ]
}

// 处理标签页切换
const handleTabChange = (key: string) => {
  // 清空表单
  Object.assign(loginForm, { email: '', password: '' })
  Object.assign(registerForm, { email: '', password: '', confirmPassword: '' })
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
    message.success('注册成功！请检查您的邮箱以验证账户。')
    activeTab.value = 'login'
  } else {
    message.error(result.error?.message || '注册失败')
  }
}

// 处理密码重置
const handleResetPassword = async () => {
  if (!resetEmail.value) {
    message.error('请输入邮箱地址')
    return
  }

  const result = await authStore.resetPassword(resetEmail.value)
  
  if (result.success) {
    message.success('密码重置邮件已发送！')
    showResetPassword.value = false
    resetEmail.value = ''
  } else {
    message.error(result.error?.message || '发送失败')
  }
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