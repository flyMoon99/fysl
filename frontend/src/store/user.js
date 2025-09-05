import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/utils/api'

export const useUserStore = defineStore('user', () => {
  // 状态
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(null)
  const userType = ref(localStorage.getItem('userType') || '') // 从localStorage恢复userType
  const isInitialized = ref(false) // 标记是否已完成初始化

  // 计算属性
  const isLoggedIn = computed(() => {
    // 如果还没初始化且有token，认为是登录状态（等待初始化完成）
    if (!isInitialized.value && token.value) {
      return true
    }
    // 初始化完成后，需要同时有token和user信息
    return !!token.value && !!user.value
  })
  const isMember = computed(() => userType.value === 'member')
  const isAdmin = computed(() => userType.value === 'admin')

  // 初始化用户状态
  const initUser = async () => {
    if (token.value && !user.value) {
      try {
        const response = await api.get('/auth/user-info')
        // 后端返回格式: { message: "获取成功", data: { user } }
        if (response.data.message && response.data.data) {
          user.value = response.data.data.user
          userType.value = response.data.data.user.type
          localStorage.setItem('userType', response.data.data.user.type) // 保存userType到localStorage
        } else {
          // Token无效，清除状态
          console.warn('获取用户信息失败，响应格式不正确:', response.data)
          logout()
        }
      } catch (error) {
        console.error('初始化用户状态失败:', error)
        // 只有在确实是401错误时才退出，其他网络错误不退出
        if (error.response && error.response.status === 401) {
          logout()
        } else {
          console.warn('网络错误，保持登录状态')
        }
      }
    }
    // 标记初始化完成
    isInitialized.value = true
  }

  // 会员登录
  const memberLogin = async (credentials) => {
    try {
      const response = await api.post('/member/login', credentials)
      // 后端返回格式: { message: "登录成功", data: { token, member } }
      if (response.data.message === '登录成功') {
        const { token: newToken, member } = response.data.data
        token.value = newToken
        user.value = member
        userType.value = 'member'
        isInitialized.value = true // 登录成功后标记为已初始化
        localStorage.setItem('token', newToken)
        localStorage.setItem('userType', 'member') // 保存userType到localStorage
        return { success: true }
      } else {
        return { success: false, message: response.data.error }
      }
    } catch (error) {
      console.error('会员登录失败:', error)
      return { 
        success: false, 
        message: error.response?.data?.error || '登录失败，请稍后重试' 
      }
    }
  }

  // 会员注册
  const memberRegister = async (userData) => {
    try {
      const response = await api.post('/member/register', userData)
      if (response.data.message) {
        return { success: true, message: response.data.message }
      } else {
        return { success: false, message: response.data.error }
      }
    } catch (error) {
      console.error('会员注册失败:', error)
      return { 
        success: false, 
        message: error.response?.data?.error || '注册失败，请稍后重试' 
      }
    }
  }

  // 登出
  const logout = () => {
    token.value = ''
    user.value = null
    userType.value = ''
    isInitialized.value = false
    localStorage.removeItem('token')
    localStorage.removeItem('userType')
  }

  // 更新用户信息
  const updateUserInfo = (newUserInfo) => {
    user.value = { ...user.value, ...newUserInfo }
  }

  return {
    // 状态
    token,
    user,
    userType,
    isInitialized,
    
    // 计算属性
    isLoggedIn,
    isMember,
    isAdmin,
    
    // 方法
    initUser,
    memberLogin,
    memberRegister,
    logout,
    updateUserInfo
  }
})
