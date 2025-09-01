<template>
  <div class="member-management">
    <!-- 页面头部 -->
    <div class="content-header">
      <h2>会员管理</h2>
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>
        新增会员
      </el-button>
    </div>

    <!-- 搜索栏 -->
    <div class="content-body">
      <div class="search-bar">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="用户名">
            <el-input 
              v-model="searchForm.username" 
              placeholder="请输入用户名"
              clearable
            />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
              <el-option label="启用" value="active" />
              <el-option label="禁用" value="inactive" />
            </el-select>
          </el-form-item>
          <el-form-item label="注册时间">
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

      <!-- 会员列表 -->
      <el-table :data="memberList" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" width="150" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'active' ? 'success' : 'danger'">
              {{ scope.row.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="注册时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="last_login_at" label="最后登录" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.last_login_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="login_count" label="登录次数" width="100" />
        <el-table-column label="操作" width="250" fixed="right">
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
              @click="handleEdit(scope.row)"
            >
              编辑
            </el-button>
            <el-button 
              size="small" 
              type="warning"
              @click="handleViewLoginHistory(scope.row)"
            >
              登录记录
            </el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="handleDelete(scope.row)"
            >
              删除
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

    <!-- 新增/编辑对话框 -->
    <el-dialog 
      v-model="showCreateDialog" 
      :title="isEdit ? '编辑会员' : '新增会员'"
      width="500px"
    >
      <el-form 
        ref="formRef" 
        :model="form" 
        :rules="rules" 
        label-width="100px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        
        <el-form-item label="密码" prop="password" v-if="!isEdit">
          <el-input 
            v-model="form.password" 
            type="password" 
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>
        
        <!-- 编辑模式下的密码修改选项 -->
        <template v-if="isEdit">
          <el-form-item>
            <el-checkbox v-model="changePassword">修改密码</el-checkbox>
          </el-form-item>
          
          <el-form-item label="新密码" prop="password" v-if="changePassword">
            <el-input 
              v-model="form.password" 
              type="password" 
              placeholder="请输入新密码"
              show-password
            />
          </el-form-item>
        </template>
        
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择状态" style="width: 100%">
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="inactive" />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCreateDialog = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            {{ isEdit ? '更新' : '创建' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 会员详情对话框 -->
    <el-dialog 
      v-model="showDetailDialog" 
      title="会员详情"
      width="600px"
    >
      <div class="member-detail" v-if="currentMember">
        <div class="detail-item">
          <label>ID：</label>
          <span>{{ currentMember.id }}</span>
        </div>
        <div class="detail-item">
          <label>用户名：</label>
          <span>{{ currentMember.username }}</span>
        </div>
        <div class="detail-item">
          <label>状态：</label>
          <el-tag :type="currentMember.status === 'active' ? 'success' : 'danger'">
            {{ currentMember.status === 'active' ? '启用' : '禁用' }}
          </el-tag>
        </div>
        <div class="detail-item">
          <label>注册时间：</label>
          <span>{{ formatDateTime(currentMember.created_at) }}</span>
        </div>
        <div class="detail-item">
          <label>最后登录：</label>
          <span>{{ formatDateTime(currentMember.last_login_at) }}</span>
        </div>
        <div class="detail-item">
          <label>登录次数：</label>
          <span>{{ currentMember.login_count || 0 }}</span>
        </div>
      </div>
    </el-dialog>

    <!-- 登录历史对话框 -->
    <el-dialog 
      v-model="showLoginHistoryDialog" 
      title="登录历史"
      width="800px"
    >
      <el-table :data="loginHistory" style="width: 100%" v-loading="loginHistoryLoading">
        <el-table-column prop="operation_time" label="登录时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.operation_time) }}
          </template>
        </el-table-column>
        <el-table-column prop="ip_address" label="IP地址" width="150" />
        <el-table-column prop="operation_url" label="登录页面" width="150" />
        <el-table-column prop="user_agent" label="设备信息" show-overflow-tooltip />
      </el-table>
      
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="loginHistoryPage"
          v-model:page-size="loginHistoryPageSize"
          :page-sizes="[10, 20, 50]"
          :total="loginHistoryTotal"
          layout="total, sizes, prev, pager, next"
          @size-change="handleLoginHistorySizeChange"
          @current-change="handleLoginHistoryPageChange"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { memberAPI } from '@/utils/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const formRef = ref()
const loading = ref(false)
const submitting = ref(false)
const showCreateDialog = ref(false)
const showDetailDialog = ref(false)
const showLoginHistoryDialog = ref(false)
const isEdit = ref(false)
const changePassword = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const memberList = ref([])
const currentEditId = ref(null)
const currentMember = ref(null)
const loginHistory = ref([])
const loginHistoryLoading = ref(false)
const loginHistoryPage = ref(1)
const loginHistoryPageSize = ref(10)
const loginHistoryTotal = ref(0)
const currentMemberId = ref(null)

// 搜索表单
const searchForm = reactive({
  username: '',
  status: '',
  dateRange: []
})

// 表单数据
const form = reactive({
  username: '',
  password: '',
  status: 'active'
})

// 表单验证规则
const rules = computed(() => ({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '用户名长度在 3 到 50 个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线', trigger: 'blur' }
  ],
  password: [
    { 
      required: !isEdit.value || changePassword.value, 
      message: '请输入密码', 
      trigger: 'blur' 
    },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' },
    { 
      pattern: /^(?=.*[a-zA-Z])(?=.*\d)/, 
      message: '密码必须包含字母和数字', 
      trigger: 'blur' 
    }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
}))

// 格式化日期时间
const formatDateTime = (dateString) => {
  if (!dateString) return '暂无数据'
  return new Date(dateString).toLocaleString('zh-CN')
}

// 获取会员列表
const fetchMemberList = async () => {
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
    
    const response = await memberAPI.getMemberList(params)
    if (response.data.message) {
      memberList.value = response.data.data.members
      total.value = response.data.data.pagination.total
    }
  } catch (error) {
    console.error('获取会员列表失败:', error)
    ElMessage.error('获取会员列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  fetchMemberList()
}

// 重置搜索
const resetSearch = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = ''
  })
  searchForm.dateRange = []
  currentPage.value = 1
  fetchMemberList()
}

// 处理分页大小变化
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  fetchMemberList()
}

// 处理当前页变化
const handleCurrentChange = (page) => {
  currentPage.value = page
  fetchMemberList()
}

// 查看会员详情
const handleView = (row) => {
  currentMember.value = row
  showDetailDialog.value = true
}

// 新增会员
const handleCreate = () => {
  isEdit.value = false
  changePassword.value = false
  currentEditId.value = null
  Object.assign(form, {
    username: '',
    password: '',
    status: 'active'
  })
  showCreateDialog.value = true
}

// 编辑会员
const handleEdit = (row) => {
  isEdit.value = true
  changePassword.value = false
  currentEditId.value = row.id
  Object.assign(form, {
    username: row.username,
    password: '',
    status: row.status
  })
  showCreateDialog.value = true
}

// 查看登录历史
const handleViewLoginHistory = async (row) => {
  currentMemberId.value = row.id
  loginHistoryPage.value = 1
  await fetchLoginHistory()
  showLoginHistoryDialog.value = true
}

// 获取登录历史
const fetchLoginHistory = async () => {
  try {
    loginHistoryLoading.value = true
    const response = await memberAPI.getMemberLoginHistory(
      currentMemberId.value,
      {
        page: loginHistoryPage.value,
        limit: loginHistoryPageSize.value
      }
    )
    
    if (response.data.message) {
      loginHistory.value = response.data.data.loginHistory
      loginHistoryTotal.value = response.data.data.pagination.total
    }
  } catch (error) {
    console.error('获取登录历史失败:', error)
    ElMessage.error('获取登录历史失败')
  } finally {
    loginHistoryLoading.value = false
  }
}

// 处理登录历史分页大小变化
const handleLoginHistorySizeChange = (size) => {
  loginHistoryPageSize.value = size
  loginHistoryPage.value = 1
  fetchLoginHistory()
}

// 处理登录历史当前页变化
const handleLoginHistoryPageChange = (page) => {
  loginHistoryPage.value = page
  fetchLoginHistory()
}

// 删除会员
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除会员 "${row.username}" 吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const response = await memberAPI.deleteMember(row.id)
    if (response.data.message) {
      ElMessage.success(response.data.message)
      fetchMemberList()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除会员失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    submitting.value = true
    
    if (isEdit.value) {
      // 编辑会员
      const updateData = {
        username: form.username,
        status: form.status
      }
      // 只有选择修改密码时才包含密码字段
      if (changePassword.value && form.password) {
        updateData.password = form.password
      }
      const response = await memberAPI.updateMember(currentEditId.value, updateData)
      if (response.data.message) {
        ElMessage.success(response.data.message)
        showCreateDialog.value = false
        fetchMemberList()
      }
    } else {
      // 新增会员
      const response = await memberAPI.createMember(form)
      if (response.data.message) {
        ElMessage.success(response.data.message)
        showCreateDialog.value = false
        fetchMemberList()
      }
    }
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

// 监听对话框关闭
const handleDialogClose = () => {
  isEdit.value = false
  currentEditId.value = null
  formRef.value?.resetFields()
  Object.assign(form, {
    username: '',
    password: '',
    status: 'active'
  })
}

onMounted(() => {
  fetchMemberList()
})
</script>

<style scoped>
.member-management {
  max-width: 100%;
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

.member-detail {
  padding: 20px 0;
}

.detail-item {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .search-form {
    display: block;
  }
  
  .search-form .el-form-item {
    margin-bottom: 15px;
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
