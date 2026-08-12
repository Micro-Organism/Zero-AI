import { Button, Form, Input, Typography, message } from 'antd'
import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  if (user) return <Navigate to="/" replace />

  return <main className="login-shell" style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: 'minmax(320px, 480px) 1fr', background: '#f3f6f8' }}>
    <section style={{ padding: 'clamp(32px, 7vw, 82px)', background: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div className="career-brand" style={{ color: '#18212a', padding: 0, marginBottom: 48 }}><span>Z</span><div><b>Zero AI</b><small>Career Workspace</small></div></div>
      <Typography.Title level={2}>登录个人工作台</Typography.Title>
      <Typography.Paragraph type="secondary">管理可信简历事实、招聘研究和岗位定制版本。</Typography.Paragraph>
      <Form layout="vertical" size="large" initialValues={{ username: 'admin' }} onFinish={async (values) => {
        try {
          await login(values.username, values.password)
          navigate((location.state as { from?: string } | null)?.from ?? '/', { replace: true })
        } catch (error) { message.error(error instanceof Error ? error.message : '登录失败') }
      }}>
        <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}><Input prefix={<UserOutlined />} autoComplete="username" /></Form.Item>
        <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}><Input.Password prefix={<LockOutlined />} autoComplete="current-password" /></Form.Item>
        <Button block type="primary" htmlType="submit">登录</Button>
      </Form>
    </section>
    <section style={{ background: '#17212b', color: '#e9f0f5', padding: '8vw', display: 'flex', alignItems: 'center' }}>
      <div><Typography.Title style={{ color: 'white', fontSize: 42 }}>从招聘要求，到可信的岗位定制简历</Typography.Title><p style={{ color: '#9fb0bd', fontSize: 17, lineHeight: 1.8 }}>结构化积累职业证据，清楚看到匹配原因、能力缺口和下一步行动。</p></div>
    </section>
  </main>
}
