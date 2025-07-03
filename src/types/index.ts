// 导出所有类型定义
export * from './auth'
export * from './theme'
export * from './profile'
export * from './database'

// 通用API响应接口
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    message: string
    code?: string
    status?: number
  }
}

// 分页接口
export interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

// 通用列表响应接口
export interface ListResponse<T> extends ApiResponse<T[]> {
  pagination?: Pagination
}

// 应用配置接口
export interface AppConfig {
  title: string
  description: string
  version: string
}