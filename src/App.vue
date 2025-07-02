<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { ConfigProvider } from 'ant-design-vue'
import zhCN from 'ant-design-vue/es/locale/zh_CN'

const authStore = useAuthStore()
const themeStore = useThemeStore()

// 初始化
onMounted(async () => {
  // 初始化主题系统
  themeStore.initialize()

  // 初始化认证状态
  await authStore.initialize()
})
</script>

<template>
  <ConfigProvider
    :locale="zhCN"
    :theme="themeStore.antdThemeConfig"
  >
    <div class="app-container">
      <RouterView />
    </div>
  </ConfigProvider>
</template>

<style>
/* 全局样式，不使用 scoped */
#app {
  width: 100%;
  height: 100vh;
  margin: 0;
  padding: 0;
}

.app-container {
  width: 100%;
  height: 100vh;
  background-color: #f5f5f5;
}
</style>