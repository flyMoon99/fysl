<template>
  <div class="about-page">
    <!-- 头部导航 -->
    <Header />
    
    <!-- 主要内容 -->
    <div class="main-content">
      <!-- 页面标题 -->
      <div class="page-header">
        <div class="container">
          <h1>关于我们</h1>
          <p>专业的跨境物流解决方案提供商</p>
        </div>
      </div>
      
      <!-- 公司介绍 -->
      <section class="company-intro">
        <div class="container">
          <div class="intro-content">
            <div class="intro-text">
              <h2>福佑丝路</h2>
              <p>福佑丝路是一家专注于跨境物流的科技公司，致力于为客户提供高效、安全、便捷的物流解决方案。我们通过先进的技术手段和专业的服务团队，为全球贸易提供强有力的支持。</p>
              <p>自成立以来，我们始终坚持"客户至上、服务第一"的理念，不断创新和完善我们的服务体系，为客户创造更大的价值。</p>
            </div>
            <div class="intro-image">
              <div class="image-placeholder">
                <el-icon size="64" color="#409eff"><OfficeBuilding /></el-icon>
                <p>公司大楼</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <!-- 核心优势 -->
      <section class="advantages">
        <div class="container">
          <h2 class="section-title">核心优势</h2>
          <div class="advantages-grid">
            <div class="advantage-card">
              <div class="advantage-icon">
                <el-icon size="48" color="#409eff"><Connection /></el-icon>
              </div>
              <h3>全球网络</h3>
              <p>覆盖全球主要贸易国家和地区，为客户提供全方位的物流服务</p>
            </div>
            
            <div class="advantage-card">
              <div class="advantage-icon">
                <el-icon size="48" color="#67c23a"><Monitor /></el-icon>
              </div>
              <h3>智能系统</h3>
              <p>采用先进的TMS系统和GPS定位技术，实现全程可视化管理</p>
            </div>
            
            <div class="advantage-card">
              <div class="advantage-icon">
                <el-icon size="48" color="#e6a23c"><Service /></el-icon>
              </div>
              <h3>专业服务</h3>
              <p>拥有经验丰富的专业团队，为客户提供个性化的解决方案</p>
            </div>
            
            <div class="advantage-card">
              <div class="advantage-icon">
                <el-icon size="48" color="#f56c6c"><Shield /></el-icon>
              </div>
              <h3>安全保障</h3>
              <p>严格的安全标准和保险体系，确保货物运输安全可靠</p>
            </div>
          </div>
        </div>
      </section>
      
      <!-- 发展历程 -->
      <section class="history">
        <div class="container">
          <h2 class="section-title">发展历程</h2>
          <div class="timeline">
            <div class="timeline-item">
              <div class="timeline-year">2020</div>
              <div class="timeline-content">
                <h3>公司成立</h3>
                <p>福佑丝路正式成立，开始专注于跨境物流服务</p>
              </div>
            </div>
            
            <div class="timeline-item">
              <div class="timeline-year">2021</div>
              <div class="timeline-content">
                <h3>技术升级</h3>
                <p>推出自主研发的TMS系统，提升物流管理效率</p>
              </div>
            </div>
            
            <div class="timeline-item">
              <div class="timeline-year">2022</div>
              <div class="timeline-content">
                <h3>业务扩展</h3>
                <p>服务网络扩展至欧洲、北美等主要市场</p>
              </div>
            </div>
            
            <div class="timeline-item">
              <div class="timeline-year">2023</div>
              <div class="timeline-content">
                <h3>数字化转型</h3>
                <p>全面推进数字化转型，为客户提供更智能的服务</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <!-- 联系我们 -->
      <section class="contact-section">
        <div class="container">
          <h2 class="section-title">联系我们</h2>
          <div class="contact-info">
            <div class="contact-item">
              <el-icon size="24" color="#409eff"><Location /></el-icon>
              <div>
                <h3>地址</h3>
                <p>深圳市南山区科技园南区</p>
              </div>
            </div>
            
            <div class="contact-item">
              <el-icon size="24" color="#409eff"><Phone /></el-icon>
              <div>
                <h3>电话</h3>
                <p>400-888-8888</p>
              </div>
            </div>
            
            <div class="contact-item">
              <el-icon size="24" color="#409eff"><Message /></el-icon>
              <div>
                <h3>邮箱</h3>
                <p>info@fuyousilu.com</p>
              </div>
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
import Header from '@/components/Header.vue'
import Footer from '@/components/Footer.vue'
import { 
  OfficeBuilding, 
  Connection, 
  Monitor, 
  Service, 
  Shield, 
  Location, 
  Phone, 
  Message 
} from '@element-plus/icons-vue'
</script>

<style scoped>
.about-page {
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

/* 公司介绍 */
.company-intro {
  padding: 80px 0;
  background: white;
}

.intro-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;
}

.intro-text h2 {
  font-size: 36px;
  font-weight: bold;
  color: #303133;
  margin: 0 0 24px 0;
}

.intro-text p {
  font-size: 16px;
  line-height: 1.8;
  color: #606266;
  margin: 0 0 20px 0;
}

.intro-image {
  display: flex;
  justify-content: center;
  align-items: center;
}

.image-placeholder {
  background: #f5f7fa;
  border-radius: 12px;
  padding: 60px;
  text-align: center;
  width: 100%;
  max-width: 300px;
}

.image-placeholder p {
  margin: 16px 0 0 0;
  color: #909399;
  font-size: 14px;
}

/* 核心优势 */
.advantages {
  padding: 80px 0;
  background: #f5f7fa;
}

.section-title {
  font-size: 36px;
  font-weight: bold;
  text-align: center;
  color: #303133;
  margin: 0 0 60px 0;
}

.advantages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 30px;
}

.advantage-card {
  background: white;
  border-radius: 12px;
  padding: 40px 30px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.advantage-card:hover {
  transform: translateY(-5px);
}

.advantage-icon {
  margin-bottom: 20px;
}

.advantage-card h3 {
  font-size: 20px;
  font-weight: bold;
  color: #303133;
  margin: 0 0 16px 0;
}

.advantage-card p {
  font-size: 14px;
  line-height: 1.6;
  color: #606266;
  margin: 0;
}

/* 发展历程 */
.history {
  padding: 80px 0;
  background: white;
}

.timeline {
  position: relative;
  max-width: 800px;
  margin: 0 auto;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #e4e7ed;
  transform: translateX(-50%);
}

.timeline-item {
  position: relative;
  margin-bottom: 40px;
  display: flex;
  align-items: center;
}

.timeline-item:nth-child(odd) {
  flex-direction: row;
}

.timeline-item:nth-child(even) {
  flex-direction: row-reverse;
}

.timeline-year {
  background: #409eff;
  color: white;
  padding: 12px 24px;
  border-radius: 20px;
  font-weight: bold;
  font-size: 16px;
  min-width: 100px;
  text-align: center;
  position: relative;
  z-index: 1;
}

.timeline-content {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin: 0 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  flex: 1;
}

.timeline-content h3 {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
  margin: 0 0 8px 0;
}

.timeline-content p {
  font-size: 14px;
  color: #606266;
  margin: 0;
  line-height: 1.6;
}

/* 联系我们 */
.contact-section {
  padding: 80px 0;
  background: #f5f7fa;
}

.contact-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  max-width: 900px;
  margin: 0 auto;
}

.contact-item {
  background: white;
  border-radius: 12px;
  padding: 30px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.contact-item h3 {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
  margin: 0 0 8px 0;
}

.contact-item p {
  font-size: 14px;
  color: #606266;
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header h1 {
    font-size: 32px;
  }
  
  .page-header p {
    font-size: 16px;
  }
  
  .intro-content {
    grid-template-columns: 1fr;
    gap: 40px;
  }
  
  .intro-text h2 {
    font-size: 28px;
  }
  
  .section-title {
    font-size: 28px;
  }
  
  .timeline::before {
    left: 20px;
  }
  
  .timeline-item {
    flex-direction: row !important;
  }
  
  .timeline-year {
    min-width: 80px;
    font-size: 14px;
    padding: 8px 16px;
  }
  
  .timeline-content {
    margin-left: 50px;
    margin-right: 0;
  }
  
  .contact-info {
    grid-template-columns: 1fr;
  }
}
</style>
