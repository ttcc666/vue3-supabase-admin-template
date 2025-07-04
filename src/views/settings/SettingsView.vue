<template>
  <div class="settings-content">
    <!-- 加载状态 -->
    <a-spin :spinning="settingsStore.isLoading" tip="加载设置中...">
      <!-- 主题设置 -->
      <a-card title="主题设置" :bordered="false">
        <a-form layout="vertical">
          <a-row :gutter="24">
            <a-col :xs="24" :md="12">
              <a-form-item label="主色调">
                <div class="color-picker-container">
                  <a-space wrap>
                    <div
                      v-for="color in PRESET_COLORS"
                      :key="color.value"
                      class="color-option"
                      :class="{ active: themeStore.customization.primaryColor === color.value }"
                      :style="{ backgroundColor: color.value }"
                      @click="themeStore.setPrimaryColor(color.value)"
                      :title="color.name"
                    />
                  </a-space>
                  <a-input
                    v-model:value="themeStore.customization.primaryColor"
                    placeholder="自定义颜色"
                    style="margin-top: 12px"
                    @change="validateColor"
                  />
                </div>
              </a-form-item>
            </a-col>
          </a-row>

          <a-row :gutter="24">
            <a-col :xs="24" :md="12">
              <a-form-item label="组件尺寸">
                <a-select v-model:value="themeStore.customization.componentSize" style="width: 100%">
                  <a-select-option value="small">紧凑</a-select-option>
                  <a-select-option value="middle">默认</a-select-option>
                  <a-select-option value="large">宽松</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="12">
              <a-form-item label="圆角大小">
                <a-slider
                  v-model:value="themeStore.customization.borderRadius"
                  :min="0"
                  :max="20"
                  :marks="{ 0: '0px', 6: '6px', 12: '12px', 20: '20px' }"
                />
              </a-form-item>
            </a-col>
          </a-row>

          <a-row :gutter="24">
            <a-col :xs="24" :md="12">
              <a-form-item label="字体大小">
                <a-slider
                  v-model:value="themeStore.customization.fontSize"
                  :min="12"
                  :max="18"
                  :marks="{ 12: '12px', 14: '14px', 16: '16px', 18: '18px' }"
                />
              </a-form-item>
            </a-col>
          </a-row>
        </a-form>
      </a-card>

    <!-- 布局设置 -->
    <a-card title="布局设置" :bordered="false">
      <a-form layout="vertical">
        <a-row :gutter="24">
          <a-col :xs="24" :md="12">
            <a-form-item label="侧边栏宽度">
              <a-slider
                v-model:value="themeStore.layout.sidebarWidth"
                :min="180"
                :max="300"
                :marks="{ 180: '180px', 200: '200px', 250: '250px', 300: '300px' }"
              />
            </a-form-item>
          </a-col>

          <a-col :xs="24" :md="12">
            <a-form-item label="头部高度">
              <a-slider
                v-model:value="themeStore.layout.headerHeight"
                :min="48"
                :max="80"
                :marks="{ 48: '48px', 64: '64px', 72: '72px', 80: '80px' }"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="24">
          <a-col :xs="24" :md="12">
            <a-form-item label="内容区域间距">
              <a-slider
                v-model:value="themeStore.layout.contentPadding"
                :min="16"
                :max="32"
                :marks="{ 16: '16px', 20: '20px', 24: '24px', 32: '32px' }"
              />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-card>

      <!-- 系统设置 -->
      <a-card title="系统设置" :bordered="false">
        <a-form layout="vertical">
          <a-row :gutter="24">
            <a-col :xs="24" :md="12">
              <a-form-item label="语言设置">
                <a-select
                  v-model:value="settingsStore.system.language"
                  style="width: 100%"
                  @change="(value: any) => handleSystemSettingChange('language', value)"
                >
                  <a-select-option
                    v-for="option in LANGUAGE_OPTIONS"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>

          <a-row :gutter="24">
            <a-col :xs="24" :md="12">
              <a-form-item label="时区设置">
                <a-select
                  v-model:value="settingsStore.system.timezone"
                  style="width: 100%"
                  @change="(value: any) => handleSystemSettingChange('timezone', value)"
                >
                  <a-select-option
                    v-for="option in TIMEZONE_OPTIONS"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="12">
              <a-form-item label="日期格式">
                <a-select
                  v-model:value="settingsStore.system.dateFormat"
                  style="width: 100%"
                  @change="(value: any) => handleSystemSettingChange('dateFormat', value)"
                >
                  <a-select-option
                    v-for="option in DATE_FORMAT_OPTIONS"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>
        </a-form>
      </a-card>

      <!-- 通知设置 -->
      <a-card title="通知设置" :bordered="false">
        <a-list>
          <a-list-item v-for="option in NOTIFICATION_OPTIONS" :key="option.key">
            <a-list-item-meta>
              <template #title>{{ option.title }}</template>
              <template #description>{{ option.description }}</template>
            </a-list-item-meta>
            <a-switch
              v-model:checked="settingsStore.notification[option.key]"
              @change="(checked: any) => handleNotificationSettingChange(option.key, checked)"
            />
          </a-list-item>
        </a-list>
      </a-card>

      <!-- 隐私设置 -->
      <a-card title="隐私设置" :bordered="false">
        <a-list>
          <a-list-item v-for="option in PRIVACY_OPTIONS" :key="option.key">
            <a-list-item-meta>
              <template #title>{{ option.title }}</template>
              <template #description>{{ option.description }}</template>
            </a-list-item-meta>

            <!-- 开关类型 -->
            <a-switch
              v-if="option.type === 'switch'"
              v-model:checked="settingsStore.privacy[option.key]"
              @change="(checked: any) => handlePrivacySettingChange(option.key, checked)"
            />

            <!-- 选择类型 -->
            <a-select
              v-else-if="option.type === 'select'"
              v-model:value="settingsStore.privacy[option.key]"
              style="width: 120px"
              @change="(value: any) => handlePrivacySettingChange(option.key, value)"
            >
              <a-select-option
                v-for="selectOption in option.options"
                :key="selectOption.value"
                :value="selectOption.value"
              >
                {{ selectOption.label }}
              </a-select-option>
            </a-select>
          </a-list-item>
        </a-list>
      </a-card>

      <!-- 操作按钮 -->
      <a-card :bordered="false">
        <a-space>
          <a-button
            type="primary"
            @click="handleSave"
            :loading="settingsStore.isLoading"
          >
            保存设置
          </a-button>
          <a-button
            @click="handleReset"
            :loading="settingsStore.isLoading"
          >
            重置为默认
          </a-button>

        </a-space>
      </a-card>

      <!-- 错误提示 -->
      <a-alert
        v-if="settingsStore.hasError"
        :message="settingsStore.error"
        type="error"
        show-icon
        closable
        @close="settingsStore.clearError"
        style="margin-top: 16px"
      />

      <!-- 同步状态指示器 -->
      <a-card
        v-if="settingsStore.isSubscribed"
        title="同步状态"
        :bordered="false"
        size="small"
        style="margin-top: 16px"
      >
        <a-tag color="green">
          <template #icon>
            <sync-outlined />
          </template>
          实时同步已启用
        </a-tag>
      </a-card>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { message } from 'ant-design-vue'
import { SyncOutlined } from '@ant-design/icons-vue'
import { useThemeStore } from '@/stores/theme'
import { useSettingsStore } from '@/stores/settings'
import { PRESET_COLORS } from '@/types/theme'
import {
  LANGUAGE_OPTIONS,
  TIMEZONE_OPTIONS,
  DATE_FORMAT_OPTIONS,
  NOTIFICATION_OPTIONS,
  PRIVACY_OPTIONS
} from '@/types/settings'
import { settingsCache } from '@/utils/settingsCache'

const themeStore = useThemeStore()
const settingsStore = useSettingsStore()

// =====================================================
// 事件处理函数
// =====================================================

/**
 * 颜色验证
 */
const validateColor = (e: Event) => {
  const value = (e.target as HTMLInputElement).value
  const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  if (value && !colorRegex.test(value)) {
    message.warning('请输入有效的颜色值（如：#1677ff）')
  }
}

/**
 * 处理系统设置变更
 */
const handleSystemSettingChange = async (key: string, value: any) => {
  try {
    await settingsStore.setSetting('system', key, value)
  } catch (error) {
    console.error('Failed to update system setting:', error)
  }
}

/**
 * 处理通知设置变更
 */
const handleNotificationSettingChange = async (key: string, value: any) => {
  try {
    await settingsStore.setSetting('notification', key, value)
  } catch (error) {
    console.error('Failed to update notification setting:', error)
  }
}

/**
 * 处理隐私设置变更
 */
const handlePrivacySettingChange = async (key: string, value: any) => {
  try {
    await settingsStore.setSetting('privacy', key, value)
  } catch (error) {
    console.error('Failed to update privacy setting:', error)
  }
}

/**
 * 保存设置（手动触发批量保存）
 */
const handleSave = async () => {
  try {
    // 强制刷新批量更新队列
    await settingsCache.flushBatchQueue()
    message.success('设置保存成功！')
  } catch (error) {
    console.error('Failed to save settings:', error)
    message.error('设置保存失败')
  }
}

/**
 * 重置设置
 */
const handleReset = async () => {
  try {
    // 重置主题设置（本地存储）
    themeStore.resetToDefault()

    // 重置数据库设置
    await settingsStore.resetSettings()
  } catch (error) {
    console.error('Failed to reset settings:', error)
    message.error('重置设置失败')
  }
}



// =====================================================
// 生命周期
// =====================================================

onMounted(async () => {
  try {
    // 初始化主题 store
    themeStore.initialize()

    // 加载设置
    if (!settingsStore.initialized) {
      await settingsStore.loadAllSettings()
    }
  } catch (error) {
    console.error('Failed to initialize settings:', error)
  }
})

onUnmounted(() => {
  // 清理工作在 store 中自动处理
})
</script>

<style scoped>
.settings-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.color-picker-container {
  width: 100%;
}

.color-option {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s;
  display: inline-block;
}

.color-option:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.color-option.active {
  border-color: #1677ff;
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.2);
}
</style>