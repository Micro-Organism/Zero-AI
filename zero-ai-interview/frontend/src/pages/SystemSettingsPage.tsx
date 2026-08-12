import { useState } from 'react'
import { Button, Card, Form, Input, InputNumber, Modal, Popconfirm, Space, Switch, Table, Tabs, Tag, message } from 'antd'
import { ApiOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { AIProvider, AuditLog } from '@/api/types'
import { PageHeader } from '@/components/PageHeader'

type ProviderForm = Omit<AIProvider, 'id' | 'api_key_configured'>

export function SystemSettingsPage() {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<AIProvider>()
  const [form] = Form.useForm<ProviderForm>()
  const [passwordForm] = Form.useForm()
  const queryClient = useQueryClient()
  const providers = useQuery({ queryKey: ['ai-providers'], queryFn: () => api<AIProvider[]>('/system/ai-providers') })
  const audits = useQuery({ queryKey: ['audit-logs'], queryFn: () => api<AuditLog[]>('/system/audit-logs') })
  const save = useMutation({ mutationFn: (values: ProviderForm) => api<AIProvider>(editing ? `/system/ai-providers/${editing.id}` : '/system/ai-providers', { method: editing ? 'PUT' : 'POST', body: JSON.stringify(values) }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['ai-providers'] }); setOpen(false); setEditing(undefined); form.resetFields(); message.success('AI 服务配置已保存') } })
  const remove = useMutation({ mutationFn: (id: string) => api(`/system/ai-providers/${id}`, { method: 'DELETE' }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai-providers'] }) })
  const testConnection = useMutation({ mutationFn: (id: string) => api<{ ok: boolean; latency_ms: number }>(`/system/ai-providers/${id}/test-connection`, { method: 'POST' }), onSuccess: (result) => message.success(`连接成功，耗时 ${result.latency_ms} ms`), onError: (error) => message.error(error instanceof Error ? error.message : '连接失败') })
  const changePassword = useMutation({ mutationFn: (values: { current_password: string; new_password: string }) => api('/auth/change-password', { method: 'POST', body: JSON.stringify(values) }), onSuccess: () => { passwordForm.resetFields(); message.success('密码已修改') } })

  const showProvider = (provider?: AIProvider) => {
    setEditing(provider)
    if (provider) form.setFieldsValue(provider)
    else form.resetFields()
    setOpen(true)
  }

  return <>
    <PageHeader title="系统管理" description="配置 OpenAI 兼容服务、账户安全和审计信息；API Key 只从后端环境变量读取。" />
    <Tabs items={[
      { key: 'ai', label: 'AI 服务', children: <Card title="OpenAI 兼容接口" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => showProvider()}>新增服务</Button>}><Table rowKey="id" dataSource={providers.data ?? []} loading={providers.isLoading} pagination={false} columns={[
        { title: '名称', dataIndex: 'name', render: (value: string, row: AIProvider) => <Space>{value}{row.is_default ? <Tag color="blue">默认</Tag> : null}</Space> },
        { title: '模型', dataIndex: 'model' },
        { title: '地址', dataIndex: 'base_url', ellipsis: true },
        { title: '密钥变量', dataIndex: 'api_key_env', render: (value: string, row: AIProvider) => <Space>{value}<Tag color={row.api_key_configured ? 'green' : 'orange'}>{row.api_key_configured ? '已配置' : '未配置'}</Tag></Space> },
        { title: '操作', key: 'actions', render: (_: unknown, row: AIProvider) => <Space><Button icon={<ApiOutlined />} loading={testConnection.isPending} onClick={() => testConnection.mutate(row.id)}>测试</Button><Button type="text" icon={<EditOutlined />} title="编辑" onClick={() => showProvider(row)} /><Popconfirm title="删除这个服务配置？" onConfirm={() => remove.mutate(row.id)}><Button danger type="text" icon={<DeleteOutlined />} title="删除" /></Popconfirm></Space> },
      ]} /></Card> },
      { key: 'account', label: '账户安全', children: <Card title="修改密码" className="settings-form"><Form form={passwordForm} layout="vertical" onFinish={(values) => changePassword.mutate(values)}><Form.Item name="current_password" label="当前密码" rules={[{ required: true }]}><Input.Password autoComplete="current-password" /></Form.Item><Form.Item name="new_password" label="新密码" rules={[{ required: true }, { min: 8, message: '至少 8 个字符' }]}><Input.Password autoComplete="new-password" /></Form.Item><Button type="primary" htmlType="submit" loading={changePassword.isPending}>更新密码</Button></Form></Card> },
      { key: 'audit', label: '审计日志', children: <Card><Table rowKey="id" dataSource={audits.data ?? []} pagination={{ pageSize: 20 }} columns={[{ title: '时间', dataIndex: 'created_at', render: (value: string) => new Date(value).toLocaleString() }, { title: '动作', dataIndex: 'action' }, { title: '对象', dataIndex: 'entity_type' }, { title: '对象 ID', dataIndex: 'entity_id', ellipsis: true }]} /></Card> },
    ]} />
    <Modal title={editing ? '编辑 AI 服务' : '新增 AI 服务'} open={open} onCancel={() => { setOpen(false); setEditing(undefined) }} onOk={() => form.submit()} confirmLoading={save.isPending} width={680}>
      <Form form={form} layout="vertical" initialValues={{ api_key_env: 'AI_API_KEY', timeout_seconds: 60, max_retries: 2, temperature: 0.2, max_tokens: 2000, is_enabled: true, is_default: false }} onFinish={(values) => save.mutate(values)}>
        <div className="form-grid"><Form.Item name="name" label="服务名称" rules={[{ required: true }]}><Input placeholder="例如：通义千问" /></Form.Item><Form.Item name="model" label="模型名称" rules={[{ required: true }]}><Input placeholder="例如：qwen-plus" /></Form.Item></div>
        <Form.Item name="base_url" label="Base URL" rules={[{ required: true }, { type: 'url' }]}><Input placeholder="https://example.com/v1" /></Form.Item>
        <Form.Item name="api_key_env" label="API Key 环境变量" rules={[{ required: true }]}><Input placeholder="AI_API_KEY" /></Form.Item>
        <div className="form-grid"><Form.Item name="timeout_seconds" label="超时（秒）"><InputNumber min={5} max={600} style={{ width: '100%' }} /></Form.Item><Form.Item name="max_retries" label="重试次数"><InputNumber min={0} max={10} style={{ width: '100%' }} /></Form.Item><Form.Item name="temperature" label="Temperature"><InputNumber min={0} max={2} step={0.1} style={{ width: '100%' }} /></Form.Item><Form.Item name="max_tokens" label="最大 Token"><InputNumber min={100} max={100000} style={{ width: '100%' }} /></Form.Item></div>
        <Space size="large"><Form.Item name="is_enabled" label="启用" valuePropName="checked"><Switch /></Form.Item><Form.Item name="is_default" label="设为默认" valuePropName="checked"><Switch /></Form.Item></Space>
      </Form>
    </Modal>
  </>
}
