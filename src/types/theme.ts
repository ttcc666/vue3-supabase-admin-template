// 组件尺寸类型
export type ComponentSize = 'small' | 'middle' | 'large'

// 预设主题色
export interface PresetColor {
  name: string
  value: string
  description: string
}

// 布局配置接口
export interface LayoutConfig {
  sidebarCollapsed: boolean
  sidebarWidth: number
  headerHeight: number
  contentPadding: number
}

// 样式自定义配置接口
export interface CustomizationConfig {
  primaryColor: string
  borderRadius: number
  fontSize: number
  componentSize: ComponentSize
}

// 主题状态接口
export interface ThemeState {
  // 布局配置
  layout: LayoutConfig

  // 样式自定义
  customization: CustomizationConfig
}

// 主题配置接口（用于 Ant Design Vue ConfigProvider）
export interface ThemeConfig {
  algorithm?: any
  token?: Record<string, any>
  components?: Record<string, any>
}

// 预设主题色列表
export const PRESET_COLORS: PresetColor[] = [
  { name: '拂晓蓝', value: '#1677ff', description: '默认主题色' },
  { name: '薄暮', value: '#fa541c', description: '温暖的橙色' },
  { name: '火山', value: '#fa8c16', description: '活力的橙色' },
  { name: '日暮', value: '#faad14', description: '明亮的黄色' },
  { name: '明青', value: '#13c2c2', description: '清新的青色' },
  { name: '极光绿', value: '#52c41a', description: '生机的绿色' },
  { name: '极客蓝', value: '#2f54eb', description: '专业的蓝色' },
  { name: '酱紫', value: '#722ed1', description: '神秘的紫色' },
  { name: '洋红', value: '#eb2f96', description: '浪漫的粉色' },
  { name: '红色', value: '#ff4d4f', description: '警示的红色' }
]

// 默认主题配置
export const DEFAULT_THEME_CONFIG: ThemeState = {
  layout: {
    sidebarCollapsed: false,
    sidebarWidth: 200,
    headerHeight: 64,
    contentPadding: 24
  },
  customization: {
    primaryColor: '#1677ff',
    borderRadius: 6,
    fontSize: 14,
    componentSize: 'middle'
  }
}