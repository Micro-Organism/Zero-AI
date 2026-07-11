<template>
  <div class="chat-test-container">
    <a-card title="简单对话测试（ChatClient）" class="test-card">
      <template #extra>
        <a-space>
          <a-button @click="clearChat" :disabled="loading">
            <template #icon>
              <ClearOutlined />
            </template>
            清空对话
          </a-button>
          <a-button v-if="loading" danger @click="handleCancelStream">
            <template #icon>
              <StopOutlined />
            </template>
            停止生成
          </a-button>
          <a-tag v-if="chatId" color="blue">
            Chat ID: {{ chatId.substring(0, 8) }}...
          </a-tag>
        </a-space>
      </template>

      <div class="chat-container">
        <div class="messages" ref="messagesRef">
          <div v-if="messages.length === 0" class="empty-state">
            <a-empty description="开始对话吧！">
              <template #image>
                <RobotOutlined :style="{ fontSize: '64px', color: '#1890ff' }" />
              </template>
            </a-empty>
          </div>

          <div
            v-for="message in messages"
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
                <span class="role-name">{{ message.role === 'user' ? '您' : 'AI' }}</span>
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

          <div v-if="loading" class="message-item assistant">
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
          <a-space direction="vertical" style="width: 100%" :size="8">
            <a-input
              v-model:value="inputMessage"
              placeholder="输入您的问题..."
              size="large"
              @pressEnter="sendMessage"
              :disabled="loading"
            >
              <template #suffix>
                <a-button
                  type="primary"
                  :loading="loading"
                  @click="sendMessage"
                  :disabled="!inputMessage.trim()"
                >
                  发送
                </a-button>
              </template>
            </a-input>
          </a-space>
        </div>
      </div>
    </a-card>

    <a-card title="功能说明" class="info-card">
      <a-descriptions :column="1" bordered>
        <a-descriptions-item label="API 类型">
          <a-tag color="purple">ChatClient</a-tag>
          <span style="margin-left: 8px; color: #666;">基于 Spring AI 标准 API</span>
        </a-descriptions-item>
        <a-descriptions-item label="功能特点">
          <a-tag color="blue">简单对话</a-tag>
          <a-tag color="green">流式输出</a-tag>
          <a-tag color="orange">对话记忆</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="默认模型">
          DeepSeek Chat
        </a-descriptions-item>
        <a-descriptions-item label="Chat ID">
          {{ chatId || '未生成' }}
        </a-descriptions-item>
      </a-descriptions>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import { message } from 'ant-design-vue'
import {
  RobotOutlined,
  UserOutlined,
  ClearOutlined,
  StopOutlined
} from '@ant-design/icons-vue'
import { chatApi } from '@/api/chat'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

const messages = ref<ChatMessage[]>([])
const loading = ref(false)
const inputMessage = ref('')
const messagesRef = ref<HTMLElement>()
const chatId = ref<string>('default-chat')
let cancelStream: (() => void) | null = null

// 配置 marked
marked.setOptions({
  breaks: true, // 支持换行
  gfm: true, // 启用 GitHub Flavored Markdown
})

// 渲染 Markdown 为 HTML
const renderMarkdown = (content: string): string => {
  if (!content) return ''
  try {
    const html = marked(content) as string
    // 使用 DOMPurify 清理 HTML，防止 XSS 攻击
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

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }
  })
}

const sendMessage = async () => {
  if (!inputMessage.value.trim() || loading.value) {
    return
  }

  const userMessage: ChatMessage = {
    id: Date.now().toString(),
    role: 'user',
    content: inputMessage.value,
    timestamp: Date.now()
  }

  messages.value.push(userMessage)
  const currentInput = inputMessage.value
  inputMessage.value = ''
  scrollToBottom()

  loading.value = true

  const assistantMessageId = (Date.now() + 1).toString()
  const assistantMessage: ChatMessage = {
    id: assistantMessageId,
    role: 'assistant',
    content: '',
    timestamp: Date.now()
  }
  messages.value.push(assistantMessage)

  try {
    cancelStream = await chatApi.chatStream(
      {
        prompt: currentInput,
        chatId: chatId.value
      },
      {
        onMessage: (chunk: string) => {
          const msg = messages.value.find(m => m.id === assistantMessageId)
          if (msg) {
            msg.content += chunk
            scrollToBottom()
          }
        },
        onDone: () => {
          loading.value = false
          scrollToBottom()
          cancelStream = null
        },
        onError: (error: string) => {
          loading.value = false
          message.error('发送消息失败: ' + error)
          const index = messages.value.findIndex(m => m.id === assistantMessageId)
          if (index !== -1) {
            messages.value.splice(index, 1)
          }
          cancelStream = null
        }
      }
    )
  } catch (error: any) {
    loading.value = false
    message.error('发送消息失败: ' + (error.message || '未知错误'))
    const index = messages.value.findIndex(m => m.id === assistantMessageId)
    if (index !== -1) {
      messages.value.splice(index, 1)
    }
    cancelStream = null
  }
}

const clearChat = () => {
  if (cancelStream) {
    cancelStream()
    cancelStream = null
  }
  messages.value = []
  loading.value = false
  chatId.value = 'default-chat-' + Date.now()
  message.success('对话已清空')
}

const handleCancelStream = () => {
  if (cancelStream) {
    cancelStream()
    cancelStream = null
    loading.value = false
    message.info('已停止生成')
  }
}

watch(messages, () => {
  scrollToBottom()
}, { deep: true })
</script>

<style scoped>
.chat-test-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.test-card {
  margin-bottom: 24px;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 600px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  overflow: hidden;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #fafafa;
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
  color: #ccc;
}

.message-text {
  padding: 8px 12px;
  background: white;
  border-radius: 4px;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.message-text.markdown-content {
  white-space: normal;
  line-height: 1.6;
}

.message-text.markdown-content :deep(h1),
.message-text.markdown-content :deep(h2),
.message-text.markdown-content :deep(h3),
.message-text.markdown-content :deep(h4),
.message-text.markdown-content :deep(h5),
.message-text.markdown-content :deep(h6) {
  margin-top: 16px;
  margin-bottom: 8px;
  font-weight: 600;
}

.message-text.markdown-content :deep(h1) {
  font-size: 1.5em;
  border-bottom: 1px solid #e8e8e8;
  padding-bottom: 8px;
}

.message-text.markdown-content :deep(h2) {
  font-size: 1.3em;
}

.message-text.markdown-content :deep(h3) {
  font-size: 1.1em;
}

.message-text.markdown-content :deep(p) {
  margin: 8px 0;
}

.message-text.markdown-content :deep(ul),
.message-text.markdown-content :deep(ol) {
  margin: 8px 0;
  padding-left: 24px;
}

.message-text.markdown-content :deep(li) {
  margin: 4px 0;
}

.message-text.markdown-content :deep(strong) {
  font-weight: 600;
}

.message-text.markdown-content :deep(em) {
  font-style: italic;
}

.message-text.markdown-content :deep(code) {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

.message-text.markdown-content :deep(pre) {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
  margin: 12px 0;
}

.message-text.markdown-content :deep(pre code) {
  background: none;
  padding: 0;
}

.message-text.markdown-content :deep(blockquote) {
  border-left: 4px solid #1890ff;
  padding-left: 12px;
  margin: 12px 0;
  color: #666;
  font-style: italic;
}

.message-text.markdown-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 12px 0;
}

.message-text.markdown-content :deep(th),
.message-text.markdown-content :deep(td) {
  border: 1px solid #e8e8e8;
  padding: 8px;
  text-align: left;
}

.message-text.markdown-content :deep(th) {
  background: #fafafa;
  font-weight: 600;
}

.message-text.markdown-content :deep(hr) {
  border: none;
  border-top: 1px solid #e8e8e8;
  margin: 16px 0;
}

.message-item.user .message-text {
  background: #1890ff;
  color: white;
}

.input-area {
  padding: 16px;
  background: white;
  border-top: 1px solid #e8e8e8;
}

.info-card {
  margin-top: 24px;
}
</style>

