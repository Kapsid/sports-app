import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { guest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/RegisterView.vue'),
    meta: { guest: true }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/DashboardView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/world/:id',
    name: 'WorldDashboard',
    component: () => import('../views/WorldDashboardView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/world/:worldId/sport/ski-jumping',
    name: 'SkiJumping',
    component: () => import('../views/SkiJumpingView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/world/:worldId/sport/biathlon',
    name: 'Biathlon',
    component: () => import('../views/BiathlonView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/world/:worldId/sport/cross-country',
    name: 'CrossCountry',
    component: () => import('../views/CrossCountryView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/world/:worldId/sport/alpine-skiing',
    name: 'AlpineSkiing',
    component: () => import('../views/AlpineView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/world/:worldId/sport/nordic-combined',
    name: 'NordicCombined',
    component: () => import('../views/NordicCombinedView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/world/:worldId/sport/bobsleigh',
    name: 'Bobsleigh',
    component: () => import('../views/BobsleighView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/world/:worldId/sport/speed-skating',
    name: 'SpeedSkating',
    component: () => import('../views/SpeedSkatingView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/world/:worldId/sport/luge',
    name: 'Luge',
    component: () => import('../views/LugeView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/world/:worldId/sport/skeleton',
    name: 'Skeleton',
    component: () => import('../views/SkeletonView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/world/:worldId/sport/:sportId',
    name: 'Sport',
    component: () => import('../views/SportView.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')

  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else if (to.meta.guest && token) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
