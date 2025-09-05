<template>
  <div class="device-track-map">
    <!-- 轨迹控制面板 -->
    <div class="track-controls">
      <div class="controls-header">
        <h4>设备轨迹</h4>
        <div class="device-info" v-if="deviceInfo">
          <el-tag :type="deviceInfo.status === 'online' ? 'success' : 'danger'" size="small">
            {{ deviceInfo.device_number }} - {{ deviceInfo.status === 'online' ? '在线' : '离线' }}
          </el-tag>
        </div>
      </div>

      <!-- 时间选择器 -->
      <div class="time-selector">
        <el-form :inline="true" size="small">
          <el-form-item label="查询时间:">
            <el-date-picker
              v-model="timeRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              :disabled-date="disabledDate"
              :shortcuts="timeShortcuts"
              @change="handleTimeRangeChange"
            />
          </el-form-item>
          <el-form-item>
            <el-button 
              type="primary" 
              @click="loadTrackData"
              :loading="loadingTrack"
              :disabled="!timeRange || timeRange.length !== 2"
            >
              <el-icon><Search /></el-icon>
              查询轨迹
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 轨迹信息 -->
      <div class="track-info" v-if="trackData.length > 0">
        <div class="info-item">
          <span class="label">轨迹点数:</span>
          <span class="value">{{ trackData.length }}</span>
        </div>
        <div class="info-item">
          <span class="label">总距离:</span>
          <span class="value">{{ formatDistance(totalDistance) }}</span>
        </div>
        <div class="info-item">
          <span class="label">平均速度:</span>
          <span class="value">{{ formatSpeed(averageSpeed) }}</span>
        </div>
      </div>

      <!-- 播放控制 -->
      <div class="playback-controls" v-if="trackData.length > 0">
        <el-button-group size="small">
          <el-button 
            @click="togglePlayback"
            :type="isPlaying ? 'danger' : 'primary'"
          >
            <el-icon><component :is="isPlaying ? VideoPause : VideoPlay" /></el-icon>
            {{ isPlaying ? '暂停' : '播放' }}
          </el-button>
          <el-button @click="resetPlayback">
            <el-icon><RefreshLeft /></el-icon>
            重置
          </el-button>
        </el-button-group>
        
        <div class="playback-slider">
          <el-slider
            v-model="currentPlayIndex"
            :max="trackData.length - 1"
            :disabled="isPlaying"
            @change="handleSliderChange"
          />
        </div>
        
        <div class="playback-info">
          <span>{{ currentPlayIndex + 1 }} / {{ trackData.length }}</span>
          <span v-if="currentTrackPoint">{{ formatDateTime(currentTrackPoint.timestamp) }}</span>
        </div>
      </div>
    </div>

    <!-- 地图容器 -->
    <div class="map-wrapper">
      <MapContainer
        ref="mapContainerRef"
        :height="mapHeight"
        :center="mapCenter"
        :zoom="mapZoom"
        @mapReady="handleMapReady"
        @mapClick="handleMapClick"
      />
    </div>

    <!-- 轨迹详情对话框 -->
    <el-dialog
      v-model="showTrackDetail"
      title="轨迹点详情"
      width="500px"
    >
      <div v-if="selectedTrackPoint" class="track-point-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="时间">
            {{ formatDateTime(selectedTrackPoint.timestamp) }}
          </el-descriptions-item>
          <el-descriptions-item label="经度">
            {{ selectedTrackPoint.longitude }}
          </el-descriptions-item>
          <el-descriptions-item label="纬度">
            {{ selectedTrackPoint.latitude }}
          </el-descriptions-item>
          <el-descriptions-item label="速度" v-if="selectedTrackPoint.speed">
            {{ selectedTrackPoint.speed }} km/h
          </el-descriptions-item>
          <el-descriptions-item label="海拔" v-if="selectedTrackPoint.altitude">
            {{ selectedTrackPoint.altitude }} 米
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, VideoPlay, VideoPause, RefreshLeft } from '@element-plus/icons-vue'
import MapContainer from './MapContainer.vue'
import { memberAPI } from '@/utils/api'

// Props
const props = defineProps({
  // 设备ID
  deviceId: {
    type: [String, Number],
    required: true
  },
  // 设备信息
  deviceInfo: {
    type: Object,
    default: () => ({})
  },
  // 地图高度
  mapHeight: {
    type: String,
    default: '500px'
  },
  // 是否自动加载轨迹
  autoLoad: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits([
  'trackLoaded',
  'trackError',
  'pointSelected'
])

// 响应式数据
const loadingTrack = ref(false)
const trackData = ref([])
const timeRange = ref([])
const mapContainerRef = ref()
const showTrackDetail = ref(false)
const selectedTrackPoint = ref(null)

// 播放控制
const isPlaying = ref(false)
const currentPlayIndex = ref(0)
const playTimer = ref(null)
const playSpeed = ref(1000) // 播放速度，毫秒

// 地图相关
const mapCenter = ref({ lng: 116.404, lat: 39.915 })
const mapZoom = ref(11)
const trackPolyline = ref(null)
const playMarker = ref(null)

// 时间快捷选项
const timeShortcuts = [
  {
    text: '最近1小时',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000)
      return [start, end]
    }
  },
  {
    text: '最近6小时',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 6)
      return [start, end]
    }
  },
  {
    text: '今天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setHours(0, 0, 0, 0)
      return [start, end]
    }
  },
  {
    text: '昨天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24)
      start.setHours(0, 0, 0, 0)
      end.setTime(start.getTime() + 3600 * 1000 * 24 - 1)
      return [start, end]
    }
  },
  {
    text: '最近7天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
      return [start, end]
    }
  }
]

// 计算属性
const totalDistance = computed(() => {
  if (trackData.value.length < 2) return 0
  
  let distance = 0
  for (let i = 1; i < trackData.value.length; i++) {
    const prev = trackData.value[i - 1]
    const curr = trackData.value[i]
    distance += calculateDistance(prev.latitude, prev.longitude, curr.latitude, curr.longitude)
  }
  return distance
})

const averageSpeed = computed(() => {
  if (trackData.value.length < 2 || !timeRange.value.length) return 0
  
  const startTime = new Date(timeRange.value[0]).getTime()
  const endTime = new Date(timeRange.value[1]).getTime()
  const hours = (endTime - startTime) / (1000 * 60 * 60)
  
  return hours > 0 ? totalDistance.value / hours : 0
})

const currentTrackPoint = computed(() => {
  return trackData.value[currentPlayIndex.value] || null
})

// 禁用未来日期
const disabledDate = (time) => {
  return time.getTime() > Date.now()
}

// 格式化日期时间
const formatDateTime = (dateString) => {
  if (!dateString) return '暂无数据'
  return new Date(dateString).toLocaleString('zh-CN')
}

// 格式化距离
const formatDistance = (distance) => {
  if (distance < 1000) {
    return `${distance.toFixed(0)} 米`
  }
  return `${(distance / 1000).toFixed(2)} 公里`
}

// 格式化速度
const formatSpeed = (speed) => {
  return `${speed.toFixed(1)} km/h`
}

// 计算两点间距离（米）
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371000 // 地球半径（米）
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// 时间范围变化处理
const handleTimeRangeChange = () => {
  if (timeRange.value && timeRange.value.length === 2) {
    // 检查时间跨度不超过7天
    const startTime = new Date(timeRange.value[0])
    const endTime = new Date(timeRange.value[1])
    const diffDays = (endTime - startTime) / (1000 * 60 * 60 * 24)
    
    if (diffDays > 7) {
      ElMessage.warning('查询时间跨度不能超过7天')
      timeRange.value = []
      return
    }
  }
}

// 加载轨迹数据
const loadTrackData = async () => {
  if (!timeRange.value || timeRange.value.length !== 2) {
    ElMessage.warning('请选择查询时间范围')
    return
  }

  try {
    loadingTrack.value = true
    
    // 调用真实的API获取轨迹数据
    const response = await memberAPI.getDeviceTrackPoints(props.deviceId, {
      startTime: timeRange.value[0],
      endTime: timeRange.value[1],
      limit: 1000
    })
    
    trackData.value = response.data.data.trackPoints || []
    currentPlayIndex.value = 0
    
    
    if (trackData.value.length > 0) {
      drawTrackOnMap()
      emit('trackLoaded', trackData.value)
      ElMessage.success(`成功加载 ${trackData.value.length} 个轨迹点`)
    } else {
      ElMessage.info('该时间段内没有轨迹数据')
    }
  } catch (error) {
    console.error('加载轨迹数据失败:', error)
    
    // 如果API调用失败，使用模拟数据作为后备
    const mockTrackData = generateMockTrackData()
    trackData.value = mockTrackData
    currentPlayIndex.value = 0
    
    if (trackData.value.length > 0) {
      drawTrackOnMap()
      emit('trackLoaded', trackData.value)
      ElMessage.warning(`API调用失败，使用模拟数据：${trackData.value.length} 个轨迹点`)
    } else {
      ElMessage.error('加载轨迹数据失败')
      emit('trackError', error)
    }
  } finally {
    loadingTrack.value = false
  }
}

// 生成模拟轨迹数据
const generateMockTrackData = () => {
  const startLat = 39.915
  const startLng = 116.404
  const points = []
  
  const startTime = new Date(timeRange.value[0]).getTime()
  const endTime = new Date(timeRange.value[1]).getTime()
  const pointCount = Math.min(100, Math.floor((endTime - startTime) / (5 * 60 * 1000))) // 每5分钟一个点
  
  for (let i = 0; i < pointCount; i++) {
    const progress = i / (pointCount - 1)
    const timestamp = new Date(startTime + progress * (endTime - startTime)).toISOString()
    
    // 模拟轨迹路径
    const lat = startLat + (Math.random() - 0.5) * 0.01 + progress * 0.005
    const lng = startLng + (Math.random() - 0.5) * 0.01 + progress * 0.008
    
    points.push({
      timestamp,
      latitude: lat,
      longitude: lng,
      speed: Math.random() * 60 + 20, // 20-80 km/h
      altitude: Math.random() * 100 + 50 // 50-150米
    })
  }
  
  return points
}

// 在地图上绘制轨迹
const drawTrackOnMap = () => {
  const mapUtils = mapContainerRef.value?.mapUtils
  if (!mapUtils || !trackData.value.length) {
    return
  }

  
  // 清除之前的轨迹
  mapUtils.clearAll()

  // 绘制轨迹线
  trackPolyline.value = mapUtils.drawDeviceTrack(trackData.value, {
    color: '#3388ff',
    weight: 4,
    opacity: 0.8
  })

  // 添加所有轨迹点标记（使用卡车图标）
  if (trackData.value.length > 0) {
    trackData.value.forEach((point, index) => {
      // 为每个轨迹点添加卡车图标标记
      mapUtils.addDeviceMarker({
        id: `track-point-${index}`,
        device_number: `轨迹点${index + 1}`,
        status: 'online',
        timestamp: point.timestamp
      }, {
        lng: point.lng,
        lat: point.lat
      })
    })

    // 设置地图中心为轨迹中心
    const startPoint = trackData.value[0]
    const endPoint = trackData.value[trackData.value.length - 1]
    const centerLat = (startPoint.lat + endPoint.lat) / 2
    const centerLng = (startPoint.lng + endPoint.lng) / 2
    mapUtils.setCenter({ lng: centerLng, lat: centerLat }, 13)
  }
}

// 播放控制
const togglePlayback = () => {
  if (isPlaying.value) {
    stopPlayback()
  } else {
    startPlayback()
  }
}

const startPlayback = () => {
  if (trackData.value.length === 0) return
  
  isPlaying.value = true
  playTimer.value = setInterval(() => {
    if (currentPlayIndex.value < trackData.value.length - 1) {
      currentPlayIndex.value++
      updatePlayMarker()
    } else {
      stopPlayback()
    }
  }, playSpeed.value)
}

const stopPlayback = () => {
  isPlaying.value = false
  if (playTimer.value) {
    clearInterval(playTimer.value)
    playTimer.value = null
  }
}

const resetPlayback = () => {
  stopPlayback()
  currentPlayIndex.value = 0
  updatePlayMarker()
}

const handleSliderChange = () => {
  updatePlayMarker()
}

// 更新播放标记
const updatePlayMarker = () => {
  const mapUtils = mapContainerRef.value?.mapUtils
  if (!mapUtils || !currentTrackPoint.value) return

  // 移除之前的播放标记
  if (playMarker.value && mapUtils.map) {
    mapUtils.map.removeOverlay(playMarker.value)
  }

  // 添加新的播放标记
  const currentPoint = currentTrackPoint.value
  playMarker.value = mapUtils.addDeviceMarker({
    id: 'current',
    device_number: `当前位置 (${currentPlayIndex.value + 1}/${trackData.value.length})`,
    status: 'online'
  }, {
    lng: currentPoint.longitude,
    lat: currentPoint.latitude
  })

  // 设置地图中心为当前点
  mapUtils.setCenter({
    lng: currentPoint.longitude,
    lat: currentPoint.latitude
  })
}

// 地图事件处理
const handleMapReady = (mapInstance) => {
  
  // 如果有设备信息且有位置，设置地图中心
  if (props.deviceInfo && props.deviceInfo.last_longitude && props.deviceInfo.last_latitude) {
    mapCenter.value = {
      lng: props.deviceInfo.last_longitude,
      lat: props.deviceInfo.last_latitude
    }
    mapZoom.value = 15
  }

  // 自动加载轨迹
  if (props.autoLoad && timeRange.value.length === 2) {
    loadTrackData()
  }
}

const handleMapClick = (point) => {
}

// 生命周期
onMounted(() => {
  // 设置默认时间范围为最近7天
  const end = new Date()
  const start = new Date()
  start.setTime(start.getTime() - 7 * 24 * 3600 * 1000) // 7天前
  timeRange.value = [
    start.toISOString().slice(0, 19).replace('T', ' '),
    end.toISOString().slice(0, 19).replace('T', ' ')
  ]
  
  // 自动加载轨迹数据
  if (timeRange.value.length === 2) {
    loadTrackData()
  }
})

onUnmounted(() => {
  stopPlayback()
})

// 监听设备变化
watch(() => props.deviceId, () => {
  // 设备变化时清空轨迹数据
  trackData.value = []
  stopPlayback()
  currentPlayIndex.value = 0
})

// 暴露方法给父组件
defineExpose({
  loadTrackData,
  clearTrack: () => {
    trackData.value = []
    mapContainerRef.value?.mapUtils?.clearAll()
  }
})
</script>

<style scoped>
.device-track-map {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 15px;
}

.track-controls {
  background: white;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.controls-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.controls-header h4 {
  margin: 0;
  color: #303133;
  font-size: 16px;
}

.time-selector {
  margin-bottom: 15px;
}

.track-info {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 6px;
}

.info-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.info-item .label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 5px;
}

.info-item .value {
  font-size: 14px;
  font-weight: bold;
  color: #303133;
}

.playback-controls {
  border-top: 1px solid #ebeef5;
  padding-top: 15px;
}

.playback-slider {
  margin: 10px 0;
}

.playback-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
}

.map-wrapper {
  flex: 1;
  min-height: 400px;
}

.track-point-detail {
  max-height: 400px;
  overflow-y: auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .track-info {
    flex-direction: column;
    gap: 10px;
  }

  .info-item {
    flex-direction: row;
    justify-content: space-between;
  }

  .controls-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>
