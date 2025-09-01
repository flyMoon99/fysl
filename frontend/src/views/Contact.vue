<template>
  <div class="contact-page">
    <!-- 头部导航 -->
    <Header />
    
    <!-- 主要内容 -->
    <div class="main-content">
      <!-- 页面标题 -->
      <div class="page-header">
        <div class="container">
          <h1>联系我们</h1>
          <p>随时为您提供专业的服务支持</p>
        </div>
      </div>
      
      <!-- 联系信息 -->
      <section class="contact-info">
        <div class="container">
          <div class="info-grid">
            <div class="info-card">
              <div class="info-icon">
                <el-icon size="48" color="#409eff"><Location /></el-icon>
              </div>
              <h3>公司地址</h3>
              <p>深圳市南山区科技园南区</p>
              <p>深南大道10000号</p>
            </div>
            
            <div class="info-card">
              <div class="info-icon">
                <el-icon size="48" color="#67c23a"><Phone /></el-icon>
              </div>
              <h3>联系电话</h3>
              <p>400-888-8888</p>
              <p>0755-88888888</p>
            </div>
            
            <div class="info-card">
              <div class="info-icon">
                <el-icon size="48" color="#e6a23c"><Message /></el-icon>
              </div>
              <h3>电子邮箱</h3>
              <p>info@fuyousilu.com</p>
              <p>service@fuyousilu.com</p>
            </div>
            
            <div class="info-card">
              <div class="info-icon">
                <el-icon size="48" color="#f56c6c"><Clock /></el-icon>
              </div>
              <h3>工作时间</h3>
              <p>周一至周五：9:00-18:00</p>
              <p>周六：9:00-12:00</p>
            </div>
          </div>
        </div>
      </section>
      
      <!-- 联系表单 -->
      <section class="contact-form">
        <div class="container">
          <div class="form-container">
            <div class="form-header">
              <h2>在线咨询</h2>
              <p>填写以下信息，我们会尽快与您联系</p>
            </div>
            
            <el-form 
              ref="formRef" 
              :model="form" 
              :rules="rules" 
              class="contact-form-el"
              v-loading="loading"
            >
              <div class="form-row">
                <el-form-item prop="name" class="form-item">
                  <el-input 
                    v-model="form.name" 
                    placeholder="您的姓名"
                    size="large"
                  />
                </el-form-item>
                
                <el-form-item prop="phone" class="form-item">
                  <el-input 
                    v-model="form.phone" 
                    placeholder="联系电话"
                    size="large"
                  />
                </el-form-item>
              </div>
              
              <el-form-item prop="email">
                <el-input 
                  v-model="form.email" 
                  placeholder="电子邮箱"
                  size="large"
                />
              </el-form-item>
              
              <el-form-item prop="company">
                <el-input 
                  v-model="form.company" 
                  placeholder="公司名称（可选）"
                  size="large"
                />
              </el-form-item>
              
              <el-form-item prop="subject">
                <el-select 
                  v-model="form.subject" 
                  placeholder="咨询主题"
                  size="large"
                  style="width: 100%"
                >
                  <el-option label="物流服务咨询" value="logistics" />
                  <el-option label="系统功能咨询" value="system" />
                  <el-option label="合作洽谈" value="cooperation" />
                  <el-option label="其他" value="other" />
                </el-select>
              </el-form-item>
              
              <el-form-item prop="message">
                <el-input 
                  v-model="form.message" 
                  type="textarea" 
                  placeholder="请详细描述您的需求"
                  :rows="6"
                  size="large"
                />
              </el-form-item>
              
              <el-form-item>
                <el-button 
                  type="primary" 
                  size="large" 
                  class="submit-btn"
                  @click="handleSubmit"
                  :loading="submitting"
                >
                  提交咨询
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </section>
      
      <!-- 地图区域 -->
      <section class="map-section">
        <div class="container">
          <h2 class="section-title">公司位置</h2>
          <div class="map-container">
            <div class="map-placeholder">
              <el-icon size="64" color="#409eff"><Location /></el-icon>
              <h3>深圳市南山区科技园南区</h3>
              <p>深南大道10000号</p>
              <p>福佑丝路大厦</p>
            </div>
          </div>
        </div>
      </section>
    </div>
    
    <!-- 底部 -->
    <Footer />
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import Header from '@/components/Header.vue'
import Footer from '@/components/Footer.vue'
import { Location, Phone, Message, Clock } from '@element-plus/icons-vue'

const formRef = ref()
const loading = ref(false)
const submitting = ref(false)

const form = reactive({
  name: '',
  phone: '',
  email: '',
  company: '',
  subject: '',
  message: ''
})

const rules = {
  name: [
    { required: true, message: '请输入您的姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '姓名长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入电子邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  subject: [
    { required: true, message: '请选择咨询主题', trigger: 'change' }
  ],
  message: [
    { required: true, message: '请输入咨询内容', trigger: 'blur' },
    { min: 10, max: 500, message: '咨询内容长度在 10 到 500 个字符', trigger: 'blur' }
  ]
}

// 处理表单提交
const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    submitting.value = true
    
    // 这里可以调用API发送咨询信息
    // 目前只是模拟提交
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success('咨询信息提交成功，我们会尽快与您联系')
    formRef.value.resetFields()
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('提交失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.contact-page {
  min-height: 100vh;
}

.main-content {
  margin-top: 70px;
}

/* 页面标题 */
.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 80px 0;
  text-align: center;
}

.page-header h1 {
  font-size: 48px;
  font-weight: bold;
  margin: 0 0 16px 0;
}

.page-header p {
  font-size: 20px;
  margin: 0;
  opacity: 0.9;
}

/* 联系信息 */
.contact-info {
  padding: 80px 0;
  background: white;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 30px;
}

.info-card {
  background: #f5f7fa;
  border-radius: 12px;
  padding: 40px 30px;
  text-align: center;
  transition: transform 0.3s ease;
}

.info-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.info-icon {
  margin-bottom: 20px;
}

.info-card h3 {
  font-size: 20px;
  font-weight: bold;
  color: #303133;
  margin: 0 0 16px 0;
}

.info-card p {
  font-size: 14px;
  color: #606266;
  margin: 0 0 8px 0;
  line-height: 1.6;
}

/* 联系表单 */
.contact-form {
  padding: 80px 0;
  background: #f5f7fa;
}

.form-container {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.form-header {
  text-align: center;
  margin-bottom: 40px;
}

.form-header h2 {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
  margin: 0 0 12px 0;
}

.form-header p {
  font-size: 16px;
  color: #606266;
  margin: 0;
}

.contact-form-el {
  max-width: 100%;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-item {
  margin-bottom: 20px;
}

.el-form-item {
  margin-bottom: 20px;
}

.submit-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: bold;
  border-radius: 8px;
}

/* 地图区域 */
.map-section {
  padding: 80px 0;
  background: white;
}

.section-title {
  font-size: 36px;
  font-weight: bold;
  text-align: center;
  color: #303133;
  margin: 0 0 40px 0;
}

.map-container {
  max-width: 800px;
  margin: 0 auto;
}

.map-placeholder {
  background: #f5f7fa;
  border-radius: 12px;
  padding: 60px;
  text-align: center;
  border: 2px dashed #dcdfe6;
}

.map-placeholder h3 {
  font-size: 20px;
  font-weight: bold;
  color: #303133;
  margin: 20px 0 12px 0;
}

.map-placeholder p {
  font-size: 14px;
  color: #606266;
  margin: 0 0 8px 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header h1 {
    font-size: 32px;
  }
  
  .page-header p {
    font-size: 16px;
  }
  
  .form-container {
    margin: 0 20px;
    padding: 30px 20px;
  }
  
  .form-header h2 {
    font-size: 24px;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .section-title {
    font-size: 28px;
  }
  
  .map-placeholder {
    padding: 40px 20px;
  }
}
</style>
