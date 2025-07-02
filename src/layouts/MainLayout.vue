<template>
  <a-layout :class="['main-layout', { collapsed }]">
    <!-- 侧边栏 -->
    <a-layout-sider
      v-model:collapsed="collapsed"
      :trigger="null"
      :width="themeStore.layout.sidebarWidth"
      collapsible
      class="main-sider"
    >
      <div class="logo">
        <h2 v-if="!collapsed">{{ appTitle }}</h2>
        <h2 v-else>SW</h2>
      </div>
      
      <a-menu
        v-model:selectedKeys="selectedKeys"
        theme="dark"
        mode="inline"
        @click="handleMenuClick"
      >
        <a-menu-item key="dashboard">
          <DashboardOutlined />
          <span>仪表板</span>
        </a-menu-item>
        
        <a-menu-item key="profile">
          <UserOutlined />
          <span>个人资料</span>
        </a-menu-item>
        
        <a-menu-item key="settings">
          <SettingOutlined />
          <span>设置</span>
        </a-menu-item>
      </a-menu>
    </a-layout-sider>

    <!-- 主内容区域 -->
    <a-layout>
      <!-- 头部 -->
      <a-layout-header
        class="main-header"
        :style="{
          height: dynamicStyles.headerHeight,
          marginLeft: dynamicStyles.headerMarginLeft
        }"
      >
        <div class="header-left">
          <a-button
            type="text"
            :icon="h(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined)"
            @click="collapsed = !collapsed"
            class="trigger"
          />
          
          <a-breadcrumb class="breadcrumb">
            <a-breadcrumb-item>首页</a-breadcrumb-item>
            <a-breadcrumb-item>{{ currentPageTitle }}</a-breadcrumb-item>
          </a-breadcrumb>
        </div>

        <div class="header-right">
          <a-space>
            <!-- 通知 -->
            <a-badge count="5">
              <a-button type="text" :icon="h(BellOutlined)" />
            </a-badge>

            <!-- 主题设置 -->
            <a-button
              type="text"
              :icon="h(BgColorsOutlined)"
              @click="showThemeDrawer = true"
              title="主题设置"
            />

            <!-- 用户菜单 -->
            <a-dropdown>
              <a-button type="text" class="user-button">
                <a-avatar :icon="h(UserOutlined)" />
                <span class="user-name">{{ userEmail }}</span>
                <DownOutlined />
              </a-button>
              
              <template #overlay>
                <a-menu @click="handleUserMenuClick">
                  <a-menu-item key="profile">
                    <UserOutlined />
                    个人资料
                  </a-menu-item>
                  <a-menu-item key="settings">
                    <SettingOutlined />
                    设置
                  </a-menu-item>
                  <a-menu-divider />
                  <a-menu-item key="logout">
                    <LogoutOutlined />
                    退出登录
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </a-space>
        </div>
      </a-layout-header>

      <!-- 内容区域 -->
      <a-layout-content
        class="main-content"
        :style="{
          marginLeft: dynamicStyles.contentMarginLeft,
          padding: dynamicStyles.contentPadding,
          height: dynamicStyles.contentHeight
        }"
      >
        <router-view />
      </a-layout-content>
    </a-layout>

    <!-- 主题设置抽屉 -->
    <a-drawer
      v-model:open="showThemeDrawer"
      title="主题设置"
      placement="right"
      :width="drawerWidth"
      :closable="true"
      :mask-closable="true"
      :keyboard="true"
      class="theme-drawer"
    >
      <ThemeDrawerContent />
    </a-drawer>
  </a-layout>
</template>

<script setup lang="ts">
import { ref, computed, watch, h } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  UserOutlined,
  SettingOutlined,
  BellOutlined,
  DownOutlined,
  LogoutOutlined,
  BgColorsOutlined
} from '@ant-design/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import ThemeDrawerContent from '@/components/ThemeDrawerContent.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const themeStore = useThemeStore()

// 应用标题
const appTitle = import.meta.env.VITE_APP_TITLE || 'Supabase Web App'

// 侧边栏折叠状态 - 从主题 store 获取
const collapsed = computed({
  get: () => themeStore.layout.sidebarCollapsed,
  set: (value: boolean) => {
    themeStore.layout.sidebarCollapsed = value
  }
})

// 主题抽屉状态
const showThemeDrawer = ref(false)

// 抽屉宽度 - 响应式
const drawerWidth = computed(() => {
  // 移动端使用更小的宽度或全屏
  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    return Math.min(window.innerWidth - 32, 360)
  }
  return 400
})

// 当前选中的菜单项
const selectedKeys = ref<string[]>(['dashboard'])

// 用户邮箱
const userEmail = computed(() => authStore.user?.email || '')

// 页面标题映射
const pageTitleMap: Record<string, string> = {
  '/': '仪表板',
  '/dashboard': '仪表板',
  '/profile': '个人资料',
  '/settings': '设置'
}

// 当前页面标题
const currentPageTitle = computed(() => {
  return pageTitleMap[route.path] || '未知页面'
})

// 动态样式计算
const dynamicStyles = computed(() => {
  const { sidebarWidth, headerHeight, contentPadding } = themeStore.layout
  const collapsedWidth = 80

  return {
    siderWidth: `${sidebarWidth}px`,
    collapsedWidth: `${collapsedWidth}px`,
    headerHeight: `${headerHeight}px`,
    contentPadding: `${contentPadding}px`,
    headerMarginLeft: collapsed.value ? `${collapsedWidth}px` : `${sidebarWidth}px`,
    contentMarginLeft: collapsed.value ? `${collapsedWidth}px` : `${sidebarWidth}px`,
    contentHeight: `calc(100vh - ${headerHeight}px)`
  }
})

// 根据路由更新选中的菜单项
watch(() => route.path, (newPath) => {
  if (newPath === '/' || newPath === '/dashboard') {
    selectedKeys.value = ['dashboard']
  } else if (newPath === '/profile') {
    selectedKeys.value = ['profile']
  } else if (newPath === '/settings') {
    selectedKeys.value = ['settings']
  }
}, { immediate: true })

// 处理菜单点击
const handleMenuClick = ({ key }: { key: string }) => {
  switch (key) {
    case 'dashboard':
      router.push('/')
      break
    case 'profile':
      router.push('/profile')
      break
    case 'settings':
      router.push('/settings')
      break
  }
}

// 处理用户菜单点击
const handleUserMenuClick = async ({ key }: { key: string }) => {
  switch (key) {
    case 'profile':
      router.push('/profile')
      break
    case 'settings':
      router.push('/settings')
      break
    case 'logout':
      const result = await authStore.signOut()
      if (result.success) {
        message.success('退出登录成功！')
        router.push('/auth')
      } else {
        message.error(result.error?.message || '退出登录失败')
      }
      break
  }
}
</script>

<style scoped>
.main-layout {
  width: 100%;
  height: 100vh;
  margin: 0;
  padding: 0;
}

.main-layout :deep(.ant-layout) {
  background: transparent;
}

.main-layout :deep(.ant-layout-has-sider) {
  flex-direction: row;
}

.main-sider {
  background: #001529;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 100;
}

.main-sider :deep(.ant-layout-sider-children) {
  height: 100vh;
  overflow-y: auto;
}

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  margin: 16px;
  border-radius: 6px;
}

.logo h2 {
  color: white;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.main-header {
  background: white;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  transition: margin-left 0.2s;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  height: 64px;
}

.trigger {
  font-size: 18px;
  height: 40px;
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: color 0.3s;
  border-radius: 6px;
}

.trigger:hover {
  color: #1890ff;
  background-color: rgba(0, 0, 0, 0.06);
}

.breadcrumb {
  margin: 0;
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-button {
  display: flex;
  align-items: center;
  gap: 8px;
  height: auto;
  padding: 8px 12px;
}

.user-name {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.main-content {
  margin: 0;
  background: #f0f2f5;
  overflow-y: auto;
  transition: margin-left 0.2s;
}

/* 主题抽屉样式 */
.theme-drawer :deep(.ant-drawer-body) {
  padding: 24px;
  background: var(--ant-color-bg-container);
}

.theme-drawer :deep(.ant-drawer-header) {
  border-bottom: 1px solid var(--ant-color-border);
  background: var(--ant-color-bg-container);
}

.theme-drawer :deep(.ant-drawer-title) {
  font-weight: 600;
  color: var(--ant-color-text);
}

@media (max-width: 768px) {
  .main-sider {
    position: fixed;
    z-index: 1000;
    transform: translateX(-100%);
    transition: transform 0.3s;
  }

  .main-sider.ant-layout-sider-collapsed {
    transform: translateX(-100%);
  }

  .main-header {
    padding: 0 16px;
    margin-left: 0 !important;
  }

  .main-content {
    padding: 16px;
    margin-left: 0 !important;
  }

  .user-name {
    display: none;
  }

  /* 移动端抽屉样式调整 */
  .theme-drawer :deep(.ant-drawer-body) {
    padding: 16px;
  }
}
</style>