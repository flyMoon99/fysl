<template>
  <div class="admin-dashboard">
    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon size="32" color="#409eff"><User /></el-icon>
        </div>
        <div class="stat-content">
          <h3>总会员数</h3>
          <p>{{ stats.totalMembers }}</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon size="32" color="#67c23a"><Avatar /></el-icon>
        </div>
        <div class="stat-content">
          <h3>活跃会员</h3>
          <p>{{ stats.activeMembers }}</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon size="32" color="#e6a23c"><Clock /></el-icon>
        </div>
        <div class="stat-content">
          <h3>今日登录</h3>
          <p>{{ stats.todayLogins }}</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon size="32" color="#f56c6c"><View /></el-icon>
        </div>
        <div class="stat-content">
          <h3>总登录次数</h3>
          <p>{{ stats.totalLogins }}</p>
        </div>
      </div>
    </div>

    <!-- 快速操作 -->
    <div class="content-header">
      <h2>快速操作</h2>
      <div class="quick-actions">
        <el-button type="primary" @click="$router.push('/admin/members')">
          <el-icon><Avatar /></el-icon>
          会员管理
        </el-button>
        
        <el-button 
          v-if="adminStore.isSuperAdmin" 
          type="success" 
          @click="$router.push('/admin/admins')"
        >
          <el-icon><User /></el-icon>
          管理员管理
        </el-button>
        
        <el-button type="warning" @click="$router.push('/admin/stats')">
          <el-icon><TrendCharts /></el-icon>
          统计分析
        </el-button>
      </div>
    </div>

    <!-- 最近登录记录 -->
    <div class="content-body">
      <h2>最近登录记录</h2>
      <el-table :data="recentLogins" style="width: 100%" v-loading="loading">
        <el-table-column prop="username" label="用户名" width="150" />
        <el-table-column prop="operation_time" label="登录时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.operation_time) }}
          </template>
        </el-table-column>
        <el-table-column prop="ip_address" label="IP地址" width="150" />
        <el-table-column prop="user_agent" label="设备信息" show-overflow-tooltip />
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAdminStore } from '@/store/admin'
import { statsAPI } from '@/utils/api'
import { ElMessage } from 'element-plus'
import { User, Avatar, Clock, View, TrendCharts } from '@element-plus/icons-vue'

const adminStore = useAdminStore()
const loading = ref(false)
const recentLogins = ref([])

const stats = ref({
  totalMembers: 0,
  activeMembers: 0,
  todayLogins: 0,
  totalLogins: 0
})

// 格式化日期时间
const formatDateTime = (dateString) => {
  if (!dateString) return '暂无数据'
  return new Date(dateString).toLocaleString('zh-CN')
}

// 获取统计数据
const fetchStats = async () => {
  try {
    loading.value = true
    
    // 获取系统统计信息
    const systemResponse = await statsAPI.getSystemStats()
    if (systemResponse.data.success) {
      stats.value = systemResponse.data.data
    }
    
    // 获取最近登录记录
    const loginResponse = await statsAPI.getLoginStats({ limit: 10 })
    if (loginResponse.data.success) {
      recentLogins.value = loginResponse.data.data.logins
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
    ElMessage.error('获取统计数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchStats()
})
</script>

<style scoped>
.admin-dashboard {
  max-width: 100%;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #f5f7fa;
}

.stat-content h3 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.stat-content p {
  margin: 0;
  font-size: 28px;
  font-weight: bold;
  color: #333;
}

.content-header {
  margin-bottom: 24px;
}

.content-header h2 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 20px;
  font-weight: 600;
}

.content-body {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.content-body h2 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.quick-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.quick-actions .el-button {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .quick-actions {
    flex-direction: column;
  }
  
  .quick-actions .el-button {
    width: 100%;
  }
  
  .stat-card {
    padding: 20px;
  }
  
  .content-body {
    padding: 20px;
  }
}

@media (max-width: 480px) {
  .stat-card {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
  
  .stat-content h3 {
    font-size: 12px;
  }
  
  .stat-content p {
    font-size: 24px;
  }
}
</style>
