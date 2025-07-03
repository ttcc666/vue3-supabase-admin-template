<template>
  <div class="profile-content">
    <!-- 个人信息卡片 -->
    <a-card title="个人资料" :bordered="false" :loading="profileStore.loading">
      <a-row :gutter="24">
        <!-- 左侧：头像和基本信息 -->
        <a-col :xs="24" :md="8">
          <div class="profile-avatar-section">
            <Avatar
              :size="120"
              @upload="handleAvatarUpload"
              @delete="handleAvatarDelete"
              @error="handleAvatarError"
            />
            <h3>{{ profileStore.displayName }}</h3>
            <p>{{ getUserRole() }}</p>
            <a-progress
              :percent="profileStore.profileCompleteness"
              size="small"
              :status="profileStore.profileCompleteness === 100 ? 'success' : 'active'"
            />
            <p class="completeness-text">资料完整度 {{ profileStore.profileCompleteness }}%</p>
          </div>
        </a-col>

        <!-- 右侧：表单 -->
        <a-col :xs="24" :md="16">
          <a-form
            ref="formRef"
            :model="profileForm"
            :rules="formRules"
            layout="vertical"
            class="profile-form"
            @finish="handleSave"
          >
            <a-row :gutter="16">
              <a-col :xs="24" :sm="12">
                <a-form-item label="邮箱">
                  <a-input
                    :value="authStore.userEmail"
                    :prefix="h(MailOutlined)"
                    disabled
                  />
                </a-form-item>
              </a-col>

              <a-col :xs="24" :sm="12">
                <a-form-item label="用户名" name="username">
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
                <a-form-item label="名字" name="first_name">
                  <a-input
                    v-model:value="profileForm.first_name"
                    :prefix="h(UserOutlined)"
                    placeholder="请输入名字"
                  />
                </a-form-item>
              </a-col>

              <a-col :xs="24" :sm="12">
                <a-form-item label="姓氏" name="last_name">
                  <a-input
                    v-model:value="profileForm.last_name"
                    :prefix="h(UserOutlined)"
                    placeholder="请输入姓氏"
                  />
                </a-form-item>
              </a-col>
            </a-row>

            <a-row :gutter="16">
              <a-col :xs="24" :sm="12">
                <a-form-item label="手机号" name="phone">
                  <a-input
                    v-model:value="profileForm.phone"
                    :prefix="h(PhoneOutlined)"
                    placeholder="请输入手机号"
                  />
                </a-form-item>
              </a-col>

              <a-col :xs="24" :sm="12">
                <a-form-item label="生日" name="birthday">
                  <a-date-picker
                    v-model:value="profileForm.birthday"
                    style="width: 100%"
                    placeholder="请选择生日"
                    format="YYYY-MM-DD"
                    value-format="YYYY-MM-DD"
                  />
                </a-form-item>
              </a-col>
            </a-row>

            <a-row :gutter="16">
              <a-col :xs="24" :sm="12">
                <a-form-item label="个人网站" name="website">
                  <a-input
                    v-model:value="profileForm.website"
                    :prefix="h(GlobalOutlined)"
                    placeholder="https://example.com"
                  />
                </a-form-item>
              </a-col>

              <a-col :xs="24" :sm="12">
                <a-form-item label="所在城市" name="city">
                  <a-input
                    v-model:value="profileForm.city"
                    :prefix="h(EnvironmentOutlined)"
                    placeholder="请输入所在城市"
                  />
                </a-form-item>
              </a-col>
            </a-row>

            <a-form-item label="个人简介" name="bio">
              <a-textarea
                v-model:value="profileForm.bio"
                :rows="4"
                placeholder="请输入个人简介"
                :maxlength="500"
                show-count
              />
            </a-form-item>

            <a-form-item>
              <a-space>
                <a-button
                  type="primary"
                  html-type="submit"
                  :loading="profileStore.loading"
                >
                  保存更改
                </a-button>
                <a-button @click="handleReset">
                  重 置
                </a-button>
                <a-button @click="handleRefresh" :icon="h(ReloadOutlined)">
                  刷 新
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
            <a-tag :color="emailVerificationStatus.color">
              {{ emailVerificationStatus.text }}
            </a-tag>
          </template>
        </a-list-item>


      </a-list>
    </a-card>

    <!-- 操作记录 -->
    <a-card title="最近操作" :bordered="false" :loading="activitiesStore.loading">
      <template #extra>
        <a-button
          type="text"
          :icon="h(ReloadOutlined)"
          @click="handleRefreshActivities"
          :loading="activitiesStore.loading"
        >
          刷新
        </a-button>
      </template>

      <a-list
        :data-source="activitiesStore.recentActivities"
        item-layout="horizontal"
        :locale="{ emptyText: '暂无操作记录' }"
      >
        <template #renderItem="{ item }">
          <a-list-item>
            <a-list-item-meta>
              <template #avatar>
                <a-avatar>
                  <template #icon>
                    <component :is="getActivityIcon(item.activity_type)" />
                  </template>
                </a-avatar>
              </template>
              <template #title>
                {{ item.activity_title }}
              </template>
              <template #description>
                {{ item.activity_description || item.activity_type_display }}
              </template>
            </a-list-item-meta>
            <div class="activity-time">{{ item.time_ago }}</div>
          </a-list-item>
        </template>
      </a-list>

      <!-- 活动统计 -->
      <a-divider />
      <a-row :gutter="16" v-if="activitiesStore.stats">
        <a-col :span="6">
          <a-statistic
            title="今日活动"
            :value="activitiesStore.stats.activities_today"
            :value-style="{ color: '#1890ff' }"
          />
        </a-col>
        <a-col :span="6">
          <a-statistic
            title="本周活动"
            :value="activitiesStore.stats.activities_this_week"
            :value-style="{ color: '#52c41a' }"
          />
        </a-col>
        <a-col :span="6">
          <a-statistic
            title="本月活动"
            :value="activitiesStore.stats.activities_this_month"
            :value-style="{ color: '#722ed1' }"
          />
        </a-col>
        <a-col :span="6">
          <a-statistic
            title="总活动"
            :value="activitiesStore.stats.total_activities"
            :value-style="{ color: '#fa8c16' }"
          />
        </a-col>
      </a-row>
    </a-card>

    <!-- 密码修改弹窗 -->
    <PasswordChangeModal
      v-model:open="passwordModalVisible"
      @success="handlePasswordChangeSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, h, ref, onMounted, watch } from 'vue'
import { message } from 'ant-design-vue'
import type { FormInstance, Rule } from 'ant-design-vue/es/form'
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  UploadOutlined,
  LockOutlined,
  LoginOutlined,
  LogoutOutlined,
  EditOutlined,
  GlobalOutlined,
  EnvironmentOutlined,
  ReloadOutlined
} from '@ant-design/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { useProfileStore } from '@/stores/profile'
import { useActivitiesStore } from '@/stores/activities'
import Avatar from '@/components/Avatar.vue'
import PasswordChangeModal from '@/components/PasswordChangeModal.vue'
import { ActivityType, ActivityTypeIcons } from '@/types/activities'
import type { ProfileFormData } from '@/types/profile'
import { useSecurity } from '@/composables/useSecurity'

const authStore = useAuthStore()
const profileStore = useProfileStore()
const activitiesStore = useActivitiesStore()
const { emailVerificationStatus } = useSecurity()

// Refs
const formRef = ref<FormInstance>()
const passwordModalVisible = ref(false)

// 表单数据
const profileForm = reactive<ProfileFormData>({
  username: '',
  first_name: '',
  last_name: '',
  phone: '',
  website: '',
  bio: '',
  birthday: null,
  city: ''
})

// 表单验证规则
const formRules: Record<string, Rule[]> = {
  username: [
    { min: 3, message: '用户名至少需要3个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_-]+$/, message: '用户名只能包含字母、数字、下划线和连字符', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^\+?[1-9]\d{1,14}$/, message: '请输入有效的手机号码', trigger: 'blur' }
  ],
  website: [
    { pattern: /^https?:\/\/.+/, message: '请输入有效的网站地址（以 http:// 或 https:// 开头）', trigger: 'blur' }
  ],
  bio: [
    { max: 500, message: '个人简介不能超过500个字符', trigger: 'blur' }
  ]
}

// 加载资料数据到表单
const loadProfileData = () => {
  try {
    if (profileStore.profile) {
      const profile = profileStore.profile
      profileForm.username = profile.username || ''
      profileForm.first_name = profile.first_name || ''
      profileForm.last_name = profile.last_name || ''
      profileForm.phone = profile.phone || ''
      profileForm.website = profile.website || ''
      profileForm.bio = profile.bio || ''
      profileForm.birthday = profile.birthday || null
      profileForm.city = profile.city || ''
    }
  } catch (error) {
    console.error('Error loading profile data:', error)
  }
}

// 初始化
onMounted(async () => {
  try {
    // 并行初始化 profile store 和 activities store
    const initPromises = []

    if (!profileStore.initialized) {
      initPromises.push(profileStore.initialize())
    }

    if (!activitiesStore.initialized) {
      initPromises.push(activitiesStore.initialize())
    }

    await Promise.all(initPromises)
    loadProfileData()
  } catch (error) {
    console.error('Error initializing profile view:', error)
  }
})

// 监听 profile 变化，同步到表单
watch(() => profileStore.profile, (newProfile) => {
  try {
    if (newProfile) {
      loadProfileData()
    }
  } catch (error) {
    console.error('Error in profile watcher:', error)
  }
}, { immediate: false, deep: false })

// 获取用户角色
const getUserRole = () => {
  if (profileStore.isProfileComplete) {
    return '认证用户'
  }
  return '普通用户'
}

// 保存更改
const handleSave = async () => {
  try {
    await formRef.value?.validate()

    const result = await profileStore.updateProfile(profileForm)

    if (result.success) {
      message.success(result.message || '个人资料保存成功！')
    } else {
      message.error(result.error || '保存失败')
    }
  } catch (error) {
    console.error('Form validation failed:', error)
  }
}

// 重置表单
const handleReset = () => {
  loadProfileData()
  message.info('表单已重置')
}

// 刷新数据
const handleRefresh = async () => {
  try {
    await profileStore.fetchProfile()
    message.success('数据刷新成功')
  } catch (error) {
    message.error('刷新失败')
  }
}

// 头像上传成功
const handleAvatarUpload = (url: string) => {
  message.success('头像上传成功')
}

// 头像删除成功
const handleAvatarDelete = () => {
  message.success('头像删除成功')
}

// 头像操作错误
const handleAvatarError = (error: string) => {
  message.error(error)
}

// 获取活动类型对应的图标
const getActivityIcon = (activityType: string) => {
  const iconMap: Record<string, any> = {
    'login': LoginOutlined,
    'logout': LogoutOutlined,
    'profile_update': EditOutlined,
    'password_change': LockOutlined,
    'avatar_upload': UploadOutlined,
    'email_change': MailOutlined,
    'phone_update': PhoneOutlined,
    'security_setting': LockOutlined,
    'account_setting': UserOutlined
  }
  return iconMap[activityType] || UserOutlined
}

// 刷新活动记录
const handleRefreshActivities = async () => {
  try {
    await activitiesStore.refresh()
    message.success('活动记录已刷新')
  } catch (error) {
    message.error('刷新活动记录失败')
  }
}

// 修改密码
const handleChangePassword = () => {
  passwordModalVisible.value = true
}

// 密码修改成功回调
const handlePasswordChangeSuccess = async () => {
  // 不在这里显示成功消息，避免重复
  // 成功消息已在 PasswordChangeModal 中显示

  // 创建活动记录
  try {
    await activitiesStore.createActivity({
      activity_type: ActivityType.PASSWORD_CHANGE,
      activity_title: '修改登录密码',
      activity_description: '用户成功修改了登录密码',
      metadata: {
        source: 'profile_page',
        method: 'password_change_modal'
      }
    })
  } catch (error) {
    console.error('Failed to log password change activity:', error)
  }
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
  justify-content: center;
  text-align: center;
  gap: 16px;
  width: 100%;
  padding: 20px 0;
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

.completeness-text {
  font-size: 12px;
  color: #666;
  margin-top: 8px;
  text-align: center;
}

/* 确保进度条居中 */
.profile-avatar-section :deep(.ant-progress) {
  display: flex;
  justify-content: center;
  width: 200px;
  margin: 0 auto;
}

.profile-form {
  margin-top: 24px;
}

@media (max-width: 768px) {
  .profile-avatar-section {
    margin-bottom: 24px;
  }
}

.activity-time {
  color: #999;
  font-size: 12px;
  white-space: nowrap;
}
</style>