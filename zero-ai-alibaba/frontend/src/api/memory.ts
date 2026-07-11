import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export interface MemoryHistory {
  threadId: string
  state?: any
  metadata?: any
}

export const memoryApi = {
  // 获取对话历史
  getHistory: (threadId: string) => {
    return axios.get(`${API_BASE_URL}/memory/history/${threadId}`)
  },

  // 清空对话历史
  clearHistory: (threadId: string) => {
    return axios.delete(`${API_BASE_URL}/memory/history/${threadId}`)
  },

  // 获取所有线程列表
  getThreads: () => {
    return axios.get(`${API_BASE_URL}/memory/threads`)
  },

  // 获取记忆状态
  getStatus: () => {
    return axios.get(`${API_BASE_URL}/memory/status`)
  }
}

