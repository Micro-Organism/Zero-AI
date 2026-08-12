import { ConfigProvider, App as AntApp } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { RouterProvider } from 'react-router-dom'
import { router } from '@/router'
import '@/styles/global.scss'

const theme = {
  token: {
    colorPrimary: '#1f7a5c',
    colorInfo: '#1f7a5c',
    colorSuccess: '#2f9e6a',
    colorWarning: '#c45c26',
    borderRadius: 10,
    fontFamily: '"IBM Plex Sans", "Noto Sans SC", "PingFang SC", sans-serif',
  },
}

export default function App() {
  return (
    <ConfigProvider locale={zhCN} theme={theme}>
      <AntApp>
        <RouterProvider router={router} />
      </AntApp>
    </ConfigProvider>
  )
}
