<template>
  <div class="profile">
    <h1 class="page-title">个人信息</h1>
    
    <el-card class="profile-card">
      <template #header>
        <div class="card-header">
          <span>基本信息</span>
        </div>
      </template>
      
      <el-form 
        ref="formRef" 
        :model="form" 
        :rules="rules" 
        label-width="120px"
        v-loading="loading"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        
        <el-form-item label="账户状态">
          <el-tag :type="userStore.user?.status === 'active' ? 'success' : 'danger'">
            {{ userStore.user?.status === 'active' ? '正常' : '禁用' }}
          </el-tag>
        </el-form-item>
        
        <el-form-item label="注册时间">
          <span>{{ formatDate(userStore.user?.created_at) }}</span>
        </el-form-item>
        
        <el-form-item label="最后登录">
          <span>{{ formatDate(userStore.user?.last_login_at) }}</span>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            保存修改
          </el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import { memberAPI } from '@/utils/api'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()
const formRef = ref()
const loading = ref(false)
const submitting = ref(false)

const form = reactive({
  username: ''
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '用户名长度在 3 到 50 个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线', trigger: 'blur' }
  ]
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '暂无数据'
  return new Date(dateString).toLocaleString('zh-CN')
}

// 初始化表单数据
const initForm = () => {
  if (userStore.user) {
    form.username = userStore.user.username
  }
}

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    submitting.value = true
    
    const response = await memberAPI.updateProfile({
      username: form.username
    })
    
    if (response.data.message) {
      ElMessage.success(response.data.message)
      // 更新用户状态
      userStore.updateUserInfo({
        username: form.username
      })
    } else {
      ElMessage.error(response.data.error || '更新失败')
    }
  } catch (error) {
    console.error('更新个人信息失败:', error)
    ElMessage.error('更新失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

// 重置表单
const resetForm = () => {
  formRef.value?.resetFields()
  initForm()
}

onMounted(() => {
  initForm()
})
</script>

<style scoped>
.profile {
  max-width: 100%;
}

.page-title {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 30px;
  color: #303133;
}

.profile-card {
  max-width: 600px;
}

.card-header {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.el-form-item {
  margin-bottom: 24px;
}

.el-tag {
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .profile-card {
    max-width: 100%;
  }
  
  .el-form {
    padding: 0;
  }
}
</style>
