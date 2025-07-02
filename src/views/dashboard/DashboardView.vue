<template>
  <div class="dashboard-content">
    <!-- 欢迎卡片 -->
    <a-card class="welcome-card" :bordered="false">
      <template #title>
        <span style="color: white;">欢迎回来，{{ userEmail }}！</span>
      </template>
      
      <a-row :gutter="24">
        <a-col :xs="24" :sm="8">
          <a-statistic
            title="今日访问"
            :value="1128"
            class="statistic-card"
          >
            <template #prefix>
              <ArrowUpOutlined style="color: #3f8600" />
            </template>
          </a-statistic>
        </a-col>
        
        <a-col :xs="24" :sm="8">
          <a-statistic
            title="总用户数"
            :value="93"
            suffix="/ 100"
            class="statistic-card"
          />
        </a-col>
        
        <a-col :xs="24" :sm="8">
          <a-statistic
            title="活跃用户"
            :value="68"
            class="statistic-card"
          >
            <template #prefix>
              <ArrowUpOutlined style="color: #3f8600" />
            </template>
          </a-statistic>
        </a-col>
      </a-row>
    </a-card>

    <!-- 快速操作 -->
    <a-card title="快速操作" class="quick-actions-card" :bordered="false">
      <a-row :gutter="[16, 16]">
        <a-col :xs="12" :sm="6">
          <a-button 
            type="primary" 
            block 
            size="large"
            @click="handleQuickAction('new-project')"
          >
            <template #icon>
              <PlusOutlined />
            </template>
            新建项目
          </a-button>
        </a-col>
        
        <a-col :xs="12" :sm="6">
          <a-button 
            block 
            size="large"
            @click="handleQuickAction('view-reports')"
          >
            <template #icon>
              <FileTextOutlined />
            </template>
            查看报告
          </a-button>
        </a-col>
        
        <a-col :xs="12" :sm="6">
          <a-button 
            block 
            size="large"
            @click="handleQuickAction('team-management')"
          >
            <template #icon>
              <TeamOutlined />
            </template>
            团队管理
          </a-button>
        </a-col>
        
        <a-col :xs="12" :sm="6">
          <a-button 
            block 
            size="large"
            @click="handleQuickAction('system-settings')"
          >
            <template #icon>
              <SettingOutlined />
            </template>
            系统设置
          </a-button>
        </a-col>
      </a-row>
    </a-card>

    <!-- 数据概览 -->
    <a-card title="数据概览" :bordered="false">
      <a-row :gutter="24">
        <a-col :xs="24" :lg="12">
          <div class="chart-placeholder">
            <h4>访问趋势</h4>
            <p>图表组件开发中...</p>
          </div>
        </a-col>
        <a-col :xs="24" :lg="12">
          <div class="chart-placeholder">
            <h4>用户分布</h4>
            <p>图表组件开发中...</p>
          </div>
        </a-col>
      </a-row>
    </a-card>

    <!-- 欢迎信息 -->
    <a-card title="欢迎使用" :bordered="false">
      <a-alert
        message="系统运行正常"
        description="您的 Supabase Web App 已成功部署并运行。您可以通过顶部导航栏的主题设置按钮 🎨 来个性化您的界面体验。"
        type="success"
        show-icon
        style="margin-bottom: 16px"
      />

      <a-row :gutter="16">
        <a-col :xs="24" :md="8">
          <a-card size="small" title="🎨 主题设置">
            <p>点击导航栏的调色板图标可以自定义主色调、组件尺寸、布局配置等。</p>
          </a-card>
        </a-col>
        <a-col :xs="24" :md="8">
          <a-card size="small" title="👤 个人资料">
            <p>在个人资料页面管理您的基本信息和账户设置。</p>
          </a-card>
        </a-col>
        <a-col :xs="24" :md="8">
          <a-card size="small" title="⚙️ 系统设置">
            <p>在设置页面配置语言、时区、通知和隐私选项。</p>
          </a-card>
        </a-col>
      </a-row>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { message } from 'ant-design-vue'
import {
  ArrowUpOutlined,
  PlusOutlined,
  FileTextOutlined,
  TeamOutlined,
  SettingOutlined
} from '@ant-design/icons-vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// 用户邮箱
const userEmail = computed(() => authStore.user?.email || '')

// 处理快速操作
const handleQuickAction = (action: string) => {
  switch (action) {
    case 'new-project':
      message.info('新建项目功能开发中...')
      break
    case 'view-reports':
      message.info('查看报告功能开发中...')
      break
    case 'team-management':
      message.info('团队管理功能开发中...')
      break
    case 'system-settings':
      message.info('系统设置功能开发中...')
      break
    default:
      message.info('功能开发中...')
  }
}
</script>

<style scoped>
.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.welcome-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.welcome-card :deep(.ant-card-head-title) {
  color: white;
  font-size: 18px;
  font-weight: 600;
}

.statistic-card :deep(.ant-statistic-title) {
  color: rgba(255, 255, 255, 0.8);
}

.statistic-card :deep(.ant-statistic-content) {
  color: white;
}

.quick-actions-card {
  background: white;
}

.chart-placeholder {
  text-align: center;
  padding: 40px 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px dashed #dee2e6;
}

.chart-placeholder h4 {
  margin-bottom: 8px;
  color: #495057;
}

.chart-placeholder p {
  margin: 0;
  color: #6c757d;
}
</style>