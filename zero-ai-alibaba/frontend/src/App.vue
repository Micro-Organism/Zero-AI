<template>
  <a-layout class="layout">
    <a-layout-header class="header">
      <div class="logo">
        <span>Zero AI Alibaba</span>
      </div>
      <a-menu
        v-model:selectedKeys="selectedKeys"
        mode="horizontal"
        theme="dark"
        :style="{ lineHeight: '64px' }"
        @click="handleMenuClick"
      >
        <a-menu-item key="home">
          <template #icon>
            <HomeOutlined />
          </template>
          首页
        </a-menu-item>
        <a-menu-item key="agent">
          <template #icon>
            <RobotOutlined />
          </template>
          Agent 测试
        </a-menu-item>
      </a-menu>
    </a-layout-header>
    <a-layout-content class="content">
      <router-view />
    </a-layout-content>
    <a-layout-footer class="footer">
      Zero AI Alibaba ©2025
    </a-layout-footer>
  </a-layout>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { HomeOutlined, RobotOutlined } from '@ant-design/icons-vue'

const router = useRouter()
const route = useRoute()
const selectedKeys = ref<string[]>(['home'])

const handleMenuClick = ({ key }: { key: string }) => {
  if (key === 'home') {
    router.push('/')
  } else if (key === 'agent') {
    router.push('/agent')
  }
}

watch(
  () => route.path,
  (path) => {
    if (path === '/') {
      selectedKeys.value = ['home']
    } else if (path.startsWith('/agent')) {
      selectedKeys.value = ['agent']
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.layout {
  min-height: 100vh;
}

.header {
  display: flex;
  align-items: center;
  padding: 0 24px;
  background: #001529;
}

.logo {
  color: #fff;
  font-size: 20px;
  font-weight: bold;
  margin-right: 40px;
}

.content {
  padding: 24px;
  background: #f0f2f5;
  min-height: calc(100vh - 64px - 70px);
}

.footer {
  text-align: center;
  background: #fff;
}
</style>

