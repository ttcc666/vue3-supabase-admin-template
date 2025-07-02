# 项目设置指南

## 快速开始

### 1. 克隆项目
```bash
git clone https://github.com/ttcc666/vue3-supabase-admin-template.git
cd vue3-supabase-admin-template
```

### 2. 安装依赖
```bash
pnpm install
```

### 3. 环境配置
复制环境变量模板文件：
```bash
cp .env.example .env
```

编辑 `.env` 文件，填入您的 Supabase 配置：
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_APP_TITLE=Supabase Web App
VITE_APP_DESCRIPTION=A modern Vue3 web application with Supabase backend
```

### 4. 启动开发服务器
```bash
pnpm dev
```

应用将在 http://localhost:8888 启动。

## 项目特性

✅ **已完成的功能**
- 🚀 Vue 3 + TypeScript + Vite 现代化技术栈
- 🎨 Ant Design Vue 4.x UI 组件库
- 🔐 Supabase 用户认证系统（登录/注册/密码重置）
- 📱 响应式设计，支持移动端
- 🏗️ 模块化架构，按功能组织代码
- 🎯 完整的 TypeScript 类型安全
- 🔄 Pinia 状态管理
- 🛣️ Vue Router 嵌套路由
- 🎨 主题定制系统（主色调、组件尺寸、布局配置）
- 🌐 Vercel 部署配置

✅ **核心页面**
- 认证页面（登录/注册/密码重置）
- 仪表板（数据概览、快速操作）
- 个人资料（基本信息、账户安全、操作记录）
- 设置页面（主题、布局、系统、通知、隐私设置）

✅ **组件架构**
- MainLayout（主布局组件）
- AuthView（认证页面）
- AuthForm（认证表单组件）
- ThemeDrawerContent（主题设置抽屉）
- DashboardView（仪表板）
- ProfileView（个人资料）
- SettingsView（设置页面）

## 技术栈详情

### 核心依赖
- **Vue 3.5.17** - 渐进式 JavaScript 框架
- **TypeScript 5.8.3** - 类型安全的 JavaScript
- **Vite 5.4.19** - 下一代前端构建工具
- **Ant Design Vue 4.x** - 企业级 UI 组件库
- **Pinia 3.0.3** - Vue 状态管理
- **Vue Router 4.5.1** - 官方路由管理器
- **Supabase 2.50.2** - 开源 Firebase 替代方案

### 开发工具
- **ESLint** - 代码质量检查
- **Prettier** - 代码格式化
- **Vue DevTools** - Vue 开发者工具
- **TypeScript** - 类型检查

## 部署

### Vercel 部署
1. 将项目推送到 GitHub
2. 在 Vercel 中导入项目
3. 配置环境变量
4. 自动部署

### 其他平台
项目支持部署到任何支持静态文件的平台：
- Netlify
- GitHub Pages
- 阿里云 OSS
- 腾讯云 COS

## 开发命令

```bash
# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 预览生产构建
pnpm preview

# 类型检查
pnpm type-check

# 代码检查
pnpm lint

# 代码格式化
pnpm format
```

## 注意事项

1. **依赖安装**：项目使用 pnpm 作为包管理器，请确保已安装 pnpm
2. **环境变量**：必须配置 Supabase 相关环境变量才能正常使用认证功能
3. **端口配置**：开发服务器默认使用 8888 端口
4. **浏览器支持**：支持现代浏览器，建议使用 Chrome、Firefox、Safari 最新版本

## 项目结构

```
src/
├── layouts/           # 布局组件
├── views/            # 页面组件（按模块组织）
├── components/       # 可复用组件
├── stores/           # Pinia 状态管理
├── types/            # TypeScript 类型定义
├── router/           # 路由配置
├── lib/              # 第三方库配置
├── assets/           # 静态资源
└── main.ts           # 应用入口
```

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License - 查看 LICENSE 文件了解详情