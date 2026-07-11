import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export interface GraphRequest {
  message: string
  threadId?: string
}

export const graphApi = {
  // 执行简单 Graph
  execute: (data: GraphRequest) => {
    return axios.post(`${API_BASE_URL}/graph/execute`, data)
  },

  // 流式执行 Graph
  stream: (data: GraphRequest, onMessage: (chunk: string) => void, onDone: () => void, onError: (error: string) => void) => {
    return fetch(`${API_BASE_URL}/graph/stream`, {
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
            } else if (line.startsWith('event:')) {
              // 处理事件类型
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

  // 执行并行 Graph
  executeParallel: (data: GraphRequest) => {
    return axios.post(`${API_BASE_URL}/graph/parallel`, data)
  },

  // 获取 Graph 状态
  getStatus: (threadId: string) => {
    return axios.get(`${API_BASE_URL}/graph/status/${threadId}`)
  }
}

