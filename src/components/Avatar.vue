<template>
  <div class="avatar-upload">
    <!-- 头像显示区域 -->
    <div class="avatar-container" @click="handleAvatarClick">
      <a-avatar 
        :size="size" 
        :src="avatarUrl" 
        :icon="!avatarUrl ? h(UserOutlined) : undefined"
        class="avatar-image"
        :class="{ 'avatar-loading': uploading }"
      />
      
      <!-- 上传遮罩 -->
      <div class="avatar-overlay" v-if="!uploading">
        <UploadOutlined class="upload-icon" />
        <span class="upload-text">{{ avatarUrl ? '更换头像' : '上传头像' }}</span>
      </div>
      
      <!-- 加载状态 -->
      <div class="avatar-loading-overlay" v-if="uploading">
        <a-spin size="small" />
        <span class="loading-text">上传中...</span>
      </div>
    </div>

    <!-- 隐藏的文件输入 -->
    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      style="display: none"
      @change="handleFileChange"
    />

    <!-- 头像操作菜单 -->
    <a-dropdown v-if="avatarUrl && !uploading" :trigger="['click']">
      <template #overlay>
        <a-menu>
          <a-menu-item key="change" @click="handleAvatarClick">
            <UploadOutlined />
            更换头像
          </a-menu-item>
          <a-menu-item key="delete" @click="handleDeleteAvatar" danger>
            <DeleteOutlined />
            删除头像
          </a-menu-item>
        </a-menu>
      </template>
      <a-button 
        type="text" 
        size="small" 
        class="avatar-menu-btn"
        :icon="h(MoreOutlined)"
      />
    </a-dropdown>

    <!-- 上传提示 -->
    <div class="avatar-tips" v-if="showTips">
      <p class="tip-text">
        <InfoCircleOutlined />
        支持 JPG、PNG、GIF 格式，文件大小不超过 5MB
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { message } from 'ant-design-vue'
import {
  UserOutlined,
  UploadOutlined,
  DeleteOutlined,
  MoreOutlined,
  InfoCircleOutlined
} from '@ant-design/icons-vue'
import { useProfileStore } from '@/stores/profile'

// Props
interface Props {
  size?: number
  showTips?: boolean
  allowDelete?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 120,
  showTips: true,
  allowDelete: true
})

// Emits
interface Emits {
  (e: 'upload', url: string): void
  (e: 'delete'): void
  (e: 'error', error: string): void
}

const emit = defineEmits<Emits>()

// Store
const profileStore = useProfileStore()

// Refs
const fileInputRef = ref<HTMLInputElement>()

// Computed
const avatarUrl = computed(() => profileStore.avatarUrl)
const uploading = computed(() => profileStore.uploading)
const containerSize = computed(() => `${props.size}px`)

// 处理头像点击
const handleAvatarClick = () => {
  if (uploading.value) return
  fileInputRef.value?.click()
}

// 处理文件选择
const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return

  try {
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      message.error('请选择图片文件')
      return
    }

    // 验证文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      message.error('图片大小不能超过 5MB')
      return
    }

    // 上传头像
    const result = await profileStore.uploadAvatar(file)
    
    if (result.success && result.url) {
      message.success('头像上传成功')
      emit('upload', result.url)
    } else {
      message.error(result.error || '头像上传失败')
      emit('error', result.error || '头像上传失败')
    }
  } catch (error) {
    console.error('Avatar upload error:', error)
    const errorMessage = error instanceof Error ? error.message : '头像上传失败'
    message.error(errorMessage)
    emit('error', errorMessage)
  } finally {
    // 清空文件输入，允许重新选择同一文件
    if (target) {
      target.value = ''
    }
  }
}

// 处理删除头像
const handleDeleteAvatar = async () => {
  try {
    const result = await profileStore.deleteAvatar()
    
    if (result.success) {
      message.success('头像删除成功')
      emit('delete')
    } else {
      message.error(result.error || '头像删除失败')
      emit('error', result.error || '头像删除失败')
    }
  } catch (error) {
    console.error('Avatar delete error:', error)
    const errorMessage = error instanceof Error ? error.message : '头像删除失败'
    message.error(errorMessage)
    emit('error', errorMessage)
  }
}

// 预览图片（可选功能）
const previewImage = () => {
  if (!avatarUrl.value) return
  
  // 这里可以集成图片预览功能
  // 比如使用 Ant Design Vue 的 Image 组件的预览功能
  console.log('Preview image:', avatarUrl.value)
}
</script>

<style scoped>
.avatar-upload {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.avatar-container {
  position: relative;
  cursor: pointer;
  border-radius: 50%;
  overflow: hidden;
  transition: all 0.3s ease;
  width: v-bind(containerSize);
  height: v-bind(containerSize);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  flex-shrink: 0;
}

.avatar-container:hover {
  transform: scale(1.05);
}

.avatar-container:hover .avatar-overlay {
  opacity: 1;
}

.avatar-image {
  display: block;
  transition: all 0.3s ease;
  border-radius: 50% !important;
  width: 100% !important;
  height: 100% !important;
  object-fit: cover;
}

.avatar-image.avatar-loading {
  opacity: 0.6;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 50%;
}

.upload-icon {
  font-size: 24px;
  color: white;
  margin-bottom: 4px;
}

.upload-text {
  color: white;
  font-size: 12px;
  text-align: center;
  line-height: 1.2;
}

.avatar-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.loading-text {
  font-size: 12px;
  color: #666;
  margin-top: 8px;
}

.avatar-menu-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.avatar-tips {
  margin-top: 12px;
  text-align: center;
  width: 100%;
  display: flex;
  justify-content: center;
}

.tip-text {
  font-size: 12px;
  color: #666;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

/* 确保头像始终为圆形和居中 */
.avatar-container :deep(.ant-avatar) {
  border-radius: 50% !important;
  width: 100% !important;
  height: 100% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.avatar-container :deep(.ant-avatar img) {
  border-radius: 50% !important;
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
}

/* 强制居中对齐 */
.avatar-upload {
  margin: 0 auto !important;
  text-align: center !important;
}

.avatar-upload > * {
  margin-left: auto !important;
  margin-right: auto !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .upload-text {
    font-size: 10px;
  }

  .upload-icon {
    font-size: 20px;
  }

  .avatar-menu-btn {
    width: 20px;
    height: 20px;
    top: -6px;
    right: -6px;
  }
}

/* 无障碍支持 */
.avatar-container:focus {
  outline: 2px solid #1890ff;
  outline-offset: 2px;
}

/* 动画效果 */
@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

.avatar-container.uploading {
  animation: pulse 1.5s infinite;
}
</style>
