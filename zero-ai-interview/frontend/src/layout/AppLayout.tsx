import { useMemo, useState } from 'react'
import { Avatar, Button, Drawer, Dropdown, Layout, Menu, Space, Typography } from 'antd'
import {
  AppstoreOutlined,
  BarChartOutlined,
  DatabaseOutlined,
  FileDoneOutlined,
  FileSearchOutlined,
  FolderOpenOutlined,
  LogoutOutlined,
  MenuOutlined,
  ProfileOutlined,
  ReadOutlined,
  SettingOutlined,
  SolutionOutlined,
} from '@ant-design/icons'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import './AppLayout.scss'

const { Header, Sider, Content } = Layout

const menuItems = [
  { type: 'group' as const, label: '工作空间', children: [
    { key: '/', icon: <AppstoreOutlined />, label: '工作台' },
    { key: '/matching', icon: <SolutionOutlined />, label: '求职匹配' },
  ] },
  { type: 'group' as const, label: '职业资料', children: [
    { key: '/resume/master', icon: <ProfileOutlined />, label: '我的主简历' },
    { key: '/resume/library', icon: <DatabaseOutlined />, label: '简历素材库' },
    { key: '/resume/references', icon: <ReadOutlined />, label: '参考简历库' },
    { key: '/resume/targeted', icon: <FileDoneOutlined />, label: '定制简历' },
  ] },
  { type: 'group' as const, label: '招聘研究', children: [
    { key: '/recruitment', icon: <FileSearchOutlined />, label: '招聘信息' },
    { key: '/insights', icon: <BarChartOutlined />, label: '洞察与学习计划' },
  ] },
  { type: 'group' as const, label: '系统', children: [
    { key: '/files', icon: <FolderOpenOutlined />, label: '文件与任务' },
    { key: '/settings', icon: <SettingOutlined />, label: '系统管理' },
  ] },
]

export function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const selectedKeys = useMemo(() => {
    const paths = menuItems.flatMap((group) => group.children.map((item) => item.key))
    return [paths.filter((path) => path !== '/' && location.pathname.startsWith(path)).sort((a, b) => b.length - a.length)[0] ?? '/']
  }, [location.pathname])

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
    setDrawerOpen(false)
  }

  return (
    <Layout className="career-shell">
      <Sider width={244} className="career-sider" breakpoint="lg" collapsedWidth={0} trigger={null}>
        <div className="career-brand"><span>Z</span><div><b>Zero AI</b><small>Career Workspace</small></div></div>
        <Menu className="career-menu" theme="dark" mode="inline" items={menuItems} selectedKeys={selectedKeys} onClick={handleMenuClick} />
      </Sider>
      <Layout>
        <Header className="career-header">
          <Button className="mobile-menu" type="text" icon={<MenuOutlined />} onClick={() => setDrawerOpen(true)} />
          <Typography.Text className="header-context">个人 AI 求职工作台</Typography.Text>
          <Dropdown menu={{ items: [{ key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: logout }] }}>
            <Space className="account-menu"><Avatar>{user?.display_name.slice(0, 1)}</Avatar><span>{user?.display_name}</span></Space>
          </Dropdown>
        </Header>
        <Content className="career-content"><Outlet /></Content>
      </Layout>
      <Drawer title="导航" placement="left" open={drawerOpen} onClose={() => setDrawerOpen(false)} styles={{ body: { padding: 0 } }}>
        <Menu mode="inline" items={menuItems} selectedKeys={selectedKeys} onClick={handleMenuClick} />
      </Drawer>
    </Layout>
  )
}
