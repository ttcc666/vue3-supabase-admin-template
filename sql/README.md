# 🚀 Vue3 Supabase Admin Template 数据库脚本

## 📋 概述

这是一个完整的Vue3 Supabase管理模板数据库系统，包含：

- ✅ **用户资料管理** (profiles表)
- ✅ **用户活动记录** (user_activities表)
- ✅ **用户设置管理** (user_settings表)
- ✅ **智能用户名生成** (解决约束冲突)
- ✅ **行级安全策略** (RLS)
- ✅ **头像上传支持** (Storage配置)
- ✅ **实时同步支持** (Realtime)
- ✅ **自动清理机制** (可选定时任务)
- ✅ **完整的权限管理**

## 🎯 推荐安装方式

### 🌟 方法1: 完整应用初始化（推荐）

使用统一的初始化脚本，一次性创建所有功能：

1. 登录到您的 [Supabase Dashboard](https://app.supabase.com)
2. 选择您的项目
3. 进入 **SQL Editor**
4. 复制 `sql/complete_app_setup.sql` 的全部内容
5. 粘贴并点击 **Run** 执行

### 方法2: 仅用户设置系统

如果只需要用户设置功能：

1. 复制 `sql/03_user_settings_setup_simple.sql` 的内容
2. 在 SQL Editor 中执行

### 方法3: 使用psql命令行

```bash
# 连接到您的Supabase数据库
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# 执行完整初始化脚本
\i sql/complete_app_setup.sql
```

## ✅ 验证安装

### 完整安装成功消息

```text
🎉 Vue3 Supabase Admin Template 数据库初始化完成！
✅ 已创建的表:
   📋 profiles - 用户资料表
   📊 user_activities - 用户活动记录表
   ⚙️  user_settings - 用户设置表
✅ 已创建的功能:
   🔐 完整的RLS策略
   📁 Storage配置（头像上传）
   🔄 实时订阅
   🛠️  业务函数和触发器
```

## 🔧 约束修复

如果遇到 `setting_value_valid` 约束错误，请执行修复脚本：

```sql
-- 在 SQL Editor 中执行
\i sql/fix_constraint.sql
```

或者手动执行：

```sql
-- 删除旧约束
ALTER TABLE public.user_settings DROP CONSTRAINT IF EXISTS setting_value_valid;

-- 添加新约束（支持多种JSON类型）
ALTER TABLE public.user_settings ADD CONSTRAINT setting_value_valid 
CHECK (jsonb_typeof(setting_value) IN ('object', 'string', 'boolean', 'number'));
```

## 📊 数据库结构

### 核心表结构

#### profiles表 - 用户资料
- 用户基本信息（姓名、用户名、联系方式）
- 社交媒体链接（GitHub、LinkedIn、Twitter）
- 自动生成的全名字段
- 头像上传支持

#### user_activities表 - 活动记录
- 活动类型枚举（登录、登出、资料更新等）
- 活动标题和描述
- IP地址和用户代理
- JSON元数据
- 时间戳

#### user_settings表 - 用户设置
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 用户ID（外键） |
| category | setting_category | 设置分类 |
| setting_key | VARCHAR(100) | 设置键名 |
| setting_value | JSONB | 设置值 |
| description | TEXT | 设置描述 |
| is_active | BOOLEAN | 是否激活 |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间 |

### 枚举类型

#### activity_type - 活动类型
- `login` - 登录系统
- `logout` - 退出登录
- `profile_update` - 更新资料
- `password_change` - 修改密码
- `avatar_upload` - 上传头像
- `email_change` - 修改邮箱
- `phone_update` - 更新手机
- `security_setting` - 安全设置
- `account_setting` - 账户设置

#### setting_category - 设置分类
- `system` - 系统设置：语言、时区、日期格式
- `notification` - 通知设置：邮件、浏览器、短信、营销通知
- `privacy` - 隐私设置：资料可见性、活动状态、数据分析

### 关键函数
- `generate_valid_username()` - 智能用户名生成
- `log_user_activity()` - 记录用户活动
- `get_user_activity_stats()` - 获取活动统计
- `get_user_setting()` - 获取用户设置
- `update_user_setting()` - 更新用户设置
- `cleanup_old_activities()` - 清理旧记录

## 🛠️ 故障排除

### 常见问题

**Q: 执行脚本时出现权限错误**
A: 确保您使用的是项目的postgres用户连接

**Q: setting_value_valid约束错误**
A: 执行 `sql/fix_constraint.sql` 修复约束条件

**Q: 默认设置未创建**
A: 检查用户是否已登录，脚本需要在认证用户下执行

### 手动修复

如果遇到问题，可以手动执行清理：

```sql
-- 清理旧的设置表
DROP TABLE IF EXISTS public.user_settings CASCADE;
DROP TYPE IF EXISTS setting_category CASCADE;

-- 然后重新执行安装脚本
```

## 🎉 完成

安装完成后，您的应用就具备了完整的用户管理功能，包括：

- 👤 **用户资料管理** - 完整的个人信息管理
- 📝 **活动记录追踪** - 自动记录用户操作
- ⚙️ **个性化设置** - 灵活的用户配置系统
- 🖼️ **头像上传** - 安全的文件存储
- 🔄 **实时数据同步** - 即时更新体验

所有数据都会被安全地存储，并支持实时同步。

如有问题，请检查Supabase Dashboard的日志或联系技术支持。

## 📁 文件说明

- `complete_app_setup.sql` - 🌟 **推荐** 完整应用初始化脚本
- `03_user_settings_setup_simple.sql` - 仅用户设置系统
- `00_complete_setup.sql` - 用户资料和活动记录系统
- `02_system_validation_tests.sql` - 系统验证测试脚本
- `fix_constraint.sql` - 约束修复脚本
