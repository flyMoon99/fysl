<template>
  <footer class="footer">
    <div class="container">
      <div class="footer-content">
        <!-- 公司信息 -->
        <div class="footer-section">
          <h3>福佑丝路</h3>
          <p>专业的跨境物流TMS系统提供商</p>
          <p>提供国际版便携式GPS定位器，实时追踪货物轨迹</p>
        </div>

        <!-- 产品服务 -->
        <div class="footer-section">
          <h4>产品服务</h4>
          <ul>
            <li>GPS定位器</li>
            <li>跨境物流TMS</li>
            <li>报关服务</li>
            <li>货物承运</li>
          </ul>
        </div>

        <!-- 联系方式 -->
        <div class="footer-section">
          <h4>联系我们</h4>
          <ul>
            <li>
              <el-icon><Location /></el-icon>
              地址：深圳市南山区科技园
            </li>
            <li>
              <el-icon><Phone /></el-icon>
              电话：400-888-8888
            </li>
            <li>
              <el-icon><Message /></el-icon>
              邮箱：info@fuyousilu.com
            </li>
          </ul>
        </div>

        <!-- 快速链接 -->
        <div class="footer-section">
          <h4>快速链接</h4>
          <ul>
            <li><router-link to="/">首页</router-link></li>
            <li><router-link to="/products">产品服务</router-link></li>
            <li><router-link to="/about">关于我们</router-link></li>
            <li><router-link to="/contact">联系我们</router-link></li>
          </ul>
        </div>
      </div>

      <!-- 版权信息 -->
      <div class="footer-bottom">
        <p>&copy; 2024 福佑丝路. 保留所有权利.</p>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { Location, Phone, Message } from '@element-plus/icons-vue'
</script>

<style scoped>
.footer {
  background: #2c3e50;
  color: white;
  padding: 40px 0 20px;
  margin-top: 60px;
}

.footer-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 30px;
  margin-bottom: 30px;
}

.footer-section h3 {
  font-size: 20px;
  margin-bottom: 15px;
  color: #409eff;
}

.footer-section h4 {
  font-size: 16px;
  margin-bottom: 15px;
  color: #409eff;
}

.footer-section p {
  margin-bottom: 10px;
  line-height: 1.6;
  color: #bdc3c7;
}

.footer-section ul {
  list-style: none;
  padding: 0;
}

.footer-section ul li {
  margin-bottom: 8px;
  color: #bdc3c7;
  display: flex;
  align-items: center;
  gap: 8px;
}

.footer-section ul li a {
  color: #bdc3c7;
  text-decoration: none;
  transition: color 0.3s ease;
}

.footer-section ul li a:hover {
  color: #409eff;
}

.footer-bottom {
  border-top: 1px solid #34495e;
  padding-top: 20px;
  text-align: center;
}

.footer-bottom p {
  color: #95a5a6;
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .footer-content {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .footer-section {
    text-align: center;
  }
}
</style>
