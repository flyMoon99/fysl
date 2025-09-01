<template>
  <div class="admin-layout">
    <!-- 侧边栏 -->
    <aside class="admin-sidebar">
      <div class="sidebar-logo">
        <h1>福佑丝路</h1>
      </div>
      
      <nav class="sidebar-menu">
        <router-link to="/admin" :class="['menu-item', { active: isActiveMenu('/admin') }]">
          <el-icon><House /></el-icon>
          <span>仪表盘</span>
        </router-link>
        
        <router-link 
          v-if="adminStore.isSuperAdmin" 
          to="/admin/admins" 
          :class="['menu-item', { active: isActiveMenu('/admin/admins') }]"
        >
          <el-icon><User /></el-icon>
          <span>管理员管理</span>
        </router-link>
        
        <router-link to="/admin/members" :class="['menu-item', { active: isActiveMenu('/admin/members') }]">
          <el-icon><Avatar /></el-icon>
          <span>会员管理</span>
        </router-link>
        
        <router-link to="/admin/stats" :class="['menu-item', { active: isActiveMenu('/admin/stats') }]">
          <el-icon><TrendCharts /></el-icon>
          <span>统计分析</span>
        </router-link>
      </nav>
    </aside>
    
    <!-- 主内容区 -->
    <main class="admin-main">
      <!-- 头部 -->
      <header class="admin-header">
        <div class="header-left">
          <h2 class="header-title">{{ currentPageTitle }}</h2>
        </div>
        
        <div class="header-right">
          <div class="admin-info" @click="showUserMenu = !showUserMenu">
            <div class="admin-avatar">
              {{ adminStore.admin?.username?.charAt(0)?.toUpperCase() }}
            </div>
            <span>{{ adminStore.admin?.username }}</span>
            <el-icon><ArrowDown /></el-icon>
          </div>
          
          <!-- 用户菜单 -->
          <el-dropdown v-model="showUserMenu" @command="handleUserCommand">
            <span class="el-dropdown-link">
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人信息</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>
      
      <!-- 内容区域 -->
      <div class="admin-content">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminStore } from '@/store/admin'
import { ElMessageBox, ElMessage } from 'element-plus'
import { 
  House, 
  User, 
  Avatar, 
  TrendCharts, 
  ArrowDown 
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const adminStore = useAdminStore()
const showUserMenu = ref(false)

// 当前页面标题
const currentPageTitle = computed(() => {
  return route.meta.title || '管理后台'
})

// 判断菜单是否活跃
const isActiveMenu = (path) => {
  return route.path === path
}

// 处理用户菜单命令
const handleUserCommand = async (command) => {
  switch (command) {
    case 'profile':
      // 跳转到个人信息页面（暂未实现）
      ElMessage.info('个人信息功能开发中')
      break
    case 'logout':
      try {
        await ElMessageBox.confirm(
          '确定要退出登录吗？',
          '提示',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        adminStore.logout()
        router.push('/admin/login')
      } catch {
        // 用户取消
      }
      break
  }
}
</script>

<style scoped>
/* 样式已在全局CSS中定义 */
</style>
