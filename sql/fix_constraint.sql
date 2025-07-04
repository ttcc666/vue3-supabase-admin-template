-- 修复 user_settings 表的约束条件
-- 允许 setting_value 存储基本 JSON 类型

-- 删除旧的约束
ALTER TABLE public.user_settings DROP CONSTRAINT IF EXISTS setting_value_valid;

-- 添加新的约束，允许多种 JSON 类型
ALTER TABLE public.user_settings ADD CONSTRAINT setting_value_valid 
CHECK (jsonb_typeof(setting_value) IN ('object', 'string', 'boolean', 'number'));

-- 显示修复完成信息
DO $$
BEGIN
  RAISE NOTICE '约束条件已修复，现在允许存储字符串、布尔值、数字和对象类型的 JSON 值';
END $$;
