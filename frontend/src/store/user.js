import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/utils/api'

export const useUserStore = defineStore('user', () => {
  // 状态
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(null)
  const userType = ref('')

  // 计算属性
  const isLoggedIn = computed(() => !!token.value && !!user.value)
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
        } else {
          // Token无效，清除状态
          logout()
        }
      } catch (error) {
        console.error('初始化用户状态失败:', error)
        logout()
      }
    }
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
        localStorage.setItem('token', newToken)
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
    localStorage.removeItem('token')
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
