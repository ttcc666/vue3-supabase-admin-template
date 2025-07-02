<template>
  <div class="profile-content">
    <!-- 个人信息卡片 -->
    <a-card title="个人资料" :bordered="false">
      <a-row :gutter="24">
        <!-- 左侧：头像和基本信息 -->
        <a-col :xs="24" :md="8">
          <div class="profile-avatar-section">
            <a-avatar :size="120" :icon="h(UserOutlined)" />
            <h3>{{ userEmail }}</h3>
            <p>普通用户</p>
            <a-button type="primary" :icon="h(UploadOutlined)" @click="handleAvatarUpload">
              更换头像
            </a-button>
          </div>
        </a-col>

        <!-- 右侧：表单 -->
        <a-col :xs="24" :md="16">
          <a-form
            :model="profileForm"
            layout="vertical"
            class="profile-form"
            @finish="handleSaveProfile"
          >
            <a-row :gutter="16">
              <a-col :xs="24" :sm="12">
                <a-form-item label="邮箱">
                  <a-input
                    v-model:value="profileForm.email"
                    :prefix="h(MailOutlined)"
                    disabled
                  />
                </a-form-item>
              </a-col>
              
              <a-col :xs="24" :sm="12">
                <a-form-item label="用户名">
                  <a-input
                    v-model:value="profileForm.username"
                    :prefix="h(UserOutlined)"
                    placeholder="请输入用户名"
                  />
                </a-form-item>
              </a-col>
            </a-row>

            <a-row :gutter="16">
              <a-col :xs="24" :sm="12">
                <a-form-item label="手机号">
                  <a-input
                    v-model:value="profileForm.phone"
                    :prefix="h(PhoneOutlined)"
                    placeholder="请输入手机号"
                  />
                </a-form-item>
              </a-col>
              
              <a-col :xs="24" :sm="12">
                <a-form-item label="生日">
                  <a-date-picker
                    v-model:value="profileForm.birthday"
                    placeholder="请选择生日"
                    style="width: 100%"
                  />
                </a-form-item>
              </a-col>
            </a-row>

            <a-form-item label="个人简介">
              <a-textarea
                v-model:value="profileForm.bio"
                placeholder="请输入个人简介"
                :rows="4"
              />
            </a-form-item>

            <a-form-item>
              <a-space>
                <a-button type="primary" html-type="submit" :loading="loading">
                  保存更改
                </a-button>
                <a-button @click="handleReset">
                  重置
                </a-button>
              </a-space>
            </a-form-item>
          </a-form>
        </a-col>
      </a-row>
    </a-card>

    <!-- 账户安全 -->
    <a-card title="账户安全" :bordered="false">
      <a-row :gutter="24">
        <a-col :xs="24" :md="12">
          <a-card size="small" title="密码设置">
            <p>定期更换密码可以提高账户安全性</p>
            <a-button type="primary" @click="handleChangePassword">
              修改密码
            </a-button>
          </a-card>
        </a-col>
        
        <a-col :xs="24" :md="12">
          <a-card size="small" title="两步验证">
            <p>启用两步验证可以更好地保护您的账户</p>
            <a-button @click="handleTwoFactor">
              设置两步验证
            </a-button>
          </a-card>
        </a-col>
      </a-row>
    </a-card>

    <!-- 最近活动 -->
    <a-card title="最近活动" :bordered="false">
      <a-list
        :data-source="recentActivities"
        item-layout="horizontal"
      >
        <template #renderItem="{ item }">
          <a-list-item>
            <a-list-item-meta
              :title="item.title"
              :description="item.description"
            >
              <template #avatar>
                <a-avatar :icon="item.icon" />
              </template>
            </a-list-item-meta>
            <div>{{ item.time }}</div>
          </a-list-item>
        </template>
      </a-list>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, h } from 'vue'
import { message } from 'ant-design-vue'
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  UploadOutlined,
  LoginOutlined,
  SettingOutlined,
  SafetyOutlined
} from '@ant-design/icons-vue'
import { useAuthStore } from '@/stores/auth'
import type { Dayjs } from 'dayjs'

const authStore = useAuthStore()

// 用户邮箱
const userEmail = computed(() => authStore.user?.email || '')

// 加载状态
const loading = ref(false)

// 表单数据
const profileForm = reactive({
  email: userEmail.value,
  username: '',
  phone: '',
  birthday: null as Dayjs | null,
  bio: ''
})

// 最近活动数据
const recentActivities = ref([
  {
    title: '登录系统',
    description: '从 Chrome 浏览器登录',
    time: '2 小时前',
    icon: h(LoginOutlined)
  },
  {
    title: '修改个人资料',
    description: '更新了用户名和个人简介',
    time: '1 天前',
    icon: h(UserOutlined)
  },
  {
    title: '安全设置',
    description: '启用了两步验证',
    time: '3 天前',
    icon: h(SafetyOutlined)
  },
  {
    title: '系统设置',
    description: '修改了主题配置',
    time: '1 周前',
    icon: h(SettingOutlined)
  }
])

// 处理头像上传
const handleAvatarUpload = () => {
  message.info('头像上传功能开发中...')
}

// 处理保存个人资料
const handleSaveProfile = async () => {
  loading.value = true
  try {
    // 模拟保存操作
    await new Promise(resolve => setTimeout(resolve, 1000))
    message.success('个人资料保存成功！')
  } catch (error) {
    message.error('保存失败，请重试')
  } finally {
    loading.value = false
  }
}

// 处理重置表单
const handleReset = () => {
  Object.assign(profileForm, {
    email: userEmail.value,
    username: '',
    phone: '',
    birthday: null,
    bio: ''
  })
  message.info('表单已重置')
}

// 处理修改密码
const handleChangePassword = () => {
  message.info('密码修改功能开发中...')
}

// 处理两步验证
const handleTwoFactor = () => {
  message.info('两步验证功能开发中...')
}
</script>

<style scoped>
.profile-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.profile-avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 16px;
}

.profile-avatar-section h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.profile-avatar-section p {
  margin: 0;
  color: #666;
}

.profile-form {
  padding-left: 24px;
}

@media (max-width: 768px) {
  .profile-form {
    padding-left: 0;
    margin-top: 24px;
  }
}
</style>