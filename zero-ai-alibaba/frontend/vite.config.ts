import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')
  
  // 获取开发服务器端口
  const devPort = parseInt(env.VITE_DEV_PORT || '3000', 10)
  
  // 获取代理目标地址
  const proxyTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:8080'

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    server: {
      port: devPort,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          rewrite: (path) => path
        }
      }
    },
    build: {
      outDir: '../src/main/resources/static',
      emptyOutDir: true
    },
    define: {
      // 将环境变量注入到代码中
      __APP_ENV__: JSON.stringify(env.VITE_ENV || mode)
    }
  }
})

