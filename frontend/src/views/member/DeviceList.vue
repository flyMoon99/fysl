<template>
  <div class="device-list">
    <h1 class="page-title">设备列表</h1>
    
    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item>
          <el-input
            v-model="searchForm.device_number"
            placeholder="请输入设备号"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item>
          <el-select
            v-model="searchForm.status"
            placeholder="设备状态"
            clearable
            style="width: 120px"
          >
            <el-option label="在线" value="online" />
            <el-option label="离线" value="offline" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="searchForm.device_model"
            placeholder="设备型号"
            clearable
            style="width: 150px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 设备统计卡片 -->
    <div class="stats-cards" v-if="deviceStats">
      <div class="stat-card">
        <div class="stat-icon online">
          <el-icon size="24"><Connection /></el-icon>
        </div>
        <div class="stat-content">
          <h3>在线设备</h3>
          <p>{{ deviceStats.online || 0 }} 个</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon offline">
          <el-icon size="24"><Close /></el-icon>
        </div>
        <div class="stat-content">
          <h3>离线设备</h3>
          <p>{{ deviceStats.offline || 0 }} 个</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon total">
          <el-icon size="24"><Position /></el-icon>
        </div>
        <div class="stat-content">
          <h3>总设备数</h3>
          <p>{{ deviceStats.total || 0 }} 个</p>
        </div>
      </div>
    </div>

    <!-- 设备列表 -->
    <div class="device-table">
      <el-table :data="deviceList" style="width: 100%" v-loading="loading">
        <el-table-column prop="device_number" label="设备号" width="150" />
        <el-table-column prop="device_alias" label="设备别名" width="120">
          <template #default="scope">
            {{ scope.row.device_alias || '暂无' }}
          </template>
        </el-table-column>
        <el-table-column prop="device_remarks" label="设备备注" min-width="150">
          <template #default="scope">
            {{ scope.row.device_remarks || '暂无' }}
          </template>
        </el-table-column>
        <el-table-column prop="battery_level" label="电量" width="100">
          <template #default="scope">
            <div class="battery-level">
              <el-progress 
                :percentage="scope.row.battery_level || 0" 
                :color="getBatteryColor(scope.row.battery_level)"
                :stroke-width="8"
              />
              <span class="battery-text">{{ scope.row.battery_level || 0 }}%</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="设备状态" width="100">
          <template #default="scope">
            <el-tag 
              :type="scope.row.status === 'online' ? 'success' : 'danger'"
            >
              {{ scope.row.status === 'online' ? '在线' : '离线' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="last_update_time" label="最后更新" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.last_update_time) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220">
          <template #default="scope">
            <el-button-group size="small">
              <el-button
                type="primary"
                @click="showDeviceDetail(scope.row)"
              >
                详情
              </el-button>
              <el-button
                type="warning"
                @click="showDeviceTrack(scope.row)"
              >
                <el-icon><Operation /></el-icon>
                轨迹
              </el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-if="total > 0"
        background
        layout="prev, pager, next, jumper, total"
        :current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        @current-change="handlePageChange"
        style="margin-top: 20px; text-align: center"
      />
    </div>

    <!-- 设备详情对话框 -->
    <el-dialog 
      v-model="showDetailDialog" 
      title="设备详情"
      width="600px"
    >
      <div v-if="currentDevice" class="device-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="设备号">{{ currentDevice.device_number }}</el-descriptions-item>
          <el-descriptions-item label="设备别名">{{ currentDevice.device_alias || '暂无' }}</el-descriptions-item>
          <el-descriptions-item label="设备型号">{{ currentDevice.device_model || '暂无' }}</el-descriptions-item>
          <el-descriptions-item label="设备状态">
            <el-tag :type="currentDevice.status === 'online' ? 'success' : 'danger'">
              {{ currentDevice.status === 'online' ? '在线' : '离线' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="电量">
            <el-progress 
              :percentage="currentDevice.battery_level || 0" 
              :color="getBatteryColor(currentDevice.battery_level)"
              style="width: 150px"
            />
            <span style="margin-left: 10px">{{ currentDevice.battery_level || 0 }}%</span>
          </el-descriptions-item>
          <el-descriptions-item label="服务状态">
            <el-tag :type="currentDevice.service_status === 'active' ? 'success' : 'warning'">
              {{ currentDevice.service_status === 'active' ? '服务中' : '未激活' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="设置状态">
            <el-tag :type="currentDevice.setting_status === 'active' ? 'success' : 'danger'">
              {{ currentDevice.setting_status === 'active' ? '服务中' : '已到期' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="最后更新时间">{{ formatDateTime(currentDevice.last_update_time) }}</el-descriptions-item>
          <el-descriptions-item label="最后位置" :span="2">
            <span v-if="currentDevice.last_longitude && currentDevice.last_latitude">
              经度: {{ currentDevice.last_longitude }}, 纬度: {{ currentDevice.last_latitude }}
            </span>
            <span v-else>暂无位置信息</span>
          </el-descriptions-item>
          <el-descriptions-item label="设备备注" :span="2">{{ currentDevice.device_remarks || '暂无' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDateTime(currentDevice.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ formatDateTime(currentDevice.updated_at) }}</el-descriptions-item>
        </el-descriptions>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showDetailDialog = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>


    <!-- 设备轨迹对话框 -->
    <el-dialog
      v-model="showTrackDialog"
      title="设备轨迹"
      width="90%"
      :close-on-click-modal="false"
      top="5vh"
    >
      <div v-if="currentDevice" class="device-track-dialog">
        <DeviceTrackMap
          :device-id="currentDevice.id"
          :device-info="currentDevice"
          map-height="600px"
          @trackLoaded="handleTrackLoaded"
          @trackError="handleTrackError"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { memberAPI } from '@/utils/api'
import { ElMessage } from 'element-plus'
import { Connection, Close, Operation } from '@element-plus/icons-vue'
import DeviceTrackMap from '@/components/DeviceTrackMap.vue'

const loading = ref(false)
const showDetailDialog = ref(false)
const showTrackDialog = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const deviceList = ref([])
const currentDevice = ref(null)

// 搜索表单
const searchForm = reactive({
  device_number: '',
  status: '',
  device_model: ''
})

// 计算设备统计
const deviceStats = computed(() => {
  if (!deviceList.value.length) return null
  
  const online = deviceList.value.filter(device => device.status === 'online').length
  const offline = deviceList.value.filter(device => device.status === 'offline').length
  const total = deviceList.value.length
  
  return { online, offline, total }
})

// 格式化日期时间
const formatDateTime = (dateString) => {
  if (!dateString) return '暂无数据'
  return new Date(dateString).toLocaleString('zh-CN')
}

// 获取电池颜色
const getBatteryColor = (level) => {
  if (level >= 80) return '#67c23a'
  if (level >= 50) return '#e6a23c'
  if (level >= 20) return '#f56c6c'
  return '#f56c6c'
}

// 获取设备列表
const fetchDeviceList = async () => {
  try {
    loading.value = true
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      ...searchForm
    }
    
    // 过滤空值
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] == null) {
        delete params[key]
      }
    })

    const response = await memberAPI.getDevices(params)
    if (response.data.message) {
      deviceList.value = response.data.data.devices
      total.value = response.data.data.pagination.total
    }
  } catch (error) {
    console.error('获取设备列表失败:', error)
    ElMessage.error('获取设备列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  fetchDeviceList()
}

// 重置搜索
const resetSearch = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = ''
  })
  currentPage.value = 1
  fetchDeviceList()
}

// 分页变化
const handlePageChange = (page) => {
  currentPage.value = page
  fetchDeviceList()
}

// 显示设备详情
const showDeviceDetail = (device) => {
  currentDevice.value = device
  showDetailDialog.value = true
}


// 显示设备轨迹
const showDeviceTrack = (device) => {
  currentDevice.value = device
  showTrackDialog.value = true
}


// 轨迹加载完成
const handleTrackLoaded = (trackData) => {
  ElMessage.success(`成功加载 ${trackData.length} 个轨迹点`)
}

// 轨迹加载错误
const handleTrackError = (error) => {
  console.error('[设备列表] 轨迹加载失败:', error)
  ElMessage.error('轨迹加载失败，请稍后重试')
}

onMounted(() => {
  fetchDeviceList()
})
</script>

<style scoped>
.device-list {
  max-width: 100%;
}

.page-title {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 30px;
  color: #303133;
}

/* 搜索栏 */
.search-bar {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.search-form {
  margin: 0;
}

/* 统计卡片 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 15px;
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-icon {
  border-radius: 12px;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon.online {
  background: #f0f9ff;
  color: #67c23a;
}

.stat-icon.offline {
  background: #fef0f0;
  color: #f56c6c;
}

.stat-icon.total {
  background: #f4f4f5;
  color: #409eff;
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

/* 设备表格 */
.device-table {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

/* 电量显示 */
.battery-level {
  display: flex;
  align-items: center;
  gap: 8px;
}

.battery-text {
  font-size: 12px;
  color: #606266;
  min-width: 30px;
}

/* 设备详情 */
.device-detail {
  max-height: 400px;
  overflow-y: auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .search-form {
    display: block;
  }

  .search-form .el-form-item {
    display: block;
    margin-bottom: 15px;
    margin-right: 0;
  }

  .search-form .el-input,
  .search-form .el-select {
    width: 100% !important;
  }

  .stats-cards {
    grid-template-columns: 1fr;
  }

  .stat-card {
    padding: 15px;
  }
}


.device-track-dialog {
  padding: 10px 0;
}
</style>
