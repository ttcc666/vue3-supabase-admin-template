<template>
  <div class="settings-content">
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
              <a-select v-model:value="settings.language" style="width: 100%">
                <a-select-option value="zh-CN">简体中文</a-select-option>
                <a-select-option value="en-US">English</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          

        </a-row>

        <a-row :gutter="24">
          <a-col :xs="24" :md="12">
            <a-form-item label="时区设置">
              <a-select v-model:value="settings.timezone" style="width: 100%">
                <a-select-option value="Asia/Shanghai">北京时间 (UTC+8)</a-select-option>
                <a-select-option value="America/New_York">纽约时间 (UTC-5)</a-select-option>
                <a-select-option value="Europe/London">伦敦时间 (UTC+0)</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          
          <a-col :xs="24" :md="12">
            <a-form-item label="日期格式">
              <a-select v-model:value="settings.dateFormat" style="width: 100%">
                <a-select-option value="YYYY-MM-DD">2024-01-01</a-select-option>
                <a-select-option value="DD/MM/YYYY">01/01/2024</a-select-option>
                <a-select-option value="MM/DD/YYYY">01/01/2024</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-card>

    <!-- 通知设置 -->
    <a-card title="通知设置" :bordered="false">
      <a-list>
        <a-list-item>
          <a-list-item-meta>
            <template #title>邮件通知</template>
            <template #description>接收重要系统通知和更新</template>
          </a-list-item-meta>
          <a-switch v-model:checked="notifications.email" />
        </a-list-item>

        <a-list-item>
          <a-list-item-meta>
            <template #title>浏览器通知</template>
            <template #description>在浏览器中显示实时通知</template>
          </a-list-item-meta>
          <a-switch v-model:checked="notifications.browser" />
        </a-list-item>

        <a-list-item>
          <a-list-item-meta>
            <template #title>短信通知</template>
            <template #description>接收重要安全提醒短信</template>
          </a-list-item-meta>
          <a-switch v-model:checked="notifications.sms" />
        </a-list-item>

        <a-list-item>
          <a-list-item-meta>
            <template #title>营销邮件</template>
            <template #description>接收产品更新和营销信息</template>
          </a-list-item-meta>
          <a-switch v-model:checked="notifications.marketing" />
        </a-list-item>
      </a-list>
    </a-card>

    <!-- 隐私设置 -->
    <a-card title="隐私设置" :bordered="false">
      <a-list>
        <a-list-item>
          <a-list-item-meta>
            <template #title>个人资料可见性</template>
            <template #description>控制其他用户是否可以查看您的个人资料</template>
          </a-list-item-meta>
          <a-select v-model:value="privacy.profileVisibility" style="width: 120px">
            <a-select-option value="public">公开</a-select-option>
            <a-select-option value="friends">仅好友</a-select-option>
            <a-select-option value="private">私密</a-select-option>
          </a-select>
        </a-list-item>

        <a-list-item>
          <a-list-item-meta>
            <template #title>活动状态</template>
            <template #description>显示您的在线状态</template>
          </a-list-item-meta>
          <a-switch v-model:checked="privacy.showOnlineStatus" />
        </a-list-item>

        <a-list-item>
          <a-list-item-meta>
            <template #title>数据分析</template>
            <template #description>允许收集匿名使用数据以改进服务</template>
          </a-list-item-meta>
          <a-switch v-model:checked="privacy.allowAnalytics" />
        </a-list-item>
      </a-list>
    </a-card>

    <!-- 操作按钮 -->
    <a-card :bordered="false">
      <a-space>
        <a-button type="primary" @click="handleSave">
          保存设置
        </a-button>
        <a-button @click="handleReset">
          重置为默认
        </a-button>
        <a-button danger @click="handleExportData">
          导出数据
        </a-button>
      </a-space>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { message } from 'ant-design-vue'
import { useThemeStore } from '@/stores/theme'
import { PRESET_COLORS } from '@/types/theme'

const themeStore = useThemeStore()

// 系统设置
const settings = reactive({
  language: 'zh-CN',
  timezone: 'Asia/Shanghai',
  dateFormat: 'YYYY-MM-DD'
})

// 通知设置
const notifications = reactive({
  email: true,
  browser: true,
  sms: false,
  marketing: false
})

// 隐私设置
const privacy = reactive({
  profileVisibility: 'public',
  showOnlineStatus: true,
  allowAnalytics: true
})

// 颜色验证
const validateColor = (e: Event) => {
  const value = (e.target as HTMLInputElement).value
  const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  if (value && !colorRegex.test(value)) {
    message.warning('请输入有效的颜色值（如：#1677ff）')
  }
}

// 保存设置
const handleSave = () => {
  message.success('设置保存成功！')
}

// 重置设置
const handleReset = () => {
  // 重置主题设置
  themeStore.resetToDefault()

  // 重置其他设置
  Object.assign(settings, {
    language: 'zh-CN',
    timezone: 'Asia/Shanghai',
    dateFormat: 'YYYY-MM-DD'
  })

  Object.assign(notifications, {
    email: true,
    browser: true,
    sms: false,
    marketing: false
  })

  Object.assign(privacy, {
    profileVisibility: 'public',
    showOnlineStatus: true,
    allowAnalytics: true
  })

  message.info('设置已重置为默认值')
}

// 导出数据
const handleExportData = () => {
  message.info('数据导出功能开发中...')
}
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