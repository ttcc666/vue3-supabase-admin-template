-- =====================================================
-- Vue3 Supabase Admin Template - 完整应用数据库初始化脚本
-- 版本: 2.0
-- 创建时间: 2025-07-04
-- 
-- 功能说明:
-- 1. 用户资料管理系统 (profiles表)
-- 2. 用户活动记录系统 (user_activities表)  
-- 3. 用户设置管理系统 (user_settings表)
-- 4. 完整的RLS策略和权限管理
-- 5. Storage配置支持头像上传
-- 6. 实时订阅配置
-- 7. 智能用户名生成和活动记录功能
-- 8. 可选的定时清理任务
-- 
-- 执行要求: 在全新的Supabase项目中一次性执行
-- 依赖: 无(自包含脚本)
-- 兼容性: 支持重复执行，使用IF NOT EXISTS语句
-- =====================================================

-- 开始事务以确保原子性
BEGIN;

-- 显示开始信息
DO $$ BEGIN
    RAISE NOTICE '🚀 开始初始化 Vue3 Supabase Admin Template 数据库...';
    RAISE NOTICE '📅 执行时间: %', NOW();
END $$;

-- =====================================================
-- 第一部分: 创建枚举类型
-- =====================================================

-- 创建活动类型枚举
DO $$ BEGIN
    CREATE TYPE activity_type AS ENUM (
      'login',              -- 登录
      'logout',             -- 登出
      'profile_update',     -- 更新个人资料
      'password_change',    -- 修改密码
      'avatar_upload',      -- 上传头像
      'email_change',       -- 修改邮箱
      'phone_update',       -- 更新手机号
      'security_setting',   -- 安全设置变更
      'account_setting'     -- 账户设置变更
    );
    RAISE NOTICE '✅ Created activity_type enum';
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE '⚠️  activity_type enum already exists, skipping';
END $$;

-- 创建设置分类枚举
DO $$ BEGIN
    CREATE TYPE setting_category AS ENUM (
      'system',         -- 系统设置：语言、时区、日期格式
      'notification',   -- 通知设置：邮件、浏览器、短信、营销通知
      'privacy'         -- 隐私设置：资料可见性、活动状态、数据分析
    );
    RAISE NOTICE '✅ Created setting_category enum';
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE '⚠️  setting_category enum already exists, skipping';
END $$;

-- =====================================================
-- 第二部分: 创建辅助函数
-- =====================================================

-- 创建用户名生成函数
CREATE OR REPLACE FUNCTION public.generate_valid_username(email TEXT, meta_username TEXT DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INTEGER := 0;
  max_attempts INTEGER := 100;
BEGIN
  -- 如果提供了 meta_username 且符合格式，直接使用
  IF meta_username IS NOT NULL AND meta_username ~ '^[a-zA-Z0-9_-]+$' AND char_length(meta_username) >= 3 THEN
    -- 检查是否已存在
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE username = meta_username) THEN
      RETURN meta_username;
    END IF;
    base_username := meta_username;
  ELSE
    -- 从 email 生成基础用户名
    base_username := split_part(email, '@', 1);
    -- 移除不符合格式的字符，只保留字母、数字、下划线、连字符
    base_username := regexp_replace(base_username, '[^a-zA-Z0-9_-]', '', 'g');
    -- 确保至少3个字符
    IF char_length(base_username) < 3 THEN
      base_username := 'user' || base_username;
    END IF;
  END IF;
  
  -- 尝试使用基础用户名
  final_username := base_username;
  
  -- 如果用户名已存在，添加数字后缀
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) AND counter < max_attempts LOOP
    counter := counter + 1;
    final_username := base_username || counter;
  END LOOP;
  
  -- 如果仍然冲突，使用随机后缀
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) THEN
    final_username := base_username || '_' || substr(md5(random()::text), 1, 6);
  END IF;
  
  RETURN final_username;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建更新时间戳函数
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

RAISE NOTICE '✅ Created utility functions';

-- =====================================================
-- 第三部分: 创建用户资料表 (profiles)
-- =====================================================

-- 创建用户资料表
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(30) UNIQUE,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  full_name VARCHAR(100) GENERATED ALWAYS AS (
    CASE
      WHEN first_name IS NOT NULL AND last_name IS NOT NULL THEN
        CONCAT(first_name, ' ', last_name)
      WHEN first_name IS NOT NULL THEN
        first_name
      WHEN last_name IS NOT NULL THEN
        last_name
      ELSE
        username
    END
  ) STORED,
  phone VARCHAR(20),
  website VARCHAR(255),
  bio TEXT,
  avatar_url VARCHAR(500),
  birthday DATE,
  country VARCHAR(100),
  city VARCHAR(100),
  address TEXT,
  github_url VARCHAR(255),
  linkedin_url VARCHAR(255),
  twitter_url VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- 约束条件
  CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_-]+$'),
  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30),
  CONSTRAINT phone_format CHECK (phone IS NULL OR phone ~ '^\+?[1-9]\d{1,14}$'),
  CONSTRAINT website_format CHECK (website IS NULL OR website ~ '^https?://'),
  CONSTRAINT bio_length CHECK (char_length(bio) <= 500),
  CONSTRAINT birthday_valid CHECK (birthday IS NULL OR birthday <= CURRENT_DATE),
  CONSTRAINT github_url_format CHECK (github_url IS NULL OR github_url ~ '^https://github\.com/'),
  CONSTRAINT linkedin_url_format CHECK (linkedin_url IS NULL OR linkedin_url ~ '^https://linkedin\.com/'),
  CONSTRAINT twitter_url_format CHECK (twitter_url IS NULL OR twitter_url ~ '^https://twitter\.com/')
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON public.profiles(updated_at);

-- 创建触发器
DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

RAISE NOTICE '✅ Created profiles table with indexes and triggers';

-- =====================================================
-- 第四部分: 创建用户活动记录表 (user_activities)
-- =====================================================

-- 创建用户活动记录表
CREATE TABLE IF NOT EXISTS public.user_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type activity_type NOT NULL,
  activity_title VARCHAR(100) NOT NULL,
  activity_description TEXT,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- 约束
  CONSTRAINT user_activities_title_not_empty CHECK (LENGTH(TRIM(activity_title)) > 0),
  CONSTRAINT user_activities_metadata_valid CHECK (jsonb_typeof(metadata) = 'object')
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON public.user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON public.user_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON public.user_activities(created_at);
CREATE INDEX IF NOT EXISTS idx_user_activities_user_type ON public.user_activities(user_id, activity_type);

RAISE NOTICE '✅ Created user_activities table with indexes';

-- =====================================================
-- 第五部分: 创建用户设置表 (user_settings)
-- =====================================================

-- 创建用户设置表
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 设置分类和键值
  category setting_category NOT NULL,
  setting_key VARCHAR(100) NOT NULL,
  setting_value JSONB NOT NULL DEFAULT '{}',

  -- 元数据
  description TEXT,
  is_active BOOLEAN DEFAULT true,

  -- 系统字段
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- 约束
  CONSTRAINT user_settings_unique_key UNIQUE(user_id, category, setting_key),
  CONSTRAINT setting_key_format CHECK (setting_key ~ '^[a-zA-Z][a-zA-Z0-9_]*$'),
  CONSTRAINT setting_key_length CHECK (char_length(setting_key) >= 2 AND char_length(setting_key) <= 100),
  CONSTRAINT setting_value_valid CHECK (jsonb_typeof(setting_value) IN ('object', 'string', 'boolean', 'number')),
  CONSTRAINT description_length CHECK (char_length(description) <= 500)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_category ON public.user_settings(category);
CREATE INDEX IF NOT EXISTS idx_user_settings_key ON public.user_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_category ON public.user_settings(user_id, category);
CREATE INDEX IF NOT EXISTS idx_user_settings_active ON public.user_settings(is_active) WHERE is_active = true;

-- 创建触发器
DROP TRIGGER IF EXISTS trigger_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER trigger_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

RAISE NOTICE '✅ Created user_settings table with indexes and triggers';

-- =====================================================
-- 第六部分: 创建业务函数
-- =====================================================

-- 活动记录函数
CREATE OR REPLACE FUNCTION public.log_user_activity(
  p_user_id UUID,
  p_activity_type activity_type,
  p_activity_title VARCHAR(100),
  p_activity_description TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO public.user_activities (
    user_id,
    activity_type,
    activity_title,
    activity_description,
    ip_address,
    user_agent,
    metadata
  ) VALUES (
    p_user_id,
    p_activity_type,
    p_activity_title,
    p_activity_description,
    p_ip_address,
    p_user_agent,
    p_metadata
  ) RETURNING id INTO activity_id;

  RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 用户设置获取函数
CREATE OR REPLACE FUNCTION public.get_user_setting(
  p_category setting_category,
  p_setting_key VARCHAR(100),
  p_default_value JSONB DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT setting_value INTO result
  FROM public.user_settings
  WHERE user_id = auth.uid()
    AND category = p_category
    AND setting_key = p_setting_key
    AND is_active = true;

  RETURN COALESCE(result, p_default_value);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 用户设置更新函数
CREATE OR REPLACE FUNCTION public.update_user_setting(
  p_category setting_category,
  p_setting_key VARCHAR(100),
  p_setting_value JSONB,
  p_description TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO public.user_settings (
    user_id,
    category,
    setting_key,
    setting_value,
    description
  ) VALUES (
    auth.uid(),
    p_category,
    p_setting_key,
    p_setting_value,
    p_description
  )
  ON CONFLICT (user_id, category, setting_key)
  DO UPDATE SET
    setting_value = EXCLUDED.setting_value,
    description = COALESCE(EXCLUDED.description, user_settings.description),
    updated_at = NOW();

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

RAISE NOTICE '✅ Created business functions';

-- =====================================================
-- 第七部分: 创建RLS策略
-- =====================================================

-- 启用RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- profiles表RLS策略
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- user_activities表RLS策略
DROP POLICY IF EXISTS "Users can view own activities" ON public.user_activities;
CREATE POLICY "Users can view own activities" ON public.user_activities
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own activities" ON public.user_activities;
CREATE POLICY "Users can insert own activities" ON public.user_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- user_settings表RLS策略
DROP POLICY IF EXISTS "Users can view own settings" ON public.user_settings;
CREATE POLICY "Users can view own settings" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;
CREATE POLICY "Users can update own settings" ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own settings" ON public.user_settings;
CREATE POLICY "Users can insert own settings" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own settings" ON public.user_settings;
CREATE POLICY "Users can delete own settings" ON public.user_settings
  FOR DELETE USING (auth.uid() = user_id);

RAISE NOTICE '✅ Created RLS policies for all tables';

-- =====================================================
-- 第八部分: 创建视图和统计函数
-- =====================================================

-- 最近活动视图
CREATE OR REPLACE VIEW public.recent_user_activities AS
SELECT
  ua.id,
  ua.user_id,
  ua.activity_type,
  ua.activity_title,
  ua.activity_description,
  ua.ip_address,
  ua.user_agent,
  ua.metadata,
  ua.created_at,
  CASE ua.activity_type
    WHEN 'login' THEN '登录系统'
    WHEN 'logout' THEN '退出登录'
    WHEN 'profile_update' THEN '更新资料'
    WHEN 'password_change' THEN '修改密码'
    WHEN 'avatar_upload' THEN '上传头像'
    WHEN 'email_change' THEN '修改邮箱'
    WHEN 'phone_update' THEN '更新手机'
    WHEN 'security_setting' THEN '安全设置'
    WHEN 'account_setting' THEN '账户设置'
    ELSE '其他操作'
  END AS activity_type_display
FROM public.user_activities ua
WHERE ua.user_id = auth.uid()
ORDER BY ua.created_at DESC
LIMIT 50;

-- 用户活动统计函数
CREATE OR REPLACE FUNCTION public.get_user_activity_stats(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  total_activities BIGINT,
  activities_today BIGINT,
  activities_this_week BIGINT,
  activities_this_month BIGINT,
  most_common_activity activity_type,
  last_activity_time TIMESTAMPTZ
) AS $$
DECLARE
  target_user_id UUID;
BEGIN
  target_user_id := COALESCE(p_user_id, auth.uid());

  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_activities,
    COUNT(CASE WHEN DATE(ua.created_at) = CURRENT_DATE THEN 1 END)::BIGINT as activities_today,
    COUNT(CASE WHEN ua.created_at >= DATE_TRUNC('week', NOW()) THEN 1 END)::BIGINT as activities_this_week,
    COUNT(CASE WHEN ua.created_at >= DATE_TRUNC('month', NOW()) THEN 1 END)::BIGINT as activities_this_month,
    (
      SELECT ua2.activity_type
      FROM public.user_activities ua2
      WHERE ua2.user_id = target_user_id
      GROUP BY ua2.activity_type
      ORDER BY COUNT(*) DESC
      LIMIT 1
    ) as most_common_activity,
    MAX(ua.created_at) as last_activity_time
  FROM public.user_activities ua
  WHERE ua.user_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

RAISE NOTICE '✅ Created views and statistics functions';

-- =====================================================
-- 第九部分: Storage配置
-- =====================================================

-- 创建avatars存储桶
DO $$ BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'avatars',
    'avatars',
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  );
  RAISE NOTICE '✅ Created avatars storage bucket';
EXCEPTION
  WHEN unique_violation THEN
    RAISE NOTICE '⚠️  avatars bucket already exists, skipping';
END $$;

-- Storage RLS策略
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

RAISE NOTICE '✅ Created storage policies';

-- =====================================================
-- 第十部分: 实时订阅配置
-- =====================================================

-- 启用实时订阅
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_activities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_settings;

RAISE NOTICE '✅ Enabled realtime subscriptions';

-- =====================================================
-- 第十一部分: 插入默认数据
-- =====================================================

-- 为当前用户插入默认设置（如果用户已登录）
DO $$
DECLARE
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();

  IF current_user_id IS NOT NULL THEN
    -- 插入默认系统设置
    INSERT INTO public.user_settings (user_id, category, setting_key, setting_value, description) VALUES
    (current_user_id, 'system', 'language', '"zh-CN"', '界面显示语言'),
    (current_user_id, 'system', 'timezone', '"Asia/Shanghai"', '用户时区设置'),
    (current_user_id, 'system', 'dateFormat', '"YYYY-MM-DD"', '日期显示格式')
    ON CONFLICT (user_id, category, setting_key) DO NOTHING;

    -- 插入默认通知设置
    INSERT INTO public.user_settings (user_id, category, setting_key, setting_value, description) VALUES
    (current_user_id, 'notification', 'email', 'true', '邮件通知开关'),
    (current_user_id, 'notification', 'browser', 'true', '浏览器通知开关'),
    (current_user_id, 'notification', 'sms', 'false', '短信通知开关'),
    (current_user_id, 'notification', 'marketing', 'false', '营销邮件开关')
    ON CONFLICT (user_id, category, setting_key) DO NOTHING;

    -- 插入默认隐私设置
    INSERT INTO public.user_settings (user_id, category, setting_key, setting_value, description) VALUES
    (current_user_id, 'privacy', 'profileVisibility', '"public"', '个人资料可见性'),
    (current_user_id, 'privacy', 'showOnlineStatus', 'true', '显示在线状态'),
    (current_user_id, 'privacy', 'allowAnalytics', 'true', '允许数据分析')
    ON CONFLICT (user_id, category, setting_key) DO NOTHING;

    RAISE NOTICE '✅ Inserted default settings for current user: %', current_user_id;
  ELSE
    RAISE NOTICE '⚠️  No authenticated user found, skipping default settings insertion';
  END IF;
END $$;

-- =====================================================
-- 第十二部分: 清理和维护函数
-- =====================================================

-- 清理旧活动记录函数
CREATE OR REPLACE FUNCTION public.cleanup_old_activities()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.user_activities
  WHERE created_at < NOW() - INTERVAL '3 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RAISE NOTICE 'Cleaned up % old activity records', deleted_count;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 获取用户资料函数
CREATE OR REPLACE FUNCTION public.get_profile(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  username VARCHAR(30),
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  full_name VARCHAR(100),
  phone VARCHAR(20),
  website VARCHAR(255),
  bio TEXT,
  avatar_url VARCHAR(500),
  birthday DATE,
  country VARCHAR(100),
  city VARCHAR(100),
  address TEXT,
  github_url VARCHAR(255),
  linkedin_url VARCHAR(255),
  twitter_url VARCHAR(255),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
DECLARE
  target_user_id UUID;
BEGIN
  target_user_id := COALESCE(p_user_id, auth.uid());

  RETURN QUERY
  SELECT p.*
  FROM public.profiles p
  WHERE p.id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 可选：创建定时清理任务（需要pg_cron扩展）
DO $$ BEGIN
  -- 检查pg_cron扩展是否可用
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron') THEN
    -- 尝试创建扩展
    CREATE EXTENSION IF NOT EXISTS pg_cron;

    -- 删除可能存在的旧任务
    PERFORM cron.unschedule('cleanup-old-activities');

    -- 创建每日清理任务（每天凌晨2点执行）
    PERFORM cron.schedule(
      'cleanup-old-activities',
      '0 2 * * *',
      'SELECT public.cleanup_old_activities();'
    );

    RAISE NOTICE '✅ Created scheduled cleanup task (daily at 2 AM)';
  ELSE
    RAISE NOTICE '⚠️  pg_cron extension not available, skipping scheduled cleanup';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '⚠️  Could not create scheduled cleanup task: %', SQLERRM;
END $$;

RAISE NOTICE '✅ Created maintenance functions';

-- =====================================================
-- 第十三部分: 添加注释和完成
-- =====================================================

-- 表注释
COMMENT ON TABLE public.profiles IS '用户资料表，存储用户的个人信息和联系方式';
COMMENT ON TABLE public.user_activities IS '用户活动记录表，记录用户的关键操作行为';
COMMENT ON TABLE public.user_settings IS '用户设置表，存储用户的个性化配置';

-- 函数注释
COMMENT ON FUNCTION public.generate_valid_username(TEXT, TEXT) IS '生成符合约束的有效用户名';
COMMENT ON FUNCTION public.log_user_activity(UUID, activity_type, VARCHAR, TEXT, INET, TEXT, JSONB) IS '记录用户活动的辅助函数';
COMMENT ON FUNCTION public.get_user_activity_stats(UUID) IS '获取用户活动统计信息';
COMMENT ON FUNCTION public.get_profile(UUID) IS '获取用户资料信息';
COMMENT ON FUNCTION public.cleanup_old_activities() IS '清理超过3天的用户活动记录';
COMMENT ON FUNCTION public.get_user_setting(setting_category, VARCHAR, JSONB) IS '获取用户设置值';
COMMENT ON FUNCTION public.update_user_setting(setting_category, VARCHAR, JSONB, TEXT) IS '更新用户设置值';

-- 提交事务
COMMIT;

-- 显示完成信息
DO $$ BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ===============================================';
    RAISE NOTICE '🎉 Vue3 Supabase Admin Template 数据库初始化完成！';
    RAISE NOTICE '🎉 ===============================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ 已创建的表:';
    RAISE NOTICE '   📋 profiles - 用户资料表';
    RAISE NOTICE '   📊 user_activities - 用户活动记录表';
    RAISE NOTICE '   ⚙️  user_settings - 用户设置表';
    RAISE NOTICE '';
    RAISE NOTICE '✅ 已创建的功能:';
    RAISE NOTICE '   🔐 完整的RLS策略';
    RAISE NOTICE '   📁 Storage配置（头像上传）';
    RAISE NOTICE '   🔄 实时订阅';
    RAISE NOTICE '   🛠️  业务函数和触发器';
    RAISE NOTICE '   📈 统计和视图';
    RAISE NOTICE '   🧹 自动清理机制';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 您的应用现在可以使用以下功能:';
    RAISE NOTICE '   👤 用户资料管理';
    RAISE NOTICE '   📝 活动记录追踪';
    RAISE NOTICE '   ⚙️  个性化设置';
    RAISE NOTICE '   🖼️  头像上传';
    RAISE NOTICE '   🔄 实时数据同步';
    RAISE NOTICE '';
    RAISE NOTICE '📅 初始化完成时间: %', NOW();
    RAISE NOTICE '🎉 ===============================================';
END $$;
