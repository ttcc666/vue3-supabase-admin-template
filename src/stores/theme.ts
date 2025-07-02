import { defineStore } from 'pinia'
import { ref, computed, watch, watchEffect } from 'vue'
import { theme } from 'ant-design-vue'
import type {
  ThemeState,
  LayoutConfig,
  CustomizationConfig,
  ThemeConfig,
  ComponentSize
} from '@/types/theme'
import { DEFAULT_THEME_CONFIG } from '@/types/theme'

const STORAGE_KEY = 'supabase-web-app-theme'

export const useThemeStore = defineStore('theme', () => {
  // 状态
  const layout = ref<LayoutConfig>({ ...DEFAULT_THEME_CONFIG.layout })
  const customization = ref<CustomizationConfig>({ ...DEFAULT_THEME_CONFIG.customization })

  // 计算属性 - Ant Design Vue 主题配置
  const antdThemeConfig = computed<ThemeConfig>(() => {
    const isCompact = customization.value.componentSize === 'small'

    // 构建算法数组 - 只保留浅色主题
    const algorithms = [theme.defaultAlgorithm]
    if (isCompact) {
      algorithms.push(theme.compactAlgorithm)
    }

    return {
      algorithm: algorithms.length > 1 ? algorithms : algorithms[0],
      token: {
        colorPrimary: customization.value.primaryColor,
        borderRadius: customization.value.borderRadius,
        fontSize: customization.value.fontSize,
        // 根据组件尺寸调整控件高度
        controlHeight: customization.value.componentSize === 'large' ? 40 :
                     customization.value.componentSize === 'small' ? 24 : 32,
      },
      components: {
        Layout: {
          siderWidth: layout.value.sidebarWidth,
          headerHeight: layout.value.headerHeight,
        },
        Menu: {
          itemHeight: customization.value.componentSize === 'large' ? 48 :
                     customization.value.componentSize === 'small' ? 32 : 40,
        }
      }
    }
  })



  // 从本地存储加载配置
  const loadFromStorage = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const config: ThemeState = JSON.parse(stored)
        layout.value = { ...DEFAULT_THEME_CONFIG.layout, ...config.layout }
        customization.value = { ...DEFAULT_THEME_CONFIG.customization, ...config.customization }
      }
    } catch (error) {
      console.error('Failed to load theme config from storage:', error)
    }
  }

  // 保存到本地存储
  const saveToStorage = () => {
    try {
      const config = {
        layout: layout.value,
        customization: customization.value
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    } catch (error) {
      console.error('Failed to save theme config to storage:', error)
    }
  }

  // 监听配置变化并保存
  watchEffect(() => {
    saveToStorage()
  })



  // 设置主色调
  const setPrimaryColor = (color: string) => {
    customization.value.primaryColor = color
  }

  // 设置组件尺寸
  const setComponentSize = (size: ComponentSize) => {
    customization.value.componentSize = size
  }

  // 设置边框圆角
  const setBorderRadius = (radius: number) => {
    customization.value.borderRadius = radius
  }

  // 设置字体大小
  const setFontSize = (size: number) => {
    customization.value.fontSize = size
  }

  // 切换侧边栏折叠状态
  const toggleSidebarCollapsed = () => {
    layout.value.sidebarCollapsed = !layout.value.sidebarCollapsed
  }

  // 设置侧边栏宽度
  const setSidebarWidth = (width: number) => {
    layout.value.sidebarWidth = width
  }

  // 设置头部高度
  const setHeaderHeight = (height: number) => {
    layout.value.headerHeight = height
  }

  // 设置内容区域间距
  const setContentPadding = (padding: number) => {
    layout.value.contentPadding = padding
  }

  // 重置为默认配置
  const resetToDefault = () => {
    layout.value = { ...DEFAULT_THEME_CONFIG.layout }
    customization.value = { ...DEFAULT_THEME_CONFIG.customization }
  }

  // 初始化
  const initialize = () => {
    loadFromStorage()
  }

  return {
    // 状态
    layout,
    customization,

    // 计算属性
    antdThemeConfig,

    // 方法
    setPrimaryColor,
    setComponentSize,
    setBorderRadius,
    setFontSize,
    toggleSidebarCollapsed,
    setSidebarWidth,
    setHeaderHeight,
    setContentPadding,
    resetToDefault,
    initialize
  }
})