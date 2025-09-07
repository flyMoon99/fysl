<template>
  <div class="member-center-fullscreen">
    <!-- 左侧菜单 -->
    <aside class="sidebar" :class="{ collapsed: sidebarCollapsed }">
      <!-- Logo区域 -->
      <div class="logo-area">
        <div class="logo-container">
          <div class="brand-info" v-show="!sidebarCollapsed">
            <h3>福佑丝路</h3>
            <p>FUYOU SILK ROAD</p>
          </div>
        </div>
        <el-button 
          class="collapse-btn" 
          :icon="sidebarCollapsed ? Expand : Fold" 
          @click="toggleSidebar"
          text
        />
      </div>
      
      <!-- 导航菜单 -->
      <nav class="sidebar-nav">
        <router-link to="/member" class="nav-item" exact-active-class="active">
          <el-icon><Odometer /></el-icon>
          <span v-show="!sidebarCollapsed">仪表盘</span>
        </router-link>
        <router-link to="/member/devices" class="nav-item" exact-active-class="active">
          <el-icon><Monitor /></el-icon>
          <span v-show="!sidebarCollapsed">设备管理</span>
        </router-link>
        <router-link to="/member/waybills" class="nav-item" exact-active-class="active">
          <el-icon><Box /></el-icon>
          <span v-show="!sidebarCollapsed">运单管理</span>
        </router-link>
      </nav>
    </aside>

    <!-- 主要区域 -->
    <div class="main-area">
      <!-- 顶部工具栏 -->
      <header class="top-toolbar">
        <div class="toolbar-spacer"></div>
        <div class="toolbar-right">
          <!-- 用户信息 -->
          <el-dropdown class="user-dropdown" @command="handleUserCommand">
            <div class="user-info">
              <el-avatar :size="32" icon="UserFilled" />
              <span class="username">{{ userStore.user?.username }}</span>
              <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人信息</el-dropdown-item>
                <el-dropdown-item command="password">修改密码</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <!-- 主内容区 -->
      <main class="content-area">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import logoUrl from '@/assets/logo.png'
import { 
  Odometer, Monitor, Box,
  ArrowDown, UserFilled, Expand, Fold
} from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const sidebarCollapsed = ref(false)

// 切换侧边栏收起状态
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

// 处理用户下拉菜单命令
const handleUserCommand = async (command) => {
  switch (command) {
    case 'profile':
      router.push('/member/profile')
      break
    case 'password':
      router.push('/member/password')
      break
    case 'logout':
      try {
        await ElMessageBox.confirm(
          '确定要退出登录吗？',
          '确认退出',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        
        await userStore.logout()
        ElMessage.success('已退出登录')
        router.push('/login')
      } catch (error) {
        if (error !== 'cancel') {
          console.error('退出登录失败:', error)
          ElMessage.error('退出登录失败')
        }
      }
      break
  }
}
</script>

<style scoped>
/* 全屏布局 */
.member-center-fullscreen {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background: #f5f7fa;
}

/* 左侧边栏 */
.sidebar {
  width: 280px;
  background: linear-gradient(180deg, #4A90E2 0%, #357ABD 100%);
  color: white;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.sidebar.collapsed {
  width: 80px;
}

/* Logo区域 */
.logo-area {
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.logo {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  object-fit: contain;
}

.brand-info {
  min-width: 0;
}

.brand-info h3 {
  font-size: 16px;
  font-weight: bold;
  margin: 0 0 4px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.brand-info p {
  font-size: 12px;
  margin: 0;
  opacity: 0.8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.collapse-btn {
  color: white;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  width: 32px;
  height: 32px;
  border-radius: 6px;
  flex-shrink: 0;
}

.collapse-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

/* 导航菜单 */
.sidebar-nav {
  flex: 1;
  padding: 20px 0;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
  white-space: nowrap;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.nav-item.active {
  background: rgba(255, 255, 255, 0.15);
  color: white;
  border-left-color: white;
}

.nav-item .el-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 16px;
}

/* 主要区域 */
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 顶部工具栏 */
.top-toolbar {
  background: white;
  padding: 12px 24px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  z-index: 50;
  min-height: 60px;
}

.toolbar-spacer {
  flex: 1;
}

.toolbar-right {
  display: flex;
  align-items: center;
}

/* 用户信息下拉 */
.user-dropdown {
  margin: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.user-info:hover {
  background: #f5f7fa;
}

.username {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.dropdown-icon {
  font-size: 12px;
  color: #909399;
  transition: transform 0.3s ease;
}

/* 主内容区 */
.content-area {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background: #f5f7fa;
}

/* 响应式设计 */

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    height: 100vh;
    z-index: 1000;
    transform: translateX(-100%);
  }
  
  .sidebar:not(.collapsed) {
    transform: translateX(0);
  }
  
  .main-area {
    width: 100%;
  }
  
  .top-toolbar {
    padding: 12px 16px;
  }
  
  .content-area {
    padding: 16px;
  }
  
  .user-info .username {
    display: none;
  }
}

@media (max-width: 480px) {
  .logo-area {
    padding: 16px;
  }
  
  .top-toolbar {
    padding: 12px;
  }
  
  .content-area {
    padding: 12px;
  }
}

/* 动画效果 */
.sidebar {
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-item span {
  transition: opacity 0.3s ease;
}

.sidebar.collapsed .nav-item span {
  opacity: 0;
}

/* 滚动条样式 */
.sidebar-nav::-webkit-scrollbar {
  width: 4px;
}

.sidebar-nav::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

.content-area::-webkit-scrollbar {
  width: 6px;
}

.content-area::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.content-area::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.content-area::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
