<template>
  <div class="member-center">
    <!-- 头部导航 -->
    <Header />

    <!-- 主要内容 -->
    <div class="main-content">
      <div class="container">
        <div class="member-layout">
          <!-- 侧边栏 -->
          <aside class="sidebar">
            <div class="user-info">
              <el-avatar :size="64" icon="UserFilled" />
              <h3>{{ userStore.user?.username }}</h3>
              <p>会员中心</p>
            </div>
            
            <nav class="sidebar-nav">
              <router-link to="/member" class="nav-item" exact-active-class="active">
                <el-icon><House /></el-icon>
                <span>仪表盘</span>
              </router-link>
              <router-link to="/member/profile" class="nav-item" exact-active-class="active">
                <el-icon><User /></el-icon>
                <span>个人信息</span>
              </router-link>
              <router-link to="/member/password" class="nav-item" exact-active-class="active">
                <el-icon><Lock /></el-icon>
                <span>修改密码</span>
              </router-link>
              <router-link to="/member/login-history" class="nav-item" exact-active-class="active">
                <el-icon><Clock /></el-icon>
                <span>登录历史</span>
              </router-link>
            </nav>
          </aside>

          <!-- 主内容区 -->
          <main class="content">
            <router-view />
          </main>
        </div>
      </div>
    </div>

    <!-- 底部 -->
    <Footer />
  </div>
</template>

<script setup>
import { useUserStore } from '@/store/user'
import Header from '@/components/Header.vue'
import Footer from '@/components/Footer.vue'
import { House, User, Lock, Clock } from '@element-plus/icons-vue'

const userStore = useUserStore()
</script>

<style scoped>
.member-center {
  min-height: 100vh;
}

.main-content {
  margin-top: 70px;
  padding: 40px 0;
  background: #f5f7fa;
  min-height: calc(100vh - 70px);
}

.member-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 30px;
  align-items: start;
}

/* 侧边栏 */
.sidebar {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.user-info {
  padding: 30px 20px;
  text-align: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.user-info h3 {
  margin: 15px 0 5px;
  font-size: 18px;
  font-weight: bold;
}

.user-info p {
  margin: 0;
  opacity: 0.9;
  font-size: 14px;
}

.sidebar-nav {
  padding: 20px 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px 20px;
  color: #606266;
  text-decoration: none;
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
}

.nav-item:hover {
  background: #f5f7fa;
  color: #409eff;
}

.nav-item.active {
  background: #ecf5ff;
  color: #409eff;
  border-left-color: #409eff;
}

.nav-item .el-icon {
  font-size: 18px;
}

/* 主内容区 */
.content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 30px;
  min-height: 600px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .member-layout {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .sidebar {
    order: 2;
  }

  .content {
    order: 1;
    padding: 20px;
  }

  .user-info {
    padding: 20px;
  }

  .nav-item {
    padding: 12px 20px;
  }
}
</style>
