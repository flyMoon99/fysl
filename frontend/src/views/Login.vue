<template>
  <div class="login-page">
    <!-- 头部导航 -->
    <Header />
    
    <!-- 主要内容 -->
    <div class="main-content">
      <div class="container">
        <div class="login-container">
          <div class="login-card">
            <div class="login-header">
              <h1>会员登录</h1>
              <p>欢迎回到福佑丝路</p>
            </div>
            
            <el-form 
              ref="formRef" 
              :model="form" 
              :rules="rules" 
              class="login-form"
              v-loading="loading"
            >
              <el-form-item prop="username">
                <el-input 
                  v-model="form.username" 
                  placeholder="请输入用户名"
                  size="large"
                  prefix-icon="User"
                />
              </el-form-item>
              
              <el-form-item prop="password">
                <el-input 
                  v-model="form.password" 
                  type="password" 
                  placeholder="请输入密码"
                  size="large"
                  prefix-icon="Lock"
                  show-password
                  @keyup.enter="handleLogin"
                />
              </el-form-item>
              
              <el-form-item>
                <el-button 
                  type="primary" 
                  size="large" 
                  class="login-btn"
                  @click="handleLogin"
                  :loading="submitting"
                >
                  登录
                </el-button>
              </el-form-item>
            </el-form>
            
            <div class="login-footer">
              <p>还没有账户？ <router-link to="/register" class="link">立即注册</router-link></p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 底部 -->
    <Footer />
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { ElMessage } from 'element-plus'
import Header from '@/components/Header.vue'
import Footer from '@/components/Footer.vue'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref()
const loading = ref(false)
const submitting = ref(false)

const form = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '用户名长度在 3 到 50 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
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
</script>

<style scoped>
.login-page {
  min-height: 100vh;
}

.main-content {
  margin-top: 70px;
  padding: 80px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  min-height: calc(100vh - 70px);
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.main-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
  opacity: 0.3;
  pointer-events: none;
}

.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  position: relative;
  z-index: 1;
}

.login-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24px;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.2);
  padding: 50px;
  width: 100%;
  max-width: 550px;
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  position: relative;
  overflow: hidden;
}

.login-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea, #764ba2, #f093fb);
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.login-header h1 {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
  margin: 0 0 12px 0;
}

.login-header p {
  font-size: 18px;
  color: #606266;
  margin: 0;
}

.login-form {
  margin-bottom: 30px;
}

.login-form .el-form-item {
  margin-bottom: 25px;
}

.login-form .el-input {
  font-size: 16px;
}

.login-form .el-input__wrapper {
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.login-form .el-input__wrapper:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.login-form .el-input__wrapper.is-focus {
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
}

.login-btn {
  width: 100%;
  height: 52px;
  font-size: 18px;
  font-weight: bold;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  transition: all 0.3s ease;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.login-footer {
  text-align: center;
  padding-top: 25px;
  border-top: 1px solid #ebeef5;
}

.login-footer p {
  margin: 0;
  color: #606266;
  font-size: 16px;
}

.link {
  color: #667eea;
  text-decoration: none;
  font-weight: bold;
  transition: color 0.3s ease;
}

.link:hover {
  color: #764ba2;
  text-decoration: underline;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-content {
    padding: 40px 20px;
  }
  
  .login-card {
    padding: 40px 30px;
    margin: 0 10px;
    max-width: 100%;
  }
  
  .login-header h1 {
    font-size: 28px;
  }
  
  .login-header p {
    font-size: 16px;
  }
  
  .login-btn {
    height: 48px;
    font-size: 16px;
  }
}

/* 中等屏幕优化 */
@media (min-width: 769px) and (max-width: 1199px) {
  .login-card {
    max-width: 500px;
    padding: 45px;
  }
}

/* 大屏幕优化 */
@media (min-width: 1200px) {
  .login-card {
    max-width: 600px;
    padding: 60px;
  }
  
  .login-header h1 {
    font-size: 36px;
  }
  
  .login-header p {
    font-size: 20px;
  }
}
</style>
