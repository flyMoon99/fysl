<template>
  <div class="device-track-map">
    <!-- 轨迹控制面板 -->
    <div class="track-controls" v-if="!props.hideTimeControls && !props.floatingTimeSelector">
      <!-- 时间选择器 -->
      <div class="time-selector" v-if="!props.hideTimeControls">
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
      <div class="track-info" v-if="trackData.length > 0 && !props.hideTrackStats">
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
      <div class="playback-controls" v-if="trackData.length > 0 && !props.hidePlaybackControls">
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
    <div class="map-wrapper" :class="{ 'with-floating-controls': props.floatingTimeSelector }">
      <!-- 悬浮的时间选择器 -->
      <div class="floating-time-selector" v-if="props.floatingTimeSelector && !props.hideTimeControls">
        <el-form :inline="true" size="small">
          <el-form-item>
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
      
      <MapContainer
        ref="mapContainerRef"
        :height="mapHeight"
        :center="mapCenter"
        :zoom="mapZoom"
        :show-clear-reset-buttons="props.showClearResetButtons"
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
import { publicAPI } from '@/utils/api'

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
  },
  // 是否隐藏时间控制
  hideTimeControls: {
    type: Boolean,
    default: false
  },
  // 是否隐藏轨迹统计和播放控制
  hideTrackStats: {
    type: Boolean,
    default: false
  },
  // 是否隐藏播放控制
  hidePlaybackControls: {
    type: Boolean,
    default: false
  },
  // 是否将时间选择器悬浮到地图上方
  floatingTimeSelector: {
    type: Boolean,
    default: false
  },
  // 是否显示清除和重置按钮
  showClearResetButtons: {
    type: Boolean,
    default: true
  },
  // 外部传入的时间范围
  externalTimeRange: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits([
  'trackLoaded',
  'trackError',
  'pointSelected'
])

// 移除用户状态依赖，统一使用公开API

// 响应式数据
const loadingTrack = ref(false)
const trackData = ref([])
const timeRange = ref([])
const mapContainerRef = ref()
const showTrackDetail = ref(false)
const selectedTrackPoint = ref(null)
const hasLoadedTrack = ref(false) // 防止重复加载

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
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
      
      return [
        start.getFullYear() + '-' + 
        String(start.getMonth() + 1).padStart(2, '0') + '-' + 
        String(start.getDate()).padStart(2, '0') + ' ' +
        String(start.getHours()).padStart(2, '0') + ':' +
        String(start.getMinutes()).padStart(2, '0') + ':' +
        String(start.getSeconds()).padStart(2, '0'),
        
        end.getFullYear() + '-' + 
        String(end.getMonth() + 1).padStart(2, '0') + '-' + 
        String(end.getDate()).padStart(2, '0') + ' ' +
        String(end.getHours()).padStart(2, '0') + ':' +
        String(end.getMinutes()).padStart(2, '0') + ':' +
        String(end.getSeconds()).padStart(2, '0')
      ]
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
    
    // 统一使用公开API获取轨迹数据
    // 转换时间格式为ISO格式，确保正确处理时区
    const startTime = new Date(timeRange.value[0] + '+08:00').toISOString()
    const endTime = new Date(timeRange.value[1] + '+08:00').toISOString()
    
    console.log('轨迹查询参数:', {
      deviceId: props.deviceId,
      startTime: startTime,
      endTime: endTime
    })
    
    const response = await publicAPI.getDeviceTrackPoints(props.deviceId, {
      startTime: startTime,
      endTime: endTime,
      limit: 1000
    })
    
    console.log('轨迹查询响应:', response.data)
    
    // 处理轨迹数据格式
    const trackPoints = response.data.data.trackPoints || []
    console.log('原始轨迹点数据:', trackPoints)
    console.log('轨迹点数量:', trackPoints.length)
    
    trackData.value = trackPoints.map(point => ({
      lng: point.longitude,
      lat: point.latitude,
      longitude: point.longitude,
      latitude: point.latitude,
      timestamp: point.timestamp,
      coordinateSystem: point.coordinateSystem,
      address: point.address
    }))
    
    console.log('处理后的轨迹数据:', trackData.value)
    console.log('处理后的轨迹点数量:', trackData.value.length)
    
    currentPlayIndex.value = 0
    
    if (trackData.value.length > 0) {
      console.log('开始绘制轨迹到地图')
      drawTrackOnMap()
      emit('trackLoaded', trackData.value)
      hasLoadedTrack.value = true // 标记已加载
      ElMessage.success(`成功加载 ${trackData.value.length} 个轨迹点`)
    } else {
      console.log('没有轨迹数据，显示提示信息')
      ElMessage.info('该时间段内没有轨迹数据')
    }
  } catch (error) {
    console.error('加载轨迹数据失败:', error)
    console.error('错误详情:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: error.config
    })
    
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
      lng: lng,
      lat: lat,
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
  console.log('开始绘制轨迹，轨迹数据:', trackData.value)
  console.log('轨迹数据长度:', trackData.value.length)
  
  const mapUtils = mapContainerRef.value?.mapUtils
  console.log('地图工具实例:', mapUtils)
  
  if (!mapUtils || !trackData.value.length) {
    console.log('无法绘制轨迹:', { mapUtils: !!mapUtils, trackDataLength: trackData.value.length })
    return
  }

  console.log('清除之前的轨迹')
  // 清除之前的轨迹
  mapUtils.clearAll()

  console.log('开始绘制轨迹线')
  // 绘制轨迹线
  trackPolyline.value = mapUtils.drawDeviceTrack(trackData.value, {
    color: '#3388ff',
    weight: 4,
    opacity: 0.8
  })
  
  console.log('轨迹线绘制结果:', trackPolyline.value)

  // 添加所有轨迹点标记（使用卡车图标）
  if (trackData.value.length > 0) {
    trackData.value.forEach((point, index) => {
      // 为每个轨迹点添加卡车图标标记
      mapUtils.addDeviceMarker({
        id: `track-point-${index}`,
        device_number: props.deviceInfo?.device_number || '未知设备',
        status: 'online',
        timestamp: point.timestamp,
        address: point.address
      }, {
        lng: point.lng,
        lat: point.lat
      })
    })

    // 根据轨迹点自动调整地图视野
    console.log('开始根据轨迹点调整地图视野')
    mapUtils.fitTrackBounds(trackData.value, {
      padding: 80,    // 边距
      minZoom: 8,     // 最小缩放级别
      maxZoom: 18     // 最大缩放级别
    })
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
    device_number: props.deviceInfo?.device_number || '未知设备',
    status: 'online',
    timestamp: currentPoint.timestamp,
    address: currentPoint.address
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
  console.log('地图准备就绪，设备ID:', props.deviceId)
  console.log('地图实例:', mapInstance)
  console.log('autoLoad属性:', props.autoLoad)
  console.log('时间范围:', timeRange.value)
  console.log('是否已加载轨迹:', hasLoadedTrack.value)
  
  // 检查地图实例是否有mapUtils
  if (mapInstance && mapInstance.mapUtils) {
    console.log('地图工具实例存在:', mapInstance.mapUtils)
  } else {
    console.error('地图工具实例不存在!')
  }
  
  // 如果有设备信息且有位置，设置地图中心
  if (props.deviceInfo && props.deviceInfo.last_longitude && props.deviceInfo.last_latitude) {
    mapCenter.value = {
      lng: props.deviceInfo.last_longitude,
      lat: props.deviceInfo.last_latitude
    }
    mapZoom.value = 15
  }

  // 自动加载轨迹（只在 autoLoad 为 true 且时间范围已设置且未加载过时）
  if (props.autoLoad && timeRange.value.length === 2 && !hasLoadedTrack.value) {
    console.log('地图准备就绪，开始自动加载轨迹数据')
    loadTrackData()
  } else {
    console.log('不满足自动加载条件:', {
      autoLoad: props.autoLoad,
      timeRangeLength: timeRange.value.length,
      hasLoadedTrack: hasLoadedTrack.value
    })
  }
}

const handleMapClick = (point) => {
}

// 生命周期
onMounted(() => {
  console.log('DeviceTrackMap组件初始化，设备ID:', props.deviceId)
  console.log('设备信息:', props.deviceInfo)
  
  // 设置默认时间范围为最近7天（使用本地时间，避免时区转换问题）
  const now = new Date()
  const start = new Date()
  start.setTime(start.getTime() - 3600 * 1000 * 24 * 7) // 7天前
  const end = new Date() // 当前时间
  
  // 直接使用本地时间字符串，不进行时区转换
  timeRange.value = [
    start.getFullYear() + '-' + 
    String(start.getMonth() + 1).padStart(2, '0') + '-' + 
    String(start.getDate()).padStart(2, '0') + ' ' +
    String(start.getHours()).padStart(2, '0') + ':' +
    String(start.getMinutes()).padStart(2, '0') + ':' +
    String(start.getSeconds()).padStart(2, '0'),
    
    end.getFullYear() + '-' + 
    String(end.getMonth() + 1).padStart(2, '0') + '-' + 
    String(end.getDate()).padStart(2, '0') + ' ' +
    String(end.getHours()).padStart(2, '0') + ':' +
    String(end.getMinutes()).padStart(2, '0') + ':' +
    String(end.getSeconds()).padStart(2, '0')
  ]
  
  console.log('设置默认时间范围（最近7天）:', timeRange.value)
  
  // 注意：不在这里自动加载轨迹数据，避免重复加载
  // 轨迹数据将在 handleMapReady 中根据 autoLoad 属性决定是否加载
})

onUnmounted(() => {
  stopPlayback()
})

// 监听设备变化
watch(() => props.deviceId, () => {
  // 设备变化时清空轨迹数据和加载状态
  trackData.value = []
  hasLoadedTrack.value = false
  stopPlayback()
  currentPlayIndex.value = 0
})

// 监听外部时间范围变化
watch(() => props.externalTimeRange, (newTimeRange) => {
  if (newTimeRange && newTimeRange.length === 2) {
    console.log('外部时间范围变化，更新内部时间范围:', newTimeRange)
    timeRange.value = [...newTimeRange]
    
    // 如果地图已准备就绪且autoLoad为true，自动加载轨迹数据
    if (mapContainerRef.value && props.autoLoad) {
      console.log('外部时间范围变化，自动加载轨迹数据')
      loadTrackData()
    }
  }
}, { deep: true })

// 暴露方法给父组件
defineExpose({
  mapContainerRef,
  loadTrackData,
  loadTrackDataWithTimeRange: async (startTime, endTime) => {
    if (!startTime || !endTime) {
      ElMessage.warning('请提供开始时间和结束时间')
      return
    }

    try {
      loadingTrack.value = true
      
      console.log('使用外部时间范围加载轨迹数据:', { 
        deviceId: props.deviceId,
        startTime, 
        endTime 
      })
      
      const response = await publicAPI.getDeviceTrackPoints(props.deviceId, {
        startTime: startTime,
        endTime: endTime,
        limit: 1000
      })
      
      console.log('API响应状态:', response.status)
      console.log('API响应数据:', response.data)
      
      console.log('轨迹查询响应:', response.data)
      
      // 处理轨迹数据格式
      const trackPoints = response.data.data.trackPoints || []
      console.log('原始轨迹点数据:', trackPoints)
      console.log('轨迹点数量:', trackPoints.length)
      
      trackData.value = trackPoints.map(point => ({
        lng: point.longitude,
        lat: point.latitude,
        longitude: point.longitude,
        latitude: point.latitude,
        timestamp: point.timestamp,
        coordinateSystem: point.coordinateSystem,
        address: point.address
      }))
      
      console.log('处理后的轨迹数据:', trackData.value)
      console.log('处理后的轨迹点数量:', trackData.value.length)
      
      currentPlayIndex.value = 0
      
      if (trackData.value.length > 0) {
        console.log('开始绘制轨迹到地图')
        drawTrackOnMap()
        emit('trackLoaded', trackData.value)
        hasLoadedTrack.value = true
        ElMessage.success(`成功加载 ${trackData.value.length} 个轨迹点`)
      } else {
        console.log('没有轨迹数据，显示提示信息')
        ElMessage.info('该时间段内没有轨迹数据')
      }
    } catch (error) {
      console.error('加载轨迹数据失败:', error)
      console.error('错误详情:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config
      })
      
      ElMessage.error('加载轨迹数据失败')
      emit('trackError', error)
    } finally {
      loadingTrack.value = false
    }
  },
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
  position: relative;
}

.map-wrapper.with-floating-controls {
  padding-top: 0;
}

.floating-time-selector {
  position: absolute;
  top: 15px;
  left: 80px;  /* 避开左侧的缩放轴 */
  width: 500px;
  max-width: calc(100% - 95px);  /* 调整最大宽度，为左侧控件留出空间 */
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  padding: 10px 14px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
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
