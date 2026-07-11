<template>
  <div class="multi-agent-test-container">
    <a-card title="多智能体系统测试" class="test-card">
      <a-tabs v-model:activeKey="activeTab" @change="handleTabChange" type="card">
        <!-- 监督者模式 Tab -->
        <a-tab-pane key="supervisor">
          <template #tab>
            <span>
              <TeamOutlined />
              监督者模式
            </span>
          </template>
          <div class="tab-content">
            <div class="mode-header">
              <a-space>
                <a-tag color="blue" :icon="h(TeamOutlined)">当前模式：监督者模式</a-tag>
                <a-tag v-if="chatStates.supervisor.threadId" color="green">
                  Thread ID: {{ chatStates.supervisor.threadId.substring(0, 8) }}...
                </a-tag>
                <a-button size="small" @click="clearChat('supervisor')" :disabled="chatStates.supervisor.loading">
                  <template #icon>
                    <ClearOutlined />
                  </template>
                  清空对话
                </a-button>
                <a-button v-if="chatStates.supervisor.loading" size="small" danger @click="handleCancelStream('supervisor')">
                  <template #icon>
                    <StopOutlined />
                  </template>
                  停止生成
                </a-button>
              </a-space>
            </div>
            <div class="chat-container">
              <div class="messages" :ref="el => messagesRefs.supervisor = el">
                <div v-if="chatStates.supervisor.messages.length === 0" class="empty-state">
                  <a-empty description="开始与监督者 Agent 对话吧！">
                    <template #image>
                      <RobotOutlined :style="{ fontSize: '64px', color: '#1890ff' }" />
                    </template>
                  </a-empty>
                </div>
                <div
                  v-for="message in chatStates.supervisor.messages"
                  :key="message.id"
                  :class="['message-item', message.role]"
                >
                  <a-avatar
                    :style="message.role === 'user' ? { backgroundColor: '#1890ff' } : { backgroundColor: '#52c41a' }"
                  >
                    <template #icon>
                      <UserOutlined v-if="message.role === 'user'" />
                      <RobotOutlined v-else />
                    </template>
                  </a-avatar>
                  <div class="message-content">
                    <div class="message-header">
                      <a-space>
                        <span class="role-name">{{ message.role === 'user' ? '您' : '监督者 Agent' }}</span>
                        <a-tag v-if="message.role === 'assistant'" color="blue" size="small">监督者模式</a-tag>
                      </a-space>
                      <span class="timestamp">{{ formatTime(message.timestamp) }}</span>
                    </div>
                    <div 
                      v-if="message.role === 'user'" 
                      class="message-text"
                    >
                      {{ message.content }}
                    </div>
                    <div 
                      v-else 
                      class="message-text markdown-content" 
                      v-html="renderMarkdown(message.content)"
                    ></div>
                  </div>
                </div>
                <div v-if="chatStates.supervisor.loading" class="message-item assistant">
                  <a-avatar :style="{ backgroundColor: '#52c41a' }">
                    <template #icon>
                      <RobotOutlined />
                    </template>
                  </a-avatar>
                  <div class="message-content">
                    <a-spin />
                  </div>
                </div>
              </div>
              <div class="input-area">
                <a-input
                  v-model:value="chatStates.supervisor.inputMessage"
                  placeholder="输入您的问题，例如：今天天气怎么样？"
                  size="large"
                  @pressEnter="sendMessage('supervisor')"
                  :disabled="chatStates.supervisor.loading"
                >
                  <template #suffix>
                    <a-button
                      type="primary"
                      :loading="chatStates.supervisor.loading"
                      @click="sendMessage('supervisor')"
                      :disabled="!chatStates.supervisor.inputMessage.trim()"
                    >
                      发送
                    </a-button>
                  </template>
                </a-input>
              </div>
            </div>
          </div>
        </a-tab-pane>

        <!-- 顺序执行模式 Tab -->
        <a-tab-pane key="sequential">
          <template #tab>
            <span>
              <OrderedListOutlined />
              顺序执行模式
            </span>
          </template>
          <div class="tab-content">
            <div class="mode-header">
              <a-space>
                <a-tag color="orange" :icon="h(OrderedListOutlined)">当前模式：顺序执行模式</a-tag>
                <a-tag v-if="chatStates.sequential.threadId" color="green">
                  Thread ID: {{ chatStates.sequential.threadId.substring(0, 8) }}...
                </a-tag>
                <a-button size="small" @click="clearChat('sequential')" :disabled="chatStates.sequential.loading">
                  <template #icon>
                    <ClearOutlined />
                  </template>
                  清空对话
                </a-button>
                <a-button v-if="chatStates.sequential.loading" size="small" danger @click="handleCancelStream('sequential')">
                  <template #icon>
                    <StopOutlined />
                  </template>
                  停止生成
                </a-button>
              </a-space>
            </div>
            <div class="chat-container">
              <div class="messages" :ref="el => messagesRefs.sequential = el">
                <div v-if="chatStates.sequential.messages.length === 0" class="empty-state">
                  <a-empty description="开始与顺序执行 Agent 对话吧！">
                    <template #image>
                      <RobotOutlined :style="{ fontSize: '64px', color: '#1890ff' }" />
                    </template>
                  </a-empty>
                </div>
                <div
                  v-for="message in chatStates.sequential.messages"
                  :key="message.id"
                  :class="['message-item', message.role]"
                >
                  <a-avatar
                    :style="message.role === 'user' ? { backgroundColor: '#1890ff' } : { backgroundColor: '#52c41a' }"
                  >
                    <template #icon>
                      <UserOutlined v-if="message.role === 'user'" />
                      <RobotOutlined v-else />
                    </template>
                  </a-avatar>
                  <div class="message-content">
                    <div class="message-header">
                      <a-space>
                        <span class="role-name">{{ message.role === 'user' ? '您' : '顺序执行 Agent' }}</span>
                        <a-tag v-if="message.role === 'assistant'" color="orange" size="small">顺序执行模式</a-tag>
                      </a-space>
                      <span class="timestamp">{{ formatTime(message.timestamp) }}</span>
                    </div>
                    <div 
                      v-if="message.role === 'user'" 
                      class="message-text"
                    >
                      {{ message.content }}
                    </div>
                    <div 
                      v-else 
                      class="message-text markdown-content" 
                      v-html="renderMarkdown(message.content)"
                    ></div>
                  </div>
                </div>
                <div v-if="chatStates.sequential.loading" class="message-item assistant">
                  <a-avatar :style="{ backgroundColor: '#52c41a' }">
                    <template #icon>
                      <RobotOutlined />
                    </template>
                  </a-avatar>
                  <div class="message-content">
                    <a-spin />
                  </div>
                </div>
              </div>
              <div class="input-area">
                <a-input
                  v-model:value="chatStates.sequential.inputMessage"
                  placeholder="输入您的问题，例如：帮我获取位置并查询天气"
                  size="large"
                  @pressEnter="sendMessage('sequential')"
                  :disabled="chatStates.sequential.loading"
                >
                  <template #suffix>
                    <a-button
                      type="primary"
                      :loading="chatStates.sequential.loading"
                      @click="sendMessage('sequential')"
                      :disabled="!chatStates.sequential.inputMessage.trim()"
                    >
                      发送
                    </a-button>
                  </template>
                </a-input>
              </div>
            </div>
          </div>
        </a-tab-pane>

        <!-- 工具调用模式 Tab -->
        <a-tab-pane key="coordinator">
          <template #tab>
            <span>
              <ToolOutlined />
              工具调用模式
            </span>
          </template>
          <div class="tab-content">
            <div class="mode-header">
              <a-space>
                <a-tag color="cyan" :icon="h(ToolOutlined)">当前模式：工具调用模式</a-tag>
                <a-tag v-if="chatStates.coordinator.threadId" color="green">
                  Thread ID: {{ chatStates.coordinator.threadId.substring(0, 8) }}...
                </a-tag>
                <a-button size="small" @click="clearChat('coordinator')" :disabled="chatStates.coordinator.loading">
                  <template #icon>
                    <ClearOutlined />
                  </template>
                  清空对话
                </a-button>
                <a-button v-if="chatStates.coordinator.loading" size="small" danger @click="handleCancelStream('coordinator')">
                  <template #icon>
                    <StopOutlined />
                  </template>
                  停止生成
                </a-button>
              </a-space>
            </div>
            <div class="chat-container">
              <div class="messages" :ref="el => messagesRefs.coordinator = el">
                <div v-if="chatStates.coordinator.messages.length === 0" class="empty-state">
                  <a-empty description="开始与协调者 Agent 对话吧！">
                    <template #image>
                      <RobotOutlined :style="{ fontSize: '64px', color: '#1890ff' }" />
                    </template>
                  </a-empty>
                </div>
                <div
                  v-for="message in chatStates.coordinator.messages"
                  :key="message.id"
                  :class="['message-item', message.role]"
                >
                  <a-avatar
                    :style="message.role === 'user' ? { backgroundColor: '#1890ff' } : { backgroundColor: '#52c41a' }"
                  >
                    <template #icon>
                      <UserOutlined v-if="message.role === 'user'" />
                      <RobotOutlined v-else />
                    </template>
                  </a-avatar>
                  <div class="message-content">
                    <div class="message-header">
                      <a-space>
                        <span class="role-name">{{ message.role === 'user' ? '您' : '协调者 Agent' }}</span>
                        <a-tag v-if="message.role === 'assistant'" color="cyan" size="small">工具调用模式</a-tag>
                      </a-space>
                      <span class="timestamp">{{ formatTime(message.timestamp) }}</span>
                    </div>
                    <div 
                      v-if="message.role === 'user'" 
                      class="message-text"
                    >
                      {{ message.content }}
                    </div>
                    <div 
                      v-else 
                      class="message-text markdown-content" 
                      v-html="renderMarkdown(message.content)"
                    ></div>
                  </div>
                </div>
                <div v-if="chatStates.coordinator.loading" class="message-item assistant">
                  <a-avatar :style="{ backgroundColor: '#52c41a' }">
                    <template #icon>
                      <RobotOutlined />
                    </template>
                  </a-avatar>
                  <div class="message-content">
                    <a-spin />
                  </div>
                </div>
              </div>
              <div class="input-area">
                <a-input
                  v-model:value="chatStates.coordinator.inputMessage"
                  placeholder="输入您的问题，例如：先获取位置，再查询天气"
                  size="large"
                  @pressEnter="sendMessage('coordinator')"
                  :disabled="chatStates.coordinator.loading"
                >
                  <template #suffix>
                    <a-button
                      type="primary"
                      :loading="chatStates.coordinator.loading"
                      @click="sendMessage('coordinator')"
                      :disabled="!chatStates.coordinator.inputMessage.trim()"
                    >
                      发送
                    </a-button>
                  </template>
                </a-input>
              </div>
            </div>
          </div>
        </a-tab-pane>
      </a-tabs>
    </a-card>

    <a-card title="模式说明" class="info-card">
      <a-tabs v-model:activeKey="activeTab">
        <a-tab-pane key="supervisor" tab="监督者模式">
          <a-descriptions :column="1" bordered>
            <a-descriptions-item label="模式特点">
              <a-tag color="blue">智能路由</a-tag>
              <a-tag color="green">多Agent协调</a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="工作原理">
              监督者 Agent 根据用户请求智能路由到合适的专业 Agent（天气、位置、分析）
            </a-descriptions-item>
            <a-descriptions-item label="适用场景">
              <ul class="example-list">
                <li>需要智能判断任务类型的场景</li>
                <li>需要多个专业 Agent 协作的场景</li>
              </ul>
            </a-descriptions-item>
            <a-descriptions-item label="示例问题">
              <ul class="example-list">
                <li>今天天气怎么样？</li>
                <li>我所在位置在哪里？</li>
                <li>帮我分析一下这些数据</li>
              </ul>
            </a-descriptions-item>
          </a-descriptions>
        </a-tab-pane>
        <a-tab-pane key="sequential" tab="顺序执行模式">
          <a-descriptions :column="1" bordered>
            <a-descriptions-item label="模式特点">
              <a-tag color="orange">顺序执行</a-tag>
              <a-tag color="purple">工作流</a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="工作原理">
              按顺序执行：位置获取 → 天气查询 → 数据分析，前一步的输出作为下一步的输入
            </a-descriptions-item>
            <a-descriptions-item label="适用场景">
              <ul class="example-list">
                <li>有明确执行顺序的工作流</li>
                <li>需要多步骤处理的复杂任务</li>
              </ul>
            </a-descriptions-item>
            <a-descriptions-item label="示例问题">
              <ul class="example-list">
                <li>帮我获取位置并查询天气</li>
                <li>分析我所在位置的天气情况</li>
              </ul>
            </a-descriptions-item>
          </a-descriptions>
        </a-tab-pane>
        <a-tab-pane key="coordinator" tab="工具调用模式">
          <a-descriptions :column="1" bordered>
            <a-descriptions-item label="模式特点">
              <a-tag color="cyan">动态调用</a-tag>
              <a-tag color="magenta">工具封装</a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="工作原理">
              协调者 Agent 将其他 Agent 封装成工具，可以根据需求动态调用不同的工具
            </a-descriptions-item>
            <a-descriptions-item label="适用场景">
              <ul class="example-list">
                <li>需要动态调用不同 Agent 的场景</li>
                <li>需要灵活组合多个功能的场景</li>
              </ul>
            </a-descriptions-item>
            <a-descriptions-item label="示例问题">
              <ul class="example-list">
                <li>先获取位置，再查询天气</li>
                <li>查询天气并分析数据</li>
              </ul>
            </a-descriptions-item>
          </a-descriptions>
        </a-tab-pane>
      </a-tabs>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, h } from 'vue'
import { message } from 'ant-design-vue'
import {
  RobotOutlined,
  UserOutlined,
  ClearOutlined,
  StopOutlined,
  TeamOutlined,
  OrderedListOutlined,
  ToolOutlined
} from '@ant-design/icons-vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import {
  supervisorChatStream,
  sequentialChatStream,
  coordinatorChatStream
} from '@/api/multiAgent'

type AgentMode = 'supervisor' | 'sequential' | 'coordinator'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

interface ChatState {
  messages: ChatMessage[]
  threadId: string
  loading: boolean
  inputMessage: string
}

// 每个模式独立的对话状态
const chatStates = ref<Record<AgentMode, ChatState>>({
  supervisor: {
    messages: [],
    threadId: '',
    loading: false,
    inputMessage: ''
  },
  sequential: {
    messages: [],
    threadId: '',
    loading: false,
    inputMessage: ''
  },
  coordinator: {
    messages: [],
    threadId: '',
    loading: false,
    inputMessage: ''
  }
})

const activeTab = ref<AgentMode>('supervisor')
const messagesRefs = ref<Record<AgentMode, HTMLElement | null>>({
  supervisor: null,
  sequential: null,
  coordinator: null
})

// Tab 切换处理
const handleTabChange = (key: string) => {
  activeTab.value = key as AgentMode
  // 切换 Tab 时滚动到底部
  nextTick(() => {
    scrollToBottom(activeTab.value)
  })
}

// 配置 marked
marked.setOptions({
  breaks: true,
  gfm: true,
})

// 渲染 Markdown 为 HTML
const renderMarkdown = (content: string): string => {
  if (!content) return ''
  try {
    const html = marked(content) as string
    return DOMPurify.sanitize(html)
  } catch (error) {
    console.error('Markdown 渲染失败:', error)
    return content
  }
}

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const scrollToBottom = (mode: AgentMode) => {
  nextTick(() => {
    const ref = messagesRefs.value[mode]
    if (ref) {
      ref.scrollTop = ref.scrollHeight
    }
  })
}

let cancelStreams: Record<AgentMode, (() => void) | null> = {
  supervisor: null,
  sequential: null,
  coordinator: null
}

const sendMessage = async (mode: AgentMode) => {
  const state = chatStates.value[mode]
  if (!state.inputMessage.trim() || state.loading) {
    return
  }

  const userMessage: ChatMessage = {
    id: Date.now().toString(),
    role: 'user',
    content: state.inputMessage,
    timestamp: Date.now()
  }

  state.messages.push(userMessage)
  const currentInput = state.inputMessage
  state.inputMessage = ''
  scrollToBottom(mode)

  state.loading = true

  // 创建助手消息占位符
  const assistantMessageId = (Date.now() + 1).toString()
  let assistantMessage: ChatMessage = {
    id: assistantMessageId,
    role: 'assistant',
    content: '',
    timestamp: Date.now()
  }
  state.messages.push(assistantMessage)

  try {
    // 根据选择的模式调用不同的流式接口
    const streamFunction = {
      supervisor: supervisorChatStream,
      sequential: sequentialChatStream,
      coordinator: coordinatorChatStream
    }[mode]

    await streamFunction(
      {
        message: currentInput,
        threadId: state.threadId || undefined,
        userId: '1',
      },
      {
        onThreadId: (tid: string) => {
          if (tid && !state.threadId) {
            state.threadId = tid
          }
        },
        onMessage: (chunk: string) => {
          const msg = state.messages.find(m => m.id === assistantMessageId)
          if (msg) {
            msg.content += chunk
            scrollToBottom(mode)
          }
        },
        onDone: (fullContent: string) => {
          const msg = state.messages.find(m => m.id === assistantMessageId)
          if (msg && !msg.content.trim() && fullContent.trim()) {
            msg.content = fullContent.trim()
          }
          state.loading = false
          scrollToBottom(mode)
        },
        onError: (error: string) => {
          message.error(`调用失败: ${error}`)
          const msg = state.messages.find(m => m.id === assistantMessageId)
          if (msg) {
            msg.content = `错误: ${error}`
          }
          state.loading = false
        }
      }
    )
  } catch (error: any) {
    message.error(`发送消息失败: ${error.message || '未知错误'}`)
    const msg = state.messages.find(m => m.id === assistantMessageId)
    if (msg) {
      msg.content = `错误: ${error.message || '未知错误'}`
    }
    state.loading = false
  }
}

const clearChat = (mode: AgentMode) => {
  const state = chatStates.value[mode]
  state.messages = []
  state.threadId = ''
  state.loading = false
  state.inputMessage = ''
  message.success('对话已清空')
}

const handleCancelStream = (mode: AgentMode) => {
  if (cancelStreams[mode]) {
    cancelStreams[mode]?.()
    cancelStreams[mode] = null
  }
  chatStates.value[mode].loading = false
  message.info('已停止生成')
}
</script>

<style scoped>
.multi-agent-test-container {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.test-card {
  margin-bottom: 24px;
}

.tab-content {
  padding: 16px 0;
}

.mode-header {
  margin-bottom: 16px;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 4px;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 600px;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #fafafa;
  border-radius: 4px;
  margin-bottom: 16px;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.message-item {
  display: flex;
  margin-bottom: 16px;
  gap: 12px;
}

.message-item.user {
  flex-direction: row-reverse;
}

.message-content {
  flex: 1;
  max-width: 70%;
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 12px;
  color: #999;
}

.role-name {
  font-weight: 500;
}

.timestamp {
  color: #999;
}

.message-text {
  padding: 8px 12px;
  border-radius: 4px;
  background: #fff;
  word-wrap: break-word;
}

.message-item.user .message-text {
  background: #1890ff;
  color: #fff;
}

.markdown-content {
  background: #fff;
  padding: 12px;
  border-radius: 4px;
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3) {
  margin-top: 16px;
  margin-bottom: 8px;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin: 8px 0;
  padding-left: 24px;
}

.markdown-content :deep(code) {
  background: #f5f5f5;
  padding: 2px 4px;
  border-radius: 2px;
  font-family: 'Courier New', monospace;
}

.markdown-content :deep(pre) {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
}

.input-area {
  margin-top: 16px;
}

.info-card {
  margin-top: 24px;
}

.example-list {
  margin: 0;
  padding-left: 20px;
}

.example-list li {
  margin: 4px 0;
}
</style>

