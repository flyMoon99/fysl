<template>
  <div class="waybill-detail-page">

    <!-- 密码验证弹窗 -->
    <el-dialog
      v-model="showPasswordDialog"
      title="请输入查看密码"
      width="400px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
    >
      <el-form @submit.prevent="verifyPassword">
        <el-form-item label="查看密码">
          <el-input
            v-model="inputPassword"
            type="password"
            placeholder="请输入运单查看密码"
            show-password
            @keyup.enter="verifyPassword"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="goBack">取消</el-button>
          <el-button type="primary" @click="verifyPassword" :loading="verifying">
            确认
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 主要内容区域 -->
    <div v-if="!showPasswordDialog && waybillData" class="main-content">
      <!-- 运单基本信息 -->
      <div class="waybill-basic-info">
        <el-card>
          <div class="basic-info-content">
            <div class="info-item">
              <span class="label">运单号：</span>
              <span class="value">{{ waybillData.waybill_number }}</span>
            </div>
            <div class="info-item">
              <span class="label">创建人：</span>
              <span class="value">{{ waybillData.create_by }}</span>
            </div>
            <div class="info-item">
              <span class="label">创建时间：</span>
              <span class="value">{{ formatDateTime(waybillData.created_at) }}</span>
            </div>
            <div class="info-item full-width">
              <span class="label">运单备注：</span>
              <span class="value">{{ waybillData.waybill_remarks || '暂无' }}</span>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 左右分栏主体内容 -->
      <div class="content-layout">
        <!-- 左侧：运输明细列表 -->
        <div class="left-panel">
          <el-card>
            <template #header>
              <div class="panel-header">
                <span>运输明细</span>
                <span class="count">({{ transportDetails.length }}条)</span>
              </div>
            </template>
            <div class="transport-list">
              <div
                v-for="(detail, index) in transportDetails"
                :key="detail.id"
                class="transport-item"
                :class="{ active: selectedDetailIndex === index }"
                @click="selectTransportDetail(index)"
              >
                <div class="item-header">
                  <span class="device-number">设备号：{{ detail.device?.device_number }}</span>
                  <span class="select-indicator" v-if="selectedDetailIndex === index">
                    <el-icon><Check /></el-icon>
                  </span>
                </div>
                <div class="item-content">
                  <div class="info-row">
                    <span class="label">车牌号：</span>
                    <span class="value">{{ detail.license_plate || '暂无' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">运输备注：</span>
                    <span class="value">{{ detail.transport_remarks || '暂无' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">最后位置：</span>
                    <span class="value">{{ detail.address || '暂无' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">更新时间：</span>
                    <span class="value">{{ formatDateTime(detail.last_update_time) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </div>

        <!-- 右侧：地图轨迹展示 -->
        <div class="right-panel">
          <el-card>
            <template #header>
              <div class="panel-header">
                <span v-if="selectedDetailIndex === -1">所有设备位置</span>
                <span v-else>
                  {{ transportDetails[selectedDetailIndex]?.device?.device_number }} - 最近7天轨迹
                </span>
                <el-button-group size="small">
                  <el-button @click="showAllDevices" :type="selectedDetailIndex === -1 ? 'primary' : ''">
                    全部位置
                  </el-button>
                  <el-button @click="refreshMap" icon="Refresh">刷新</el-button>
                </el-button-group>
              </div>
            </template>
            <div class="map-container">
              <DeviceTrackMap
                v-if="mapKey && selectedDetailIndex >= 0 && transportDetails[selectedDetailIndex]"
                :key="`single-${mapKey}`"
                :device-id="transportDetails[selectedDetailIndex].device_id"
                :device-info="transportDetails[selectedDetailIndex].device"
                :map-height="mapHeight"
                :auto-load="true"
                @trackLoaded="handleTrackLoaded"
                @trackError="handleTrackError"
              />
              <div v-else-if="selectedDetailIndex === -1" class="all-devices-map">
                <MapContainer
                  :height="mapHeight"
                  :center="mapCenter"
                  :zoom="12"
                  @mapReady="handleAllDevicesMapReady"
                />
              </div>
            </div>
          </el-card>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-loading text="正在加载运单详情..." />
    </div>

    <!-- 错误状态 -->
    <div v-if="error && !loading" class="error-container">
      <el-result
        icon="error"
        title="加载失败"
        :sub-title="error"
      >
        <template #extra>
          <el-button type="primary" @click="loadWaybillDetail">重新加载</el-button>
          <el-button @click="goBack">返回</el-button>
        </template>
      </el-result>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { memberAPI, publicAPI } from '@/utils/api'
import { ElMessage, ElLoading } from 'element-plus'
import { ArrowLeft, Check, Refresh } from '@element-plus/icons-vue'
import DeviceTrackMap from '@/components/DeviceTrackMap.vue'
import MapContainer from '@/components/MapContainer.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 响应式数据
const loading = ref(true)
const error = ref('')
const waybillData = ref(null)
const transportDetails = ref([])
const showPasswordDialog = ref(false)
const inputPassword = ref('')
const verifying = ref(false)
const selectedDetailIndex = ref(-1) // -1表示显示所有设备，>=0表示选中的明细索引
const mapKey = ref(0) // 用于强制重新渲染地图组件
const mapCenter = ref({ lng: 116.404, lat: 39.915 }) // 默认北京

// 计算属性
const mapHeight = computed(() => '600px')

// 格式化日期时间
const formatDateTime = (dateString) => {
  if (!dateString) return '暂无'
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

// 返回上一页
const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/member/waybills')
  }
}

// 验证查看密码
const verifyPassword = async () => {
  if (!inputPassword.value.trim()) {
    ElMessage.warning('请输入查看密码')
    return
  }

  try {
    verifying.value = true
    
    const response = await publicAPI.verifyWaybillPassword(route.params.id, { password: inputPassword.value })
    
    // 处理验证成功的响应
    if (response.data && response.data.message === '密码验证成功') {
      waybillData.value = response.data.data
      transportDetails.value = response.data.data.transportDetails || []
      showPasswordDialog.value = false
      inputPassword.value = ''
      ElMessage.success('密码验证成功')
    } else {
      ElMessage.error(response.data?.message || '密码验证失败')
    }
  } catch (error) {
    console.error('密码验证失败:', error)
    if (error.response?.status === 401) {
      ElMessage.error('密码错误，请重新输入')
    } else {
      ElMessage.error(error.response?.data?.error || '密码验证失败')
    }
  } finally {
    verifying.value = false
  }
}

// 选择运输明细
const selectTransportDetail = (index) => {
  selectedDetailIndex.value = index
  mapKey.value++ // 强制重新渲染地图
}

// 显示所有设备位置
const showAllDevices = () => {
  selectedDetailIndex.value = -1
  mapKey.value++ // 强制重新渲染地图
}

// 刷新地图
const refreshMap = () => {
  mapKey.value++
}

// 处理轨迹加载成功
const handleTrackLoaded = (data) => {
  console.log('轨迹加载成功:', data)
}

// 处理轨迹加载失败
const handleTrackError = (error) => {
  console.error('轨迹加载失败:', error)
  ElMessage.error('轨迹数据加载失败')
}

// 处理所有设备地图准备就绪
const handleAllDevicesMapReady = (mapInstance) => {
  if (transportDetails.value.length > 0) {
    // 在地图上显示所有设备的最后位置
    const mapUtils = mapInstance.mapUtils
    if (mapUtils) {
      transportDetails.value.forEach((detail, index) => {
        if (detail.device && detail.device.last_longitude && detail.device.last_latitude) {
          mapUtils.addDeviceMarker(
            {
              id: detail.device_id,
              device_number: detail.device.device_number,
              status: 'online' // 假设在线状态
            },
            {
              lng: detail.device.last_longitude,
              lat: detail.device.last_latitude
            }
          )
        }
      })
      
      // 如果有设备位置，调整地图视野
      const firstDevice = transportDetails.value.find(d => 
        d.device?.last_longitude && d.device?.last_latitude
      )
      if (firstDevice) {
        mapCenter.value = {
          lng: firstDevice.device.last_longitude,
          lat: firstDevice.device.last_latitude
        }
        mapUtils.setCenter(mapCenter.value, 12)
      }
    }
  }
}

// 加载运单详情
const loadWaybillDetail = async () => {
  try {
    loading.value = true
    error.value = ''

    const waybillId = route.params.id
    if (!waybillId) {
      throw new Error('运单ID不能为空')
    }

    // 统一使用公开API获取运单详情
    let response
    try {
      response = await publicAPI.getWaybillDetail(waybillId)
    } catch (apiError) {
      // 如果是403错误且需要密码验证
      if (apiError.response?.status === 403 && apiError.response?.data?.requiresPassword) {
        showPasswordDialog.value = true
        return
      }
      // 如果API不存在或网络错误，使用模拟数据进行演示
      else if (apiError.response?.status === 404 || apiError.code === 'ECONNREFUSED' || !apiError.response) {
        console.warn('API接口未实现或网络错误，使用模拟数据进行演示')
        response = { data: createMockResponse(waybillId) }
      } else {
        throw apiError
      }
    }
    
    // 处理响应数据
    let waybillInfo, transportDetailsData
    
    if (response.data?.success !== false) {
      // 标准API响应格式
      if (response.data?.data && typeof response.data.data === 'object') {
        // 如果data中有waybill字段
        if (response.data.data.waybill) {
          waybillInfo = response.data.data.waybill
          transportDetailsData = waybillInfo.transportDetails || []
        }
        // 如果data本身就是waybill数据（Sequelize模型实例）
        else {
          waybillInfo = response.data.data
          transportDetailsData = response.data.data.transportDetails || []
        }
      }
      // 直接数据格式（兼容不同的API响应和模拟数据）
      else if (response.data?.waybill_number) {
        waybillInfo = response.data
        transportDetailsData = response.data.transportDetails || []
      }
      else {
        throw new Error('响应数据格式错误：未找到有效的运单数据')
      }
      
      waybillData.value = waybillInfo
      transportDetails.value = transportDetailsData
      
      // 检查访问权限
      if (!userStore.isLoggedIn && waybillInfo.waybill_password) {
        showPasswordDialog.value = true
      }
    } else {
      throw new Error(response.data.message || '获取运单详情失败')
    }
  } catch (err) {
    console.error('加载运单详情失败:', err)
    error.value = err.message || '加载运单详情失败'
    
    // 如果是权限问题，显示密码输入框
    if (err.response?.status === 403) {
      showPasswordDialog.value = true
      error.value = ''
    }
  } finally {
    loading.value = false
  }
}

// 创建模拟响应数据（用于演示）
const createMockResponse = (waybillId) => {
  return {
    waybill_number: `FY${waybillId.toString().padStart(6, '0')}`,
    waybill_remarks: '这是一个演示运单，包含多个运输设备的轨迹信息',
    waybill_password: '', // 演示用，不设置密码
    create_by: 'demo_user',
    created_at: new Date().toISOString(),
    transportDetails: [
      {
        id: 1,
        device_id: 42,
        license_plate: '京A12345',
        transport_remarks: '重要货物，请小心运输',
        address: '北京市朝阳区建国门外大街',
        last_update_time: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        device: {
          id: 42,
          device_number: '61003201',
          device_alias: '北京配送车辆',
          last_longitude: 116.404,
          last_latitude: 39.915
        }
      },
      {
        id: 2,
        device_id: 43,
        license_plate: '沪B67890',
        transport_remarks: '次要货物运输',
        address: '上海市浦东新区陆家嘴',
        last_update_time: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        device: {
          id: 43,
          device_number: '61003202',
          device_alias: '上海配送车辆',
          last_longitude: 121.473,
          last_latitude: 31.230
        }
      },
      {
        id: 3,
        device_id: 44,
        license_plate: '粤C11111',
        transport_remarks: '紧急运输任务',
        address: '深圳市南山区科技园',
        last_update_time: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        device: {
          id: 44,
          device_number: '61003203',
          device_alias: '深圳配送车辆',
          last_longitude: 114.057,
          last_latitude: 22.543
        }
      }
    ]
  }
}

// 页面加载时获取运单详情
onMounted(() => {
  loadWaybillDetail()
})
</script>

<style scoped>
.waybill-detail-page {
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

.page-title {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin: 0 0 8px 0;
}

.waybill-info {
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: #606266;
}

.waybill-number {
  font-weight: bold;
  color: #409eff;
}

/* 主要内容区域 */
.main-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px 24px;
}

/* 运单基本信息 */
.waybill-basic-info {
  margin-bottom: 20px;
}

.basic-info-content {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.info-item {
  display: flex;
  align-items: center;
  min-width: 250px;
}

.info-item.full-width {
  width: 100%;
}

.info-item .label {
  font-weight: bold;
  color: #606266;
  margin-right: 8px;
}

.info-item .value {
  color: #303133;
}

/* 左右分栏布局 */
.content-layout {
  display: flex;
  gap: 20px;
  height: 700px;
}

.left-panel {
  width: 400px;
  flex-shrink: 0;
}

.right-panel {
  flex: 1;
  min-width: 0;
}

/* 面板头部 */
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}

.count {
  color: #909399;
  font-weight: normal;
}

/* 运输明细列表 */
.transport-list {
  max-height: 600px;
  overflow-y: auto;
}

.transport-item {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.3s;
  background: #fafafa;
}

.transport-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.transport-item.active {
  border-color: #409eff;
  background: #ecf5ff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.device-number {
  font-weight: bold;
  color: #303133;
  font-size: 14px;
}

.select-indicator {
  color: #409eff;
  font-size: 16px;
}

.info-row {
  display: flex;
  margin-bottom: 6px;
  font-size: 13px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-row .label {
  color: #909399;
  min-width: 70px;
  flex-shrink: 0;
}

.info-row .value {
  color: #606266;
  flex: 1;
  word-break: break-all;
}

/* 地图容器 */
.map-container {
  height: 600px;
  border-radius: 4px;
  overflow: hidden;
}

/* 加载和错误状态 */
.loading-container,
.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
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
  
  .transport-list {
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
  
  .waybill-info {
    flex-direction: column;
    gap: 8px;
  }
  
  .basic-info-content {
    flex-direction: column;
    gap: 12px;
  }
  
  .info-item {
    min-width: auto;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>
