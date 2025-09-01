<template>
  <div class="device-management">
    <!-- 页面头部 -->
    <div class="content-header">
      <h2>设备管理</h2>
      <div class="header-actions">
        <el-button 
          v-if="selectedDevices.length > 0"
          type="primary" 
          @click="showAssignDialog = true"
        >
          <el-icon><User /></el-icon>
          分配客户 ({{ selectedDevices.length }})
        </el-button>
        <el-button 
          type="success" 
          @click="handleSyncDevices"
          :loading="syncingDevices"
        >
          <el-icon><Refresh /></el-icon>
          获取设备
        </el-button>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="content-body">
      <div class="search-bar">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="设备号">
            <el-input 
              v-model="searchForm.device_number" 
              placeholder="请输入设备号"
              clearable
            />
          </el-form-item>
          <el-form-item label="设备状态">
            <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
              <el-option label="在线" value="online" />
              <el-option label="离线" value="offline" />
            </el-select>
          </el-form-item>
          <el-form-item label="服务状态">
            <el-select v-model="searchForm.service_status" placeholder="请选择服务状态" clearable>
              <el-option label="服务中" value="active" />
              <el-option label="未激活" value="inactive" />
            </el-select>
          </el-form-item>
          <el-form-item label="设备型号">
            <el-input 
              v-model="searchForm.device_model" 
              placeholder="请输入设备型号"
              clearable
            />
          </el-form-item>
          <el-form-item label="创建时间">
            <el-date-picker
              v-model="searchForm.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 批量操作栏 -->
      <div class="batch-actions" v-if="deviceList.length > 0">
        <div class="batch-left">
          <el-button size="small" @click="handleSelectAll">全选</el-button>
          <el-button size="small" @click="handleSelectNone">清空选择</el-button>
          <el-button size="small" @click="handleSelectReverse">反选</el-button>
        </div>
        <div class="batch-right">
          <span v-if="selectedDevices.length > 0" class="selected-count">
            已选择 {{ selectedDevices.length }} 个设备
          </span>
        </div>
      </div>

      <!-- 设备列表 -->
      <el-table 
        ref="deviceTableRef"
        :data="deviceList" 
        style="width: 100%" 
        v-loading="loading"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="device_number" label="设备号" width="150" />
        <el-table-column prop="device_alias" label="设备别名" width="120">
          <template #default="scope">
            {{ scope.row.device_alias || '暂无' }}
          </template>
        </el-table-column>
        <el-table-column prop="device_model" label="设备型号" width="120">
          <template #default="scope">
            {{ scope.row.device_model || '暂无' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="设备状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'online' ? 'success' : 'danger'">
              {{ scope.row.status === 'online' ? '在线' : '离线' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="battery_level" label="电量" width="80">
          <template #default="scope">
            <span :class="getBatteryClass(scope.row.battery_level)">
              {{ scope.row.battery_level || 0 }}%
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="service_status" label="服务状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.service_status === 'active' ? 'success' : 'warning'">
              {{ scope.row.service_status === 'active' ? '服务中' : '未激活' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="setting_status" label="设置状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.setting_status === 'active' ? 'success' : 'danger'">
              {{ scope.row.setting_status === 'active' ? '服务中' : '已到期' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="customer" label="客户" width="120">
          <template #default="scope">
            {{ scope.row.customer?.username || '未分配' }}
          </template>
        </el-table-column>
        <el-table-column prop="last_update_time" label="最后更新" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.last_update_time) }}
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="400" fixed="right">
          <template #default="scope">
            <el-button 
              size="small" 
              @click="handleView(scope.row)"
            >
              查看
            </el-button>
            <el-button 
              size="small" 
              type="primary"
              @click="handleViewLocation(scope.row)"
            >
              位置记录
            </el-button>
            <el-button 
              size="small" 
              type="warning"
              @click="handleGetLocation(scope.row)"
              :loading="scope.row.syncing"
            >
              获取位置
            </el-button>
            <el-button 
              size="small" 
              type="success"
              @click="showGetTrackDialog(scope.row)"
            >
              获取轨迹
            </el-button>
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
    </div>

    <!-- 设备详情对话框 -->
    <el-dialog 
      v-model="showDetailDialog" 
      title="设备详情"
      width="700px"
    >
      <div class="device-detail" v-if="currentDevice">
        <div class="detail-row">
          <div class="detail-item">
            <label>设备ID：</label>
            <span>{{ currentDevice.id }}</span>
          </div>
          <div class="detail-item">
            <label>设备号：</label>
            <span>{{ currentDevice.device_number }}</span>
          </div>
        </div>
        <div class="detail-row">
          <div class="detail-item">
            <label>设备别名：</label>
            <span>{{ currentDevice.device_alias || '暂无' }}</span>
          </div>
          <div class="detail-item">
            <label>设备型号：</label>
            <span>{{ currentDevice.device_model || '暂无' }}</span>
          </div>
        </div>
        <div class="detail-row">
          <div class="detail-item">
            <label>设备状态：</label>
            <el-tag :type="currentDevice.status === 'online' ? 'success' : 'danger'">
              {{ currentDevice.status === 'online' ? '在线' : '离线' }}
            </el-tag>
          </div>
          <div class="detail-item">
            <label>电量：</label>
            <span :class="getBatteryClass(currentDevice.battery_level)">
              {{ currentDevice.battery_level || 0 }}%
            </span>
          </div>
        </div>
        <div class="detail-row">
          <div class="detail-item">
            <label>服务状态：</label>
            <el-tag :type="currentDevice.service_status === 'active' ? 'success' : 'warning'">
              {{ currentDevice.service_status === 'active' ? '服务中' : '未激活' }}
            </el-tag>
          </div>
          <div class="detail-item">
            <label>设置状态：</label>
            <el-tag :type="currentDevice.setting_status === 'active' ? 'success' : 'danger'">
              {{ currentDevice.setting_status === 'active' ? '服务中' : '已到期' }}
            </el-tag>
          </div>
        </div>
        <div class="detail-row">
          <div class="detail-item">
            <label>关联客户：</label>
            <span>{{ currentDevice.customer?.username || '未分配' }}</span>
          </div>
          <div class="detail-item">
            <label>最后更新：</label>
            <span>{{ formatDateTime(currentDevice.last_update_time) }}</span>
          </div>
        </div>
        <div class="detail-row">
          <div class="detail-item">
            <label>最后位置：</label>
            <span v-if="currentDevice.last_longitude && currentDevice.last_latitude">
              {{ currentDevice.last_longitude }}, {{ currentDevice.last_latitude }}
            </span>
            <span v-else>暂无定位数据</span>
          </div>
        </div>
        <div class="detail-row full-width">
          <div class="detail-item">
            <label>设备备注：</label>
            <span>{{ currentDevice.device_remarks || '暂无备注' }}</span>
          </div>
        </div>
        <div class="detail-row">
          <div class="detail-item">
            <label>创建时间：</label>
            <span>{{ formatDateTime(currentDevice.created_at) }}</span>
          </div>
          <div class="detail-item">
            <label>更新时间：</label>
            <span>{{ formatDateTime(currentDevice.updated_at) }}</span>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 位置记录对话框 -->
    <el-dialog 
      v-model="showLocationDialog" 
      title="位置记录"
      width="800px"
    >
      <div class="location-header" v-if="currentDevice">
        <h4>{{ currentDevice.device_number }} - {{ currentDevice.device_alias || '设备位置记录' }}</h4>
      </div>
      
      <el-table :data="locationHistory" style="width: 100%" v-loading="locationLoading">
        <el-table-column prop="longitude" label="经度" width="120">
          <template #default="scope">
            {{ parseFloat(scope.row.longitude).toFixed(6) }}
          </template>
        </el-table-column>
        <el-table-column prop="latitude" label="纬度" width="120">
          <template #default="scope">
            {{ parseFloat(scope.row.latitude).toFixed(6) }}
          </template>
        </el-table-column>
        <el-table-column prop="coordinate_system" label="坐标系" width="100" />
        <el-table-column prop="created_at" label="记录时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.created_at) }}
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="locationPage"
          v-model:page-size="locationPageSize"
          :page-sizes="[10, 20, 50]"
          :total="locationTotal"
          layout="total, sizes, prev, pager, next"
          @size-change="handleLocationSizeChange"
          @current-change="handleLocationPageChange"
        />
      </div>
    </el-dialog>

    <!-- 获取历史轨迹对话框 -->
    <el-dialog 
      v-model="showTrackDialog" 
      title="获取历史轨迹"
      width="500px"
    >
      <div class="track-sync-form" v-if="currentDevice">
        <p><strong>设备：</strong>{{ currentDevice.device_number }} - {{ currentDevice.device_alias || '未命名设备' }}</p>
        
        <el-form :model="trackForm" label-width="100px">
          <el-form-item label="时间范围" required>
            <el-date-picker
              v-model="trackForm.dateRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              :disabled-date="disabledDate"
              style="width: 100%"
            />
          </el-form-item>
          <el-alert
            title="注意：时间跨度不能超过7天"
            type="warning"
            :closable="false"
            style="margin-bottom: 20px"
          />
        </el-form>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showTrackDialog = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="handleSyncTrack"
            :loading="syncingTrack"
            :disabled="!trackForm.dateRange || trackForm.dateRange.length !== 2"
          >
            获取轨迹
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 分配客户对话框 -->
    <el-dialog 
      v-model="showAssignDialog" 
      title="批量分配客户"
      width="600px"
    >
      <div class="assign-customer-form">
        <div class="selected-devices">
          <h4>已选择设备 ({{ selectedDevices.length }}个)</h4>
          <div class="device-list">
            <el-tag 
              v-for="device in selectedDevices" 
              :key="device.id"
              style="margin: 5px"
            >
              {{ device.device_number }} - {{ device.device_alias || '未命名' }}
            </el-tag>
          </div>
        </div>
        
        <el-divider />
        
        <el-form :model="assignForm" label-width="100px">
          <el-form-item label="选择客户" required>
            <el-select 
              v-model="assignForm.customerId" 
              placeholder="请选择要分配的客户"
              style="width: 100%"
              filterable
              :loading="loadingMembers"
            >
              <el-option
                v-for="member in memberList"
                :key="member.id"
                :label="`${member.username} (ID: ${member.id})`"
                :value="member.id"
              />
            </el-select>
          </el-form-item>
          
          <el-form-item label="操作说明">
            <el-alert
              title="将选中的设备批量分配给指定客户"
              type="info"
              :closable="false"
            />
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAssignDialog = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="handleBatchAssign"
            :loading="assigningCustomer"
            :disabled="!assignForm.customerId"
          >
            确定分配
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { deviceAPI, memberAPI } from '@/utils/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, User } from '@element-plus/icons-vue'

const loading = ref(false)
const showDetailDialog = ref(false)
const showLocationDialog = ref(false)
const showTrackDialog = ref(false)
const showAssignDialog = ref(false)
const syncingDevices = ref(false)
const syncingTrack = ref(false)
const assigningCustomer = ref(false)
const loadingMembers = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const deviceList = ref([])
const currentDevice = ref(null)
const locationHistory = ref([])
const locationLoading = ref(false)
const locationPage = ref(1)
const locationPageSize = ref(10)
const locationTotal = ref(0)
const selectedDevices = ref([])
const memberList = ref([])
const deviceTableRef = ref()

// 搜索表单
const searchForm = reactive({
  device_number: '',
  status: '',
  service_status: '',
  device_model: '',
  dateRange: []
})

// 轨迹同步表单
const trackForm = reactive({
  dateRange: []
})

// 分配客户表单
const assignForm = reactive({
  customerId: null
})

// 格式化日期时间
const formatDateTime = (dateString) => {
  if (!dateString) return '暂无数据'
  return new Date(dateString).toLocaleString('zh-CN')
}

// 获取电量样式类
const getBatteryClass = (batteryLevel) => {
  if (!batteryLevel) return ''
  if (batteryLevel <= 20) return 'battery-low'
  if (batteryLevel <= 50) return 'battery-medium'
  return 'battery-high'
}

// 禁用未来日期
const disabledDate = (time) => {
  return time.getTime() > Date.now()
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
    
    // 处理日期范围
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      params.startDate = searchForm.dateRange[0]
      params.endDate = searchForm.dateRange[1]
    }
    
    const response = await deviceAPI.getDeviceList(params)
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
  searchForm.dateRange = []
  currentPage.value = 1
  fetchDeviceList()
}

// 处理分页大小变化
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  fetchDeviceList()
}

// 处理当前页变化
const handleCurrentChange = (page) => {
  currentPage.value = page
  fetchDeviceList()
}

// 查看设备详情
const handleView = async (row) => {
  try {
    const response = await deviceAPI.getDeviceDetail(row.id)
    if (response.data.message) {
      currentDevice.value = response.data.data.device
      showDetailDialog.value = true
    }
  } catch (error) {
    console.error('获取设备详情失败:', error)
    ElMessage.error('获取设备详情失败')
  }
}

// 查看位置记录
const handleViewLocation = async (row) => {
  currentDevice.value = row
  locationPage.value = 1
  await fetchLocationHistory(row.id)
  showLocationDialog.value = true
}

// 获取位置记录
const fetchLocationHistory = async (deviceId) => {
  try {
    locationLoading.value = true
    const response = await deviceAPI.getDeviceLocationHistory(
      deviceId,
      {
        page: locationPage.value,
        limit: locationPageSize.value
      }
    )
    
    if (response.data.message) {
      locationHistory.value = response.data.data.locations
      locationTotal.value = response.data.data.pagination.total
    }
  } catch (error) {
    console.error('获取位置记录失败:', error)
    ElMessage.error('获取位置记录失败')
  } finally {
    locationLoading.value = false
  }
}

// 处理位置记录分页大小变化
const handleLocationSizeChange = (size) => {
  locationPageSize.value = size
  locationPage.value = 1
  fetchLocationHistory(currentDevice.value.id)
}

// 处理位置记录当前页变化
const handleLocationPageChange = (page) => {
  locationPage.value = page
  fetchLocationHistory(currentDevice.value.id)
}

// 同步所有设备
const handleSyncDevices = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要从第三方API获取最新的设备信息吗？',
      '同步设备',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    syncingDevices.value = true
    const response = await deviceAPI.syncAllDevices()
    
    if (response.data.message) {
      const result = response.data.data
      ElMessage.success(
        `设备同步完成！总数：${result.total}，新增：${result.created}，更新：${result.updated}${result.errors.length > 0 ? `，错误：${result.errors.length}` : ''}`
      )
      // 刷新设备列表
      fetchDeviceList()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('同步设备失败:', error)
      ElMessage.error('同步设备失败')
    }
  } finally {
    syncingDevices.value = false
  }
}

// 获取设备位置
const handleGetLocation = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要获取设备 "${row.device_number}" 的当前位置吗？`,
      '获取位置',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )
    
    // 设置行级loading状态
    row.syncing = true
    
    const response = await deviceAPI.syncDeviceCurrentLocation(row.device_number)
    
    if (response.data.message) {
      ElMessage.success('位置获取成功')
      // 刷新设备列表
      fetchDeviceList()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('获取位置失败:', error)
      ElMessage.error('获取位置失败')
    }
  } finally {
    row.syncing = false
  }
}

// 显示轨迹同步对话框
const showGetTrackDialog = (row) => {
  currentDevice.value = row
  
  // 设置默认时间范围为最近7天
  const endTime = new Date()
  const startTime = new Date()
  startTime.setDate(startTime.getDate() - 7)
  
  trackForm.dateRange = [
    startTime.toISOString().slice(0, 19).replace('T', ' '),
    endTime.toISOString().slice(0, 19).replace('T', ' ')
  ]
  
  showTrackDialog.value = true
}

// 同步设备历史轨迹
const handleSyncTrack = async () => {
  try {
    if (!trackForm.dateRange || trackForm.dateRange.length !== 2) {
      ElMessage.warning('请选择时间范围')
      return
    }

    // 验证时间跨度不超过7天
    const startTime = new Date(trackForm.dateRange[0])
    const endTime = new Date(trackForm.dateRange[1])
    const diffTime = Math.abs(endTime - startTime)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays > 7) {
      ElMessage.warning('时间跨度不能超过7天')
      return
    }

    syncingTrack.value = true
    
    const response = await deviceAPI.syncDeviceTrack(
      currentDevice.value.device_number,
      {
        startTime: trackForm.dateRange[0],
        endTime: trackForm.dateRange[1]
      }
    )
    
    if (response.data.message) {
      const result = response.data.data
      ElMessage.success(
        `轨迹同步完成！总点数：${result.totalPoints}，保存：${result.savedPoints}${result.duplicatePoints > 0 ? `，重复：${result.duplicatePoints}` : ''}${result.errors.length > 0 ? `，错误：${result.errors.length}` : ''}`
      )
      showTrackDialog.value = false
      
      // 如果当前正在查看该设备的位置记录，刷新位置记录
      if (showLocationDialog.value && currentDevice.value) {
        fetchLocationHistory(currentDevice.value.id)
      }
    }
  } catch (error) {
    console.error('同步轨迹失败:', error)
    ElMessage.error('同步轨迹失败')
  } finally {
    syncingTrack.value = false
  }
}

// 处理选择变化
const handleSelectionChange = (selection) => {
  selectedDevices.value = selection
}

// 全选
const handleSelectAll = () => {
  deviceTableRef.value.clearSelection()
  deviceList.value.forEach(row => {
    deviceTableRef.value.toggleRowSelection(row, true)
  })
}

// 清空选择
const handleSelectNone = () => {
  deviceTableRef.value.clearSelection()
}

// 反选
const handleSelectReverse = () => {
  const currentSelected = new Set(selectedDevices.value.map(item => item.id))
  deviceTableRef.value.clearSelection()
  
  deviceList.value.forEach(row => {
    if (!currentSelected.has(row.id)) {
      deviceTableRef.value.toggleRowSelection(row, true)
    }
  })
}

// 获取会员列表
const fetchMemberList = async () => {
  try {
    loadingMembers.value = true
    const response = await memberAPI.getMemberList({
      page: 1,
      limit: 1000, // 获取所有会员
      status: 'active' // 只获取激活的会员
    })
    
    if (response.data.message) {
      memberList.value = response.data.data.members
    }
  } catch (error) {
    console.error('获取会员列表失败:', error)
    ElMessage.error('获取会员列表失败')
  } finally {
    loadingMembers.value = false
  }
}

// 批量分配客户
const handleBatchAssign = async () => {
  try {
    if (!assignForm.customerId) {
      ElMessage.warning('请选择要分配的客户')
      return
    }

    if (selectedDevices.value.length === 0) {
      ElMessage.warning('请先选择要分配的设备')
      return
    }

    await ElMessageBox.confirm(
      `确定要将 ${selectedDevices.value.length} 个设备分配给选中的客户吗？`,
      '批量分配确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    assigningCustomer.value = true
    
    const deviceIds = selectedDevices.value.map(device => device.id)
    const response = await deviceAPI.batchAssignCustomer({
      deviceIds: deviceIds,
      customerId: assignForm.customerId
    })
    
    if (response.data.message) {
      ElMessage.success(`成功分配 ${selectedDevices.value.length} 个设备`)
      showAssignDialog.value = false
      assignForm.customerId = null
      selectedDevices.value = []
      // 刷新设备列表
      fetchDeviceList()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量分配客户失败:', error)
      ElMessage.error('批量分配失败')
    }
  } finally {
    assigningCustomer.value = false
  }
}

// 监听分配对话框打开，加载会员列表
const handleAssignDialogOpen = () => {
  if (memberList.value.length === 0) {
    fetchMemberList()
  }
}

// 监听分配对话框变化
watch(showAssignDialog, (newVal) => {
  if (newVal) {
    handleAssignDialogOpen()
  }
})

onMounted(() => {
  fetchDeviceList()
})
</script>

<style scoped>
.device-management {
  max-width: 100%;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.search-bar {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.search-form {
  margin: 0;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.device-detail {
  padding: 20px 0;
}

.detail-row {
  display: flex;
  margin-bottom: 15px;
  gap: 20px;
}

.detail-row.full-width {
  flex-direction: column;
}

.detail-item {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-item label {
  font-weight: bold;
  color: #606266;
  width: 100px;
  flex-shrink: 0;
}

.detail-item span {
  color: #303133;
}

.battery-low {
  color: #f56c6c;
  font-weight: bold;
}

.battery-medium {
  color: #e6a23c;
  font-weight: bold;
}

.battery-high {
  color: #67c23a;
  font-weight: bold;
}

.location-header {
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.location-header h4 {
  margin: 0;
  color: #303133;
}

.assign-customer-form {
  padding: 10px 0;
}

.selected-devices h4 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 16px;
}

.device-list {
  max-height: 200px;
  overflow-y: auto;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
}

.batch-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  margin-bottom: 10px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 15px 20px;
}

.batch-left {
  display: flex;
  gap: 10px;
}

.selected-count {
  color: #409eff;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .search-form {
    display: block;
  }
  
  .search-form .el-form-item {
    margin-bottom: 15px;
  }
  
  .detail-row {
    flex-direction: column;
    gap: 10px;
  }
  
  .detail-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .detail-item label {
    width: auto;
    margin-bottom: 5px;
  }
}
</style>
