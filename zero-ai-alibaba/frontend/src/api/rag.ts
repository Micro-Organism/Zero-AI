import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export interface RagQuery {
  query: string
  topK?: number
}

export const ragApi = {
  // 上传文档
  uploadDocument: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return axios.post(`${API_BASE_URL}/rag/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // RAG 查询
  query: (data: RagQuery) => {
    return axios.post(`${API_BASE_URL}/rag/query`, data)
  },

  // 流式 RAG 查询
  streamQuery: (data: RagQuery, onMessage: (chunk: string) => void, onDone: () => void, onError: (error: string) => void) => {
    return fetch(`${API_BASE_URL}/rag/stream`, {
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

  // 删除文档
  deleteDocument: (documentId: string) => {
    return axios.delete(`${API_BASE_URL}/rag/document/${documentId}`)
  },

  // 获取文档列表
  getDocuments: () => {
    return axios.get(`${API_BASE_URL}/rag/documents`)
  }
}

