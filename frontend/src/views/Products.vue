<template>
  <div class="products">
    <!-- 头部导航 -->
    <Header />

    <!-- 主要内容 -->
    <main class="main-content">
      <!-- 页面标题 -->
      <section class="page-header">
        <div class="container">
          <h1 class="page-title">产品服务</h1>
          <p class="page-subtitle">专业的跨境物流解决方案，为您的业务保驾护航</p>
        </div>
      </section>

      <!-- 产品列表 -->
      <section class="products-section">
        <div class="container">
          <div class="products-grid">
            <!-- GPS定位器 -->
            <div class="product-card">
              <div class="product-image">
                <el-icon size="80" color="#409eff"><Location /></el-icon>
              </div>
              <div class="product-content">
                <h3>GPS定位器</h3>
                <p class="product-description">
                  国际版便携式GPS定位器，提供实时货物追踪功能，确保货物安全运输。
                  支持全球定位，实时监控货物位置和状态。
                </p>
                <ul class="product-features">
                  <li>全球GPS定位</li>
                  <li>实时位置追踪</li>
                  <li>货物状态监控</li>
                  <li>历史轨迹回放</li>
                  <li>异常情况报警</li>
                </ul>
              </div>
            </div>

            <!-- TMS系统 -->
            <div class="product-card">
              <div class="product-image">
                <el-icon size="80" color="#409eff"><Monitor /></el-icon>
              </div>
              <div class="product-content">
                <h3>跨境物流TMS系统</h3>
                <p class="product-description">
                  完整的跨境物流管理系统，提供从订单到交付的全流程数字化管理。
                  集成订单管理、运输管理、仓储管理等功能。
                </p>
                <ul class="product-features">
                  <li>订单管理系统</li>
                  <li>运输路线规划</li>
                  <li>仓储管理</li>
                  <li>成本核算</li>
                  <li>报表分析</li>
                </ul>
              </div>
            </div>

            <!-- 报关服务 -->
            <div class="product-card">
              <div class="product-image">
                <el-icon size="80" color="#409eff"><Document /></el-icon>
              </div>
              <div class="product-content">
                <h3>报关服务</h3>
                <p class="product-description">
                  专业的报关、转关、清关服务，确保货物顺利通关。
                  提供一站式通关解决方案，简化通关流程。
                </p>
                <ul class="product-features">
                  <li>进出口报关</li>
                  <li>转关服务</li>
                  <li>清关代理</li>
                  <li>单证处理</li>
                  <li>海关咨询</li>
                </ul>
              </div>
            </div>

            <!-- 货物承运 -->
            <div class="product-card">
              <div class="product-image">
                <el-icon size="80" color="#409eff"><Van /></el-icon>
              </div>
              <div class="product-content">
                <h3>货物承运</h3>
                <p class="product-description">
                  提供全球货物承运服务，覆盖主要贸易路线。
                  支持海运、空运、陆运等多种运输方式。
                </p>
                <ul class="product-features">
                  <li>海运服务</li>
                  <li>空运服务</li>
                  <li>陆运服务</li>
                  <li>多式联运</li>
                  <li>保险服务</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 服务流程 -->
      <section class="process-section">
        <div class="container">
          <h2 class="section-title">服务流程</h2>
          <div class="process-steps">
            <div class="process-step">
              <div class="step-number">01</div>
              <div class="step-content">
                <h3>需求咨询</h3>
                <p>了解客户需求，制定个性化解决方案</p>
              </div>
            </div>
            <div class="process-step">
              <div class="step-number">02</div>
              <div class="step-content">
                <h3>方案制定</h3>
                <p>根据需求制定详细的物流方案</p>
              </div>
            </div>
            <div class="process-step">
              <div class="step-number">03</div>
              <div class="step-content">
                <h3>合同签订</h3>
                <p>确认方案后签订服务合同</p>
              </div>
            </div>
            <div class="process-step">
              <div class="step-number">04</div>
              <div class="step-content">
                <h3>服务执行</h3>
                <p>按照合同执行物流服务</p>
              </div>
            </div>
            <div class="process-step">
              <div class="step-number">05</div>
              <div class="step-content">
                <h3>全程跟踪</h3>
                <p>实时跟踪货物状态，及时反馈</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 联系我们 -->
      <section class="contact-section">
        <div class="container">
          <div class="contact-content">
            <h2>需要定制化服务？</h2>
            <p>我们的专业团队将为您提供最适合的解决方案</p>
            <el-button type="primary" size="large" @click="$router.push('/contact')">
              立即咨询
            </el-button>
          </div>
        </div>
      </section>
    </main>

    <!-- 底部 -->
    <Footer />
  </div>
</template>

<script setup>
import Header from '@/components/Header.vue'
import Footer from '@/components/Footer.vue'
import { Location, Monitor, Document, Van } from '@element-plus/icons-vue'
</script>

<style scoped>
.products {
  min-height: 100vh;
}

.main-content {
  margin-top: 70px;
}

/* 页面标题 */
.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 60px 0;
  text-align: center;
}

.page-title {
  font-size: 48px;
  font-weight: bold;
  margin-bottom: 20px;
}

.page-subtitle {
  font-size: 18px;
  opacity: 0.9;
}

/* 产品列表 */
.products-section {
  padding: 80px 0;
  background: white;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 40px;
}

.product-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.product-image {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 40px;
  text-align: center;
}

.product-content {
  padding: 30px;
}

.product-content h3 {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 15px;
  color: #303133;
}

.product-description {
  color: #606266;
  line-height: 1.6;
  margin-bottom: 20px;
}

.product-features {
  list-style: none;
  padding: 0;
}

.product-features li {
  padding: 8px 0;
  color: #606266;
  position: relative;
  padding-left: 20px;
}

.product-features li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: #409eff;
  font-weight: bold;
}

/* 服务流程 */
.process-section {
  padding: 80px 0;
  background: #f8f9fa;
}

.section-title {
  text-align: center;
  font-size: 36px;
  font-weight: bold;
  margin-bottom: 60px;
  color: #303133;
}

.process-steps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 30px;
}

.process-step {
  text-align: center;
  padding: 30px 20px;
}

.step-number {
  width: 60px;
  height: 60px;
  background: #409eff;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
  margin: 0 auto 20px;
}

.step-content h3 {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 10px;
  color: #303133;
}

.step-content p {
  color: #606266;
  line-height: 1.6;
}

/* 联系我们 */
.contact-section {
  padding: 60px 0;
  background: #2c3e50;
  color: white;
  text-align: center;
}

.contact-content h2 {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 20px;
}

.contact-content p {
  font-size: 18px;
  margin-bottom: 30px;
  opacity: 0.9;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-title {
    font-size: 32px;
  }

  .products-grid {
    grid-template-columns: 1fr;
  }

  .process-steps {
    grid-template-columns: 1fr;
  }

  .product-card {
    margin-bottom: 20px;
  }
}
</style>
