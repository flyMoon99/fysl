import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/user'

// 路由配置
const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: {
      title: '首页 - 福佑丝路',
      requiresAuth: false
    }
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('@/views/About.vue'),
    meta: {
      title: '关于我们 - 福佑丝路',
      requiresAuth: false
    }
  },
  {
    path: '/products',
    name: 'Products',
    component: () => import('@/views/Products.vue'),
    meta: {
      title: '产品服务 - 福佑丝路',
      requiresAuth: false
    }
  },
  {
    path: '/contact',
    name: 'Contact',
    component: () => import('@/views/Contact.vue'),
    meta: {
      title: '联系我们 - 福佑丝路',
      requiresAuth: false
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: {
      title: '会员登录 - 福佑丝路',
      requiresAuth: false
    }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: {
      title: '会员注册 - 福佑丝路',
      requiresAuth: false
    }
  },
  {
    path: '/member',
    name: 'MemberCenter',
    component: () => import('@/views/member/MemberCenter.vue'),
    meta: {
      title: '会员中心 - 福佑丝路',
      requiresAuth: true,
      userType: 'member'
    },
    children: [
      {
        path: '',
        name: 'MemberDashboard',
        component: () => import('@/views/member/Dashboard.vue'),
        meta: {
          title: '会员中心 - 福佑丝路'
        }
      },
      {
        path: 'profile',
        name: 'MemberProfile',
        component: () => import('@/views/member/Profile.vue'),
        meta: {
          title: '个人信息 - 会员中心'
        }
      },
      {
        path: 'password',
        name: 'MemberPassword',
        component: () => import('@/views/member/Password.vue'),
        meta: {
          title: '修改密码 - 会员中心'
        }
      },
      {
        path: 'login-history',
        name: 'MemberLoginHistory',
        component: () => import('@/views/member/LoginHistory.vue'),
        meta: {
          title: '登录历史 - 会员中心'
        }
      },
      {
        path: 'devices',
        name: 'MemberDeviceList',
        component: () => import('@/views/member/DeviceList.vue'),
        meta: {
          title: '设备列表 - 会员中心'
        }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: {
      title: '页面未找到 - 福佑丝路'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  // 设置页面标题
  if (to.meta.title) {
    document.title = to.meta.title
  }
  
  // 检查是否需要认证
  if (to.meta.requiresAuth) {
    if (!userStore.isLoggedIn) {
      // 未登录，跳转到登录页
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
      return
    }
    
    // 检查用户类型权限
    if (to.meta.userType && userStore.userType !== to.meta.userType) {
      // 用户类型不匹配，跳转到首页
      next('/')
      return
    }
  }
  
  // 如果已登录且访问登录页，跳转到会员中心
  if (to.path === '/login' && userStore.isLoggedIn && userStore.userType === 'member') {
    next('/member')
    return
  }
  
  next()
})

export default router
