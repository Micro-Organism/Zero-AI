/**
 * 环境配置
 * 从环境变量中读取配置
 */

interface EnvConfig {
  apiBaseUrl: string
  apiTimeout: number
  appTitle: string
  appDescription: string
  env: string
  devPort?: number
  proxyTarget?: string
}

// 从 import.meta.env 读取环境变量
const getEnvConfig = (): EnvConfig => {
  return {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
    apiTimeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '60000', 10),
    appTitle: import.meta.env.VITE_APP_TITLE || 'Zero AI Alibaba',
    appDescription: import.meta.env.VITE_APP_DESCRIPTION || 'Spring AI Alibaba 测试平台',
    env: import.meta.env.VITE_ENV || (import.meta.env.MODE as string) || 'development',
    devPort: import.meta.env.VITE_DEV_PORT ? parseInt(import.meta.env.VITE_DEV_PORT, 10) : undefined,
    proxyTarget: import.meta.env.VITE_API_PROXY_TARGET
  }
}

export const envConfig = getEnvConfig()

// 导出常用配置
export const API_BASE_URL = envConfig.apiBaseUrl
export const API_TIMEOUT = envConfig.apiTimeout
export const APP_TITLE = envConfig.appTitle
export const APP_DESCRIPTION = envConfig.appDescription
export const ENV = envConfig.env

// 环境判断
export const isDev = ENV === 'dev' || ENV === 'development'
export const isTest = ENV === 'test'
export const isProd = ENV === 'prod' || ENV === 'production'

