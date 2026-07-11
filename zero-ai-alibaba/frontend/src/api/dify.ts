import { API_BASE_URL } from '@/config/env'

/**
 * Dify API
 * 提供Dify工具调用、对话、工作流等功能
 */

export interface DifyToolInvokeRequest {
  tool_name: string
  parameters?: Record<string, any>
}

export interface DifyChatRequest {
  messages: Array<{
    role: string
    content: string
  }>
  app_id?: string
  inputs?: Record<string, any>
}

export interface DifyCompletionRequest {
  app_id?: string
  meeting_content?: string
  inputs?: Record<string, any>
  response_mode?: 'blocking' | 'streaming'
  user?: string
}

export interface DifyWorkflowRequest {
  workflow_id: string
  inputs?: Record<string, any>
}

/**
 * Dify API 服务
 */
export const difyApi = {
  /**
   * 获取应用列表
   */
  getApps: async (page: number = 1, limit: number = 30, name?: string): Promise<any> => {
    let url = `${API_BASE_URL}/dify/apps?page=${page}&limit=${limit}`
    if (name) {
      url += `&name=${encodeURIComponent(name)}`
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return response.json()
  },

  /**
   * 获取工具列表
   */
  getTools: async (appId?: string): Promise<any> => {
    const url = appId 
      ? `${API_BASE_URL}/dify/tools?app_id=${appId}`
      : `${API_BASE_URL}/dify/tools`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return response.json()
  },

  /**
   * 调用工具（同步）
   */
  invokeTool: async (request: DifyToolInvokeRequest): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/dify/tools/invoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return response.json()
  },

  /**
   * 调用工具（流式）
   */
  invokeToolStream: async (
    request: DifyToolInvokeRequest,
    callbacks: {
      onMessage?: (chunk: string) => void
      onDone?: () => void
      onError?: (error: string) => void
    }
  ): Promise<() => void> => {
    const controller = new AbortController()
    const { signal } = controller

    try {
      const response = await fetch(`${API_BASE_URL}/dify/tools/invoke/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(request),
        signal
      })

      if (!response.ok || !response.body) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) {
              if (buffer.trim()) {
                const data = buffer.startsWith('data:') 
                  ? buffer.substring(5).trim() 
                  : buffer.trim()
                if (data) {
                  callbacks.onMessage?.(data)
                }
              }
              callbacks.onDone?.()
              break
            }

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              const trimmedLine = line.trim()
              if (trimmedLine.startsWith('data:')) {
                const data = trimmedLine.substring(5).trim()
                if (data) {
                  callbacks.onMessage?.(data)
                }
              } else if (trimmedLine && !trimmedLine.startsWith('event:') && !trimmedLine.startsWith('id:')) {
                callbacks.onMessage?.(trimmedLine)
              }
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
  },

  /**
   * Dify对话（同步）
   */
  chat: async (request: DifyChatRequest): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/dify/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return response.json()
  },

  /**
   * Dify对话（流式）
   */
  chatStream: async (
    request: DifyChatRequest,
    callbacks: {
      onMessage?: (chunk: string) => void
      onDone?: () => void
      onError?: (error: string) => void
    }
  ): Promise<() => void> => {
    const controller = new AbortController()
    const { signal } = controller

    try {
      const response = await fetch(`${API_BASE_URL}/dify/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(request),
        signal
      })

      if (!response.ok || !response.body) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) {
              if (buffer.trim()) {
                const data = buffer.startsWith('data:') 
                  ? buffer.substring(5).trim() 
                  : buffer.trim()
                if (data) {
                  callbacks.onMessage?.(data)
                }
              }
              callbacks.onDone?.()
              break
            }

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              const trimmedLine = line.trim()
              if (trimmedLine.startsWith('data:')) {
                const data = trimmedLine.substring(5).trim()
                if (data) {
                  callbacks.onMessage?.(data)
                }
              } else if (trimmedLine && !trimmedLine.startsWith('event:') && !trimmedLine.startsWith('id:')) {
                callbacks.onMessage?.(trimmedLine)
              }
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
  },

  /**
   * 执行工作流（同步）
   */
  executeWorkflow: async (request: DifyWorkflowRequest): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/dify/workflows/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return response.json()
  },

  /**
   * Dify Completion Messages（同步）
   * 直接调用 V1 API completion-messages，默认使用 meeting_content 参数
   */
  completion: async (request: DifyCompletionRequest): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/dify/completion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return response.json()
  },

  /**
   * Dify Completion Messages（流式）
   * 直接调用 V1 API completion-messages，默认使用 meeting_content 参数
   */
  completionStream: async (
    request: DifyCompletionRequest,
    callbacks: {
      onMessage?: (chunk: string) => void
      onDone?: () => void
      onError?: (error: string) => void
    }
  ): Promise<() => void> => {
    const controller = new AbortController()
    const { signal } = controller

    try {
      const response = await fetch(`${API_BASE_URL}/dify/completion/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(request),
        signal
      })

      if (!response.ok || !response.body) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) {
              if (buffer.trim()) {
                const data = buffer.startsWith('data:') 
                  ? buffer.substring(5).trim() 
                  : buffer.trim()
                if (data) {
                  callbacks.onMessage?.(data)
                }
              }
              callbacks.onDone?.()
              break
            }

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              const trimmedLine = line.trim()
              if (trimmedLine.startsWith('data:')) {
                const data = trimmedLine.substring(5).trim()
                if (data) {
                  callbacks.onMessage?.(data)
                }
              } else if (trimmedLine && !trimmedLine.startsWith('event:') && !trimmedLine.startsWith('id:')) {
                callbacks.onMessage?.(trimmedLine)
              }
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
  },

  /**
   * 执行工作流（流式）
   */
  executeWorkflowStream: async (
    request: DifyWorkflowRequest,
    callbacks: {
      onMessage?: (chunk: string) => void
      onDone?: () => void
      onError?: (error: string) => void
    }
  ): Promise<() => void> => {
    const controller = new AbortController()
    const { signal } = controller

    try {
      const response = await fetch(`${API_BASE_URL}/dify/workflows/execute/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(request),
        signal
      })

      if (!response.ok || !response.body) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) {
              if (buffer.trim()) {
                const data = buffer.startsWith('data:') 
                  ? buffer.substring(5).trim() 
                  : buffer.trim()
                if (data) {
                  callbacks.onMessage?.(data)
                }
              }
              callbacks.onDone?.()
              break
            }

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              const trimmedLine = line.trim()
              if (trimmedLine.startsWith('data:')) {
                const data = trimmedLine.substring(5).trim()
                if (data) {
                  callbacks.onMessage?.(data)
                }
              } else if (trimmedLine && !trimmedLine.startsWith('event:') && !trimmedLine.startsWith('id:')) {
                callbacks.onMessage?.(trimmedLine)
              }
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

/**
 * Dify 应用配置管理 API
 */
export interface DifyAppConfig {
  id?: number
  name: string
  appId: string
  apiKey?: string
  appType?: string
  inputTemplate?: string
  description?: string
  enabled?: boolean
  sortOrder?: number
  remark?: string
}

export interface BatchCallRequest {
  app_ids: string[]
  inputs?: Record<string, any>
  stream?: boolean
}

export const difyAppConfigApi = {
  /**
   * 获取所有应用配置
   */
  getAll: async (enabledOnly: boolean = false): Promise<any> => {
    const url = `${API_BASE_URL}/dify/app-config?enabledOnly=${enabledOnly}`
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return response.json()
  },

  /**
   * 根据ID获取应用配置
   */
  getById: async (id: number): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/dify/app-config/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return response.json()
  },

  /**
   * 创建应用配置
   */
  create: async (config: DifyAppConfig): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/dify/app-config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(config)
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return response.json()
  },

  /**
   * 更新应用配置
   */
  update: async (id: number, config: DifyAppConfig): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/dify/app-config/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(config)
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return response.json()
  },

  /**
   * 删除应用配置
   */
  delete: async (id: number): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/dify/app-config/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return response.json()
  },

  /**
   * 批量调用多个应用
   */
  batchCall: async (request: BatchCallRequest): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/dify/app-config/batch-call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return response.json()
  }
}

