import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue')
  },
  {
    path: '/agent',
    name: 'Agent',
    component: () => import('@/views/AgentTest.vue')
  },
  {
    path: '/chat',
    name: 'Chat',
    component: () => import('@/views/ChatTest.vue')
  },
  {
    path: '/multi-agent',
    name: 'MultiAgent',
    component: () => import('@/views/MultiAgentTest.vue')
  },
  {
    path: '/advanced',
    name: 'Advanced',
    component: () => import('@/views/AdvancedFeaturesTest.vue')
  },
  {
    path: '/dify',
    name: 'Dify',
    component: () => import('@/views/DifyTest.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router

