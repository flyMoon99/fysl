<template>
  <div class="device-query-result-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <el-button @click="goBack" icon="ArrowLeft" circle />
          <div class="title-section">
            <h1 class="page-title">{{ deviceInfo.device_number }}-{{ getStatusText(deviceInfo.status) }}-设备轨迹</h1>
            <p class="device-info-text">设备别名：{{ deviceInfo.device_alias || '暂无' }}</p>
          </div>
        </div>
        <div class="header-right">
          <el-button @click="refreshData" :loading="loading" icon="Refresh">
            刷新
          </el-button>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <div class="content-layout">
        <!-- 左侧：控制面板和位置列表 -->
        <div class="left-panel">
          <el-card class="control-panel">
            <template #header>
              <h3>轨迹查询</h3>
            </template>
            
            <!-- 时间范围选择 -->
            <div class="time-range-section">
              <el-form :inline="true" size="small">
                <el-form-item label="开始日期:">
                  <el-date-picker
                    v-model="timeRange[0]"
                    type="datetime"
                    placeholder="开始时间"
                    format="YYYY-MM-DD HH:mm:ss"
                    value-format="YYYY-MM-DD HH:mm:ss"
                    size="small"
                    style="width: 180px"
                  />
                </el-form-item>
                <el-form-item label="结束日期:">
                  <el-date-picker
                    v-model="timeRange[1]"
                    type="datetime"
                    placeholder="结束时间"
                    format="YYYY-MM-DD HH:mm:ss"
                    value-format="YYYY-MM-DD HH:mm:ss"
                    size="small"
                    style="width: 180px"
                  />
                </el-form-item>
                <el-form-item>
                  <el-button 
                    type="primary" 
                    @click="searchTrackData"
                    :loading="loadingTrack"
                    size="small"
                  >
                    搜索
                  </el-button>
                </el-form-item>
              </el-form>
            </div>
          </el-card>

          <!-- 位置列表 -->
          <el-card class="location-list-card">
            <template #header>
              <div class="list-header">
                <h3>位置记录</h3>
                <span class="record-count">共 {{ locationList.length }} 条记录</span>
              </div>
            </template>
            
            <div class="location-list">
              <div
                v-for="(location, index) in paginatedLocations"
                :key="location.id"
                class="location-item"
                :class="{ active: selectedLocationIndex === index }"
                @click="selectLocation(index)"
              >
                <div class="location-address">
                  {{ location.address || '地址解析中...' }}
                </div>
                <div class="location-time">
                  {{ formatDateTime(location.created_at) }}
                </div>
              </div>
            </div>

            <!-- 分页 -->
            <div class="pagination-container" v-if="totalPages > 1">
              <el-pagination
                v-model:current-page="currentPage"
                :page-size="pageSize"
                :total="locationList.length"
                layout="prev, pager, next, jumper"
                small
                @current-change="handlePageChange"
              />
            </div>
          </el-card>
        </div>

        <!-- 右侧：地图展示 -->
        <div class="right-panel">
          <el-card class="map-card">
            <div class="map-container">
              <MapContainer
                ref="mapContainerRef"
                :height="mapHeight"
                :center="mapCenter"
                :zoom="mapZoom"
                :show-clear-reset-buttons="true"
                @mapReady="handleMapReady"
                @mapClick="handleMapClick"
              />
            </div>
          </el-card>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <el-loading text="正在加载设备信息..." />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Refresh } from '@element-plus/icons-vue'
import { publicAPI } from '@/utils/api'
import MapContainer from '@/components/MapContainer.vue'

const route = useRoute()
const router = useRouter()

// 响应式数据
const loading = ref(false)
const loadingTrack = ref(false)
const deviceInfo = ref({})
const locationList = ref([])
const selectedLocationIndex = ref(-1)
const mapContainerRef = ref()
const mapCenter = ref({ lng: 116.404, lat: 39.915 })
const mapZoom = ref(11)
const currentPage = ref(1)
const pageSize = ref(10)

// 时间范围
const timeRange = ref([])

// 计算属性
const mapHeight = computed(() => '600px')

const totalPages = computed(() => {
  return Math.ceil(locationList.value.length / pageSize.value)
})

const paginatedLocations = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return locationList.value.slice(start, end)
})

// 格式化日期时间
const formatDateTime = (dateString) => {
  if (!dateString) return '暂无数据'
  return new Date(dateString).toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

// 获取设备状态文本
const getStatusText = (status) => {
  switch (status) {
    case 'online': return '在线'
    case 'offline': return '离线'
    case 'sleep': return '休眠'
    default: return '未知'
  }
}

// 返回上一页
const goBack = () => {
  router.push('/device-query')
}

// 刷新数据
const refreshData = async () => {
  await loadDeviceInfo()
  await loadLocationData()
}

// 加载设备信息
const loadDeviceInfo = async () => {
  try {
    loading.value = true
    const deviceNumber = route.params.deviceNumber
    const response = await publicAPI.getDeviceByNumber(deviceNumber)
    
    if (response.data && response.data.data) {
      deviceInfo.value = response.data.data
      
      // 设置地图中心为设备最后位置
      if (deviceInfo.value.last_longitude && deviceInfo.value.last_latitude) {
        mapCenter.value = {
          lng: parseFloat(deviceInfo.value.last_longitude),
          lat: parseFloat(deviceInfo.value.last_latitude)
        }
        mapZoom.value = 15
      }
    } else {
      ElMessage.error('设备信息加载失败')
      router.push('/device-query')
    }
  } catch (error) {
    console.error('加载设备信息失败:', error)
    ElMessage.error('设备信息加载失败')
    router.push('/device-query')
  } finally {
    loading.value = false
  }
}

// 加载位置数据
const loadLocationData = async () => {
  try {
    loadingTrack.value = true
    
    if (!timeRange.value || timeRange.value.length !== 2) {
      // 如果没有设置时间范围，使用默认的最近7天
      const now = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
      start.setHours(0, 0, 0, 0)
      now.setHours(23, 59, 59, 999)
      
      timeRange.value = [
        start.getFullYear() + '-' + 
        String(start.getMonth() + 1).padStart(2, '0') + '-' + 
        String(start.getDate()).padStart(2, '0') + ' ' +
        String(start.getHours()).padStart(2, '0') + ':' +
        String(start.getMinutes()).padStart(2, '0') + ':' +
        String(start.getSeconds()).padStart(2, '0'),
        
        now.getFullYear() + '-' + 
        String(now.getMonth() + 1).padStart(2, '0') + '-' + 
        String(now.getDate()).padStart(2, '0') + ' ' +
        String(now.getHours()).padStart(2, '0') + ':' +
        String(now.getMinutes()).padStart(2, '0') + ':' +
        String(now.getSeconds()).padStart(2, '0')
      ]
    }
    
    const response = await publicAPI.getDeviceLocationHistory(deviceInfo.value.id, {
      startTime: timeRange.value[0],
      endTime: timeRange.value[1],
      limit: 1000,
      page: 1
    })
    
    if (response.data && response.data.data) {
      locationList.value = response.data.data.locations || []
      
      // 在地图上显示轨迹
      if (locationList.value.length > 0) {
        drawTrackOnMap()
      }
      
      ElMessage.success(`成功加载 ${locationList.value.length} 条位置记录`)
    } else {
      locationList.value = []
      ElMessage.info('该时间段内没有位置记录')
    }
  } catch (error) {
    console.error('加载位置数据失败:', error)
    ElMessage.error('位置数据加载失败')
    locationList.value = []
  } finally {
    loadingTrack.value = false
  }
}

// 搜索轨迹数据
const searchTrackData = async () => {
  if (!timeRange.value || timeRange.value.length !== 2) {
    ElMessage.warning('请选择查询时间范围')
    return
  }
  
  await loadLocationData()
}

// 选择位置
const selectLocation = (index) => {
  selectedLocationIndex.value = index
  const location = paginatedLocations.value[index]
  
  if (location && location.longitude && location.latitude) {
    // 设置地图中心为选中位置
    mapCenter.value = {
      lng: parseFloat(location.longitude),
      lat: parseFloat(location.latitude)
    }
    mapZoom.value = 16
    
    // 更新地图中心
    if (mapContainerRef.value && mapContainerRef.value.mapUtils) {
      mapContainerRef.value.mapUtils.setCenter(mapCenter.value)
    }
  }
}

// 分页变化
const handlePageChange = (page) => {
  currentPage.value = page
  selectedLocationIndex.value = -1
}

// 在地图上绘制轨迹
const drawTrackOnMap = () => {
  const mapUtils = mapContainerRef.value?.mapUtils
  if (!mapUtils || !locationList.value.length) return

  // 清除之前的轨迹
  mapUtils.clearAll()

  // 准备轨迹数据
  const trackData = locationList.value.map(location => ({
    lng: parseFloat(location.longitude),
    lat: parseFloat(location.latitude),
    longitude: parseFloat(location.longitude),
    latitude: parseFloat(location.latitude),
    timestamp: location.created_at,
    address: location.address
  }))

  // 绘制轨迹线
  mapUtils.drawDeviceTrack(trackData, {
    color: '#3388ff',
    weight: 4,
    opacity: 0.8
  })

  // 添加设备标记
  trackData.forEach((point, index) => {
    mapUtils.addDeviceMarker({
      id: `location-${index}`,
      device_number: deviceInfo.value.device_number,
      status: deviceInfo.value.status || 'online',
      timestamp: point.timestamp,
      address: point.address
    }, {
      lng: point.lng,
      lat: point.lat
    })
  })

  // 根据轨迹点自动调整地图视野
  mapUtils.fitTrackBounds(trackData, {
    padding: 80,
    minZoom: 8,
    maxZoom: 18
  })
}

// 地图事件处理
const handleMapReady = (mapInstance) => {
  console.log('地图准备就绪')
  if (locationList.value.length > 0) {
    drawTrackOnMap()
  }
}

const handleMapClick = (point) => {
  // 可以在这里处理地图点击事件
}

// 页面加载时初始化
onMounted(async () => {
  await loadDeviceInfo()
  await loadLocationData()
})
</script>

<style scoped>
.device-query-result-page {
  min-height: 100vh;
  background: #f5f7fa;
}

/* 页面头部 */
.page-header {
  background: white;
  border-bottom: 1px solid #e4e7ed;
  padding: 20px 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.title-section {
  flex: 1;
}

.page-title {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin: 0 0 4px 0;
}

.device-info-text {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 主要内容区域 */
.main-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px 24px;
}

.content-layout {
  display: flex;
  gap: 20px;
  height: 700px;
}

.left-panel {
  width: 400px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.right-panel {
  flex: 1;
  min-width: 0;
}

/* 控制面板 */
.control-panel {
  flex-shrink: 0;
}

.control-panel .el-card__header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.time-range-section {
  padding: 10px 0;
}

.time-range-section .el-form-item {
  margin-bottom: 15px;
}

.time-range-section .el-form-item:last-child {
  margin-bottom: 0;
}

/* 位置列表 */
.location-list-card {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.list-header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.record-count {
  font-size: 12px;
  color: #909399;
}

.location-list {
  flex: 1;
  overflow-y: auto;
  max-height: 400px;
}

.location-item {
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.3s;
  background: #fafafa;
}

.location-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.location-item.active {
  border-color: #409eff;
  background: #ecf5ff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.location-address {
  font-size: 13px;
  color: #303133;
  margin-bottom: 4px;
  line-height: 1.4;
  word-break: break-all;
}

.location-time {
  font-size: 12px;
  color: #909399;
}

/* 分页 */
.pagination-container {
  margin-top: 15px;
  text-align: center;
}

/* 地图容器 */
.map-card {
  height: 100%;
}

.map-container {
  height: 600px;
  border-radius: 4px;
  overflow: hidden;
}

/* 加载状态 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .content-layout {
    flex-direction: column;
    height: auto;
  }
  
  .left-panel {
    width: 100%;
  }
  
  .location-list {
    max-height: 300px;
  }
  
  .map-container {
    height: 400px;
  }
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .page-title {
    font-size: 20px;
  }
  
  .main-content {
    padding: 15px;
  }
  
  .content-layout {
    gap: 15px;
  }
}
</style>

