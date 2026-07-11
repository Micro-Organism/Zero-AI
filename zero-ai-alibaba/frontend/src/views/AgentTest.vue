<template>
  <div class="agent-test-container">
    <a-card title="Agent 对话测试" class="test-card">
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
          <a-tag v-if="threadId" color="blue">
            Thread ID: {{ threadId.substring(0, 8) }}...
          </a-tag>
        </a-space>
      </template>

      <div class="chat-container">
        <div class="messages" ref="messagesRef">
          <div v-if="messages.length === 0" class="empty-state">
            <a-empty description="开始与 Agent 对话吧！">
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
                <span class="role-name">{{ message.role === 'user' ? '您' : 'Agent' }}</span>
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
            <a-select
              v-model:value="selectedModel"
              :options="modelOptions"
              placeholder="选择模型"
              style="width: 200px"
              :disabled="loading"
            >
              <template #option="{ label, description }">
                <div>
                  <div>{{ label }}</div>
                  <div style="font-size: 12px; color: #999">{{ description }}</div>
                </div>
              </template>
            </a-select>
            <a-input
              v-model:value="inputMessage"
              placeholder="输入您的问题，例如：今天天气怎么样？"
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
        <a-descriptions-item label="当前模型">
          {{ modelOptions.find(m => m.value === selectedModel)?.label || '未选择' }}
        </a-descriptions-item>
        <a-descriptions-item label="支持功能">
          <a-tag color="blue">天气查询</a-tag>
          <a-tag color="green">位置获取</a-tag>
          <a-tag color="orange">对话记忆</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="示例问题">
          <ul class="example-list">
            <li>今天天气怎么样？</li>
            <li>我所在位置的天气如何？</li>
            <li>北京明天会下雨吗？</li>
          </ul>
        </a-descriptions-item>
        <a-descriptions-item label="Thread ID">
          {{ threadId || '未生成' }}
        </a-descriptions-item>
      </a-descriptions>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch, computed } from 'vue'
import { useChatStore, type ChatMessage } from '@/stores'
import { agentApi } from '@/api/agent'
import { message } from 'ant-design-vue'
import {
  RobotOutlined,
  UserOutlined,
  ClearOutlined,
  StopOutlined
} from '@ant-design/icons-vue'
import { MODEL_OPTIONS, ModelType } from '@/types/model'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

const chatStore = useChatStore()
const messages = computed(() => chatStore.messages)
const threadId = computed(() => chatStore.threadId)
const loading = computed(() => chatStore.loading)

const inputMessage = ref('')
const messagesRef = ref<HTMLElement>()
const selectedModel = ref<string>(ModelType.DEEPSEEK) // 默认使用 DeepSeek
const modelOptions = MODEL_OPTIONS.map(opt => ({
  value: opt.value,
  label: opt.label,
  description: opt.description
}))

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

let cancelStream: (() => void) | null = null

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

  chatStore.addMessage(userMessage)
  const currentInput = inputMessage.value
  inputMessage.value = ''
  scrollToBottom()

  chatStore.setLoading(true)

  // 创建助手消息占位符
  const assistantMessageId = (Date.now() + 1).toString()
  let assistantMessage: ChatMessage = {
    id: assistantMessageId,
    role: 'assistant',
    content: '',
    timestamp: Date.now()
  }
  chatStore.addMessage(assistantMessage)

  try {
    // 使用流式接口
    cancelStream = await agentApi.chatStream(
      {
        message: currentInput,
        threadId: threadId.value || undefined,
        userId: '1',
        modelType: selectedModel.value
      },
      {
        onThreadId: (tid: string) => {
          if (tid && !threadId.value) {
            chatStore.setThreadId(tid)
          }
        },
        onMessage: (chunk: string) => {
          // 实时显示流式内容
          const messages = chatStore.messages
          const msg = messages.find(m => m.id === assistantMessageId)
          if (msg) {
            msg.content += chunk
            scrollToBottom()
          }
        },
        onDone: (fullContent: string) => {
          // 如果已经有内容（流式更新），就不再处理
          const messages = chatStore.messages
          const msg = messages.find(m => m.id === assistantMessageId)
          if (msg) {
            // 如果内容为空，尝试解析 JSON
            if (!msg.content.trim() && fullContent.trim()) {
              try {
                // 清理内容：移除多余的空白字符，但保留 JSON 结构
                let jsonContent = fullContent.trim()
                
                // 尝试解析 JSON
                if (jsonContent.startsWith('{') || jsonContent.startsWith('[')) {
                  const parsed = JSON.parse(jsonContent)
                  
                  // 格式化显示 JSON 内容
                  if (parsed.punnyResponse && parsed.weatherConditions) {
                    // 如果是 ResponseFormat 格式，格式化显示
                    msg.content = `${parsed.punnyResponse}\n\n天气情况：${parsed.weatherConditions}`
                  } else if (typeof parsed === 'string') {
                    // 如果解析出来是字符串，直接显示
                    msg.content = parsed
                  } else {
                    // 其他格式，美化 JSON 显示
                    msg.content = JSON.stringify(parsed, null, 2)
                  }
                } else if (jsonContent) {
                  // 不是 JSON，直接显示
                  msg.content = jsonContent
                } else {
                  msg.content = '（无响应内容）'
                }
              } catch (e) {
                // 解析失败，显示原始内容
                console.error('JSON 解析失败:', e, '原始内容:', fullContent)
                msg.content = fullContent.trim() || '（解析失败）'
              }
            }
          }
          chatStore.setLoading(false)
          scrollToBottom()
          cancelStream = null
        },
        onError: (error: string) => {
          chatStore.setLoading(false)
          message.error('发送消息失败: ' + error)
          // 移除失败的消息
          const messages = chatStore.messages
          const index = messages.findIndex(m => m.id === assistantMessageId)
          if (index !== -1) {
            messages.splice(index, 1)
          }
          cancelStream = null
        }
      }
    )
  } catch (error: any) {
    chatStore.setLoading(false)
    message.error('发送消息失败: ' + (error.message || '未知错误'))
    console.error('Error:', error)
    // 移除失败的消息
    const messages = chatStore.messages
    const index = messages.findIndex(m => m.id === assistantMessageId)
    if (index !== -1) {
      messages.splice(index, 1)
    }
    cancelStream = null
  }
}

const clearChat = () => {
  // 如果正在流式输出，先取消
  if (cancelStream) {
    cancelStream()
    cancelStream = null
  }
  chatStore.clearMessages()
  chatStore.setLoading(false)
  message.success('对话已清空')
}

const handleCancelStream = () => {
  if (cancelStream) {
    cancelStream()
    cancelStream = null
    chatStore.setLoading(false)
    message.info('已停止生成')
  }
}

watch(messages, () => {
  scrollToBottom()
}, { deep: true })
</script>

<style scoped>
.agent-test-container {
  max-width: 1000px;
  margin: 0 auto;
}

.test-card {
  margin-bottom: 24px;
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
  border-radius: 8px;
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
}

.role-name {
  font-weight: 500;
  color: #1890ff;
}

.message-item.user .role-name {
  color: #52c41a;
}

.timestamp {
  color: #999;
}

.message-text {
  padding: 12px;
  background: #fff;
  border-radius: 8px;
  word-wrap: break-word;
  white-space: pre-wrap;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
  color: #fff;
}

.input-area {
  display: flex;
  gap: 8px;
}

.info-card {
  margin-top: 24px;
}

.example-list {
  margin: 0;
  padding-left: 20px;
}

.example-list li {
  margin-bottom: 8px;
  color: #666;
}
</style>

