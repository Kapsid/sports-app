import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/',
    redirect: '/modules'
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
    path: '/modules',
    name: 'ModuleSelection',
    component: () => import('../views/ModuleSelectionView.vue'),
    meta: { requiresAuth: true }
  },
  // Winter Sports (legacy /dashboard path kept as alias)
  {
    path: '/dashboard',
    redirect: '/winter-sports'
  },
  {
    path: '/winter-sports',
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
  },
  // Tennis
  {
    path: '/tennis',
    name: 'TennisDashboard',
    component: () => import('../views/TennisDashboardView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/tennis/world/:id',
    name: 'TennisWorld',
    component: () => import('../views/TennisWorldView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/tennis/world/:worldId/player/:playerId',
    name: 'TennisPlayer',
    component: () => import('../views/TennisPlayerView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/tennis/world/:worldId/event/:eventId',
    name: 'TennisEvent',
    component: () => import('../views/TennisEventView.vue'),
    meta: { requiresAuth: true }
  },
  // Handball
  {
    path: '/handball',
    name: 'HandballDashboard',
    component: () => import('../views/HandballDashboardView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/handball/league/:id',
    name: 'HandballLeague',
    component: () => import('../views/HandballLeagueView.vue'),
    meta: { requiresAuth: true }
  },
  // Ice Hockey
  {
    path: '/hockey',
    name: 'HockeyDashboard',
    component: () => import('../views/HockeyDashboardView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/hockey/world/:id',
    name: 'HockeyWorld',
    component: () => import('../views/HockeyWorldView.vue'),
    meta: { requiresAuth: true }
  },
  // MMA
  {
    path: '/mma',
    name: 'MMADashboard',
    component: () => import('../views/MMADashboardView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/mma/org/:id',
    name: 'MMAOrganization',
    component: () => import('../views/MMAOrganizationView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/mma/org/:orgId/fighter/:fighterId',
    name: 'MMAFighter',
    component: () => import('../views/MMAFighterView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/mma/org/:orgId/event/:eventId',
    name: 'MMAEvent',
    component: () => import('../views/MMAEventView.vue'),
    meta: { requiresAuth: true }
  },
  // Golf
  {
    path: '/golf',
    name: 'GolfDashboard',
    component: () => import('../views/GolfDashboardView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/golf/world/:id',
    name: 'GolfWorld',
    component: () => import('../views/GolfWorldView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/golf/world/:worldId/event/:eventId',
    name: 'GolfEvent',
    component: () => import('../views/GolfEventView.vue'),
    meta: { requiresAuth: true }
  },
  // Name Database
  {
    path: '/name-database',
    name: 'NameDatabase',
    component: () => import('../views/SportsmenView.vue'),
    meta: { requiresAuth: true }
  },
  // Summer Sports
  {
    path: '/summer-sports',
    name: 'SummerSportsDashboard',
    component: () => import('../views/SummerSportsDashboardView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/summer-sports/world/:id',
    name: 'SummerSportsWorld',
    component: () => import('../views/SummerSportsWorldView.vue'),
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
    next('/modules')
  } else {
    next()
  }
})

export default router
