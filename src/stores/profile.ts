import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth'
import { ActivityType } from '@/types/activities'
import type {
  Profile,
  ProfileFormData,
  ProfileOperationResult,
  ProfileWithStats,
  AvatarUploadResult,
  ProfileValidationError
} from '@/types/profile'
import { DEFAULT_PROFILE_VALIDATION_RULES } from '@/types/profile'
import type { User } from '@supabase/supabase-js'

export const useProfileStore = defineStore('profile', () => {
  // 状态
  const profile = ref<Profile | null>(null)
  const loading = ref(false)
  const uploading = ref(false)
  const initialized = ref(false)
  const error = ref<string | null>(null)

  // 获取认证 store
  const authStore = useAuthStore()

  // 记录活动的辅助函数
  const logActivity = async (activityData: {
    activity_type: ActivityType
    activity_title: string
    activity_description: string
    metadata?: Record<string, any>
  }) => {
    try {
      const { data, error } = await supabase
        .rpc('log_user_activity', {
          p_user_id: authStore.user?.id || null,
          p_activity_type: activityData.activity_type,
          p_activity_title: activityData.activity_title,
          p_activity_description: activityData.activity_description,
          p_ip_address: null,
          p_user_agent: navigator.userAgent,
          p_metadata: activityData.metadata || {}
        })

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error('Failed to log activity:', error)
      // 不抛出错误，避免影响主要功能
    }
  }

  // 计算属性
  const isProfileComplete = computed(() => {
    if (!profile.value) return false
    const requiredFields = ['username', 'first_name', 'last_name']
    return requiredFields.every(field => profile.value![field as keyof Profile])
  })

  const profileCompleteness = computed(() => {
    if (!profile.value) return 0
    const allFields = [
      'username', 'first_name', 'last_name', 'phone', 'website', 
      'bio', 'avatar_url', 'birthday', 'country', 'city'
    ]
    const filledFields = allFields.filter(field => profile.value![field as keyof Profile])
    return Math.round((filledFields.length / allFields.length) * 100)
  })

  const displayName = computed(() => {
    if (!profile.value) return authStore.userEmail
    return profile.value.full_name || 
           profile.value.username || 
           authStore.userEmail || 
           '未知用户'
  })

  const avatarUrl = computed(() => {
    if (!profile.value?.avatar_url) return null
    
    // 如果是完整的 URL，直接返回
    if (profile.value.avatar_url.startsWith('http')) {
      return profile.value.avatar_url
    }
    
    // 如果是 Supabase Storage 路径，构建完整 URL
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(profile.value.avatar_url)
    
    return data.publicUrl
  })

  // 初始化用户资料
  const initialize = async (): Promise<void> => {
    if (!authStore.user?.id) {
      console.warn('No authenticated user found')
      return
    }

    // 防止重复初始化
    if (initialized.value) {
      return
    }

    try {
      loading.value = true
      error.value = null

      await fetchProfile()
      initialized.value = true
    } catch (err) {
      console.error('Failed to initialize profile:', err)
      error.value = err instanceof Error ? err.message : '初始化失败'
      // 即使失败也标记为已初始化，避免无限重试
      initialized.value = true
    } finally {
      loading.value = false
    }
  }

  // 获取用户资料
  const fetchProfile = async (): Promise<Profile | null> => {
    if (!authStore.user?.id) {
      throw new Error('用户未登录')
    }

    try {
      loading.value = true
      error.value = null

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authStore.user.id)
        .single()

      if (fetchError) {
        // 如果用户资料不存在，创建一个新的
        if (fetchError.code === 'PGRST116') {
          return await createProfile()
        }
        throw fetchError
      }

      profile.value = data
      return data
    } catch (err) {
      console.error('Failed to fetch profile:', err)
      error.value = err instanceof Error ? err.message : '获取资料失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 创建用户资料
  const createProfile = async (data?: Partial<ProfileFormData>): Promise<Profile> => {
    if (!authStore.user?.id) {
      throw new Error('用户未登录')
    }

    try {
      loading.value = true
      error.value = null

      const profileData = {
        id: authStore.user.id,
        username: data?.username || authStore.userEmail?.split('@')[0],
        first_name: data?.first_name,
        last_name: data?.last_name,
        ...data
      }

      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single()

      if (createError) throw createError

      profile.value = newProfile
      return newProfile
    } catch (err) {
      console.error('Failed to create profile:', err)
      error.value = err instanceof Error ? err.message : '创建资料失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 更新用户资料
  const updateProfile = async (data: Partial<ProfileFormData>): Promise<ProfileOperationResult> => {
    if (!authStore.user?.id) {
      return { success: false, error: '用户未登录' }
    }

    try {
      loading.value = true
      error.value = null

      // 验证数据
      const validationErrors = validateProfileData(data)
      if (validationErrors.length > 0) {
        return { 
          success: false, 
          error: validationErrors.map(e => e.message).join(', ') 
        }
      }

      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', authStore.user.id)
        .select()
        .single()

      if (updateError) throw updateError

      profile.value = updatedProfile

      // 记录个人资料更新活动
      try {
        const updatedFields = Object.keys(data).filter(key => data[key as keyof typeof data] !== undefined)
        await logActivity({
          activity_type: ActivityType.PROFILE_UPDATE,
          activity_title: '更新个人资料',
          activity_description: `用户修改了个人资料信息`,
          metadata: {
            updated_fields: updatedFields,
            source: 'profile_page',
            timestamp: new Date().toISOString()
          }
        })
      } catch (activityError) {
        console.error('Failed to log profile update activity:', activityError)
      }

      return {
        success: true,
        data: updatedProfile,
        message: '资料更新成功'
      }
    } catch (err) {
      console.error('Failed to update profile:', err)
      const errorMessage = err instanceof Error ? err.message : '更新资料失败'
      error.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      loading.value = false
    }
  }

  // 上传头像
  const uploadAvatar = async (file: File): Promise<AvatarUploadResult> => {
    if (!authStore.user?.id) {
      return { success: false, error: '用户未登录' }
    }

    try {
      uploading.value = true
      error.value = null

      // 验证文件
      if (!file.type.startsWith('image/')) {
        return { success: false, error: '请选择图片文件' }
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB
        return { success: false, error: '图片大小不能超过 5MB' }
      }

      // 生成文件路径
      const fileExt = file.name.split('.').pop()
      const fileName = `${authStore.user.id}/${Date.now()}.${fileExt}`

      // 上传到 Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      // 获取公共 URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      // 更新用户资料中的头像 URL
      const updateResult = await updateProfile({ avatar_url: fileName })

      if (!updateResult.success) {
        return { success: false, error: updateResult.error }
      }

      // 记录头像上传活动
      try {
        await logActivity({
          activity_type: ActivityType.AVATAR_UPLOAD,
          activity_title: '上传头像',
          activity_description: '用户上传了新的头像图片',
          metadata: {
            file_name: fileName,
            file_size: file.size,
            file_type: file.type,
            source: 'profile_page',
            timestamp: new Date().toISOString()
          }
        })
      } catch (activityError) {
        console.error('Failed to log avatar upload activity:', activityError)
      }

      return {
        success: true,
        url: urlData.publicUrl,
        path: fileName,
      }
    } catch (err) {
      console.error('Failed to upload avatar:', err)
      const errorMessage = err instanceof Error ? err.message : '头像上传失败'
      error.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      uploading.value = false
    }
  }

  // 删除头像
  const deleteAvatar = async (): Promise<ProfileOperationResult> => {
    if (!profile.value?.avatar_url) {
      return { success: false, error: '没有头像可删除' }
    }

    try {
      loading.value = true
      error.value = null

      // 从 Storage 删除文件
      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove([profile.value.avatar_url])

      if (deleteError) {
        console.warn('Failed to delete avatar file:', deleteError)
      }

      // 更新用户资料
      const result = await updateProfile({ avatar_url: null })
      
      if (result.success) {
        result.message = '头像删除成功'
      }
      
      return result
    } catch (err) {
      console.error('Failed to delete avatar:', err)
      const errorMessage = err instanceof Error ? err.message : '删除头像失败'
      error.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      loading.value = false
    }
  }

  // 验证资料数据
  const validateProfileData = (data: Partial<ProfileFormData>): ProfileValidationError[] => {
    const errors: ProfileValidationError[] = []
    const rules = DEFAULT_PROFILE_VALIDATION_RULES

    // 验证用户名
    if (data.username !== undefined) {
      if (data.username && data.username.length < rules.username.minLength) {
        errors.push({
          field: 'username',
          message: `用户名至少需要 ${rules.username.minLength} 个字符`
        })
      }
      if (data.username && !rules.username.pattern.test(data.username)) {
        errors.push({
          field: 'username',
          message: '用户名只能包含字母、数字、下划线和连字符'
        })
      }
    }

    // 验证手机号
    if (data.phone && !rules.phone.pattern.test(data.phone)) {
      errors.push({
        field: 'phone',
        message: '请输入有效的手机号码'
      })
    }

    // 验证网站
    if (data.website && !rules.website.pattern.test(data.website)) {
      errors.push({
        field: 'website',
        message: '请输入有效的网站地址（以 http:// 或 https:// 开头）'
      })
    }

    // 验证个人简介
    if (data.bio && data.bio.length > rules.bio.maxLength) {
      errors.push({
        field: 'bio',
        message: `个人简介不能超过 ${rules.bio.maxLength} 个字符`
      })
    }

    return errors
  }

  // 清除错误
  const clearError = () => {
    error.value = null
  }

  // 重置状态
  const reset = () => {
    profile.value = null
    loading.value = false
    uploading.value = false
    initialized.value = false
    error.value = null
  }

  return {
    // 状态
    profile,
    loading,
    uploading,
    initialized,
    error,

    // 计算属性
    isProfileComplete,
    profileCompleteness,
    displayName,
    avatarUrl,

    // 方法
    initialize,
    fetchProfile,
    createProfile,
    updateProfile,
    uploadAvatar,
    deleteAvatar,
    validateProfileData,
    clearError,
    reset
  }
})
