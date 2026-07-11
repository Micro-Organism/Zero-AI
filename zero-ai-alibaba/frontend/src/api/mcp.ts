import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export interface McpCallRequest {
  toolName: string
  params?: Record<string, any>
}

export const mcpApi = {
  // 获取工具列表
  getTools: () => {
    return axios.get(`${API_BASE_URL}/mcp/tools`)
  },

  // 调用工具
  callTool: (data: McpCallRequest) => {
    return axios.post(`${API_BASE_URL}/mcp/call`, data)
  },

  // 流式调用工具
  streamCall: (data: McpCallRequest, onMessage: (chunk: string) => void, onDone: () => void, onError: (error: string) => void) => {
    return fetch(`${API_BASE_URL}/mcp/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }).then(response => {
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      const readChunk = () => {
        reader?.read().then(({ done, value }) => {
          if (done) {
            onDone()
            return
          }
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data:')) {
              const data = line.substring(5).trim()
              if (data === '[DONE]' || data === '') {
                onDone()
                return
              }
              onMessage(data)
            }
          }
          readChunk()
        }).catch(err => {
          onError(err.message)
        })
      }
      readChunk()
    }).catch(err => {
      onError(err.message)
    })
  },

  // 获取状态
  getStatus: () => {
    return axios.get(`${API_BASE_URL}/mcp/status`)
  }
}

