<template>
  <div class="waybill-list">
    <h1 class="page-title">运单列表</h1>
    
    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item>
          <el-input
            v-model="searchForm.waybill_number"
            placeholder="请输入运单号"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="searchForm.create_by"
            placeholder="创建人"
            clearable
            style="width: 150px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
          <el-button type="success" @click="showCreateDialog">新增运单</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 运单列表 -->
    <div class="waybill-table">
      <el-table :data="waybillList" style="width: 100%" v-loading="loading">
        <el-table-column prop="waybill_number" label="运单号" width="150" />
        <el-table-column prop="waybill_remarks" label="运单备注" min-width="200">
          <template #default="scope">
            {{ scope.row.waybill_remarks || '暂无' }}
          </template>
        </el-table-column>
        <el-table-column prop="create_by" label="创建人" width="120" />
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="运输明细数量" width="120">
          <template #default="scope">
            {{ scope.row.transportDetails ? scope.row.transportDetails.length : 0 }} 条
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button-group size="small">
              <el-button
                type="primary"
                @click="showWaybillDetail(scope.row)"
              >
                详情
              </el-button>
              <el-button
                type="warning"
                @click="editWaybill(scope.row)"
              >
                编辑
              </el-button>
              <el-button
                type="danger"
                @click="deleteWaybill(scope.row)"
              >
                删除
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

    <!-- 运单详情对话框 -->
    <el-dialog 
      v-model="showDetailDialog" 
      title="运单详情"
      width="800px"
    >
      <div v-if="currentWaybill" class="waybill-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="运单号">{{ currentWaybill.waybill_number }}</el-descriptions-item>
          <el-descriptions-item label="创建人">{{ currentWaybill.create_by }}</el-descriptions-item>
          <el-descriptions-item label="运单备注" :span="2">
            {{ currentWaybill.waybill_remarks || '暂无' }}
          </el-descriptions-item>
          <el-descriptions-item label="查看密码">
            {{ currentWaybill.waybill_password || '未设置' }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDateTime(currentWaybill.created_at) }}</el-descriptions-item>
        </el-descriptions>
        
        <!-- 运输明细 -->
        <div v-if="currentWaybill.transportDetails && currentWaybill.transportDetails.length > 0" class="transport-details">
          <h3 style="margin: 20px 0 10px 0;">运输明细</h3>
          <el-table :data="currentWaybill.transportDetails" size="small">
            <el-table-column prop="device.device_number" label="设备号" width="120" />
            <el-table-column prop="license_plate" label="车牌号" width="120">
              <template #default="scope">
                {{ scope.row.license_plate || '暂无' }}
              </template>
            </el-table-column>
            <el-table-column prop="address" label="位置" min-width="150">
              <template #default="scope">
                {{ scope.row.address || '暂无' }}
              </template>
            </el-table-column>
            <el-table-column prop="transport_remarks" label="运输备注" min-width="150">
              <template #default="scope">
                {{ scope.row.transport_remarks || '暂无' }}
              </template>
            </el-table-column>
            <el-table-column prop="last_update_time" label="最后更新时间" width="150">
              <template #default="scope">
                {{ scope.row.last_update_time ? formatDateTime(scope.row.last_update_time) : '暂无' }}
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showDetailDialog = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 创建/编辑运单对话框 -->
    <el-dialog 
      v-model="showFormDialog" 
      :title="isEdit ? '编辑运单' : '新增运单'"
      width="800px"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="运单号" prop="waybill_number">
          <el-input
            v-model="formData.waybill_number"
            placeholder="请输入运单号"
            :disabled="isEdit"
          />
        </el-form-item>
        
        <el-form-item label="运单备注" prop="waybill_remarks">
          <el-input
            v-model="formData.waybill_remarks"
            type="textarea"
            :rows="3"
            placeholder="请输入运单备注"
          />
        </el-form-item>
        
        
        <!-- 关联设备 -->
        <el-form-item label="关联设备">
          <div class="device-selection-form">
            <!-- 操作按钮 -->
            <div class="device-selection-actions">
              <el-button size="small" @click="selectAllDevices">全选</el-button>
              <el-button size="small" @click="selectNoneDevices">取消全选</el-button>
              <el-button size="small" @click="invertDeviceSelection">反选</el-button>
              <span class="selection-info">已选择 {{ selectedDeviceIds.length }} 个设备</span>
            </div>
            
            <!-- 设备列表 -->
            <div class="device-list-container">
              <el-table
                :data="availableDevices"
                @selection-change="handleDeviceSelectionChange"
                max-height="300"
                size="small"
                ref="deviceTableRef"
              >
                <el-table-column type="selection" width="55" />
                <el-table-column prop="id" label="设备ID" width="80" />
                <el-table-column prop="device_number" label="设备号" width="120" />
                <el-table-column prop="device_alias" label="设备备注" min-width="120">
                  <template #default="scope">
                    {{ scope.row.device_alias || '暂无' }}
                  </template>
                </el-table-column>
                <el-table-column prop="battery_level" label="电量" width="80">
                  <template #default="scope">
                    <span :class="getBatteryClass(scope.row.battery_level)">
                      {{ scope.row.battery_level }}%
                    </span>
                  </template>
                </el-table-column>
                <el-table-column prop="status" label="设备状态" width="100">
                  <template #default="scope">
                    <el-tag :type="getStatusType(scope.row.status)" size="small">
                      {{ getStatusText(scope.row.status) }}
                    </el-tag>
                  </template>
                </el-table-column>
              </el-table>
            </div>
            
            <!-- 选中设备的运输信息 -->
            <div v-if="selectedDeviceIds.length > 0" class="selected-devices-info">
              <h4>选中设备运输信息</h4>
              <div v-for="deviceId in selectedDeviceIds" :key="deviceId" class="device-transport-info">
                <el-card size="small" class="device-card">
                  <template #header>
                    <span>{{ getDeviceDisplayName(deviceId) }}</span>
                  </template>
                  <el-row :gutter="10">
                    <el-col :span="12">
                      <el-form-item label="车牌号" size="small">
                        <el-input
                          v-model="deviceTransportInfo[deviceId].license_plate"
                          placeholder="请输入车牌号"
                          size="small"
                        />
                      </el-form-item>
                    </el-col>
                    <el-col :span="12">
                      <el-form-item label="运输备注" size="small">
                        <el-input
                          v-model="deviceTransportInfo[deviceId].transport_remarks"
                          placeholder="请输入运输备注"
                          size="small"
                        />
                      </el-form-item>
                    </el-col>
                  </el-row>
                </el-card>
              </div>
            </div>
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showFormDialog = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitting">
            {{ isEdit ? '更新' : '创建' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { memberAPI } from '@/utils/api'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const submitting = ref(false)
const showDetailDialog = ref(false)
const showFormDialog = ref(false)
const isEdit = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const waybillList = ref([])
const deviceList = ref([])
const availableDevices = ref([]) // 未关联运单的设备列表
const selectedDeviceIds = ref([]) // 选中的设备ID列表
const deviceTransportInfo = ref({}) // 设备运输信息
const currentWaybill = ref(null)
const formRef = ref(null)
const deviceTableRef = ref(null)

// 搜索表单
const searchForm = reactive({
  waybill_number: '',
  create_by: ''
})

// 表单数据
const formData = reactive({
  waybill_number: '',
  waybill_remarks: ''
})

// 表单验证规则
const formRules = {
  waybill_number: [
    { required: true, message: '请输入运单号', trigger: 'blur' }
  ]
}

// 格式化日期时间
const formatDateTime = (dateString) => {
  if (!dateString) return '暂无数据'
  return new Date(dateString).toLocaleString('zh-CN')
}

// 获取运单列表
const fetchWaybillList = async () => {
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

    const response = await memberAPI.getWaybills(params)
    if (response.data.message) {
      waybillList.value = response.data.data.waybills
      total.value = response.data.data.pagination.total
    }
  } catch (error) {
    console.error('获取运单列表失败:', error)
    ElMessage.error('获取运单列表失败')
  } finally {
    loading.value = false
  }
}

// 获取设备列表
const fetchDeviceList = async () => {
  try {
    const response = await memberAPI.getDevices({ limit: 1000 })
    if (response.data.message) {
      deviceList.value = response.data.data.devices
      // 筛选出未关联运单的设备（这里暂时显示所有设备，后续可根据实际情况筛选）
      availableDevices.value = response.data.data.devices
    }
  } catch (error) {
    console.error('获取设备列表失败:', error)
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  fetchWaybillList()
}

// 重置搜索
const resetSearch = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = ''
  })
  currentPage.value = 1
  fetchWaybillList()
}

// 分页变化
const handlePageChange = (page) => {
  currentPage.value = page
  fetchWaybillList()
}

// 显示运单详情
const showWaybillDetail = (waybill) => {
  currentWaybill.value = waybill
  showDetailDialog.value = true
}

// 显示创建对话框
const showCreateDialog = () => {
  isEdit.value = false
  resetForm()
  resetDeviceSelection()
  showFormDialog.value = true
}

// 编辑运单
const editWaybill = (waybill) => {
  isEdit.value = true
  currentWaybill.value = waybill
  
  // 填充表单数据
  formData.waybill_number = waybill.waybill_number
  formData.waybill_remarks = waybill.waybill_remarks || ''
  
  // 重置设备选择
  resetDeviceSelection()
  
  // 填充已关联的设备
  if (waybill.transportDetails && waybill.transportDetails.length > 0) {
    const deviceIds = waybill.transportDetails.map(detail => detail.device_id)
    selectedDeviceIds.value = deviceIds
    
    // 填充设备运输信息
    waybill.transportDetails.forEach(detail => {
      deviceTransportInfo.value[detail.device_id] = {
        license_plate: detail.license_plate || '',
        transport_remarks: detail.transport_remarks || ''
      }
    })
    
    // 更新表格选择状态
    setTimeout(() => {
      if (deviceTableRef.value) {
        deviceIds.forEach(deviceId => {
          const row = availableDevices.value.find(device => device.id === deviceId)
          if (row) {
            deviceTableRef.value.toggleRowSelection(row, true)
          }
        })
      }
    }, 100)
  }
  
  showFormDialog.value = true
}

// 删除运单
const deleteWaybill = async (waybill) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除运单 "${waybill.waybill_number}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await memberAPI.deleteWaybill(waybill.id)
    ElMessage.success('删除成功')
    fetchWaybillList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除运单失败:', error)
      ElMessage.error('删除运单失败')
    }
  }
}

// 重置表单
const resetForm = () => {
  formData.waybill_number = ''
  formData.waybill_remarks = ''
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

// 重置设备选择
const resetDeviceSelection = () => {
  selectedDeviceIds.value = []
  deviceTransportInfo.value = {}
  if (deviceTableRef.value) {
    deviceTableRef.value.clearSelection()
  }
}

// 处理设备选择变化
const handleDeviceSelectionChange = (selection) => {
  const newSelectedIds = selection.map(device => device.id)
  
  // 移除未选中设备的运输信息
  Object.keys(deviceTransportInfo.value).forEach(deviceId => {
    if (!newSelectedIds.includes(parseInt(deviceId))) {
      delete deviceTransportInfo.value[deviceId]
    }
  })
  
  // 为新选中的设备添加默认运输信息
  newSelectedIds.forEach(deviceId => {
    if (!deviceTransportInfo.value[deviceId]) {
      deviceTransportInfo.value[deviceId] = {
        license_plate: '',
        transport_remarks: ''
      }
    }
  })
  
  selectedDeviceIds.value = newSelectedIds
}

// 全选设备
const selectAllDevices = () => {
  if (deviceTableRef.value) {
    deviceTableRef.value.toggleAllSelection()
  }
}

// 取消全选
const selectNoneDevices = () => {
  if (deviceTableRef.value) {
    deviceTableRef.value.clearSelection()
  }
}

// 反选设备
const invertDeviceSelection = () => {
  if (deviceTableRef.value) {
    availableDevices.value.forEach(device => {
      deviceTableRef.value.toggleRowSelection(device)
    })
  }
}

// 获取设备显示名称
const getDeviceDisplayName = (deviceId) => {
  const device = availableDevices.value.find(d => d.id === deviceId)
  return device ? `${device.device_number} ${device.device_alias ? '(' + device.device_alias + ')' : ''}` : `设备${deviceId}`
}

// 获取电量样式类
const getBatteryClass = (batteryLevel) => {
  if (batteryLevel >= 50) return 'battery-high'
  if (batteryLevel >= 20) return 'battery-medium'
  return 'battery-low'
}

// 获取设备状态类型
const getStatusType = (status) => {
  switch (status) {
    case 'online': return 'success'
    case 'offline': return 'danger'
    case 'sleep': return 'warning'
    default: return 'info'
  }
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

// 提交表单
const submitForm = async () => {
  try {
    await formRef.value.validate()
    
    if (selectedDeviceIds.value.length === 0) {
      ElMessage.warning('请至少选择一个设备')
      return
    }
    
    submitting.value = true
    
    // 构建运输明细数据
    const transportDetails = selectedDeviceIds.value.map(deviceId => {
      const device = availableDevices.value.find(d => d.id === deviceId)
      const transportInfo = deviceTransportInfo.value[deviceId] || {}
      
      return {
        device_id: deviceId,
        waybill_number: formData.waybill_number,
        longitude: device?.last_longitude || null,
        latitude: device?.last_latitude || null,
        address: device?.last_location || '',
        license_plate: transportInfo.license_plate || '',
        transport_remarks: transportInfo.transport_remarks || '',
        last_update_time: device?.last_update_time || null
      }
    })
    
    const submitData = {
      ...formData,
      transport_details: transportDetails
    }
    
    if (isEdit.value) {
      await memberAPI.updateWaybill(currentWaybill.value.id, submitData)
      ElMessage.success('更新成功')
    } else {
      await memberAPI.createWaybill(submitData)
      ElMessage.success('创建成功')
    }
    
    showFormDialog.value = false
    fetchWaybillList()
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error(isEdit.value ? '更新失败' : '创建失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchWaybillList()
  fetchDeviceList()
})
</script>

<style scoped>
.waybill-list {
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

/* 运单表格 */
.waybill-table {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

/* 运单详情 */
.waybill-detail {
  max-height: 400px;
  overflow-y: auto;
}

.transport-details {
  margin-top: 20px;
}

/* 设备选择表单 */
.device-selection-form {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 15px;
  background: #fafafa;
}

.device-selection-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  padding: 10px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.selection-info {
  color: #606266;
  font-size: 14px;
  margin-left: auto;
}

.device-list-container {
  margin-bottom: 20px;
}

.selected-devices-info {
  background: white;
  border-radius: 4px;
  padding: 15px;
  border: 1px solid #e4e7ed;
}

.selected-devices-info h4 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 16px;
}

.device-transport-info {
  margin-bottom: 15px;
}

.device-transport-info:last-child {
  margin-bottom: 0;
}

.device-card {
  margin-bottom: 10px;
}

.device-card:last-child {
  margin-bottom: 0;
}

/* 电量显示样式 */
.battery-high {
  color: #67c23a;
  font-weight: bold;
}

.battery-medium {
  color: #e6a23c;
  font-weight: bold;
}

.battery-low {
  color: #f56c6c;
  font-weight: bold;
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
</style>
