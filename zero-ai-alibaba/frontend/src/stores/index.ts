import { defineStore } from 'pinia'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export const useChatStore = defineStore('chat', {
  state: () => ({
    messages: [] as ChatMessage[],
    threadId: '' as string,
    loading: false
  }),
  actions: {
    addMessage(message: ChatMessage) {
      this.messages.push(message)
    },
    clearMessages() {
      this.messages = []
      this.threadId = ''
    },
    setThreadId(threadId: string) {
      this.threadId = threadId
    },
    setLoading(loading: boolean) {
      this.loading = loading
    }
  }
})

