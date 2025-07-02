# Supabase Web App

一个基于 Vue 3 + TypeScript + Vite + Supabase 构建的现代化 Web 应用，采用模块化架构设计，提供完整的用户认证和管理功能。

## ✨ 特性

- 🚀 **现代技术栈**: Vue 3 + TypeScript + Vite + Pinia
- 🎨 **UI 组件库**: Ant Design Vue 4.x
- 🔐 **用户认证**: Supabase Auth (登录/注册/密码重置)
- 📱 **响应式设计**: 支持桌面端和移动端
- 🏗️ **模块化架构**: 按功能模块组织代码结构
- 🎯 **TypeScript**: 完整的类型安全支持
- 🔄 **状态管理**: Pinia 状态管理
- 🛣️ **路由管理**: Vue Router 嵌套路由
- 🎨 **主题定制**: 主色调、布局、样式个性化配置
- 🌐 **一键部署**: 支持 Vercel、Netlify 等平台

## 🛠️ 技术栈

### 核心技术

- **前端框架**: Vue 3 (Composition API)
- **构建工具**: Vite 5.x
- **类型系统**: TypeScript
- **UI 组件**: Ant Design Vue 4.x
- **状态管理**: Pinia
- **路由管理**: Vue Router 4.x
- **后端服务**: Supabase (认证 + 数据库)
- **包管理器**: pnpm
- **开发端口**: 8888

### 架构特点

- **模块化设计**: 按功能模块组织代码
- **嵌套路由**: MainLayout + 子路由结构
- **响应式布局**: 固定侧边栏 + 动态内容区
- **类型安全**: 完整的 TypeScript 类型定义

## 🚀 快速开始

### 环境要求

- Node.js 18.18.1+
- pnpm 8.0+

### 安装依赖

```bash
pnpm install
```

### 环境配置

1. 复制环境变量文件：
```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，填入您的 Supabase 配置：
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_APP_TITLE=Supabase Web App
VITE_APP_DESCRIPTION=A modern Vue3 web application with Supabase backend
```

### 启动开发服务器

```bash
pnpm dev
```

应用将在 http://localhost:8888 启动。

## 🏗️ 项目架构

### 文件结构

```
src/
├── layouts/                 # 布局组件
│   └── MainLayout.vue      # 主布局 (侧边栏 + 头部 + 内容区)
├── views/                  # 页面组件 (按模块组织)
│   ├── auth/              # 认证模块
│   │   └── AuthView.vue   # 登录/注册/密码重置
│   ├── dashboard/         # 仪表板模块
│   │   └── DashboardView.vue  # 数据概览 + 快速操作
│   ├── profile/           # 个人资料模块
│   │   └── ProfileView.vue    # 个人信息 + 账户安全
│   └── settings/          # 设置模块
│       └── SettingsView.vue   # 系统设置 + 通知设置
├── stores/                # 状态管理
│   └── auth.ts           # 认证状态
├── types/                 # TypeScript 类型定义
│   └── auth.ts           # 认证相关类型
├── router/               # 路由配置
│   └── index.ts          # 嵌套路由 + 路由守卫
├── lib/                  # 第三方库配置
│   └── supabase.ts       # Supabase 客户端
├── assets/               # 静态资源
│   ├── main.css         # 全局样式
│   └── base.css         # 基础样式
├── components/           # 可复用组件
│   └── Auth/            # 认证相关组件
└── main.ts               # 应用入口
```

### 路由结构

```
/auth                    # 认证页面 (独立布局)
/                       # 主应用 (MainLayout)
├── /                   # 仪表板 (默认页面)
├── /profile           # 个人资料
└── /settings          # 系统设置
```

## 📋 功能模块

### 🔐 认证模块 (`/auth`)

- **用户登录**: 邮箱 + 密码登录
- **用户注册**: 邮箱验证注册
- **密码重置**: 邮箱重置密码
- **表单验证**: 实时表单验证
- **错误处理**: 友好的错误提示

### 📊 仪表板模块 (`/`)

- **欢迎卡片**: 个性化欢迎信息
- **数据统计**: 访问量、用户数、活跃度
- **快速操作**: 常用功能快捷入口
- **数据概览**: 图表展示 (占位符)

### 👤 个人资料模块 (`/profile`)

- **基本信息**: 头像、用户名、联系方式
- **账户安全**: 密码修改、邮箱验证、两步验证
- **操作记录**: 最近登录和操作历史
- **表单管理**: 信息编辑和保存

### ⚙️ 设置模块 (`/settings`)

- **系统设置**: 语言、主题、时区、日期格式
- **通知设置**: 邮件、浏览器、短信、营销通知
- **隐私设置**: 资料可见性、活动状态、数据分析
- **数据管理**: 设置导出、重置功能

## 🎨 UI/UX 特性

### 布局设计

- **固定侧边栏**: 支持折叠/展开
- **响应式头部**: 面包屑导航 + 用户菜单
- **动态内容区**: 路由切换时保持布局状态
- **移动端适配**: 自适应不同屏幕尺寸

### 交互体验

- **平滑动画**: 侧边栏折叠、页面切换动画
- **状态反馈**: Loading 状态、成功/错误提示
- **键盘支持**: 表单快捷键操作
- **无障碍**: 语义化 HTML + ARIA 标签

### 主题系统

- **浅色主题**: 默认主题
- **深色主题**: 护眼模式 (开发中)
- **自动切换**: 跟随系统主题 (开发中)

## 🔧 开发指南

### 添加新模块

1. 在 `src/views/` 下创建模块文件夹
2. 创建 `ModuleView.vue` 组件
3. 在路由中添加子路由配置
4. 在侧边栏菜单中添加导航项

### 状态管理

使用 Pinia 进行状态管理：

```typescript
// stores/example.ts
import { defineStore } from 'pinia'

export const useExampleStore = defineStore('example', () => {
  // 状态定义
  // 计算属性
  // 方法定义
})
```

### 类型定义

在 `src/types/` 下定义 TypeScript 类型：

```typescript
// types/example.ts
export interface ExampleType {
  id: string
  name: string
}
```

### 样式规范

- 使用 scoped CSS 避免样式污染
- 遵循 BEM 命名规范
- 使用 CSS 变量定义主题色彩
- 响应式设计使用 Ant Design 的栅格系统

## 🚀 部署

### Vercel 部署

1. 连接 GitHub 仓库到 Vercel
2. 配置环境变量
3. 自动部署

### 其他平台

项目支持部署到任何支持静态文件的平台：
- Netlify
- GitHub Pages
- 阿里云 OSS
- 腾讯云 COS

## 📝 开发命令

```bash
# 启动开发服务器
pnpm run dev

# 构建生产版本
pnpm run build

# 预览生产构建
pnpm run preview

# 类型检查
pnpm run type-check

# 代码检查
pnpm run lint

# 代码格式化
pnpm run format
```

## 🔧 推荐的 IDE 设置

- [VSCode](https://code.visualstudio.com/)
- [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (禁用 Vetur)
- [TypeScript Vue Plugin](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin)

## 📚 相关文档

- [Vue 3 文档](https://vuejs.org/)
- [Vite 文档](https://vitejs.dev/)
- [Ant Design Vue 文档](https://antdv.com/)
- [Supabase 文档](https://supabase.com/docs)
- [Vercel 文档](https://vercel.com/docs)

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Ant Design Vue](https://antdv.com/) - 企业级 UI 组件库
- [Supabase](https://supabase.com/) - 开源 Firebase 替代方案
- [Vite](https://vitejs.dev/) - 下一代前端构建工具