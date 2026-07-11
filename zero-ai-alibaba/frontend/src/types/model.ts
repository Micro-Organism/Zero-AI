/**
 * 模型类型定义
 */
export enum ModelType {
  QWEN = 'qwen',
  DEEPSEEK = 'deepseek'
}

export interface ModelOption {
  value: string
  label: string
  description?: string
}

export const MODEL_OPTIONS: ModelOption[] = [
  {
    value: ModelType.QWEN,
    label: '通义千问 (Qwen)',
    description: '阿里云通义千问模型'
  },
  {
    value: ModelType.DEEPSEEK,
    label: 'DeepSeek',
    description: 'DeepSeek AI 模型'
  }
]

