<template>
  <div class="login-page">
    <div class="login-container">
      <!-- 左侧品牌展示区 -->
      <div class="login-left">
        <div class="brand-section">
          <div class="logo-area">
            <h1 class="brand-title">福佑丝路</h1>
            <h2 class="brand-subtitle">FUYOU SILK ROAD</h2>
          </div>
          
          <div class="system-info">
            <h3 class="system-title">国际运输</h3>
            <h3 class="system-title">GPS跟踪系统</h3>
            <p class="system-description">让每一次跨境物流都清晰可见</p>
          </div>
          
          <div class="features">
            <div class="feature-item">
              <div class="feature-icon">📍</div>
              <span>国际GPS定位</span>
            </div>
            <div class="feature-item">
              <div class="feature-icon">🚚</div>
              <span>运单全程跟踪</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 右侧登录表单区 -->
      <div class="login-right">
        <div class="form-section">
          <div class="form-header">
            <h1>欢迎登录</h1>
            <p>请输入您的账户信息以访问系统</p>
          </div>
          
          <el-form 
            ref="formRef" 
            :model="form" 
            :rules="rules" 
            class="login-form"
            v-loading="loading"
          >
            <el-form-item prop="username">
              <label class="form-label">用户名/邮箱</label>
              <el-input 
                v-model="form.username" 
                placeholder="请输入用户名或邮箱"
                size="large"
                class="form-input"
              />
            </el-form-item>
            
            <el-form-item prop="password">
              <label class="form-label">密码</label>
              <el-input 
                v-model="form.password" 
                type="password" 
                placeholder="请输入密码"
                size="large"
                class="form-input"
                show-password
                @keyup.enter="handleLogin"
              />
            </el-form-item>
            
            <div class="form-options">
              <el-checkbox v-model="rememberMe" class="remember-checkbox">
                记住我
              </el-checkbox>
            </div>
            
            <el-form-item>
              <el-button 
                type="primary" 
                size="large" 
                class="login-btn"
                @click="handleLogin"
                :loading="submitting"
              >
                登录系统
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
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { ElMessage } from 'element-plus'
import logoUrl from '@/assets/logo.png'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref()
const loading = ref(false)
const submitting = ref(false)
const rememberMe = ref(false)

const form = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [
    { required: true, message: '请输入用户名或邮箱', trigger: 'blur' },
    { min: 3, max: 50, message: '用户名长度在 3 到 50 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

// 从本地存储加载记住的用户信息
const loadRememberedUser = () => {
  const rememberedUsername = localStorage.getItem('rememberedUsername')
  const rememberedPassword = localStorage.getItem('rememberedPassword')
  
  if (rememberedUsername && rememberedPassword) {
    form.username = rememberedUsername
    form.password = rememberedPassword
    rememberMe.value = true
  }
}

// 保存或清除记住的用户信息
const handleRememberMe = () => {
  if (rememberMe.value) {
    localStorage.setItem('rememberedUsername', form.username)
    localStorage.setItem('rememberedPassword', form.password)
  } else {
    localStorage.removeItem('rememberedUsername')
    localStorage.removeItem('rememberedPassword')
  }
}

// 处理登录
const handleLogin = async () => {
  try {
    await formRef.value.validate()
    submitting.value = true
    
    const result = await userStore.memberLogin({
      username: form.username,
      password: form.password
    })
    
    if (result.success) {
      // 处理记住我功能
      handleRememberMe()
      
      ElMessage.success('登录成功')
      router.push('/member')
    } else {
      ElMessage.error(result.message || '登录失败，请检查用户名和密码')
    }
  } catch (error) {
    console.error('登录失败:', error)
    ElMessage.error('登录失败，请检查用户名和密码')
  } finally {
    submitting.value = false
  }
}

// 处理忘记密码
const handleForgotPassword = () => {
  ElMessage.info('忘记密码功能正在开发中，请联系管理员重置密码')
}

// 组件挂载时加载记住的用户信息
onMounted(() => {
  loadRememberedUser()
})
</script>

<style scoped>
/* 整体页面样式 */
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
}

.login-container {
  display: flex;
  width: 100%;
  max-width: 1200px;
  min-height: 100vh;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  border-radius: 0;
  overflow: hidden;
}

/* 左侧品牌展示区 */
.login-left {
  flex: 1;
  background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
  padding: 60px 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  color: white;
}

.login-left::before {
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

.logo {
  width: 80px;
  height: 80px;
  margin-bottom: 20px;
  filter: brightness(0) invert(1);
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

/* 右侧登录表单区 */
.login-right {
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

.login-form {
  margin-bottom: 30px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.login-form .el-form-item {
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

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.remember-checkbox {
  font-size: 14px;
  color: #666;
}

.remember-checkbox :deep(.el-checkbox__label) {
  color: #666;
}

.forgot-password {
  font-size: 14px;
  color: #4A90E2;
  text-decoration: none;
  transition: color 0.3s ease;
}

.forgot-password:hover {
  color: #357ABD;
  text-decoration: underline;
}

.login-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
  background: #4A90E2;
  border: none;
  transition: all 0.3s ease;
}

.login-btn:hover {
  background: #357ABD;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
}

.form-footer {
  text-align: center;
  margin-top: 30px;
}

.register-text {
  font-size: 14px;
  color: #999;
  margin: 0 0 15px 0;
}

.register-link {
  margin: 0 0 20px 0;
}

.register-link span {
  color: #4A90E2;
  font-size: 14px;
  cursor: pointer;
  text-decoration: underline;
}

.terms {
  font-size: 12px;
  color: #999;
  line-height: 1.5;
  margin: 20px 0;
}

.terms .link {
  color: #4A90E2;
  text-decoration: none;
}

.terms .link:hover {
  text-decoration: underline;
}

.copyright {
  font-size: 11px;
  color: #ccc;
  line-height: 1.4;
  margin: 20px 0 0 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .login-container {
    flex-direction: column;
    min-height: 100vh;
  }
  
  .login-left {
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
  
  .login-right {
    flex: 1;
    padding: 40px 30px;
  }
  
  .form-header h1 {
    font-size: 24px;
  }
}

@media (max-width: 480px) {
  .login-left, .login-right {
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
  .login-container {
    max-width: 1000px;
  }
  
  .login-left, .login-right {
    padding: 50px 40px;
  }
}

/* 大屏幕优化 */
@media (min-width: 1200px) {
  .login-container {
    max-width: 1200px;
    border-radius: 12px;
    min-height: 700px;
  }
  
  .login-page {
    padding: 20px;
  }
}
</style>
