<template>
  <a-modal
    v-model:open="visible"
    title="修改密码"
    :confirm-loading="loading"
    :width="500"
    @ok="handleSubmit"
    @cancel="handleCancel"
  >
    <a-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      layout="vertical"
      @finish="handleSubmit"
    >
      <!-- 当前密码 -->
      <a-form-item
        label="当前密码"
        name="currentPassword"
        :help="currentPasswordError"
        :validate-status="currentPasswordError ? 'error' : ''"
      >
        <a-input-password
          v-model:value="formData.currentPassword"
          placeholder="请输入当前密码"
          :disabled="loading"
          @blur="validateCurrentPassword"
        />
      </a-form-item>

      <!-- 新密码 -->
      <a-form-item
        label="新密码"
        name="newPassword"
      >
        <a-input-password
          v-model:value="formData.newPassword"
          placeholder="请输入新密码"
          :disabled="loading"
          @input="handlePasswordChange"
        />
        
        <!-- 密码强度指示器 -->
        <div v-if="formData.newPassword" class="password-strength-container">
          <div class="password-strength-bar">
            <div 
              class="password-strength-fill"
              :style="{
                width: `${passwordValidation.score}%`,
                backgroundColor: getPasswordStrengthColor(passwordValidation.strength)
              }"
            />
          </div>
          <span 
            class="password-strength-text"
            :style="{ color: getPasswordStrengthColor(passwordValidation.strength) }"
          >
            密码强度：{{ getPasswordStrengthText(passwordValidation.strength) }}
          </span>
        </div>

        <!-- 密码要求提示 -->
        <div v-if="formData.newPassword" class="password-tips">
          <div 
            v-for="tip in passwordTips" 
            :key="tip"
            class="password-tip"
            :class="{ 'tip-success': tip.startsWith('✓') }"
          >
            {{ tip }}
          </div>
        </div>
      </a-form-item>

      <!-- 确认新密码 -->
      <a-form-item
        label="确认新密码"
        name="confirmPassword"
      >
        <a-input-password
          v-model:value="formData.confirmPassword"
          placeholder="请再次输入新密码"
          :disabled="loading"
        />
      </a-form-item>

      <!-- 密码要求说明 -->
      <a-alert
        message="密码要求"
        :description="passwordRequirementsText"
        type="info"
        show-icon
        class="password-requirements"
      />
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import { useAuthStore } from '@/stores/auth'
import type { PasswordChangeData } from '@/types/profile'
import { 
  validatePassword, 
  getPasswordStrengthColor, 
  getPasswordStrengthText,
  getPasswordStrengthTips,
  validatePasswordMatch
} from '@/utils/passwordValidator'

// Props
interface Props {
  open: boolean
}

// Emits
interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Stores
const authStore = useAuthStore()

// Refs
const formRef = ref<FormInstance>()
const loading = ref(false)
const currentPasswordError = ref('')

// Form data
const formData = reactive<PasswordChangeData>({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// Computed
const visible = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

const passwordValidation = computed(() => {
  return validatePassword(formData.newPassword)
})

const passwordTips = computed(() => {
  return getPasswordStrengthTips(formData.newPassword)
})

const passwordRequirementsText = computed(() => {
  return [
    '• 至少8个字符',
    '• 包含大写字母、小写字母、数字和特殊字符',
    '• 不能使用常见的弱密码',
    '• 建议使用12个字符以上的密码'
  ].join('\n')
})

// Form rules
const rules = {
  currentPassword: [
    { required: true, message: '请输入当前密码' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码' },
    {
      validator: (_: any, value: string) => {
        const validation = validatePassword(value)
        if (!validation.isValid) {
          return Promise.reject(validation.errors[0])
        }
        return Promise.resolve()
      }
    }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码' },
    {
      validator: (_: any, value: string) => {
        if (!validatePasswordMatch(formData.newPassword, value)) {
          return Promise.reject('两次输入的密码不一致')
        }
        return Promise.resolve()
      }
    }
  ]
}

// Methods
const handlePasswordChange = () => {
  // 清除确认密码的验证错误（如果新密码改变了）
  if (formRef.value) {
    formRef.value.clearValidate(['confirmPassword'])
  }
}

const validateCurrentPassword = async () => {
  if (!formData.currentPassword) {
    currentPasswordError.value = ''
    return
  }

  // 简化验证逻辑，在提交时再进行验证
  // 这里只做基本的非空检查
  currentPasswordError.value = ''
}

const handleSubmit = async () => {
  try {
    // 验证表单
    await formRef.value?.validate()

    loading.value = true

    // 调用密码修改API（内部会验证当前密码）
    const result = await authStore.changePassword(formData)

    if (result.success) {
      // 只显示一次成功消息
      message.success('密码修改成功')
      emit('success')
      handleCancel()
    } else {
      // 如果是当前密码错误，设置相应的错误状态
      if (result.error?.includes('当前密码')) {
        currentPasswordError.value = result.error
      }
      message.error(result.error || '密码修改失败')
    }
  } catch (error) {
    console.error('Password change failed:', error)
    // 不在这里显示错误消息，所有错误都通过 result.error 处理
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  // 重置表单
  formRef.value?.resetFields()
  currentPasswordError.value = ''
  
  // 重置表单数据
  Object.assign(formData, {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  emit('update:open', false)
}

// Watch for modal visibility changes
watch(() => props.open, (newValue) => {
  if (!newValue) {
    handleCancel()
  }
})
</script>

<style scoped>
.password-strength-container {
  margin-top: 8px;
}

.password-strength-bar {
  width: 100%;
  height: 6px;
  background-color: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 4px;
}

.password-strength-fill {
  height: 100%;
  transition: all 0.3s ease;
  border-radius: 3px;
}

.password-strength-text {
  font-size: 12px;
  font-weight: 500;
}

.password-tips {
  margin-top: 8px;
  padding: 8px;
  background-color: #fafafa;
  border-radius: 4px;
  border: 1px solid #f0f0f0;
}

.password-tip {
  font-size: 12px;
  color: #666;
  margin-bottom: 2px;
}

.password-tip:last-child {
  margin-bottom: 0;
}

.password-tip.tip-success {
  color: #52c41a;
}

.password-requirements {
  margin-top: 16px;
}

.password-requirements :deep(.ant-alert-description) {
  white-space: pre-line;
}
</style>
