-- =====================================================
-- 完整系统功能测试脚本
-- 用于验证 profiles 表、user_activities 表和相关功能是否正常工作
-- 建议在执行 00_complete_setup.sql 后运行此脚本进行验证
-- =====================================================

-- 1. 检查表结构
\d public.profiles;

-- 2. 检查 RLS 策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- 3. 检查触发器
SELECT trigger_name, event_manipulation, action_timing, action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'profiles';

-- 4. 检查索引
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'profiles';

-- 5. 检查函数
SELECT routine_name, routine_type, data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%profile%';

-- 6. 检查视图
SELECT table_name, view_definition
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name LIKE '%profile%';

-- 7. 检查 Storage bucket
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets 
WHERE id = 'avatars';

-- 8. 检查 Storage 策略
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects';

-- =====================================================
-- 第二部分: 用户活动记录表测试
-- =====================================================

-- 1. 检查 user_activities 表结构
SELECT '=== USER_ACTIVITIES 表结构 ===' as section;
\d public.user_activities;

-- 2. 检查活动类型枚举
SELECT '=== ACTIVITY_TYPE 枚举值 ===' as section;
SELECT enumlabel as activity_types 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'activity_type')
ORDER BY enumlabel;

-- 3. 检查 user_activities RLS 策略
SELECT '=== USER_ACTIVITIES RLS策略 ===' as section;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'user_activities';

-- 4. 检查 user_activities 索引
SELECT '=== USER_ACTIVITIES 索引 ===' as section;
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'user_activities';

-- 5. 检查活动记录相关函数
SELECT '=== 活动记录相关函数 ===' as section;
SELECT routine_name, routine_type, data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND (routine_name LIKE '%activity%' OR routine_name LIKE '%cleanup%');

-- 6. 检查视图
SELECT '=== 活动记录相关视图 ===' as section;
SELECT table_name, view_definition
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name LIKE '%activit%';

-- 7. 检查定时清理任务（如果启用了pg_cron）
SELECT '=== 定时清理任务检查 ===' as section;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    RAISE NOTICE 'pg_cron extension is available';
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-user-activities') THEN
      RAISE NOTICE 'Cleanup job exists and is configured';
    ELSE
      RAISE NOTICE 'Cleanup job not found - manual cleanup only';
    END IF;
  ELSE
    RAISE NOTICE 'pg_cron extension not available - manual cleanup only';
  END IF;
END $$;

-- 8. 系统完整性检查
SELECT '=== 系统完整性检查 ===' as section;
SELECT 
  'profiles' as table_name,
  COUNT(*) as record_count,
  COUNT(CASE WHEN username IS NOT NULL THEN 1 END) as users_with_username,
  COUNT(CASE WHEN avatar_url IS NOT NULL THEN 1 END) as users_with_avatar
FROM public.profiles
UNION ALL
SELECT 
  'user_activities' as table_name,
  COUNT(*) as record_count,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as recent_activities
FROM public.user_activities;

-- =====================================================
-- 第三部分: 性能和监控测试
-- =====================================================

-- 9. 性能分析 - 检查索引使用情况
SELECT '=== 索引使用情况 ===' as section;
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_tup_read,
  idx_tup_fetch,
  idx_scan
FROM pg_stat_user_indexes 
WHERE tablename IN ('profiles', 'user_activities');

-- 10. 表统计信息
SELECT '=== 表统计信息 ===' as section;
SELECT 
  schemaname,
  tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes,
  n_live_tup as live_rows,
  n_dead_tup as dead_rows,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables 
WHERE tablename IN ('profiles', 'user_activities');

-- =====================================================
-- 测试脚本说明
-- 
-- 这个测试脚本包含以下功能：
-- 1. 检查数据库结构和配置（profiles + user_activities）
-- 2. 验证安全策略和权限
-- 3. 验证活动记录系统
-- 4. 检查定时清理任务
-- 5. 性能分析查询
-- 6. 数据完整性验证
-- 7. 监控和统计信息
-- 
-- 使用方法：
-- 1. 先执行 00_complete_setup.sql 完成系统安装
-- 2. 在 Supabase SQL 编辑器中运行此测试脚本
-- 3. 在应用中测试数据操作功能
-- 4. 定期运行监控查询检查性能
-- 
-- 预期结果：
-- - 所有表、函数、视图都应该存在
-- - RLS策略应该正确配置
-- - 索引应该被正确创建
-- - 如果启用了pg_cron，清理任务应该存在
-- =====================================================
