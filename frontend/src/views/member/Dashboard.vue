<template>
  <div class="dashboard">
    <h1 class="page-title">仪表盘</h1>
    
    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon size="32" color="#409eff"><Clock /></el-icon>
        </div>
        <div class="stat-content">
          <h3>最后登录</h3>
          <p>{{ formatDate(userStore.user?.last_login_at) }}</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon size="32" color="#67c23a"><User /></el-icon>
        </div>
        <div class="stat-content">
          <h3>账户状态</h3>
          <p>{{ userStore.user?.status === 'active' ? '正常' : '禁用' }}</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon size="32" color="#e6a23c"><Calendar /></el-icon>
        </div>
        <div class="stat-content">
          <h3>注册时间</h3>
          <p>{{ formatDate(userStore.user?.created_at) }}</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon size="32" color="#f56c6c"><View /></el-icon>
        </div>
        <div class="stat-content">
          <h3>登录次数</h3>
          <p>{{ loginCount }} 次</p>
        </div>
      </div>
    </div>

    <!-- 快速操作 -->
    <div class="quick-actions">
      <h2>快速操作</h2>
      <div class="actions-grid">
        <div class="action-card" @click="$router.push('/member/profile')">
          <el-icon size="48" color="#409eff"><User /></el-icon>
          <h3>个人信息</h3>
          <p>查看和修改个人信息</p>
        </div>
        
        <div class="action-card" @click="$router.push('/member/password')">
          <el-icon size="48" color="#67c23a"><Lock /></el-icon>
          <h3>修改密码</h3>
          <p>更新账户密码</p>
        </div>
        
        <div class="action-card" @click="$router.push('/member/login-history')">
          <el-icon size="48" color="#e6a23c"><Clock /></el-icon>
          <h3>登录历史</h3>
          <p>查看登录记录</p>
        </div>
      </div>
    </div>

    <!-- 最近登录记录 -->
    <div class="recent-logins">
      <h2>最近登录记录</h2>
      <el-table :data="recentLogins" style="width: 100%" v-loading="loading">
        <el-table-column prop="operation_time" label="登录时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.operation_time) }}
          </template>
        </el-table-column>
        <el-table-column prop="ip_address" label="IP地址" width="150" />
        <el-table-column prop="operation_url" label="登录页面" />
        <el-table-column prop="user_agent" label="设备信息" show-overflow-tooltip />
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import { memberAPI } from '@/utils/api'
import { ElMessage } from 'element-plus'
import { Clock, User, Calendar, View } from '@element-plus/icons-vue'

const userStore = useUserStore()
const loading = ref(false)
const recentLogins = ref([])
const loginCount = ref(0)

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '暂无数据'
  return new Date(dateString).toLocaleDateString('zh-CN')
}

// 格式化日期时间
const formatDateTime = (dateString) => {
  if (!dateString) return '暂无数据'
  return new Date(dateString).toLocaleString('zh-CN')
}

// 获取登录历史
const fetchLoginHistory = async () => {
  try {
    loading.value = true
    const response = await memberAPI.getLoginHistory({ page: 1, limit: 5 })
    if (response.data.message) {
      recentLogins.value = response.data.data.loginHistory
      loginCount.value = response.data.data.pagination.total
    }
  } catch (error) {
    console.error('获取登录历史失败:', error)
    ElMessage.error('获取登录历史失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchLoginHistory()
})
</script>

<style scoped>
.dashboard {
  max-width: 100%;
}

.page-title {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 30px;
  color: #303133;
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-icon {
  background: #f0f9ff;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-content h3 {
  font-size: 14px;
  color: #909399;
  margin: 0 0 8px 0;
  font-weight: normal;
}

.stat-content p {
  font-size: 20px;
  font-weight: bold;
  color: #303133;
  margin: 0;
}

/* 快速操作 */
.quick-actions {
  margin-bottom: 40px;
}

.quick-actions h2 {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #303133;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.action-card {
  background: white;
  border-radius: 12px;
  padding: 30px 20px;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.action-card h3 {
  font-size: 16px;
  font-weight: bold;
  margin: 15px 0 8px 0;
  color: #303133;
}

.action-card p {
  font-size: 14px;
  color: #606266;
  margin: 0;
}

/* 最近登录记录 */
.recent-logins h2 {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #303133;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .actions-grid {
    grid-template-columns: 1fr;
  }

  .stat-card {
    padding: 20px;
  }

  .action-card {
    padding: 25px 15px;
  }
}
</style>
