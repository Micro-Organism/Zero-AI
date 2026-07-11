import axios from 'axios'
import { API_BASE_URL, API_TIMEOUT } from '@/config/env'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
})

export interface ChatRequest {
  message: string
  threadId?: string
  userId?: string
  modelType?: string // 模型类型：qwen 或 deepseek
}

export interface ChatResponse {
  response: string
  threadId: string
}

export interface StreamEventCallbacks {
  onMessage?: (chunk: string) => void
  onThreadId?: (threadId: string) => void
  onDone?: (fullContent: string) => void
  onError?: (error: string) => void
}

export const agentApi = {
  /**
   * 普通对话接口（非流式）
   */
  chat: async (params: ChatRequest): Promise<ChatResponse> => {
    const response = await api.post<ChatResponse>('/agent/chat', params)
    return response.data
  },

  /**
   * SSE 流式对话接口
   */
  chatStream: async (
    params: ChatRequest,
    callbacks: StreamEventCallbacks
  ): Promise<() => void> => {
    const baseURL = API_BASE_URL.startsWith('http') 
      ? API_BASE_URL 
      : `${window.location.origin}${API_BASE_URL}`
    
    const url = `${baseURL}/agent/chat/stream`
    
    // 使用 fetch 实现 POST + SSE
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      const error = `HTTP error! status: ${response.status}`
      callbacks.onError?.(error)
      throw new Error(error)
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      const error = 'Response body is null'
      callbacks.onError?.(error)
      throw new Error(error)
    }

    let buffer = ''
    let currentEvent = ''
    let currentData = '' // 当前事件的累积数据
    let messageBuffer = '' // 累积所有 message 数据

    const readStream = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read()
          
          if (done) {
            // 流结束时，处理最后的数据
            if (currentEvent === 'message' && currentData) {
              messageBuffer += currentData
              callbacks.onMessage?.(currentData)
            } else if (currentEvent === 'threadId' && currentData) {
              callbacks.onThreadId?.(currentData.trim())
            }
            // 如果有累积的消息，解析并返回
            if (messageBuffer) {
              callbacks.onDone?.(messageBuffer)
            } else {
              callbacks.onDone?.('')
            }
            break
          }

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            const trimmedLine = line.trim()
            
            if (trimmedLine.startsWith('event:')) {
              // 处理之前的事件（如果有数据累积）
              if (currentEvent && currentData) {
                if (currentEvent === 'threadId') {
                  callbacks.onThreadId?.(currentData.trim())
                } else if (currentEvent === 'message') {
                  messageBuffer += currentData
                  callbacks.onMessage?.(currentData)
                }
                currentData = ''
              }
              // 设置新事件类型
              currentEvent = trimmedLine.substring(trimmedLine.startsWith('event: ') ? 7 : 6).trim()
            } else if (trimmedLine.startsWith('data:')) {
              // 提取 data: 后面的内容
              // 处理 'data: ' 或 'data:' 两种格式
              const dataStart = trimmedLine.startsWith('data: ') ? 6 : 5
              const data = trimmedLine.substring(dataStart)
              // 累积当前事件的 data
              currentData += data
            } else if (trimmedLine === '') {
              // 空行表示一个完整事件结束，处理当前事件
              if (currentEvent === 'threadId' && currentData) {
                callbacks.onThreadId?.(currentData.trim())
                currentEvent = ''
                currentData = ''
              } else if (currentEvent === 'message' && currentData) {
                messageBuffer += currentData
                callbacks.onMessage?.(currentData)
                currentEvent = ''
                currentData = ''
              } else if (currentEvent === 'done') {
                // 收到 done 事件，完成流式传输
                if (messageBuffer) {
                  callbacks.onDone?.(messageBuffer)
                  messageBuffer = ''
                } else {
                  callbacks.onDone?.('')
                }
                currentEvent = ''
                currentData = ''
              } else if (currentEvent === 'error' && currentData) {
                callbacks.onError?.(currentData.trim())
                currentEvent = ''
                currentData = ''
              }
            }
          }
        }
      } catch (error: any) {
        callbacks.onError?.(error.message || '流式请求失败')
        throw error
      }
    }

    // 异步读取流
    readStream()

    // 返回取消函数
    return () => {
      reader.cancel()
    }
  }
}

