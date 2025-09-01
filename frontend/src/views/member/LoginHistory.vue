<template>
  <div class="login-history">
    <h1 class="page-title">登录历史</h1>
    
    <el-card>
      <template #header>
        <div class="card-header">
          <span>登录记录</span>
          <el-button type="primary" size="small" @click="refreshData">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>
      
      <el-table 
        :data="loginHistory" 
        style="width: 100%" 
        v-loading="loading"
        stripe
      >
        <el-table-column prop="operation_time" label="登录时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.operation_time) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="ip_address" label="IP地址" width="150" />
        
        <el-table-column prop="operation_url" label="登录页面" width="150" />
        
        <el-table-column prop="user_agent" label="设备信息" show-overflow-tooltip>
          <template #default="scope">
            <el-tooltip 
              :content="scope.row.user_agent" 
              placement="top" 
              :show-after="500"
            >
              <span>{{ getDeviceInfo(scope.row.user_agent) }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import { memberAPI } from '@/utils/api'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'

const userStore = useUserStore()
const loading = ref(false)
const loginHistory = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 格式化日期时间
const formatDateTime = (dateString) => {
  if (!dateString) return '暂无数据'
  return new Date(dateString).toLocaleString('zh-CN')
}

// 获取设备信息
const getDeviceInfo = (userAgent) => {
  if (!userAgent) return '未知设备'
  
  // 简单的设备信息提取
  if (userAgent.includes('Mobile')) {
    return '移动设备'
  } else if (userAgent.includes('Windows')) {
    return 'Windows设备'
  } else if (userAgent.includes('Mac')) {
    return 'Mac设备'
  } else if (userAgent.includes('Linux')) {
    return 'Linux设备'
  } else {
    return '其他设备'
  }
}

// 获取登录历史
const fetchLoginHistory = async () => {
  try {
    loading.value = true
    const response = await memberAPI.getLoginHistory({
      page: currentPage.value,
      limit: pageSize.value
    })
    
    if (response.data.message) {
      loginHistory.value = response.data.data.loginHistory
      total.value = response.data.data.pagination.total
    } else {
      ElMessage.error('获取登录历史失败')
    }
  } catch (error) {
    console.error('获取登录历史失败:', error)
    ElMessage.error('获取登录历史失败')
  } finally {
    loading.value = false
  }
}

// 刷新数据
const refreshData = () => {
  fetchLoginHistory()
}

// 处理分页大小变化
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  fetchLoginHistory()
}

// 处理当前页变化
const handleCurrentChange = (page) => {
  currentPage.value = page
  fetchLoginHistory()
}

onMounted(() => {
  fetchLoginHistory()
})
</script>

<style scoped>
.login-history {
  max-width: 100%;
}

.page-title {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 30px;
  color: #303133;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
  
  .el-table {
    font-size: 12px;
  }
}
</style>
