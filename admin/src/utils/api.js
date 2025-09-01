import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          ElMessage.error('登录已过期，请重新登录')
          localStorage.removeItem('admin_token')
          window.location.href = '/admin/login'
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
          ElMessage.error(data.error || '请求失败')
      }
    } else {
      ElMessage.error('网络错误，请检查网络连接')
    }
    return Promise.reject(error)
  }
)

// 管理员API
export const adminAPI = {
  // 管理员登录
  login: (credentials) => api.post('/admin/login', credentials),
  
  // 获取当前管理员信息
  getCurrentAdmin: () => api.get('/admin/me'),
  
  // 获取管理员列表
  getAdminList: (params) => api.get('/admin/list', { params }),
  
  // 创建管理员
  createAdmin: (data) => api.post('/admin/create', data),
  
  // 更新管理员
  updateAdmin: (id, data) => api.put(`/admin/${id}`, data),
  
  // 删除管理员
  deleteAdmin: (id) => api.delete(`/admin/${id}`),
  
  // 获取管理员详情
  getAdminDetail: (id) => api.get(`/admin/${id}`)
}

// 会员API
export const memberAPI = {
  // 获取会员列表
  getMemberList: (params) => api.get('/member/list', { params }),
  
  // 创建会员
  createMember: (data) => api.post('/member/create', data),
  
  // 更新会员
  updateMember: (id, data) => api.put(`/member/${id}`, data),
  
  // 删除会员
  deleteMember: (id) => api.delete(`/member/${id}`),
  
  // 获取会员详情
  getMemberDetail: (id) => api.get(`/member/${id}`),
  
  // 获取会员登录历史
  getMemberLoginHistory: (id, params) => api.get(`/member/${id}/login-history`, { params })
}

// 统计API
export const statsAPI = {
  // 获取系统统计信息
  getSystemStats: () => api.get('/stats/system'),
  
  // 获取会员统计信息
  getMemberStats: () => api.get('/stats/members'),
  
  // 获取登录统计信息
  getLoginStats: (params) => api.get('/stats/logins', { params })
}

export default api
