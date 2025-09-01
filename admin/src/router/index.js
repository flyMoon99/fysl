import { createRouter, createWebHistory } from 'vue-router'
import { useAdminStore } from '@/store/admin'
import { ElMessage } from 'element-plus'

const routes = [
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/admin',
    name: 'AdminLayout',
    component: () => import('@/views/Layout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'AdminDashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '仪表盘' }
      },
      {
        path: 'admins',
        name: 'AdminManagement',
        component: () => import('@/views/admin/AdminManagement.vue'),
        meta: { title: '管理员管理', requiresSuperAdmin: true }
      },
      {
        path: 'members',
        name: 'MemberManagement',
        component: () => import('@/views/member/MemberManagement.vue'),
        meta: { title: '会员管理' }
      },
      {
        path: 'stats',
        name: 'Statistics',
        component: () => import('@/views/Statistics.vue'),
        meta: { title: '统计分析' }
      }
    ]
  },
  {
    path: '/admin/:pathMatch(.*)*',
    redirect: '/admin'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const adminStore = useAdminStore()
  
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 福佑丝路管理后台`
  }
  
  // 检查是否需要认证
  if (to.meta.requiresAuth !== false) {
    if (!adminStore.isLoggedIn) {
      next('/admin/login')
      return
    }
    
    // 如果有token但没有管理员信息，等待初始化完成
    if (adminStore.token && !adminStore.admin && !adminStore.isInitializing) {
      try {
        await adminStore.initAdmin()
      } catch (error) {
        next('/admin/login')
        return
      }
    }
    
    // 如果正在初始化，等待一下
    if (adminStore.isInitializing) {
      // 简单等待初始化完成
      let attempts = 0
      while (adminStore.isInitializing && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100))
        attempts++
      }
      
      if (adminStore.isInitializing) {
        next('/admin/login')
        return
      }
    }
    
    // 检查超级管理员权限
    if (to.meta.requiresSuperAdmin && !adminStore.isSuperAdmin) {
      ElMessage.error('权限不足，需要超级管理员权限')
      next('/admin')
      return
    }
  }
  
  // 如果已登录且访问登录页，重定向到首页
  if (to.path === '/admin/login' && adminStore.isLoggedIn) {
    next('/admin')
    return
  }
  
  next()
})

export default router
