const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

// 导入配置
const { appConfig, isDevelopment } = require('../shared/config/app');
const { testConnection } = require('../shared/config/database');
const { initializeModels } = require('./src/models');

// 导入路由
const authRoutes = require('./src/routes/auth');
const adminRoutes = require('./src/routes/admin');
const memberRoutes = require('./src/routes/member');
const statsRoutes = require('./src/routes/stats');

const app = express();

// 安全中间件
app.use(helmet());

// CORS配置
app.use(cors(appConfig.cors));

// 请求限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP 15分钟内最多100个请求
  message: '请求过于频繁，请稍后再试'
});
app.use('/api/', limiter);

// 日志中间件
if (isDevelopment) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// 解析JSON请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/member', memberRoutes);
app.use('/api/stats', statsRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: appConfig.env
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: '接口不存在',
    path: req.originalUrl 
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('错误:', err);
  
  const status = err.status || 500;
  const message = err.message || '服务器内部错误';
  
  res.status(status).json({
    error: message,
    ...(isDevelopment && { stack: err.stack })
  });
});

// 启动服务器
const startServer = async () => {
  try {
    // 测试数据库连接
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('数据库连接失败，服务器启动终止');
      process.exit(1);
    }

    // 初始化数据库模型
    const modelsInitialized = await initializeModels();
    if (!modelsInitialized) {
      console.error('数据库模型初始化失败，服务器启动终止');
      process.exit(1);
    }

    const port = appConfig.port;
    app.listen(port, () => {
      console.log(`🚀 福佑丝路后端服务启动成功`);
      console.log(`📍 服务地址: http://localhost:${port}`);
      console.log(`🌍 环境: ${appConfig.env}`);
      console.log(`📊 健康检查: http://localhost:${port}/health`);
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
};

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，正在关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('收到SIGINT信号，正在关闭服务器...');
  process.exit(0);
});

startServer();
