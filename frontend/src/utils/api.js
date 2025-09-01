import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/user'

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    
    // 添加认证token
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    
    return config
  },
  (error) => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    // 直接返回响应数据
    return response
  },
  (error) => {
    const userStore = useUserStore()
    
    if (error.response) {
      const { status, data, config } = error.response
      
      switch (status) {
        case 401:
          // 检查是否是登录接口的401错误，如果是则不触发自动登出
          const isLoginEndpoint = config.url && (
            config.url.includes('/member/login') || 
            config.url.includes('/admin/login')
          )
          
          if (!isLoginEndpoint) {
            // 未授权，清除用户状态并跳转到登录页
            userStore.logout()
            ElMessage.error('登录已过期，请重新登录')
            window.location.href = '/login'
          }
          break
        case 403:
          ElMessage.error('权限不足')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error('服务器内部错误')
          break
        default:
          ElMessage.error(data?.error || '请求失败')
      }
    } else if (error.request) {
      ElMessage.error('网络连接失败，请检查网络设置')
    } else {
      ElMessage.error('请求配置错误')
    }
    
    return Promise.reject(error)
  }
)

// API方法封装
export const memberAPI = {
  // 会员登录
  login: (credentials) => api.post('/member/login', credentials),
  
  // 会员注册
  register: (userData) => api.post('/member/register', userData),
  
  // 获取会员信息
  getProfile: () => api.get('/member/me'),
  
  // 修改密码
  changePassword: (passwordData) => api.put('/member/change-password', passwordData),
  
  // 更新个人信息
  updateProfile: (profileData) => api.put('/member/profile', profileData),
  
  // 获取登录历史
  getLoginHistory: (params) => api.get('/member/login-history', { params })
}

export const authAPI = {
  // 获取用户信息
  getUserInfo: () => api.get('/auth/user-info'),
  
  // 验证token
  verifyToken: () => api.get('/auth/verify-token'),
  
  // 登出
  logout: () => api.post('/auth/logout')
}

export { api }
