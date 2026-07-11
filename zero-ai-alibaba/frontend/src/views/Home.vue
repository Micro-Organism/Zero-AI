<template>
  <div class="home-container">
    <a-card class="welcome-card">
      <template #title>
        <h1>欢迎使用 Zero AI Alibaba 测试平台</h1>
      </template>
      <p class="description">
        这是一个基于 Spring AI Alibaba 框架的智能体测试平台，您可以通过以下模块进行功能测试。
      </p>
    </a-card>

    <a-row :gutter="[24, 24]" class="module-list">
      <a-col :xs="24" :sm="12" :md="8" :lg="8">
        <a-card
          hoverable
          class="module-card"
          @click="goToAgent"
        >
          <template #cover>
            <div class="module-icon agent">
              <RobotOutlined :style="{ fontSize: '48px', color: '#1890ff' }" />
            </div>
          </template>
          <a-card-meta>
            <template #title>
              <h3>Agent 测试</h3>
            </template>
            <template #description>
              <p>测试天气预报智能体，支持工具调用和上下文记忆</p>
            </template>
          </a-card-meta>
        </a-card>
      </a-col>

      <a-col :xs="24" :sm="12" :md="8" :lg="8">
        <a-card
          hoverable
          class="module-card chat"
          @click="goToChat"
        >
          <template #cover>
            <div class="module-icon chat">
              <MessageOutlined :style="{ fontSize: '48px', color: '#52c41a' }" />
            </div>
          </template>
          <a-card-meta>
            <template #title>
              <h3>简单对话（ChatClient）</h3>
            </template>
            <template #description>
              <p>基于 ChatClient 的简单流式对话，支持对话记忆</p>
            </template>
          </a-card-meta>
        </a-card>
      </a-col>

      <a-col :xs="24" :sm="12" :md="8" :lg="8">
        <a-card
          hoverable
          class="module-card multi-agent"
          @click="goToMultiAgent"
        >
          <template #cover>
            <div class="module-icon multi-agent">
              <TeamOutlined :style="{ fontSize: '48px', color: '#722ed1' }" />
            </div>
          </template>
          <a-card-meta>
            <template #title>
              <h3>多智能体测试</h3>
            </template>
            <template #description>
              <p>测试三种多智能体模式：监督者、顺序执行、工具调用</p>
            </template>
          </a-card-meta>
        </a-card>
      </a-col>

      <a-col :xs="24" :sm="12" :md="8" :lg="8">
        <a-card
          hoverable
          class="module-card advanced"
          @click="goToAdvanced"
        >
          <template #cover>
            <div class="module-icon advanced">
              <ThunderboltOutlined :style="{ fontSize: '48px', color: '#fa8c16' }" />
            </div>
          </template>
          <a-card-meta>
            <template #title>
              <h3>高级功能测试</h3>
            </template>
            <template #description>
              <p>对话记忆、Graph工作流、RAG、MCP、多模态等功能测试</p>
            </template>
          </a-card-meta>
        </a-card>
      </a-col>

      <a-col :xs="24" :sm="12" :md="8" :lg="8">
        <a-card
          hoverable
          class="module-card dify"
          @click="goToDify"
        >
          <template #cover>
            <div class="module-icon dify">
              <ApiOutlined :style="{ fontSize: '48px', color: '#13c2c2' }" />
            </div>
          </template>
          <a-card-meta>
            <template #title>
              <h3>Dify 集成测试</h3>
            </template>
            <template #description>
              <p>调用Dify工具、对话、工作流，支持包含Python脚本的MCP工具</p>
            </template>
          </a-card-meta>
        </a-card>
      </a-col>
    </a-row>

    <a-card class="info-card" title="使用说明">
      <a-list>
        <a-list-item>
          <a-list-item-meta>
            <template #title>Agent 测试</template>
            <template #description>
              点击 "Agent 测试" 卡片进入测试页面，您可以与天气预报智能体进行对话。
              智能体支持查询天气、获取用户位置等功能。
            </template>
          </a-list-item-meta>
        </a-list-item>
        <a-list-item>
          <a-list-item-meta>
            <template #title>对话记忆</template>
            <template #description>
              每次对话会生成一个 threadId，使用相同的 threadId 可以保持对话上下文。
            </template>
          </a-list-item-meta>
        </a-list-item>
        <a-list-item>
          <a-list-item-meta>
            <template #title>工具调用</template>
            <template #description>
              智能体可以自动调用工具（如天气查询、位置获取）来回答您的问题。
            </template>
          </a-list-item-meta>
        </a-list-item>
      </a-list>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { RobotOutlined, MessageOutlined, TeamOutlined, ThunderboltOutlined, ApiOutlined } from '@ant-design/icons-vue'

const router = useRouter()

const goToAgent = () => {
  router.push('/agent')
}

const goToChat = () => {
  router.push('/chat')
}

const goToMultiAgent = () => {
  router.push('/multi-agent')
}

const goToAdvanced = () => {
  router.push('/advanced')
}

const goToDify = () => {
  router.push('/dify')
}
</script>

<style scoped>
.home-container {
  max-width: 1200px;
  margin: 0 auto;
}

.welcome-card {
  margin-bottom: 24px;
  text-align: center;
}

.welcome-card h1 {
  margin: 0;
  font-size: 28px;
  color: #1890ff;
}

.description {
  font-size: 16px;
  color: #666;
  margin-top: 16px;
}

.module-list {
  margin-bottom: 24px;
}

.module-card {
  cursor: pointer;
  transition: all 0.3s;
  height: 100%;
}

.module-card:hover:not(.disabled) {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.module-card.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.module-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 120px;
  background: #f5f5f5;
}

.module-icon.agent {
  background: linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%);
}

.module-icon.chat {
  background: linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%);
}

.module-icon.multi-agent {
  background: linear-gradient(135deg, #f9f0ff 0%, #efdbff 100%);
}

.module-icon.advanced {
  background: linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%);
}

.module-icon.dify {
  background: linear-gradient(135deg, #e6fffb 0%, #b5f5ec 100%);
}

.module-card h3 {
  margin: 0;
  font-size: 18px;
}

.info-card {
  margin-top: 24px;
}
</style>

