<template>
  <div class="home">
    <!-- 头部导航 -->
    <Header />

    <!-- 主要内容 -->
    <main class="main-content">
      <!-- 英雄区域 -->
      <section class="hero-section">
        <div class="container">
          <div class="hero-content">
            <div class="hero-text">
              <h1 class="hero-title">
                专业的跨境物流
                <span class="highlight">TMS系统</span>
              </h1>
              <p class="hero-subtitle">
                提供国际版便携式GPS定位器，实时追踪货物轨迹；跨境物流TMS系统，
                提供跨境物流整套服务、报关、转关、清关、货物承运等数字解决方案
              </p>
              <div class="hero-actions">
                <el-button type="primary" size="large" @click="scrollToProducts">
                  了解产品
                </el-button>
                <el-button size="large" @click="$router.push('/contact')">
                  联系我们
                </el-button>
              </div>
            </div>
            <div class="hero-image">
              <div class="image-placeholder">
                <el-icon size="120" color="#409eff"><Ship /></el-icon>
                <p>物流运输</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 产品特色 -->
      <section class="features-section" ref="productsSection">
        <div class="container">
          <h2 class="section-title">产品特色</h2>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">
                <el-icon size="48" color="#409eff"><Location /></el-icon>
              </div>
              <h3>GPS定位器</h3>
              <p>国际版便携式GPS定位器，提供实时货物追踪功能，确保货物安全运输</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">
                <el-icon size="48" color="#409eff"><Monitor /></el-icon>
              </div>
              <h3>TMS系统</h3>
              <p>完整的跨境物流管理系统，提供从订单到交付的全流程数字化管理</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">
                <el-icon size="48" color="#409eff"><Document /></el-icon>
              </div>
              <h3>报关服务</h3>
              <p>专业的报关、转关、清关服务，确保货物顺利通关</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">
                <el-icon size="48" color="#409eff"><Van /></el-icon>
              </div>
              <h3>货物承运</h3>
              <p>提供全球货物承运服务，覆盖主要贸易路线</p>
            </div>
          </div>
        </div>
      </section>

      <!-- 服务优势 -->
      <section class="advantages-section">
        <div class="container">
          <h2 class="section-title">服务优势</h2>
          <div class="advantages-content">
            <div class="advantage-item">
              <div class="advantage-number">01</div>
              <div class="advantage-text">
                <h3>实时追踪</h3>
                <p>通过GPS定位器实现货物实时追踪，让您随时掌握货物位置</p>
              </div>
            </div>
            <div class="advantage-item">
              <div class="advantage-number">02</div>
              <div class="advantage-text">
                <h3>数字化管理</h3>
                <p>全流程数字化管理，提高效率，降低成本</p>
              </div>
            </div>
            <div class="advantage-item">
              <div class="advantage-number">03</div>
              <div class="advantage-text">
                <h3>专业服务</h3>
                <p>专业的报关清关服务，确保货物顺利通关</p>
              </div>
            </div>
            <div class="advantage-item">
              <div class="advantage-number">04</div>
              <div class="advantage-text">
                <h3>全球覆盖</h3>
                <p>覆盖主要贸易路线，提供全球货物承运服务</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 联系我们 -->
      <section class="contact-section">
        <div class="container">
          <div class="contact-content">
            <div class="contact-text">
              <h2>需要帮助？</h2>
              <p>我们的专业团队随时为您提供支持和服务</p>
              <el-button type="primary" size="large" @click="$router.push('/contact')">
                立即咨询
              </el-button>
            </div>
            <div class="contact-info">
              <div class="contact-item">
                <el-icon><Phone /></el-icon>
                <span>400-888-8888</span>
              </div>
              <div class="contact-item">
                <el-icon><Message /></el-icon>
                <span>info@fuyousilu.com</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- 底部 -->
    <Footer />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Header from '@/components/Header.vue'
import Footer from '@/components/Footer.vue'
import { Ship, Location, Monitor, Document, Van, Phone, Message } from '@element-plus/icons-vue'

const productsSection = ref(null)

const scrollToProducts = () => {
  productsSection.value?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<style scoped>
.home {
  min-height: 100vh;
}

.main-content {
  margin-top: 70px;
}

/* 英雄区域 */
.hero-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 80px 0;
}

.hero-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;
}

.hero-title {
  font-size: 48px;
  font-weight: bold;
  margin-bottom: 20px;
  line-height: 1.2;
}

.highlight {
  color: #ffd700;
}

.hero-subtitle {
  font-size: 18px;
  line-height: 1.6;
  margin-bottom: 30px;
  opacity: 0.9;
}

.hero-actions {
  display: flex;
  gap: 20px;
}

.hero-image {
  display: flex;
  justify-content: center;
  align-items: center;
}

.image-placeholder {
  text-align: center;
  padding: 40px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  backdrop-filter: blur(10px);
}

.image-placeholder p {
  margin-top: 20px;
  font-size: 18px;
  font-weight: 500;
}

/* 产品特色 */
.features-section {
  padding: 80px 0;
  background: white;
}

.section-title {
  text-align: center;
  font-size: 36px;
  font-weight: bold;
  margin-bottom: 60px;
  color: #303133;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 30px;
}

.feature-card {
  text-align: center;
  padding: 40px 20px;
  border-radius: 12px;
  background: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.feature-icon {
  margin-bottom: 20px;
}

.feature-card h3 {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 15px;
  color: #303133;
}

.feature-card p {
  color: #606266;
  line-height: 1.6;
}

/* 服务优势 */
.advantages-section {
  padding: 80px 0;
  background: #f8f9fa;
}

.advantages-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 40px;
}

.advantage-item {
  display: flex;
  align-items: flex-start;
  gap: 20px;
}

.advantage-number {
  font-size: 48px;
  font-weight: bold;
  color: #409eff;
  line-height: 1;
}

.advantage-text h3 {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 10px;
  color: #303133;
}

.advantage-text p {
  color: #606266;
  line-height: 1.6;
}

/* 联系我们 */
.contact-section {
  padding: 60px 0;
  background: #2c3e50;
  color: white;
}

.contact-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;
}

.contact-text h2 {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 20px;
}

.contact-text p {
  font-size: 18px;
  margin-bottom: 30px;
  opacity: 0.9;
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 15px;
  font-size: 18px;
}

.contact-item .el-icon {
  font-size: 24px;
  color: #409eff;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .hero-content {
    grid-template-columns: 1fr;
    gap: 40px;
    text-align: center;
  }

  .hero-title {
    font-size: 32px;
  }

  .hero-actions {
    justify-content: center;
    flex-wrap: wrap;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .advantages-content {
    grid-template-columns: 1fr;
  }

  .contact-content {
    grid-template-columns: 1fr;
    gap: 40px;
    text-align: center;
  }

  .contact-info {
    align-items: center;
  }
}
</style>
