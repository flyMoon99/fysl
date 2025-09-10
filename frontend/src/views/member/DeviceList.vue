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
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
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
        <el-table-column prop="battery_level" label="电量" width="120">
          <template #default="scope">
            <div class="battery-level">
              <el-progress 
                :percentage="scope.row.battery_level || 0" 
                :color="getBatteryColor(scope.row.battery_level)"
                :stroke-width="8"
              />
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
        <el-table-column prop="last_address" label="最后地址" min-width="200">
          <template #default="scope">
            {{ scope.row.last_address || '暂无地址' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button-group size="small">
              <el-button
                type="success"
                @click="showEditDialogHandler(scope.row)"
              >
                <el-icon><Edit /></el-icon>
                编辑
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
      :title="getTrackDialogTitle()"
      width="95%"
      :close-on-click-modal="false"
      top="3vh"
    >
      <div v-if="currentDevice" class="device-track-dialog">
        <div class="track-layout">
          <!-- 左侧轨迹列表 -->
          <div class="track-list-panel">
            <!-- 日期搜索 -->
            <div class="date-search">
              <el-form :inline="true" size="small">
                <el-form-item label="开始日期:">
                  <el-date-picker
                    v-model="trackDateRange[0]"
                    type="datetime"
                    placeholder="开始日期"
                    format="YYYY-MM-DD HH:mm:ss"
                    value-format="YYYY-MM-DD HH:mm:ss"
                    size="small"
                  />
                </el-form-item>
                <el-form-item label="结束日期:">
                  <el-date-picker
                    v-model="trackDateRange[1]"
                    type="datetime"
                    placeholder="结束日期"
                    format="YYYY-MM-DD HH:mm:ss"
                    value-format="YYYY-MM-DD HH:mm:ss"
                    size="small"
                  />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" size="small" @click="searchTrackData">
                    搜索
                  </el-button>
                </el-form-item>
              </el-form>
            </div>

            <!-- 轨迹点列表 -->
            <div class="track-points-list">
              <!-- 调试信息 -->
              <div v-if="trackPoints.length === 0" class="debug-info">
                <p>调试信息：</p>
                <p>轨迹点数量: {{ trackPoints.length }}</p>
                <p>过滤后轨迹点数量: {{ filteredTrackPoints.length }}</p>
                <p>时间范围: {{ trackDateRange }}</p>
                <p>当前设备: {{ currentDevice?.device_number }} (ID: {{ currentDevice?.id }})</p>
                <p>时间跨度: {{ getTimeRangeDays() }} 天</p>
              </div>
              
              <el-table
                :data="filteredTrackPoints"
                size="small"
                height="500"
                @row-click="selectTrackPoint"
                highlight-current-row
              >
                <el-table-column prop="address" label="地址" min-width="300">
                  <template #default="scope">
                    {{ scope.row.address || '暂无地址' }}
                  </template>
                </el-table-column>
                <el-table-column prop="timestamp" label="更新时间" width="180">
                  <template #default="scope">
                    {{ formatDateTime(scope.row.timestamp) }}
                  </template>
                </el-table-column>
              </el-table>

              <!-- 分页 -->
              <el-pagination
                v-if="trackPointsTotal > 0"
                background
                layout="prev, pager, next, jumper, total"
                :current-page="trackPointsPage"
                :page-size="trackPointsPageSize"
                :total="trackPointsTotal"
                @current-change="handleTrackPointsPageChange"
                size="small"
                style="margin-top: 10px; text-align: center"
              />
            </div>
          </div>

          <!-- 右侧地图 -->
          <div class="map-panel">
        <DeviceTrackMap
              ref="trackMapRef"
          :device-id="currentDevice.id"
          :device-info="currentDevice"
              map-height="100%"
              :auto-load="false"
              :hide-time-controls="true"
              :hide-track-stats="true"
          @trackLoaded="handleTrackLoaded"
          @trackError="handleTrackError"
        />
      </div>
        </div>
      </div>
    </el-dialog>


    <!-- 设备编辑对话框 -->
    <el-dialog
      v-model="showEditDialog"
      title="编辑设备信息"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editRules"
        label-width="100px"
      >
        <el-form-item label="设备号">
          <el-input v-model="editForm.device_number" disabled />
        </el-form-item>
        <el-form-item label="设备别名" prop="device_alias">
          <el-input
            v-model="editForm.device_alias"
            placeholder="请输入设备别名"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="设备备注" prop="device_remarks">
          <el-input
            v-model="editForm.device_remarks"
            type="textarea"
            placeholder="请输入设备备注"
            :rows="4"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showEditDialog = false">取消</el-button>
          <el-button type="primary" @click="handleSaveEdit" :loading="editLoading">
            保存
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { memberAPI } from '@/utils/api'
import { ElMessage } from 'element-plus'
import { Operation, Edit } from '@element-plus/icons-vue'
import DeviceTrackMap from '@/components/DeviceTrackMap.vue'
import { CoordinateConverter } from '@/utils/mapUtils'

const loading = ref(false)
const showDetailDialog = ref(false)
const showTrackDialog = ref(false)
const showEditDialog = ref(false)
const editLoading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const deviceList = ref([])
const currentDevice = ref(null)
const editFormRef = ref(null)
const trackMapRef = ref(null)

// 轨迹相关数据
const trackDateRange = ref([])
const trackPoints = ref([])
const filteredTrackPoints = ref([])
const trackPointsPage = ref(1)
const trackPointsPageSize = ref(10)
const trackPointsTotal = ref(0)
const selectedTrackPoint = ref(null)

// 搜索表单
const searchForm = reactive({
  device_number: '',
  status: ''
})

// 编辑表单
const editForm = reactive({
  device_number: '',
  device_alias: '',
  device_remarks: ''
})

// 编辑表单验证规则
const editRules = {
  device_alias: [
    { max: 50, message: '设备别名不能超过50个字符', trigger: 'blur' }
  ],
  device_remarks: [
    { max: 200, message: '设备备注不能超过200个字符', trigger: 'blur' }
  ]
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
  console.log('显示设备轨迹，设备信息:', device)
  currentDevice.value = device
  showTrackDialog.value = true
  
  // 清空之前的轨迹数据
  trackPoints.value = []
  filteredTrackPoints.value = []
  trackPointsTotal.value = 0
  trackPointsPage.value = 1
  
  // 设置默认时间范围为最近7天
  const end = new Date()
  const start = new Date()
  start.setTime(start.getTime() - 7 * 24 * 60 * 60 * 1000)
  
  trackDateRange.value = [
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
  
  console.log('设置时间范围:', trackDateRange.value)
  
  // 等待对话框完全打开后再加载轨迹数据
  setTimeout(() => {
    console.log('开始自动加载轨迹数据')
    searchTrackData()
  }, 500)
}

// 显示编辑对话框
const showEditDialogHandler = (device) => {
  currentDevice.value = device
  // 填充编辑表单
  editForm.device_number = device.device_number
  editForm.device_alias = device.device_alias || ''
  editForm.device_remarks = device.device_remarks || ''
  showEditDialog.value = true
}

// 保存编辑
const handleSaveEdit = async () => {
  if (!editFormRef.value) return
  
  try {
    // 验证表单
    await editFormRef.value.validate()
    
    editLoading.value = true
    
    // 调用API更新设备信息
    const response = await memberAPI.updateDevice(currentDevice.value.id, {
      device_alias: editForm.device_alias,
      device_remarks: editForm.device_remarks
    })
    
    if (response.data.message) {
      ElMessage.success('设备信息更新成功')
      
      // 更新本地设备列表中的数据
      const deviceIndex = deviceList.value.findIndex(device => device.id === currentDevice.value.id)
      if (deviceIndex !== -1) {
        deviceList.value[deviceIndex].device_alias = editForm.device_alias
        deviceList.value[deviceIndex].device_remarks = editForm.device_remarks
      }
      
      // 关闭对话框
      showEditDialog.value = false
    }
  } catch (error) {
    console.error('更新设备信息失败:', error)
    if (error.response?.data?.error) {
      ElMessage.error(error.response.data.error)
    } else {
      ElMessage.error('更新设备信息失败')
    }
  } finally {
    editLoading.value = false
  }
}


// 搜索轨迹数据
const searchTrackData = async () => {
  if (!trackDateRange.value || trackDateRange.value.length !== 2) {
    ElMessage.warning('请选择查询时间范围')
    return
  }

  try {
    console.log('开始搜索轨迹数据，时间范围:', trackDateRange.value)
    
    // 调用地图组件的加载轨迹数据方法
    if (trackMapRef.value) {
      // 转换时间格式为ISO格式
      const startTime = new Date(trackDateRange.value[0] + '+08:00').toISOString()
      const endTime = new Date(trackDateRange.value[1] + '+08:00').toISOString()
      
      console.log('转换后的时间范围:', { startTime, endTime })
      
      // 使用新的方法加载轨迹数据
      await trackMapRef.value.loadTrackDataWithTimeRange(startTime, endTime)
    } else {
      console.error('地图组件引用不存在')
      ElMessage.error('地图组件未初始化')
    }
  } catch (error) {
    console.error('搜索轨迹数据失败:', error)
    ElMessage.error('搜索轨迹数据失败')
  }
}

// 选择轨迹点
const selectTrackPoint = (row) => {
  selectedTrackPoint.value = row
  console.log('选择轨迹点:', row)
  
  // 在地图上高亮显示选中的轨迹点
  if (trackMapRef.value && trackMapRef.value.mapContainerRef) {
    console.log('地图引用存在:', trackMapRef.value.mapContainerRef)
    const mapUtils = trackMapRef.value.mapContainerRef.mapUtils
    console.log('地图工具实例:', mapUtils)
    
    if (mapUtils) {
      console.log('开始设置地图中心到轨迹点:', { lng: row.longitude, lat: row.latitude })
      
      // 设置地图中心到选中的点，使用合适的缩放级别
      mapUtils.setCenter({
        lng: row.longitude,
        lat: row.latitude
      }, 16)
      
      console.log('地图中心设置完成，开始显示信息浮窗')
      
      // 在地图上显示该轨迹点的信息浮窗
      showTrackPointInfoOnMap(mapUtils, row)
    } else {
      console.error('地图工具实例不存在')
    }
  } else {
    console.error('地图引用不存在:', { 
      trackMapRef: !!trackMapRef.value, 
      mapContainerRef: !!trackMapRef.value?.mapContainerRef 
    })
  }
}

// 在地图上显示轨迹点信息浮窗
const showTrackPointInfoOnMap = (mapUtils, trackPoint) => {
  console.log('开始显示轨迹点信息浮窗:', { mapUtils, trackPoint })
  
  if (!mapUtils || !window.BMap) {
    console.error('地图工具或BMap不可用:', { mapUtils: !!mapUtils, BMap: !!window.BMap })
    return
  }
  
  // 关闭之前的信息窗口
  if (mapUtils.map) {
    mapUtils.map.closeInfoWindow()
  }
  
  // 创建信息窗口内容
  const content = `
    <div style="padding: 15px; min-width: 280px; font-family: 'Microsoft YaHei', Arial, sans-serif;">
      <div style="border-bottom: 1px solid #e4e7ed; padding-bottom: 10px; margin-bottom: 15px;">
        <h4 style="margin: 0; color: #303133; font-size: 16px; font-weight: 600;">轨迹点详情</h4>
      </div>
      <div style="line-height: 1.8;">
        <div style="margin-bottom: 12px;">
          <span style="color: #606266; font-weight: 500;">设备号:</span>
          <span style="color: #303133; margin-left: 8px;">${currentDevice.value?.device_number || '未知设备'}</span>
        </div>
        <div style="margin-bottom: 12px;">
          <span style="color: #606266; font-weight: 500;">地址:</span>
          <span style="color: #303133; margin-left: 8px; word-break: break-all;">${trackPoint.address || '地址解析中...'}</span>
        </div>
        <div style="margin-bottom: 0;">
          <span style="color: #606266; font-weight: 500;">最后更新时间:</span>
          <span style="color: #303133; margin-left: 8px;">${formatDateTime(trackPoint.timestamp)}</span>
        </div>
      </div>
    </div>
  `
  
  console.log('创建信息窗口内容:', content)
  
  // 创建信息窗口
  const infoWindow = new window.BMap.InfoWindow(content, {
    width: 320,
    height: 180,
    enableMessage: false
  })
  
  // 转换坐标
  const bdCoords = CoordinateConverter.wgs84ToBd09(trackPoint.longitude, trackPoint.latitude)
  const point = new window.BMap.Point(bdCoords.lng, bdCoords.lat)
  
  console.log('坐标转换结果:', { 
    original: { lng: trackPoint.longitude, lat: trackPoint.latitude },
    converted: bdCoords,
    point 
  })
  
  // 显示信息窗口
  mapUtils.map.openInfoWindow(infoWindow, point)
  console.log('信息窗口已显示')
}


// 轨迹点分页变化
const handleTrackPointsPageChange = (page) => {
  trackPointsPage.value = page
  updateFilteredTrackPoints()
}

// 格式化停留时长
const formatDuration = (duration) => {
  if (!duration) return '0分钟'
  
  const totalMinutes = Math.floor(duration / (1000 * 60))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`
  }
  return `${minutes}分钟`
}

// 轨迹加载完成
const handleTrackLoaded = (trackData) => {
  console.log('轨迹数据加载完成:', trackData)
  
  // 生成停留点数据
  generateStopPoints(trackData)
}

// 处理轨迹点数据
const generateStopPoints = (trackData) => {
  console.log('开始处理轨迹点数据，原始轨迹数据:', trackData)
  
  if (!trackData || trackData.length === 0) {
    console.log('没有轨迹数据，清空轨迹点列表')
    trackPoints.value = []
    filteredTrackPoints.value = []
    trackPointsTotal.value = 0
    return
  }

  const processedPoints = []
  
  // 直接使用轨迹点数据，按时间倒序排列
  trackData.forEach((point, index) => {
    processedPoints.push({
      id: index + 1,
      timestamp: point.timestamp,
      longitude: point.longitude || point.lng,
      latitude: point.latitude || point.lat,
      address: point.address || '地址未解析'
    })
  })
  
  // 按时间倒序排列（最新的在前）
  processedPoints.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  
  console.log('处理后的轨迹点数据:', processedPoints)
  
  trackPoints.value = processedPoints
  trackPointsTotal.value = processedPoints.length
  
  // 重置到第一页并更新显示数据
  trackPointsPage.value = 1
  updateFilteredTrackPoints()
  
  console.log('轨迹点数据已更新到响应式变量')
}

// 更新过滤后的轨迹点数据（实现分页）
const updateFilteredTrackPoints = () => {
  if (!trackPoints.value || trackPoints.value.length === 0) {
    filteredTrackPoints.value = []
    return
  }
  
  const startIndex = (trackPointsPage.value - 1) * trackPointsPageSize.value
  const endIndex = startIndex + trackPointsPageSize.value
  
  filteredTrackPoints.value = trackPoints.value.slice(startIndex, endIndex)
  
  console.log(`分页显示: 第${trackPointsPage.value}页, 显示${filteredTrackPoints.value.length}条数据`)
}

// 轨迹加载错误
const handleTrackError = (error) => {
  console.error('[设备列表] 轨迹加载失败:', error)
  ElMessage.error('轨迹加载失败，请稍后重试')
}

// 获取轨迹对话框标题
const getTrackDialogTitle = () => {
  if (!currentDevice.value) return '设备轨迹'
  
  const deviceNumber = currentDevice.value.device_number || '未知设备'
  const status = currentDevice.value.status === 'online' ? '在线' : '离线'
  
  return `${deviceNumber}-${status}-设备轨迹`
}

// 计算时间跨度（天）
const getTimeRangeDays = () => {
  if (!trackDateRange.value || trackDateRange.value.length !== 2) return 0
  
  const start = new Date(trackDateRange.value[0])
  const end = new Date(trackDateRange.value[1])
  const diffTime = end - start
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays
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
}


.device-track-dialog {
  padding: 0;
  height: 80vh;
}

.track-layout {
  display: flex;
  height: 100%;
  gap: 20px;
}

.track-list-panel {
  width: 400px;
  background: white;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
}

.map-panel {
  flex: 1;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.date-search {
  margin-bottom: 15px;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 6px;
}

.track-points-list {
  flex: 1;
}

.debug-info {
  background: #f0f9ff;
  border: 1px solid #b3d8ff;
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 10px;
  font-size: 12px;
  color: #409eff;
}

.debug-info p {
  margin: 2px 0;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .track-layout {
    flex-direction: column;
  }
  
  .track-list-panel {
    width: 100%;
    height: 300px;
  }
  
  .map-panel {
    height: 400px;
  }
}
</style>
