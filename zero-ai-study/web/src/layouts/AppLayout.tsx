import { useEffect, useMemo, useState } from 'react'
import { Layout, Menu, Button, Drawer, Tag, theme } from 'antd'
import {
  DashboardOutlined,
  UnorderedListOutlined,
  ExperimentOutlined,
  ThunderboltOutlined,
  MenuOutlined,
  KeyOutlined,
  BookOutlined,
  DatabaseOutlined,
  RocketOutlined,
  FormOutlined,
  CloudDownloadOutlined,
  ToolOutlined,
  ControlOutlined,
  RedoOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { fetchHealth } from '@/api/client'
import './AppLayout.scss'

const { Header, Sider, Content } = Layout

const items = [
  { key: '/', icon: <DashboardOutlined />, label: '总览' },
  { key: '/setup', icon: <KeyOutlined />, label: '准备工作' },
  { key: '/concepts', icon: <BookOutlined />, label: '概念笔记' },
  { key: '/data', icon: <DatabaseOutlined />, label: '训练数据' },
  { key: '/finetune', icon: <RocketOutlined />, label: '云端微调' },
  { key: '/eval', icon: <FormOutlined />, label: '效果评估' },
  { key: '/export', icon: <CloudDownloadOutlined />, label: '导出与推理' },
  { key: '/data-craft', icon: <ToolOutlined />, label: '数据工程' },
  { key: '/hparams', icon: <ControlOutlined />, label: '训练参数' },
  { key: '/retrain', icon: <RedoOutlined />, label: '再训复评' },
  { key: '/engineering', icon: <SafetyCertificateOutlined />, label: '工程验收' },
  { key: '/steps', icon: <UnorderedListOutlined />, label: '学习步骤' },
  { key: '/runtime', icon: <ThunderboltOutlined />, label: '运行检查' },
  { key: '/effects', icon: <ExperimentOutlined />, label: '执行效果' },
]

export function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [apiOk, setApiOk] = useState<boolean | null>(null)
  const { token } = theme.useToken()

  useEffect(() => {
    fetchHealth()
      .then(() => setApiOk(true))
      .catch(() => setApiOk(false))
  }, [])

  const selected = useMemo(() => {
    // 用「全等或 key/」匹配，避免 /data-craft 被 /data 前缀误选
    const path = location.pathname
    const match = items
      .filter((i) => i.key !== '/' && (path === i.key || path.startsWith(`${i.key}/`)))
      .sort((a, b) => b.key.length - a.key.length)[0]
    return [match?.key ?? '/']
  }, [location.pathname])

  const menu = (
    <Menu
      mode="inline"
      selectedKeys={selected}
      items={items}
      onClick={({ key }) => {
        navigate(key)
        setOpen(false)
      }}
      style={{ borderInlineEnd: 0, background: 'transparent' }}
    />
  )

  return (
    <Layout className="app-shell study-layout">
      <Sider className="study-sider" width={232} breakpoint="lg" collapsedWidth={0} trigger={null}>
        <div className="brand-block">
          <div className="brand-mark">Z</div>
          <div>
            <div className="brand-name">Zero AI Study</div>
            <div className="brand-sub">微调学习看板</div>
          </div>
        </div>
        {menu}
      </Sider>

      <Layout>
        <Header className="study-header" style={{ background: token.colorBgContainer }}>
          <Button
            className="menu-trigger"
            type="text"
            icon={<MenuOutlined />}
            onClick={() => setOpen(true)}
          />
          <div className="header-title">学习进度与执行观察</div>
          <Tag color={apiOk ? 'success' : apiOk === false ? 'error' : 'default'}>
            API {apiOk ? '在线' : apiOk === false ? '离线' : '检测中'}
          </Tag>
        </Header>
        <Content className="app-content">
          <Outlet />
        </Content>
      </Layout>

      <Drawer
        title="导航"
        placement="left"
        open={open}
        onClose={() => setOpen(false)}
        styles={{ body: { padding: 0 } }}
      >
        <div className="brand-block drawer-brand">
          <div className="brand-mark">Z</div>
          <div className="brand-name">Zero AI Study</div>
        </div>
        {menu}
      </Drawer>
    </Layout>
  )
}
