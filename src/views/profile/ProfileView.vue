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
            <a-button type="primary" :icon="h(UploadOutlined)">
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
                    style="width: 100%"
                    placeholder="请选择生日"
                  />
                </a-form-item>
              </a-col>
            </a-row>

            <a-form-item label="个人简介">
              <a-textarea
                v-model:value="profileForm.bio"
                :rows="4"
                placeholder="请输入个人简介"
                :maxlength="200"
                show-count
              />
            </a-form-item>

            <a-form-item>
              <a-space>
                <a-button type="primary" @click="handleSave">
                  保存更改
                </a-button>
                <a-button @click="handleReset">
                  重 置
                </a-button>
              </a-space>
            </a-form-item>
          </a-form>
        </a-col>
      </a-row>
    </a-card>

    <!-- 账户安全 -->
    <a-card title="账户安全" :bordered="false">
      <a-list item-layout="horizontal">
        <a-list-item>
          <a-list-item-meta>
            <template #avatar>
              <a-avatar :icon="h(LockOutlined)" />
            </template>
            <template #title>
              <h4>登录密码</h4>
            </template>
            <template #description>
              定期更换密码可以提高账户安全性
            </template>
          </a-list-item-meta>
          <template #actions>
            <a-button @click="handleChangePassword">修改密码</a-button>
          </template>
        </a-list-item>

        <a-list-item>
          <a-list-item-meta>
            <template #avatar>
              <a-avatar :icon="h(MailOutlined)" />
            </template>
            <template #title>
              <h4>邮箱验证</h4>
            </template>
            <template #description>
              已验证的邮箱可以用于找回密码
            </template>
          </a-list-item-meta>
          <template #actions>
            <a-tag color="green">已验证</a-tag>
          </template>
        </a-list-item>

        <a-list-item>
          <a-list-item-meta>
            <template #avatar>
              <a-avatar :icon="h(SafetyOutlined)" />
            </template>
            <template #title>
              <h4>两步验证</h4>
            </template>
            <template #description>
              开启两步验证可以大大提高账户安全性
            </template>
          </a-list-item-meta>
          <template #actions>
            <a-button @click="handleEnableTwoFactor">开启</a-button>
          </template>
        </a-list-item>
      </a-list>
    </a-card>

    <!-- 操作记录 -->
    <a-card title="最近操作" :bordered="false">
      <a-list :data-source="recentActions" item-layout="horizontal">
        <template #renderItem="{ item }">
          <a-list-item>
            <a-list-item-meta>
              <template #avatar>
                <a-avatar :icon="h(item.icon)" />
              </template>
              <template #title>
                {{ item.title }}
              </template>
              <template #description>
                {{ item.description }}
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
import { reactive, computed, h } from 'vue'
import { message } from 'ant-design-vue'
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  UploadOutlined,
  LockOutlined,
  SafetyOutlined,
  LoginOutlined,
  EditOutlined
} from '@ant-design/icons-vue'
import { useAuthStore } from '@/stores/auth'
import type { Dayjs } from 'dayjs'

const authStore = useAuthStore()

// 用户邮箱
const userEmail = computed(() => authStore.user?.email || '')

// 表单数据
const profileForm = reactive({
  email: userEmail.value,
  username: '',
  phone: '',
  birthday: null as Dayjs | null,
  bio: ''
})

// 最近操作记录
const recentActions = [
  {
    icon: LoginOutlined,
    title: '登录系统',
    description: '从 Chrome 浏览器登录',
    time: '2 小时前'
  },
  {
    icon: EditOutlined,
    title: '修改个人资料',
    description: '更新了个人简介',
    time: '1 天前'
  },
  {
    icon: LockOutlined,
    title: '修改密码',
    description: '成功修改登录密码',
    time: '3 天前'
  }
]

// 保存更改
const handleSave = () => {
  message.success('个人资料保存成功！')
}

// 重置表单
const handleReset = () => {
  profileForm.username = ''
  profileForm.phone = ''
  profileForm.birthday = null
  profileForm.bio = ''
  message.info('表单已重置')
}

// 修改密码
const handleChangePassword = () => {
  message.info('修改密码功能开发中...')
}

// 开启两步验证
const handleEnableTwoFactor = () => {
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
  margin-top: 24px;
}

@media (max-width: 768px) {
  .profile-avatar-section {
    margin-bottom: 24px;
  }
}
</style>