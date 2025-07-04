-- =====================================================
-- 用户设置系统数据库脚本 (简化版)
-- 版本: 1.0
-- 创建时间: 2025-07-03
-- =====================================================

-- 开始事务
BEGIN;

-- 创建设置分类枚举
DO $$ BEGIN
    CREATE TYPE setting_category AS ENUM (
      'system',         -- 系统设置：语言、时区、日期格式
      'notification',   -- 通知设置：邮件、浏览器、短信、营销通知
      'privacy'         -- 隐私设置：资料可见性、活动状态、数据分析
    );
EXCEPTION
    WHEN duplicate_object THEN 
        NULL; -- 忽略重复创建错误
END $$;

-- 创建 user_settings 表
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
CREATE INDEX IF NOT EXISTS idx_user_settings_user_category ON public.user_settings(user_id, category);
CREATE INDEX IF NOT EXISTS idx_user_settings_active ON public.user_settings(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_settings_created_at ON public.user_settings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_settings_updated_at ON public.user_settings(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_settings_value_gin ON public.user_settings USING GIN (setting_value);

-- 启用 RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "Users can view own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can delete own settings" ON public.user_settings;

-- 创建 RLS 策略
CREATE POLICY "Users can view own settings" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings" ON public.user_settings
  FOR DELETE USING (auth.uid() = user_id);

-- 创建触发器
DROP TRIGGER IF EXISTS handle_updated_at_user_settings ON public.user_settings;

CREATE TRIGGER handle_updated_at_user_settings
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 创建获取用户设置的函数
CREATE OR REPLACE FUNCTION public.get_user_setting(
  p_category setting_category,
  p_setting_key VARCHAR(100),
  p_default_value JSONB DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT setting_value INTO result
  FROM public.user_settings
  WHERE user_id = auth.uid()
    AND category = p_category
    AND setting_key = p_setting_key
    AND is_active = true;
  
  IF result IS NULL THEN
    result := p_default_value;
  END IF;
  
  RETURN result;
END;
$$;

-- 创建设置用户设置的函数
CREATE OR REPLACE FUNCTION public.set_user_setting(
  p_category setting_category,
  p_setting_key VARCHAR(100),
  p_setting_value JSONB,
  p_description TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  INSERT INTO public.user_settings (user_id, category, setting_key, setting_value, description)
  VALUES (auth.uid(), p_category, p_setting_key, p_setting_value, p_description)
  ON CONFLICT (user_id, category, setting_key)
  DO UPDATE SET
    setting_value = EXCLUDED.setting_value,
    description = COALESCE(EXCLUDED.description, user_settings.description),
    updated_at = NOW()
  RETURNING setting_value INTO result;
  
  RETURN result;
END;
$$;

-- 创建获取用户所有设置的函数
CREATE OR REPLACE FUNCTION public.get_user_settings_by_category(
  p_category setting_category DEFAULT NULL
)
RETURNS TABLE(
  category setting_category,
  setting_key VARCHAR(100),
  setting_value JSONB,
  description TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.category,
    us.setting_key,
    us.setting_value,
    us.description,
    us.created_at,
    us.updated_at
  FROM public.user_settings us
  WHERE us.user_id = auth.uid()
    AND us.is_active = true
    AND (p_category IS NULL OR us.category = p_category)
  ORDER BY us.category, us.setting_key;
END;
$$;

-- 创建插入默认设置的函数
CREATE OR REPLACE FUNCTION public.create_default_user_settings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_settings 
    WHERE user_id = auth.uid()
  ) THEN
    -- 插入默认系统设置
    INSERT INTO public.user_settings (user_id, category, setting_key, setting_value, description) VALUES
    (auth.uid(), 'system', 'language', '"zh-CN"', '界面语言设置'),
    (auth.uid(), 'system', 'timezone', '"Asia/Shanghai"', '时区设置'),
    (auth.uid(), 'system', 'dateFormat', '"YYYY-MM-DD"', '日期格式设置');
    
    -- 插入默认通知设置
    INSERT INTO public.user_settings (user_id, category, setting_key, setting_value, description) VALUES
    (auth.uid(), 'notification', 'email', 'true', '邮件通知开关'),
    (auth.uid(), 'notification', 'browser', 'true', '浏览器通知开关'),
    (auth.uid(), 'notification', 'sms', 'false', '短信通知开关'),
    (auth.uid(), 'notification', 'marketing', 'false', '营销邮件开关');
    
    -- 插入默认隐私设置
    INSERT INTO public.user_settings (user_id, category, setting_key, setting_value, description) VALUES
    (auth.uid(), 'privacy', 'profileVisibility', '"public"', '个人资料可见性'),
    (auth.uid(), 'privacy', 'showOnlineStatus', 'true', '显示在线状态'),
    (auth.uid(), 'privacy', 'allowAnalytics', 'true', '允许数据分析');
  END IF;
END;
$$;

-- 提交事务
COMMIT;

-- 显示完成信息
DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE '用户设置系统数据库脚本执行完成！';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '已创建:';
  RAISE NOTICE '✅ setting_category 枚举类型';
  RAISE NOTICE '✅ user_settings 表';
  RAISE NOTICE '✅ 所有必要的索引';
  RAISE NOTICE '✅ RLS 策略';
  RAISE NOTICE '✅ 更新时间戳触发器';
  RAISE NOTICE '✅ 辅助函数';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '使用说明:';
  RAISE NOTICE '1. 调用 create_default_user_settings() 为新用户创建默认设置';
  RAISE NOTICE '2. 使用 get_user_setting() 获取单个设置';
  RAISE NOTICE '3. 使用 set_user_setting() 设置单个设置';
  RAISE NOTICE '4. 使用 get_user_settings_by_category() 获取分类设置';
  RAISE NOTICE '==============================================';
END $$;
