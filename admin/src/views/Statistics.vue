<template>
  <div class="statistics">
    <!-- 页面头部 -->
    <div class="content-header">
      <h2>统计分析</h2>
      <div class="header-actions">
        <el-button type="primary" @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- 统计概览 -->
    <div class="stats-overview">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <el-icon size="32" color="#409eff"><User /></el-icon>
          </div>
          <div class="stat-content">
            <h3>总会员数</h3>
            <p>{{ stats.totalMembers }}</p>
            <small>较昨日 {{ stats.memberGrowth > 0 ? '+' : '' }}{{ stats.memberGrowth }}%</small>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <el-icon size="32" color="#67c23a"><Avatar /></el-icon>
          </div>
          <div class="stat-content">
            <h3>活跃会员</h3>
            <p>{{ stats.activeMembers }}</p>
            <small>活跃率 {{ stats.activeRate }}%</small>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <el-icon size="32" color="#e6a23c"><Clock /></el-icon>
          </div>
          <div class="stat-content">
            <h3>今日登录</h3>
            <p>{{ stats.todayLogins }}</p>
            <small>较昨日 {{ stats.loginGrowth > 0 ? '+' : '' }}{{ stats.loginGrowth }}%</small>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <el-icon size="32" color="#f56c6c"><View /></el-icon>
          </div>
          <div class="stat-content">
            <h3>总登录次数</h3>
            <p>{{ stats.totalLogins }}</p>
            <small>平均每人 {{ stats.avgLogins }} 次</small>
          </div>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-section">
      <div class="chart-row">
        <!-- 会员增长趋势 -->
        <div class="chart-card">
          <h3>会员增长趋势</h3>
          <div class="chart-placeholder">
            <el-icon size="48" color="#409eff"><TrendCharts /></el-icon>
            <p>会员注册趋势图表</p>
            <small>显示最近30天的会员注册情况</small>
          </div>
        </div>
        
        <!-- 登录活跃度 -->
        <div class="chart-card">
          <h3>登录活跃度</h3>
          <div class="chart-placeholder">
            <el-icon size="48" color="#67c23a"><DataLine /></el-icon>
            <p>登录活跃度图表</p>
            <small>显示最近7天的登录情况</small>
          </div>
        </div>
      </div>
      
      <div class="chart-row">
        <!-- 会员状态分布 -->
        <div class="chart-card">
          <h3>会员状态分布</h3>
          <div class="chart-placeholder">
            <el-icon size="48" color="#e6a23c"><PieChart /></el-icon>
            <p>会员状态分布图表</p>
            <small>启用/禁用会员比例</small>
          </div>
        </div>
        
        <!-- 登录时间分布 -->
        <div class="chart-card">
          <h3>登录时间分布</h3>
          <div class="chart-placeholder">
            <el-icon size="48" color="#f56c6c"><Histogram /></el-icon>
            <p>登录时间分布图表</p>
            <small>24小时登录时间分布</small>
          </div>
        </div>
      </div>
    </div>

    <!-- 详细数据表格 -->
    <div class="content-body">
      <h3>详细数据</h3>
      
      <!-- 最近注册会员 -->
      <div class="data-section">
        <h4>最近注册会员</h4>
        <el-table :data="recentMembers" style="width: 100%" v-loading="loading">
          <el-table-column prop="username" label="用户名" width="150" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.status === 'active' ? 'success' : 'danger'">
                {{ scope.row.status === 'active' ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="注册时间" width="180">
            <template #default="scope">
              {{ formatDateTime(scope.row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column prop="last_login_at" label="最后登录" width="180">
            <template #default="scope">
              {{ formatDateTime(scope.row.last_login_at) }}
            </template>
          </el-table-column>
          <el-table-column prop="login_count" label="登录次数" width="100" />
        </el-table>
      </div>
      
      <!-- 最近登录记录 -->
      <div class="data-section">
        <h4>最近登录记录</h4>
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { statsAPI } from '@/utils/api'
import { ElMessage } from 'element-plus'
import { 
  User, 
  Avatar, 
  Clock, 
  View, 
  Refresh, 
  TrendCharts, 
  DataLine, 
  PieChart, 
  Histogram 
} from '@element-plus/icons-vue'

const loading = ref(false)
const recentMembers = ref([])
const recentLogins = ref([])

const stats = ref({
  totalMembers: 0,
  activeMembers: 0,
  todayLogins: 0,
  totalLogins: 0,
  memberGrowth: 0,
  activeRate: 0,
  loginGrowth: 0,
  avgLogins: 0
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
    
    // 获取会员统计信息
    const memberResponse = await statsAPI.getMemberStats()
    if (memberResponse.data.success) {
      recentMembers.value = memberResponse.data.data.recentMembers || []
    }
    
    // 获取登录统计信息
    const loginResponse = await statsAPI.getLoginStats({ limit: 10 })
    if (loginResponse.data.success) {
      recentLogins.value = loginResponse.data.data.logins || []
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
    ElMessage.error('获取统计数据失败')
  } finally {
    loading.value = false
  }
}

// 刷新数据
const refreshData = () => {
  fetchStats()
  ElMessage.success('数据已刷新')
}

onMounted(() => {
  fetchStats()
})
</script>

<style scoped>
.statistics {
  max-width: 100%;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.stats-overview {
  margin-bottom: 30px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
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
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin: 0 0 4px 0;
}

.stat-content small {
  font-size: 12px;
  color: #909399;
}

.charts-section {
  margin-bottom: 30px;
}

.chart-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.chart-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.chart-card h3 {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
  margin: 0 0 20px 0;
}

.chart-placeholder {
  height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 8px;
  border: 2px dashed #dcdfe6;
}

.chart-placeholder p {
  margin: 12px 0 8px 0;
  color: #606266;
  font-size: 16px;
}

.chart-placeholder small {
  color: #909399;
  font-size: 14px;
}

.data-section {
  margin-bottom: 30px;
}

.data-section h4 {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  margin: 0 0 15px 0;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .chart-row {
    grid-template-columns: 1fr;
  }
  
  .stat-card {
    padding: 20px;
  }
  
  .chart-card {
    padding: 20px;
  }
}
</style>
