-- =====================================================
-- 完整的用户资料和活动记录系统设置脚本
-- 版本: 1.0
-- 创建时间: 2025-07-03
-- 
-- 功能说明:
-- 1. 创建用户资料表(profiles)和活动记录表(user_activities)
-- 2. 设置完整的RLS策略和权限管理
-- 3. 创建智能的用户名生成和活动记录功能
-- 4. 配置Storage策略支持头像上传
-- 5. 可选的定时清理任务(检测pg_cron可用性)
-- 
-- 执行要求: 在全新的Supabase项目中一次性执行
-- 依赖: 无(自包含脚本)
-- =====================================================

-- 开始事务以确保原子性
BEGIN;

-- =====================================================
-- 第一部分: 创建枚举类型和基础结构
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
    RAISE NOTICE 'Created activity_type enum';
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'activity_type enum already exists, skipping';
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

-- 创建活动记录清理函数
CREATE OR REPLACE FUNCTION public.cleanup_old_activities()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 删除超过3天的活动记录
  DELETE FROM public.user_activities 
  WHERE created_at < NOW() - INTERVAL '3 days';
  
  -- 记录清理日志
  RAISE NOTICE 'Cleaned up old user activities older than 3 days at %', NOW();
END;
$$;

-- =====================================================
-- 第三部分: 创建用户资料表(profiles)
-- =====================================================

-- 创建 profiles 表
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 基本信息
  username TEXT UNIQUE,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT GENERATED ALWAYS AS (
    CASE 
      WHEN first_name IS NOT NULL AND last_name IS NOT NULL 
      THEN first_name || ' ' || last_name
      WHEN first_name IS NOT NULL 
      THEN first_name
      WHEN last_name IS NOT NULL 
      THEN last_name
      ELSE username
    END
  ) STORED,
  
  -- 联系信息
  phone TEXT,
  website TEXT,
  
  -- 个人信息
  bio TEXT,
  avatar_url TEXT,
  birthday DATE,
  
  -- 地址信息
  country TEXT,
  city TEXT,
  address TEXT,
  
  -- 社交媒体
  github_url TEXT,
  linkedin_url TEXT,
  twitter_url TEXT,
  
  -- 系统字段
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- 主键
  PRIMARY KEY (id),
  
  -- 约束
  CONSTRAINT username_length CHECK (char_length(username) >= 3),
  CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_-]+$'),
  CONSTRAINT phone_format CHECK (phone IS NULL OR phone = '' OR phone ~ '^\+?[1-9]\d{1,14}$'),
  CONSTRAINT website_format CHECK (website ~ '^https?://' OR website IS NULL),
  CONSTRAINT bio_length CHECK (char_length(bio) <= 500)
);

RAISE NOTICE 'Created profiles table';

-- =====================================================
-- 第四部分: 创建用户活动记录表(user_activities)
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

RAISE NOTICE 'Created user_activities table';

-- =====================================================
-- 第五部分: 创建索引
-- =====================================================

-- profiles 表索引
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON public.profiles(updated_at);

-- user_activities 表索引
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON public.user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON public.user_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON public.user_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_user_created ON public.user_activities(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_recent ON public.user_activities(user_id, created_at DESC);

RAISE NOTICE 'Created all indexes';

-- =====================================================
-- 第六部分: 启用行级安全策略(RLS)
-- =====================================================

-- 启用 profiles 表的 RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 启用 user_activities 表的 RLS
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;

RAISE NOTICE 'Enabled RLS on all tables';

-- =====================================================
-- 第七部分: 创建RLS策略
-- =====================================================

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;

DROP POLICY IF EXISTS "Users can view own activities" ON public.user_activities;
DROP POLICY IF EXISTS "Users can insert own activities" ON public.user_activities;
DROP POLICY IF EXISTS "No updates allowed" ON public.user_activities;
DROP POLICY IF EXISTS "No deletes allowed" ON public.user_activities;

-- profiles 表的 RLS 策略
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile" ON public.profiles
  FOR DELETE USING (auth.uid() = id);

-- user_activities 表的 RLS 策略
CREATE POLICY "Users can view own activities" ON public.user_activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activities" ON public.user_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "No updates allowed" ON public.user_activities
  FOR UPDATE USING (false);

CREATE POLICY "No deletes allowed" ON public.user_activities
  FOR DELETE USING (false);

RAISE NOTICE 'Created all RLS policies';

-- =====================================================
-- 第八部分: 创建触发器函数和触发器
-- =====================================================

-- 创建新用户自动创建资料的触发器函数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  generated_username TEXT;
BEGIN
  -- 生成有效的用户名
  generated_username := public.generate_valid_username(
    NEW.email,
    NEW.raw_user_meta_data->>'username'
  );

  -- 插入用户资料
  INSERT INTO public.profiles (id, username, first_name, last_name, avatar_url)
  VALUES (
    NEW.id,
    generated_username,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- 如果仍然失败，使用更简单的回退方案
    INSERT INTO public.profiles (id, username, first_name, last_name, avatar_url)
    VALUES (
      NEW.id,
      'user_' || substr(NEW.id::text, 1, 8), -- 使用 UUID 前8位作为用户名
      NEW.raw_user_meta_data->>'first_name',
      NEW.raw_user_meta_data->>'last_name',
      NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建用户删除时清理资料的触发器函数
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.profiles WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器
DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_on_auth_user_created ON auth.users;
CREATE TRIGGER trigger_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS trigger_on_auth_user_deleted ON auth.users;
CREATE TRIGGER trigger_on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_delete();

RAISE NOTICE 'Created all triggers';

-- =====================================================
-- 第九部分: 创建Storage配置(头像上传)
-- =====================================================

-- 创建 avatars bucket（如果不存在）
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 删除可能存在的旧Storage策略
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- 创建 Storage 策略
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

RAISE NOTICE 'Configured Storage policies for avatars';

-- =====================================================
-- 第十部分: 创建业务函数
-- =====================================================

-- 创建记录用户活动的函数
CREATE OR REPLACE FUNCTION public.log_user_activity(
  p_user_id UUID,
  p_activity_type activity_type,
  p_activity_title VARCHAR(100),
  p_activity_description TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  activity_id UUID;
BEGIN
  -- 如果没有提供用户ID，使用当前认证用户
  IF p_user_id IS NULL THEN
    p_user_id := auth.uid();
  END IF;

  -- 确保有用户ID
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'User ID is required';
  END IF;

  -- 插入活动记录
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
$$;

-- 创建获取用户活动统计的函数
CREATE OR REPLACE FUNCTION public.get_user_activity_stats(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  total_activities BIGINT,
  activities_today BIGINT,
  activities_this_week BIGINT,
  activities_this_month BIGINT,
  most_common_activity activity_type,
  last_activity_time TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- 如果没有指定用户ID，使用当前认证用户
  target_user_id := COALESCE(p_user_id, auth.uid());

  -- 确保用户只能查看自己的统计信息
  IF target_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: You can only view your own activity statistics';
  END IF;

  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_activities,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::BIGINT as activities_today,
    COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('week', NOW()))::BIGINT as activities_this_week,
    COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', NOW()))::BIGINT as activities_this_month,
    MODE() WITHIN GROUP (ORDER BY activity_type) as most_common_activity,
    MAX(created_at) as last_activity_time
  FROM public.user_activities
  WHERE user_id = target_user_id;
END;
$$;

-- 创建获取用户资料的函数
CREATE OR REPLACE FUNCTION public.get_profile(user_id UUID DEFAULT auth.uid())
RETURNS TABLE (
  id UUID,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  phone TEXT,
  website TEXT,
  bio TEXT,
  avatar_url TEXT,
  birthday DATE,
  country TEXT,
  city TEXT,
  address TEXT,
  github_url TEXT,
  linkedin_url TEXT,
  twitter_url TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.username, p.first_name, p.last_name, p.full_name,
    p.phone, p.website, p.bio, p.avatar_url, p.birthday,
    p.country, p.city, p.address, p.github_url, p.linkedin_url, p.twitter_url,
    p.created_at, p.updated_at
  FROM public.profiles p
  WHERE p.id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

RAISE NOTICE 'Created all business functions';

-- =====================================================
-- 第十一部分: 创建视图
-- =====================================================

-- 创建最近用户活动视图
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
  -- 添加友好的时间显示
  CASE
    WHEN ua.created_at > NOW() - INTERVAL '1 hour' THEN '刚刚'
    WHEN ua.created_at > NOW() - INTERVAL '1 day' THEN
      EXTRACT(HOUR FROM NOW() - ua.created_at)::text || ' 小时前'
    WHEN ua.created_at > NOW() - INTERVAL '7 days' THEN
      EXTRACT(DAY FROM NOW() - ua.created_at)::text || ' 天前'
    ELSE TO_CHAR(ua.created_at, 'YYYY-MM-DD HH24:MI')
  END AS time_ago,
  -- 添加活动类型的中文描述
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

-- 创建用户资料统计视图
CREATE OR REPLACE VIEW public.profiles_with_stats AS
SELECT
  p.*,
  EXTRACT(YEAR FROM AGE(p.birthday)) AS age,
  CASE
    WHEN p.updated_at > NOW() - INTERVAL '7 days' THEN 'active'
    WHEN p.updated_at > NOW() - INTERVAL '30 days' THEN 'inactive'
    ELSE 'dormant'
  END AS activity_status
FROM public.profiles p;

RAISE NOTICE 'Created all views';

-- =====================================================
-- 第十二部分: 权限设置
-- =====================================================

-- 授权给认证用户
GRANT SELECT, INSERT ON public.user_activities TO authenticated;
GRANT USAGE ON TYPE activity_type TO authenticated;
GRANT SELECT ON public.recent_user_activities TO authenticated;
GRANT SELECT ON public.profiles_with_stats TO authenticated;

-- 授权执行函数
GRANT EXECUTE ON FUNCTION public.generate_valid_username(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_user_activity(UUID, activity_type, VARCHAR, TEXT, INET, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_activity_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_activities() TO postgres;

RAISE NOTICE 'Granted all permissions';

-- =====================================================
-- 第十三部分: 可选的定时清理任务
-- =====================================================

-- 检查pg_cron扩展是否可用并创建定时任务
DO $$
BEGIN
  -- 尝试创建定时任务
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- 先删除可能存在的旧任务
    PERFORM cron.unschedule('cleanup-user-activities')
    WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-user-activities');

    -- 创建新的定时任务
    PERFORM cron.schedule(
      'cleanup-user-activities',
      '0 2 */3 * *', -- 每3天的凌晨2点执行
      'SELECT public.cleanup_old_activities();'
    );

    RAISE NOTICE 'Created automatic cleanup job (runs every 3 days at 2 AM)';
  ELSE
    RAISE NOTICE 'pg_cron extension not available. You can manually run cleanup with: SELECT public.cleanup_old_activities();';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not create automatic cleanup job. You can manually run cleanup with: SELECT public.cleanup_old_activities();';
END $$;

-- =====================================================
-- 第十四部分: 添加注释
-- =====================================================

-- 表注释
COMMENT ON TABLE public.profiles IS '用户资料表，存储用户的个人信息';
COMMENT ON TABLE public.user_activities IS '用户活动记录表，记录用户的关键操作行为';

-- 函数注释
COMMENT ON FUNCTION public.generate_valid_username(TEXT, TEXT) IS '生成符合约束的有效用户名';
COMMENT ON FUNCTION public.log_user_activity(UUID, activity_type, VARCHAR, TEXT, INET, TEXT, JSONB) IS '记录用户活动的辅助函数';
COMMENT ON FUNCTION public.get_user_activity_stats(UUID) IS '获取用户活动统计信息';
COMMENT ON FUNCTION public.get_profile(UUID) IS '获取用户资料信息';
COMMENT ON FUNCTION public.cleanup_old_activities() IS '清理超过3天的用户活动记录';

-- 视图注释
COMMENT ON VIEW public.recent_user_activities IS '用户最近活动记录视图，包含友好的时间显示和中文描述';
COMMENT ON VIEW public.profiles_with_stats IS '用户资料统计视图，包含年龄和活跃状态';

RAISE NOTICE 'Added all comments';

-- =====================================================
-- 第十五部分: 验证安装
-- =====================================================

-- 验证表创建
DO $$
DECLARE
  profiles_exists BOOLEAN;
  activities_exists BOOLEAN;
  enum_exists BOOLEAN;
BEGIN
  -- 检查表是否存在
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) INTO profiles_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_activities'
  ) INTO activities_exists;

  -- 检查枚举类型是否存在
  SELECT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'activity_type'
  ) INTO enum_exists;

  -- 报告结果
  IF profiles_exists AND activities_exists AND enum_exists THEN
    RAISE NOTICE '✅ All tables and types created successfully';
  ELSE
    RAISE NOTICE '❌ Some tables or types are missing:';
    IF NOT profiles_exists THEN RAISE NOTICE '  - profiles table missing'; END IF;
    IF NOT activities_exists THEN RAISE NOTICE '  - user_activities table missing'; END IF;
    IF NOT enum_exists THEN RAISE NOTICE '  - activity_type enum missing'; END IF;
  END IF;
END $$;

-- 验证函数创建
DO $$
DECLARE
  function_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO function_count
  FROM information_schema.routines
  WHERE routine_schema = 'public'
  AND routine_name IN (
    'generate_valid_username',
    'log_user_activity',
    'get_user_activity_stats',
    'get_profile',
    'cleanup_old_activities',
    'handle_updated_at',
    'handle_new_user',
    'handle_user_delete'
  );

  IF function_count = 8 THEN
    RAISE NOTICE '✅ All functions created successfully';
  ELSE
    RAISE NOTICE '❌ Some functions are missing (expected 8, found %)', function_count;
  END IF;
END $$;

-- 验证RLS策略
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'user_activities');

  IF policy_count >= 8 THEN
    RAISE NOTICE '✅ All RLS policies created successfully';
  ELSE
    RAISE NOTICE '❌ Some RLS policies are missing (expected 8+, found %)', policy_count;
  END IF;
END $$;

-- 提交事务
COMMIT;

-- =====================================================
-- 安装完成报告
-- =====================================================

SELECT
  '🎉 Complete Setup Finished Successfully! 🎉' as status,
  NOW() as completed_at;

-- 显示创建的对象统计
SELECT
  'Database Objects Created:' as summary,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('profiles', 'user_activities')) as tables_created,
  (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public') as functions_created,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as policies_created,
  (SELECT COUNT(*) FROM information_schema.views WHERE table_schema = 'public') as views_created;

-- =====================================================
-- 使用说明
-- =====================================================

SELECT '📖 Quick Start Guide:' as guide;
SELECT '1. 🚀 Start your application: npm run dev' as step_1;
SELECT '2. 👤 Register/Login to create your first user' as step_2;
SELECT '3. 📝 Visit profile page to see activity tracking' as step_3;
SELECT '4. 🔍 Test activity logging with profile updates' as step_4;

-- =====================================================
-- 测试查询示例
-- =====================================================

SELECT '🧪 Test Queries:' as test_section;
SELECT '-- View your profile:' as query_1;
SELECT 'SELECT * FROM public.get_profile();' as query_1_sql;
SELECT '-- View recent activities:' as query_2;
SELECT 'SELECT * FROM public.recent_user_activities;' as query_2_sql;
SELECT '-- Get activity stats:' as query_3;
SELECT 'SELECT * FROM public.get_user_activity_stats();' as query_3_sql;
SELECT '-- Manual cleanup (if needed):' as query_4;
SELECT 'SELECT public.cleanup_old_activities();' as query_4_sql;

-- =====================================================
-- 脚本执行完成
-- =====================================================
