<template>
  <div class="not-found-page">
    <Header />
    <div class="main-content">
      <div class="container">
        <div class="not-found-content">
          <div class="error-code">404</div>
          <h1 class="error-title">页面未找到</h1>
          <p class="error-description">
            抱歉，您访问的页面不存在或已被移除。
          </p>
          <div class="error-actions">
            <el-button type="primary" @click="$router.push('/')">
              <el-icon><House /></el-icon>
              返回首页
            </el-button>
            <el-button @click="$router.go(-1)">
              <el-icon><Back /></el-icon>
              返回上页
            </el-button>
          </div>
          <div class="error-help">
            <p>您可以尝试：</p>
            <ul>
              <li>检查网址是否正确</li>
              <li>使用导航菜单浏览其他页面</li>
              <li>联系客服获取帮助</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    <Footer />
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import Header from '@/components/Header.vue'
import Footer from '@/components/Footer.vue'
import { House, Back } from '@element-plus/icons-vue'

const router = useRouter()
</script>

<style scoped>
.not-found-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.not-found-content {
  text-align: center;
  max-width: 600px;
  padding: 40px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.error-code {
  font-size: 120px;
  font-weight: bold;
  color: #409eff;
  line-height: 1;
  margin-bottom: 20px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.error-title {
  font-size: 32px;
  color: #303133;
  margin-bottom: 16px;
  font-weight: 600;
}

.error-description {
  font-size: 18px;
  color: #606266;
  margin-bottom: 32px;
  line-height: 1.6;
}

.error-actions {
  margin-bottom: 32px;
}

.error-actions .el-button {
  margin: 0 8px;
  padding: 12px 24px;
  font-size: 16px;
}

.error-actions .el-button .el-icon {
  margin-right: 8px;
}

.error-help {
  text-align: left;
  background: #f8f9fa;
  padding: 24px;
  border-radius: 8px;
  border-left: 4px solid #409eff;
}

.error-help p {
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.error-help ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.error-help li {
  color: #606266;
  padding: 4px 0;
  position: relative;
  padding-left: 20px;
}

.error-help li::before {
  content: "•";
  color: #409eff;
  font-weight: bold;
  position: absolute;
  left: 0;
}

@media (max-width: 768px) {
  .not-found-content {
    margin: 20px;
    padding: 30px 20px;
  }
  
  .error-code {
    font-size: 80px;
  }
  
  .error-title {
    font-size: 24px;
  }
  
  .error-description {
    font-size: 16px;
  }
  
  .error-actions .el-button {
    display: block;
    width: 100%;
    margin: 8px 0;
  }
}
</style>
