# 部署指南

## 🚀 Vercel 部署

### 方法一：通过 Vercel Dashboard

1. **连接 GitHub 仓库**
   - 访问 [Vercel Dashboard](https://vercel.com/dashboard)
   - 点击 "New Project"
   - 选择 GitHub 并授权
   - 选择 `vue3-supabase-admin-template` 仓库

2. **配置项目设置**
   - Framework Preset: `Vite`
   - Build Command: `pnpm run build`
   - Output Directory: `dist`
   - Install Command: `pnpm install`

3. **配置环境变量**
   在 Vercel 项目设置中添加以下环境变量：
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   VITE_APP_TITLE=Supabase Web App
   VITE_APP_DESCRIPTION=A modern Vue3 web application with Supabase backend
   ```

4. **部署**
   - 点击 "Deploy" 按钮
   - 等待构建完成

### 方法二：通过 Vercel CLI

1. **安装 Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **登录 Vercel**
   ```bash
   vercel login
   ```

3. **部署项目**
   ```bash
   # 在项目根目录执行
   vercel
   
   # 首次部署时会询问配置
   # 选择 "Link to existing project" 或 "Create new project"
   ```

4. **设置环境变量**
   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   vercel env add VITE_APP_TITLE
   vercel env add VITE_APP_DESCRIPTION
   ```

5. **重新部署**
   ```bash
   vercel --prod
   ```

### 环境变量配置说明

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `VITE_SUPABASE_URL` | Supabase 项目 URL | `https://xdzaxqvlsbcddeqmovfn.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase 匿名密钥 | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `VITE_APP_TITLE` | 应用标题 | `Supabase Web App` |
| `VITE_APP_DESCRIPTION` | 应用描述 | `A modern Vue3 web application` |

### 获取 Supabase 配置

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择您的项目
3. 进入 Settings → API
4. 复制 Project URL 和 anon public key

## 🌐 其他部署平台

### Netlify 部署

1. **连接 GitHub 仓库**
   - 访问 [Netlify](https://netlify.com)
   - 点击 "New site from Git"
   - 选择 GitHub 并授权
   - 选择仓库

2. **配置构建设置**
   ```
   Build command: pnpm run build
   Publish directory: dist
   ```

3. **配置环境变量**
   在 Site settings → Environment variables 中添加相同的环境变量

### GitHub Pages 部署

1. **安装 gh-pages**
   ```bash
   pnpm add -D gh-pages
   ```

2. **添加部署脚本**
   在 `package.json` 中添加：
   ```json
   {
     "scripts": {
       "deploy": "pnpm run build && gh-pages -d dist"
     }
   }
   ```

3. **部署**
   ```bash
   pnpm run deploy
   ```

### Docker 部署

1. **创建 Dockerfile**
   ```dockerfile
   FROM node:18-alpine AS builder
   
   WORKDIR /app
   COPY package*.json ./
   RUN npm install -g pnpm
   RUN pnpm install
   
   COPY . .
   RUN pnpm run build
   
   FROM nginx:alpine
   COPY --from=builder /app/dist /usr/share/nginx/html
   COPY nginx.conf /etc/nginx/nginx.conf
   
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

2. **创建 nginx.conf**
   ```nginx
   events {
     worker_connections 1024;
   }
   
   http {
     include /etc/nginx/mime.types;
     default_type application/octet-stream;
   
     server {
       listen 80;
       server_name localhost;
       root /usr/share/nginx/html;
       index index.html;
   
       location / {
         try_files $uri $uri/ /index.html;
       }
     }
   }
   ```

3. **构建和运行**
   ```bash
   docker build -t vue3-supabase-app .
   docker run -p 80:80 vue3-supabase-app
   ```

## 🔧 部署故障排除

### 常见问题

1. **环境变量未生效**
   - 确保环境变量名以 `VITE_` 开头
   - 重新部署项目以应用新的环境变量

2. **路由 404 错误**
   - 确保配置了 SPA 重写规则
   - Vercel: `vercel.json` 中的 rewrites 配置
   - Netlify: `_redirects` 文件

3. **构建失败**
   - 检查 Node.js 版本是否兼容
   - 确保所有依赖都已正确安装
   - 检查 TypeScript 类型错误

4. **Supabase 连接失败**
   - 验证 Supabase URL 和 API Key 是否正确
   - 检查 Supabase 项目是否已启用
   - 确认网络连接正常

### 性能优化

1. **启用 Gzip 压缩**
2. **配置 CDN 缓存**
3. **优化图片资源**
4. **代码分割和懒加载**

### 监控和分析

1. **Vercel Analytics**
   - 在 Vercel Dashboard 中启用 Analytics
   - 监控页面性能和用户行为

2. **错误监控**
   - 集成 Sentry 或其他错误监控服务
   - 配置错误报告和告警

## 📊 部署检查清单

- [ ] 环境变量已正确配置
- [ ] Supabase 项目已创建并配置
- [ ] 构建命令和输出目录正确
- [ ] SPA 路由重写规则已配置
- [ ] SSL 证书已启用
- [ ] 自定义域名已配置（可选）
- [ ] 性能监控已启用
- [ ] 错误监控已配置

## 🔄 持续部署

### 自动部署

- **Vercel**: 推送到 main 分支自动触发部署
- **Netlify**: 支持分支部署和预览部署
- **GitHub Actions**: 自定义 CI/CD 流程

### 分支策略

- `main`: 生产环境
- `develop`: 开发环境
- `feature/*`: 功能分支（预览部署）

通过以上配置，您的 Vue3 + Supabase 应用就可以成功部署到各种平台了！