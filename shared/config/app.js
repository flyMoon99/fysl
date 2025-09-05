require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

// 应用配置
const appConfig = {
  // 环境配置
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  
  // 前端配置
  frontend: {
    port: 8080,
    apiBaseUrl: process.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
    adminApiBaseUrl: process.env.VITE_ADMIN_API_BASE_URL || 'http://localhost:3000/admin'
  },
  
  // 管理后台配置
  admin: {
    port: 8081
  },
  
  // 日志配置
  log: {
    level: process.env.LOG_LEVEL || 'debug'
  },
  
  // CORS配置
  cors: {
    origin: ['http://localhost:8080', 'http://localhost:8081'],
    credentials: true
  },
  
  // 文件上传配置
  upload: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif']
  },
  
  // GPS第三方API配置
  gps: {
    baseURL: process.env.GPS_API_BASE_URL || 'https://openapi.51hbt.com/',
    appKey: process.env.GPS_API_APP_KEY || 'fyougps',
    appSecret: process.env.GPS_API_APP_SECRET || 'P448F2Z008D8LP20H82B',
    timeout: parseInt(process.env.GPS_API_TIMEOUT) || 30000
  },
  
  // 百度地图API配置
  baiduMap: {
    apiKey: process.env.BAIDU_MAP_API_KEY || '',
    version: '3.0', // 百度地图API版本
    plugins: ['TrackAnimation', 'MarkerClusterer'], // 需要的插件
    enableHighResolution: true, // 启用高分辨率
    enableAutoResize: true, // 启用自动调整大小
    enableMapClick: true // 启用地图点击事件
  },
  
  // 百度地图逆向地理编码API配置
  baidu: {
    ak: process.env.BAIDU_MAP_AK || process.env.BAIDU_MAP_API_KEY || '', // 优先使用BAIDU_MAP_AK，兼容BAIDU_MAP_API_KEY
    timeout: parseInt(process.env.BAIDU_GEOCODING_TIMEOUT) || 10000
  }
};

// 开发环境配置
const isDevelopment = appConfig.env === 'development';
const isProduction = appConfig.env === 'production';

module.exports = {
  appConfig,
  isDevelopment,
  isProduction
};
