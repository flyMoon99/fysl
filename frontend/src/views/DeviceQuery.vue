<template>
  <div class="device-query-page">
    <div class="query-container">
      <!-- 左侧品牌展示区 -->
      <div class="query-left">
        <div class="brand-section">
          <div class="logo-area">
            <h1 class="brand-title">福佑丝路</h1>
            <h2 class="brand-subtitle">FUYOU SILK ROAD</h2>
          </div>
          
          <div class="system-info">
            <h3 class="system-title">设备轨迹</h3>
            <h3 class="system-title">查询系统</h3>
            <p class="system-description">让每一次设备追踪都清晰可见</p>
          </div>
          
          <div class="features">
            <div class="feature-item">
              <div class="feature-icon">📍</div>
              <span>实时GPS定位</span>
            </div>
            <div class="feature-item">
              <div class="feature-icon">📱</div>
              <span>无需登录访问</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 右侧查询表单区 -->
      <div class="query-right">
        <div class="form-section">
          <div class="form-header">
            <h1>设备轨迹查询</h1>
            <p>请输入设备号查询设备轨迹信息</p>
          </div>
          
          <el-form 
            ref="queryFormRef" 
            :model="queryForm" 
            :rules="queryRules" 
            class="query-form"
            v-loading="querying"
          >
            <el-form-item prop="deviceNumber">
              <label class="form-label">设备号</label>
              <el-input 
                v-model="queryForm.deviceNumber" 
                placeholder="请输入设备号"
                size="large"
                class="form-input"
                clearable
                @keyup.enter="handleQuery"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </el-form-item>
            
            <el-form-item>
              <el-button 
                type="primary" 
                size="large" 
                class="query-btn"
                @click="handleQuery"
                :loading="querying"
              >
                <el-icon><Search /></el-icon>
                查询轨迹
              </el-button>
            </el-form-item>
          </el-form>
          
          <div class="form-footer">
            
            <p class="copyright">
              © 2024 福佑丝路 GPS跟踪系统 v2.1.0<br>
              技术支持：福佑丝路科技有限公司
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, User } from '@element-plus/icons-vue'
import { publicAPI } from '@/utils/api'

const router = useRouter()
const queryFormRef = ref()
const querying = ref(false)

// 查询表单数据
const queryForm = reactive({
  deviceNumber: ''
})

// 表单验证规则
const queryRules = {
  deviceNumber: [
    { required: true, message: '请输入设备号', trigger: 'blur' },
    { min: 3, message: '设备号至少3位', trigger: 'blur' }
  ]
}

// 处理查询
const handleQuery = async () => {
  try {
    // 验证表单
    await queryFormRef.value.validate()
    
    querying.value = true
    
    // 检查设备是否存在
    const response = await publicAPI.getDeviceByNumber(queryForm.deviceNumber)
    
    if (response.data && response.data.data) {
      const device = response.data.data
      
      // 跳转到查询结果页面
      router.push({
        name: 'DeviceQueryResult',
        params: {
          deviceNumber: queryForm.deviceNumber
        },
        query: {
          deviceId: device.id,
          deviceAlias: device.device_alias || ''
        }
      })
    } else {
      ElMessage.error('未找到该设备，请检查设备号是否正确')
    }
  } catch (error) {
    console.error('查询设备失败:', error)
    
    // 检查是否是表单验证错误
    // Element Plus的表单验证错误通常没有response属性
    if (!error.response) {
      // 没有response属性，通常是表单验证错误，Element Plus会自动显示验证信息
      return
    }
    
    // API请求错误
    if (error.response?.status === 404) {
      ElMessage.error('未找到该设备，请检查设备号是否正确')
    } else {
      ElMessage.error('查询失败，请稍后重试')
    }
  } finally {
    querying.value = false
  }
}
</script>

<style scoped>
/* 整体页面样式 */
.device-query-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
}

.query-container {
  display: flex;
  width: 100%;
  max-width: 1200px;
  min-height: 100vh;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  border-radius: 0;
  overflow: hidden;
}

/* 左侧品牌展示区 */
.query-left {
  flex: 1;
  background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
  padding: 60px 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  color: white;
}

.query-left::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23dots)"/></svg>');
  opacity: 0.6;
  pointer-events: none;
}

.brand-section {
  text-align: center;
  position: relative;
  z-index: 1;
  max-width: 400px;
}

.logo-area {
  margin-bottom: 40px;
}

.brand-title {
  font-size: 42px;
  font-weight: bold;
  margin: 0 0 8px 0;
  letter-spacing: 2px;
}

.brand-subtitle {
  font-size: 16px;
  font-weight: normal;
  margin: 0 0 40px 0;
  opacity: 0.9;
  letter-spacing: 3px;
}

.system-info {
  margin-bottom: 50px;
}

.system-title {
  font-size: 32px;
  font-weight: bold;
  margin: 0 0 10px 0;
  line-height: 1.2;
}

.system-description {
  font-size: 16px;
  line-height: 1.6;
  opacity: 0.9;
  margin: 20px 0 0 0;
}

.features {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 40px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  opacity: 0.9;
}

.feature-icon {
  font-size: 20px;
  width: 24px;
  text-align: center;
}

/* 右侧查询表单区 */
.query-right {
  flex: 1;
  background: white;
  padding: 60px 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.form-section {
  width: 100%;
  max-width: 400px;
}

.form-header {
  text-align: center;
  margin-bottom: 40px;
}

.form-header h1 {
  font-size: 32px;
  font-weight: bold;
  color: #333;
  margin: 0 0 12px 0;
}

.form-header p {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.query-form {
  margin-bottom: 30px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.query-form .el-form-item {
  margin-bottom: 24px;
}

.form-input {
  width: 100%;
}

.form-input :deep(.el-input__wrapper) {
  border-radius: 8px;
  border: 1px solid #ddd;
  box-shadow: none;
  padding: 12px 16px;
  font-size: 16px;
  transition: all 0.3s ease;
}

.form-input :deep(.el-input__wrapper):hover {
  border-color: #4A90E2;
}

.form-input :deep(.el-input__wrapper.is-focus) {
  border-color: #4A90E2;
  box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.1);
}

.query-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
  background: #4A90E2;
  border: none;
  transition: all 0.3s ease;
}

.query-btn:hover {
  background: #357ABD;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
}

.form-footer {
  text-align: center;
  margin-top: 30px;
}

.quick-links {
  margin-bottom: 20px;
}

.quick-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-decoration: none;
  border-radius: 25px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.quick-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  color: white;
  text-decoration: none;
}

.copyright {
  font-size: 11px;
  color: #ccc;
  line-height: 1.4;
  margin: 20px 0 0 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .query-container {
    flex-direction: column;
    min-height: 100vh;
  }
  
  .query-left {
    flex: none;
    min-height: 40vh;
    padding: 40px 30px;
  }
  
  .brand-title {
    font-size: 28px;
  }
  
  .system-title {
    font-size: 24px;
  }
  
  .features {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .query-right {
    flex: 1;
    padding: 40px 30px;
  }
  
  .form-header h1 {
    font-size: 24px;
  }
}

@media (max-width: 480px) {
  .query-left, .query-right {
    padding: 30px 20px;
  }
  
  .brand-title {
    font-size: 24px;
  }
  
  .system-title {
    font-size: 20px;
  }
  
  .form-header h1 {
    font-size: 20px;
  }
}

/* 中等屏幕优化 */
@media (min-width: 769px) and (max-width: 1199px) {
  .query-container {
    max-width: 1000px;
  }
  
  .query-left, .query-right {
    padding: 50px 40px;
  }
}

/* 大屏幕优化 */
@media (min-width: 1200px) {
  .query-container {
    max-width: 1200px;
    border-radius: 12px;
    min-height: 700px;
  }
  
  .device-query-page {
    padding: 20px;
  }
}
</style>

