<template>
  <div class="theme-drawer-content">
    <!-- 主题设置 -->
    <div class="setting-section">
      <h3 class="section-title">
        🎨 主题设置
      </h3>
      


      <div class="setting-item">
        <label class="setting-label">主色调</label>
        <div class="color-picker-grid">
          <div 
            v-for="color in PRESET_COLORS" 
            :key="color.value"
            class="color-option"
            :class="{ active: themeStore.customization.primaryColor === color.value }"
            :style="{ backgroundColor: color.value }"
            @click="themeStore.setPrimaryColor(color.value)"
            :title="color.name"
          />
        </div>
        <a-input 
          v-model:value="themeStore.customization.primaryColor"
          placeholder="自定义颜色 (如: #1677ff)"
          style="margin-top: 12px"
          @change="validateColor"
        />
      </div>

      <div class="setting-item">
        <label class="setting-label">组件尺寸</label>
        <a-segmented
          v-model:value="themeStore.customization.componentSize"
          :options="componentSizeOptions"
          block
        />
      </div>

      <div class="setting-item">
        <label class="setting-label">圆角大小</label>
        <a-slider 
          v-model:value="themeStore.customization.borderRadius"
          :min="0"
          :max="20"
          :marks="{ 0: '0', 6: '6', 12: '12', 20: '20' }"
          :tooltip="{ formatter: (value: number) => `${value}px` }"
        />
      </div>

      <div class="setting-item">
        <label class="setting-label">字体大小</label>
        <a-slider 
          v-model:value="themeStore.customization.fontSize"
          :min="12"
          :max="18"
          :marks="{ 12: '12', 14: '14', 16: '16', 18: '18' }"
          :tooltip="{ formatter: (value: number) => `${value}px` }"
        />
      </div>
    </div>

    <!-- 布局设置 -->
    <div class="setting-section">
      <h3 class="section-title">
        📐 布局设置
      </h3>

      <div class="setting-item">
        <label class="setting-label">侧边栏宽度</label>
        <a-slider 
          v-model:value="themeStore.layout.sidebarWidth"
          :min="180"
          :max="300"
          :marks="{ 180: '180', 200: '200', 250: '250', 300: '300' }"
          :tooltip="{ formatter: (value: number) => `${value}px` }"
        />
      </div>

      <div class="setting-item">
        <label class="setting-label">头部高度</label>
        <a-slider 
          v-model:value="themeStore.layout.headerHeight"
          :min="48"
          :max="80"
          :marks="{ 48: '48', 64: '64', 72: '72', 80: '80' }"
          :tooltip="{ formatter: (value: number) => `${value}px` }"
        />
      </div>

      <div class="setting-item">
        <label class="setting-label">内容间距</label>
        <a-slider 
          v-model:value="themeStore.layout.contentPadding"
          :min="16"
          :max="32"
          :marks="{ 16: '16', 20: '20', 24: '24', 32: '32' }"
          :tooltip="{ formatter: (value: number) => `${value}px` }"
        />
      </div>
    </div>

    <!-- 快速操作 -->
    <div class="setting-section">
      <h3 class="section-title">
        ⚡ 快速操作
      </h3>
      
      <div class="quick-actions">
        <a-button 
          @click="toggleSidebar" 
          block 
          style="margin-bottom: 8px"
        >
          <MenuOutlined />
          {{ themeStore.layout.sidebarCollapsed ? '展开' : '收起' }}侧边栏
        </a-button>
        
        <a-button 
          @click="handleReset" 
          danger 
          block
        >
          <ReloadOutlined />
          重置为默认
        </a-button>
      </div>
    </div>

    <!-- 当前主题信息 -->
    <div class="theme-info">
      <a-alert
        message="当前主题配置"
        :description="`主色调: ${themeStore.customization.primaryColor} | 组件尺寸: ${getSizeLabel(themeStore.customization.componentSize)}`"
        type="info"
        show-icon
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'
import { message } from 'ant-design-vue'
import {
  MenuOutlined,
  ReloadOutlined
} from '@ant-design/icons-vue'
import { useThemeStore } from '@/stores/theme'
import { PRESET_COLORS } from '@/types/theme'

const themeStore = useThemeStore()

// 组件尺寸选项
const componentSizeOptions = [
  { label: '紧凑', value: 'small' },
  { label: '默认', value: 'middle' },
  { label: '宽松', value: 'large' }
]

// 获取尺寸标签
const getSizeLabel = (size: string) => {
  const labels = {
    small: '紧凑',
    middle: '默认',
    large: '宽松'
  }
  return labels[size as keyof typeof labels] || size
}

// 颜色验证
const validateColor = (e: Event) => {
  const value = (e.target as HTMLInputElement).value
  const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  if (value && !colorRegex.test(value)) {
    message.warning('请输入有效的颜色值（如：#1677ff）')
  }
}

// 切换侧边栏
const toggleSidebar = () => {
  themeStore.toggleSidebarCollapsed()
  message.success(`侧边栏已${themeStore.layout.sidebarCollapsed ? '收起' : '展开'}`)
}

// 重置设置
const handleReset = () => {
  themeStore.resetToDefault()
  message.success('主题设置已重置为默认值')
}
</script>

<style scoped>
.theme-drawer-content {
  padding: 0;
}

.setting-section {
  margin-bottom: 32px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--ant-color-text);
  border-bottom: 1px solid var(--ant-color-border);
  padding-bottom: 8px;
}

.setting-item {
  margin-bottom: 20px;
}

.setting-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--ant-color-text);
}

.color-picker-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-bottom: 8px;
}

.color-option {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s;
  position: relative;
}

.color-option:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.color-option.active {
  border-color: var(--ant-color-primary);
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.2);
}

.color-option.active::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-weight: bold;
  text-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.theme-info {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--ant-color-border);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .color-picker-grid {
    grid-template-columns: repeat(4, 1fr);
  }
  
  .color-option {
    width: 28px;
    height: 28px;
  }
}
</style>