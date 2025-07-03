# 🚀 完整用户资料和活动记录系统

## 📋 概述

这是一个完整的用户资料和活动记录系统，包含：

- ✅ **用户资料管理** (profiles表)
- ✅ **活动记录追踪** (user_activities表)  
- ✅ **智能用户名生成** (解决约束冲突)
- ✅ **行级安全策略** (RLS)
- ✅ **头像上传支持** (Storage配置)
- ✅ **自动清理机制** (可选定时任务)
- ✅ **完整的权限管理**

## 🎯 一键安装

### 方法1: 在Supabase Dashboard中执行

1. 登录到您的 [Supabase Dashboard](https://app.supabase.com)
2. 选择您的项目
3. 进入 **SQL Editor**
4. 复制 `sql/00_complete_setup.sql` 的全部内容
5. 粘贴并点击 **Run** 执行

### 方法2: 使用psql命令行

```bash
# 连接到您的Supabase数据库
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# 执行安装脚本
\i sql/00_complete_setup.sql
```

## ✅ 验证安装

执行完脚本后，您应该看到类似以下的成功消息：

```
🎉 Complete Setup Finished Successfully! 🎉
✅ All tables and types created successfully
✅ All functions created successfully  
✅ All RLS policies created successfully
```

## 🧪 测试功能

### 1. 启动应用
```bash
npm run dev
```

### 2. 注册/登录用户
- 访问应用并注册新用户
- 系统会自动创建用户资料
- 登录操作会被自动记录

### 3. 测试活动记录
- 访问个人资料页面
- 修改个人信息
- 上传头像
- 修改密码
- 查看"最近操作"部分

### 4. 数据库查询测试

```sql
-- 查看您的资料
SELECT * FROM public.get_profile();

-- 查看最近活动
SELECT * FROM public.recent_user_activities;

-- 查看活动统计
SELECT * FROM public.get_user_activity_stats();

-- 手动记录活动
SELECT public.log_user_activity(
  auth.uid(),
  'login'::activity_type,
  '测试登录',
  '这是一个测试活动记录'
);
```

## 🔧 功能特性

### 智能用户名生成
- 自动从邮箱生成符合约束的用户名
- 处理重复用户名（添加数字后缀）
- 移除不符合格式的字符
- 异常处理和回退机制

### 活动记录系统
- 自动记录登录/登出
- 记录资料更新操作
- 记录头像上传
- 记录密码修改
- 支持自定义元数据

### 数据安全
- 完整的RLS策略保护
- 用户只能访问自己的数据
- 活动记录不可修改/删除
- 安全的函数权限设置

### 自动清理
- 可选的定时清理任务（需要pg_cron）
- 自动删除3天前的活动记录
- 手动清理功能

## 🛠️ 故障排除

### 常见问题

**Q: 执行脚本时出现权限错误**
A: 确保您使用的是项目的postgres用户连接

**Q: pg_cron相关错误**
A: 这是正常的，脚本会自动检测并跳过定时任务创建

**Q: 用户创建失败**
A: 脚本已修复username_format约束问题，重新执行即可

**Q: Storage策略错误**
A: 确保avatars bucket存在，脚本会自动创建

### 手动修复

如果遇到问题，可以手动执行清理：

```sql
-- 清理旧的策略和对象
DROP TABLE IF EXISTS public.user_activities CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TYPE IF EXISTS activity_type CASCADE;

-- 然后重新执行安装脚本
```

## 📊 数据库结构

### profiles表
- 用户基本信息
- 联系方式
- 社交媒体链接
- 自动生成的全名字段

### user_activities表  
- 活动类型枚举
- 活动标题和描述
- IP地址和用户代理
- JSON元数据
- 时间戳

### 关键函数
- `generate_valid_username()` - 智能用户名生成
- `log_user_activity()` - 记录用户活动
- `get_user_activity_stats()` - 获取活动统计
- `cleanup_old_activities()` - 清理旧记录

## 🎉 完成！

安装完成后，您的应用就具备了完整的用户资料管理和活动记录功能。所有操作都会被自动追踪，用户可以在个人资料页面查看最近的操作历史。

如有问题，请检查Supabase Dashboard的日志或联系技术支持。
