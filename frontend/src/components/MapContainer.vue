<template>
  <div class="map-container">
    <div 
      :id="mapId" 
      class="baidu-map"
      :style="{ width: width, height: height }"
      v-loading="loading"
      element-loading-text="正在加载地图..."
    >
    </div>
    
    <!-- 地图工具栏 -->
    <div v-if="showToolbar" class="map-toolbar">
      <el-button-group>
        <el-button 
          size="small" 
          @click="clearMap"
          :disabled="loading"
        >
          <el-icon><Delete /></el-icon>
          清除
        </el-button>
        <el-button 
          size="small" 
          @click="resetView"
          :disabled="loading"
        >
          <el-icon><Refresh /></el-icon>
          重置
        </el-button>
        <el-button 
          v-if="allowFullscreen"
          size="small" 
          @click="toggleFullscreen"
          :disabled="loading"
        >
          <el-icon><FullScreen /></el-icon>
          {{ isFullscreen ? '退出全屏' : '全屏' }}
        </el-button>
      </el-button-group>
    </div>

    <!-- 地图加载错误提示 -->
    <div v-if="loadError" class="map-error">
      <el-alert
        title="地图加载失败"
        :description="loadError"
        type="error"
        show-icon
        :closable="false"
      />
      <el-button 
        type="primary" 
        @click="retryLoad"
        style="margin-top: 10px"
      >
        重新加载
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Delete, Refresh, FullScreen } from '@element-plus/icons-vue'
import { mapUtils } from '@/utils/mapUtils'

// Props
const props = defineProps({
  // 地图容器宽度
  width: {
    type: String,
    default: '100%'
  },
  // 地图容器高度
  height: {
    type: String,
    default: '400px'
  },
  // 是否显示工具栏
  showToolbar: {
    type: Boolean,
    default: true
  },
  // 是否允许全屏
  allowFullscreen: {
    type: Boolean,
    default: true
  },
  // 地图初始中心点
  center: {
    type: Object,
    default: () => ({ lng: 116.404, lat: 39.915 })
  },
  // 地图初始缩放级别
  zoom: {
    type: Number,
    default: 11
  },
  // 是否自动调整视野以显示所有标记
  autoViewport: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits([
  'mapReady',
  'mapClick',
  'markerClick',
  'error'
])

// 响应式数据
const loading = ref(true)
const loadError = ref('')
const isFullscreen = ref(false)
const mapId = ref(`map-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
const mapInstance = ref(null)

// 初始化地图
const initMap = async () => {
  try {
    loading.value = true
    loadError.value = ''

    await nextTick()

    const mapOptions = {
      center: props.center,
      zoom: props.zoom
    }

    mapInstance.value = await mapUtils.initMap(mapId.value, mapOptions)

    // 添加地图点击事件
    mapInstance.value.addEventListener('click', handleMapClick)

    emit('mapReady', mapInstance.value)
  } catch (error) {
    console.error('[地图组件] 地图初始化失败:', error)
    loadError.value = error.message || '地图加载失败，请检查网络连接'
    emit('error', error)
  } finally {
    loading.value = false
  }
}

// 地图点击处理
const handleMapClick = (e) => {
  const point = e.point
  emit('mapClick', {
    lng: point.lng,
    lat: point.lat,
    pixel: e.pixel
  })
}

// 清除地图
const clearMap = () => {
  if (mapUtils.map) {
    mapUtils.clearAll()
    ElMessage.success('地图已清除')
  }
}

// 重置视野
const resetView = () => {
  if (mapUtils.map) {
    mapUtils.setCenter(props.center, props.zoom)
    ElMessage.success('地图视野已重置')
  }
}

// 切换全屏
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  
  if (isFullscreen.value) {
    // 进入全屏模式
    const mapContainer = document.querySelector(`#${mapId.value}`).parentElement
    if (mapContainer.requestFullscreen) {
      mapContainer.requestFullscreen()
    } else if (mapContainer.webkitRequestFullscreen) {
      mapContainer.webkitRequestFullscreen()
    } else if (mapContainer.mozRequestFullScreen) {
      mapContainer.mozRequestFullScreen()
    }
  } else {
    // 退出全屏模式
    if (document.exitFullscreen) {
      document.exitFullscreen()
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen()
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen()
    }
  }
  
  // 地图需要重新调整大小
  setTimeout(() => {
    if (mapUtils.map) {
      mapUtils.map.checkResize()
    }
  }, 100)
}

// 重新加载地图
const retryLoad = () => {
  initMap()
}

// 监听全屏状态变化
const handleFullscreenChange = () => {
  isFullscreen.value = !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement
  )
}

// 暴露方法给父组件
defineExpose({
  mapInstance,
  mapUtils,
  clearMap,
  resetView,
  toggleFullscreen,
  retryLoad
})

// 生命周期
onMounted(() => {
  initMap()
  
  // 添加全屏状态监听
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
  document.addEventListener('mozfullscreenchange', handleFullscreenChange)
})

onUnmounted(() => {
  // 清理地图资源
  if (mapUtils.map) {
    mapUtils.destroy()
  }
  
  // 移除事件监听
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
  document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
})

// 监听props变化
watch(() => props.center, (newCenter) => {
  if (mapUtils.map && newCenter) {
    mapUtils.setCenter(newCenter, props.zoom)
  }
})

watch(() => props.zoom, (newZoom) => {
  if (mapUtils.map && newZoom) {
    mapUtils.map.setZoom(newZoom)
  }
})
</script>

<style scoped>
.map-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.baidu-map {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  /* 硬件加速和性能优化 */
  transform: translateZ(0);
  -webkit-transform: translateZ(0);
  position: relative;
  background-color: #f5f5f5;
  /* 减少重绘和重排 */
  will-change: transform;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.map-toolbar {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 6px;
  padding: 5px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.map-error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  text-align: center;
  max-width: 400px;
  width: 90%;
}

/* 全屏模式样式 */
.map-container:fullscreen .baidu-map,
.map-container:-webkit-full-screen .baidu-map,
.map-container:-moz-full-screen .baidu-map {
  width: 100vw;
  height: 100vh;
  border-radius: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .map-toolbar {
    top: 5px;
    right: 5px;
    padding: 3px;
  }

  .map-toolbar .el-button {
    padding: 5px 8px;
    font-size: 12px;
  }

  .map-error {
    padding: 15px;
    max-width: 320px;
  }
}
</style>
