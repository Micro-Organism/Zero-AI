import { API_BASE_URL } from '@/config/env'

/**
 * Chat API（基于 ChatClient）
 * 提供简单的流式对话功能
 */

export interface ChatRequest {
  prompt: string
  model?: string
  chatId?: string
}

/**
 * 流式对话（使用 Fetch API + ReadableStream）
 */
export const chatApi = {
  /**
   * 流式对话
   */
  chatStream: async (
    params: ChatRequest,
    callbacks: {
      onMessage?: (chunk: string) => void
      onDone?: () => void
      onError?: (error: string) => void
    }
  ): Promise<() => void> => {
    const controller = new AbortController()
    const { signal } = controller

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'model': params.model || '',
          'chatId': params.chatId || 'default-chat'
        },
        body: params.prompt,
        signal
      })

      if (!response.ok || !response.body) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      let buffer = '' // 用于累积不完整的行

      // 处理 buffer 中剩余的数据
      const processBuffer = (remaining: string) => {
        if (remaining.trim()) {
          if (remaining.startsWith('data:')) {
            const data = remaining.substring(5).trim()
            if (data) {
              callbacks.onMessage?.(data)
            }
          } else if (remaining.trim() !== '') {
            // 如果不是 data: 格式，直接作为数据发送（兼容性处理）
            callbacks.onMessage?.(remaining)
          }
        }
      }

      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) {
              // 处理最后的数据
              if (buffer.trim()) {
                processBuffer(buffer)
              }
              callbacks.onDone?.()
              break
            }

            // 解码数据并累积到 buffer
            buffer += decoder.decode(value, { stream: true })
            
            // 按行分割处理（SSE 格式以 \n 分隔）
            const lines = buffer.split('\n')
            // 保留最后一行（可能不完整）
            buffer = lines.pop() || ''
            
            // 处理完整的行
            for (const line of lines) {
              const trimmedLine = line.trim()
              if (trimmedLine.startsWith('data:')) {
                // 提取 data: 后面的内容
                const data = trimmedLine.substring(5) // 'data: ' 长度为 6
                if (data) {
                  callbacks.onMessage?.(data)
                }
              } else if (trimmedLine === '') {
                // 空行表示一个事件结束，可以在这里处理
                // 对于简单的文本流，我们不需要特殊处理
              }
              // 忽略其他类型的行（如 event:, id: 等）
            }
          }
        } catch (error: any) {
          if (signal.aborted) {
            console.log('Stream aborted by user.')
          } else {
            callbacks.onError?.(error.message || '流式请求失败')
          }
        }
      }

      processStream().catch(e => {
        if (signal.aborted) {
          console.log('Stream aborted by user.')
        } else {
          callbacks.onError?.(e.message)
        }
      })
    } catch (error: any) {
      callbacks.onError?.(error.message || '请求失败')
    }

    return () => controller.abort()
  }
}

