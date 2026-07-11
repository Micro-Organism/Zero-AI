import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export interface ImageGenerateRequest {
  prompt: string
  width?: number
  height?: number
}

export interface MultimodalChatRequest {
  text: string
  imageUrls?: string[]
}

export const multimodalApi = {
  // 图像生成
  generateImage: (data: ImageGenerateRequest) => {
    return axios.post(`${API_BASE_URL}/multimodal/image/generate`, data)
  },

  // 图像理解
  understandImage: (file: File, prompt?: string) => {
    const formData = new FormData()
    formData.append('file', file)
    if (prompt) {
      formData.append('prompt', prompt)
    }
    return axios.post(`${API_BASE_URL}/multimodal/image/understand`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 文本转语音
  textToSpeech: (text: string, voice?: string) => {
    return axios.post(`${API_BASE_URL}/multimodal/audio/tts`, { text, voice })
  },

  // 语音转文本
  speechToText: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return axios.post(`${API_BASE_URL}/multimodal/audio/stt`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 多模态对话
  multimodalChat: (data: MultimodalChatRequest) => {
    return axios.post(`${API_BASE_URL}/multimodal/chat`, data)
  }
}

