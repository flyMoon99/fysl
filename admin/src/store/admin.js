import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { adminAPI } from '@/utils/api'

export const useAdminStore = defineStore('admin', () => {
  // 状态
  const token = ref(localStorage.getItem('admin_token') || '')
  const admin = ref(null)
  const adminType = ref('')
  const isInitializing = ref(false)

  // 计算属性
  const isLoggedIn = computed(() => !!token.value)
  const isSuperAdmin = computed(() => adminType.value === 'super')
  const isNormalAdmin = computed(() => adminType.value === 'normal')

  // 初始化管理员状态
  const initAdmin = async () => {
    // 防止重复初始化
    if (isInitializing.value) {
      return
    }
    
    if (!token.value) {
      return
    }
    
    // 如果已经有管理员信息，跳过初始化
    if (admin.value) {
      return
    }
    
    isInitializing.value = true
    
    try {
      const response = await adminAPI.getCurrentAdmin()
      // 后端返回格式: { message: "获取当前管理员信息成功", data: { admin: {...} } }
      if (response.data.message && response.data.data && response.data.data.admin) {
        admin.value = response.data.data.admin
        adminType.value = response.data.data.admin.type
      } else {
        logout()
      }
    } catch (error) {
      console.error('初始化管理员信息失败:', error)
      // 如果是401错误，清除token
      if (error.response?.status === 401) {
        logout()
      }
    } finally {
      isInitializing.value = false
    }
  }

  // 管理员登录
  const adminLogin = async (credentials) => {
    try {
      const response = await adminAPI.login(credentials)
      // 后端返回格式: { message: "登录成功", data: { token, admin } }
      if (response.data.message === '登录成功') {
        const { token: newToken, admin: adminData } = response.data.data
        token.value = newToken
        admin.value = adminData
        adminType.value = adminData.type
        localStorage.setItem('admin_token', newToken)
        return true
      } else {
        throw new Error(response.data.error || '登录失败')
      }
    } catch (error) {
      console.error('管理员登录失败:', error)
      throw error
    }
  }

  // 登出
  const logout = () => {
    token.value = ''
    admin.value = null
    adminType.value = ''
    localStorage.removeItem('admin_token')
  }

  // 更新管理员信息
  const updateAdminInfo = (newInfo) => {
    if (admin.value) {
      admin.value = { ...admin.value, ...newInfo }
    }
  }

  return {
    // 状态
    token,
    admin,
    adminType,
    isInitializing,
    
    // 计算属性
    isLoggedIn,
    isSuperAdmin,
    isNormalAdmin,
    
    // 方法
    initAdmin,
    adminLogin,
    logout,
    updateAdminInfo
  }
})
