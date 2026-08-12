import { useState } from 'react'
import { Button, Descriptions, Drawer, Form, Input, InputNumber, List, Modal, Popconfirm, Space, Table, Tabs, Tag, Typography, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { PageResult, ProjectExperience, Skill, WorkExperience } from '@/api/types'
import { PageHeader } from '@/components/PageHeader'

type Kind = 'work-experiences' | 'project-experiences' | 'skills'
type Evidence = WorkExperience | ProjectExperience | Skill

function formValues(item: Evidence) {
  const values = { ...item } as Record<string, unknown>
  for (const key of ['technologies', 'achievements', 'responsibilities', 'metrics']) {
    if (Array.isArray(values[key])) values[key] = (values[key] as string[]).join(key === 'technologies' ? '，' : '\n')
  }
  return values
}

function payloadValues(values: Record<string, unknown>) {
  const result = { ...values }
  for (const key of ['technologies', 'achievements', 'responsibilities', 'metrics']) {
    if (typeof result[key] === 'string') {
      const separator = key === 'technologies' ? /[，,]/ : /\n/
      result[key] = (result[key] as string).split(separator).map((item) => item.trim()).filter(Boolean)
    }
  }
  return result
}

export function ResumeLibraryPage() {
  const [kind, setKind] = useState<Kind>('work-experiences')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Evidence>()
  const [viewing, setViewing] = useState<Evidence>()
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [form] = Form.useForm()
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: [kind, page, keyword], queryFn: () => api<PageResult<Evidence>>(`/${kind}?page=${page}&page_size=10&keyword=${encodeURIComponent(keyword)}`) })
  const save = useMutation({ mutationFn: (values: Record<string, unknown>) => api(`/${kind}${editing ? `/${editing.id}` : ''}`, { method: editing ? 'PUT' : 'POST', body: JSON.stringify(payloadValues({ ...values, ...(editing ? { version: editing.version } : {}) })) }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: [kind] }); setOpen(false); setEditing(undefined); form.resetFields(); message.success('简历素材已保存') } })
  const remove = useMutation({ mutationFn: (id: string) => api(`/${kind}/${id}`, { method: 'DELETE' }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: [kind] }); message.success('素材已移入回收站') } })

  const showForm = (item?: Evidence) => {
    setEditing(item)
    if (item) form.setFieldsValue(formValues(item))
    else form.resetFields()
    setOpen(true)
  }

  const baseColumns: ColumnsType<Evidence> = kind === 'skills' ? [
    { title: '技能', dataIndex: 'name' },
    { title: '类别', dataIndex: 'category' },
    { title: '等级', dataIndex: 'level', render: (value: number) => <Tag color="blue">L{value}</Tag> },
    { title: '证据', dataIndex: 'evidence' },
  ] : kind === 'work-experiences' ? [
    { title: '公司', dataIndex: 'company' },
    { title: '岗位', dataIndex: 'role' },
    { title: '技术', dataIndex: 'technologies', render: (items: string[]) => items?.map((item) => <Tag key={item}>{item}</Tag>) },
    { title: '说明', dataIndex: 'description' },
  ] : [
    { title: '项目', dataIndex: 'name' },
    { title: '角色', dataIndex: 'role' },
    { title: '技术', dataIndex: 'technologies', render: (items: string[]) => items?.map((item) => <Tag key={item}>{item}</Tag>) },
    { title: '背景', dataIndex: 'background' },
  ]

  const columns: ColumnsType<Evidence> = [...baseColumns, {
    title: '操作',
    key: 'actions',
    width: 150,
    fixed: 'right',
    render: (_: unknown, record: Evidence) => <Space size={2}><Button type="text" icon={<EyeOutlined />} title="查看" onClick={() => setViewing(record)} /><Button type="text" icon={<EditOutlined />} title="编辑" onClick={() => showForm(record)} /><Popconfirm title="移入回收站？" onConfirm={() => remove.mutate(record.id)}><Button danger type="text" icon={<DeleteOutlined />} title="删除" /></Popconfirm></Space>,
  }]

  const detailItems = viewing ? kind === 'skills' ? [
    { key: 'name', label: '技能名称', children: (viewing as Skill).name },
    { key: 'category', label: '类别', children: (viewing as Skill).category || '-' },
    { key: 'level', label: '掌握等级', children: `L${(viewing as Skill).level}` },
    { key: 'evidence', label: '能力证据', children: (viewing as Skill).evidence || '-', span: 2 },
  ] : kind === 'work-experiences' ? [
    { key: 'company', label: '公司', children: (viewing as WorkExperience).company },
    { key: 'role', label: '岗位', children: (viewing as WorkExperience).role },
    { key: 'period', label: '任职时间', children: `${(viewing as WorkExperience).start_date || '-'} 至 ${(viewing as WorkExperience).is_current ? '至今' : (viewing as WorkExperience).end_date || '-'}`, span: 2 },
    { key: 'description', label: '工作说明', children: (viewing as WorkExperience).description || '-', span: 2 },
    { key: 'technologies', label: '技术栈', children: <Space wrap>{(viewing as WorkExperience).technologies?.map((item) => <Tag key={item}>{item}</Tag>) || '-'}</Space>, span: 2 },
    { key: 'achievements', label: '工作成果', children: <List size="small" dataSource={(viewing as WorkExperience).achievements} renderItem={(item) => <List.Item>{item}</List.Item>} />, span: 2 },
  ] : [
    { key: 'name', label: '项目名称', children: (viewing as ProjectExperience).name },
    { key: 'role', label: '项目角色', children: (viewing as ProjectExperience).role || '-' },
    { key: 'period', label: '项目时间', children: `${(viewing as ProjectExperience).start_date || '-'} 至 ${(viewing as ProjectExperience).end_date || '-'}`, span: 2 },
    { key: 'background', label: '项目背景', children: (viewing as ProjectExperience).background || '-', span: 2 },
    { key: 'responsibilities', label: '主要职责', children: <List size="small" dataSource={(viewing as ProjectExperience).responsibilities} renderItem={(item) => <List.Item>{item}</List.Item>} />, span: 2 },
    { key: 'technologies', label: '技术栈', children: <Space wrap>{(viewing as ProjectExperience).technologies?.map((item) => <Tag key={item}>{item}</Tag>) || '-'}</Space>, span: 2 },
    { key: 'achievements', label: '项目成果', children: <List size="small" dataSource={(viewing as ProjectExperience).achievements} renderItem={(item) => <List.Item>{item}</List.Item>} />, span: 2 },
    { key: 'metrics', label: '量化指标', children: <List size="small" dataSource={(viewing as ProjectExperience).metrics} renderItem={(item) => <List.Item>{item}</List.Item>} />, span: 2 },
  ] : []

  return <>
    <PageHeader title="简历素材库" description="只维护你本人的真实工作、项目与技能证据，再将素材组合进主简历和岗位定制版本。" actions={<Button type="primary" icon={<PlusOutlined />} onClick={() => showForm()}>新增素材</Button>} />
    <Tabs activeKey={kind} onChange={(key) => { setKind(key as Kind); setPage(1); setKeyword('') }} items={[{ key: 'work-experiences', label: '工作经历' }, { key: 'project-experiences', label: '项目经历' }, { key: 'skills', label: '技能证据' }]} />
    <div className="toolbar"><Input.Search allowClear placeholder="搜索当前素材" style={{ maxWidth: 360 }} onSearch={(value) => { setKeyword(value); setPage(1) }} /></div>
    <Table<Evidence> rowKey="id" loading={isLoading} dataSource={data?.items ?? []} columns={columns} pagination={{ current: page, pageSize: 10, total: data?.total, onChange: setPage }} />
    <Modal title={editing ? '编辑简历素材' : '新增简历素材'} open={open} onCancel={() => { setOpen(false); setEditing(undefined) }} onOk={() => form.submit()} confirmLoading={save.isPending}>
      <Form form={form} layout="vertical" onFinish={(values) => save.mutate(values)}>
        {kind === 'skills' ? <><Form.Item name="name" label="技能名称" rules={[{ required: true }]}><Input /></Form.Item><Form.Item name="category" label="类别"><Input /></Form.Item><Form.Item name="level" label="掌握等级" initialValue={1}><InputNumber min={1} max={5} /></Form.Item><Form.Item name="evidence" label="能力证据"><Input.TextArea rows={4} /></Form.Item></> : <>
          <Form.Item name={kind === 'work-experiences' ? 'company' : 'name'} label={kind === 'work-experiences' ? '公司' : '项目名称'} rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="role" label="岗位/角色" rules={[{ required: kind === 'work-experiences' }]}><Input /></Form.Item>
          <div className="form-grid"><Form.Item name="start_date" label="开始时间"><Input placeholder="2024-01" /></Form.Item><Form.Item name="end_date" label="结束时间"><Input placeholder="2025-06" /></Form.Item></div>
          <Form.Item name={kind === 'work-experiences' ? 'description' : 'background'} label="背景与说明"><Input.TextArea rows={3} /></Form.Item>
          {kind === 'project-experiences' ? <Form.Item name="responsibilities" label="职责（每行一项）"><Input.TextArea rows={3} /></Form.Item> : null}
          <Form.Item name="technologies" label="技术栈（逗号分隔）"><Input /></Form.Item>
          <Form.Item name="achievements" label="成果（每行一项）"><Input.TextArea rows={4} /></Form.Item>
          {kind === 'project-experiences' ? <Form.Item name="metrics" label="量化指标（每行一项）"><Input.TextArea rows={3} /></Form.Item> : null}
        </>}
      </Form>
    </Modal>
    <Drawer title="查看简历素材" width={640} open={!!viewing} onClose={() => setViewing(undefined)} extra={<Button icon={<EditOutlined />} onClick={() => { const item = viewing; setViewing(undefined); if (item) showForm(item) }}>编辑</Button>}>
      {viewing ? <><Typography.Title level={4} style={{ marginTop: 0 }}>{kind === 'skills' ? (viewing as Skill).name : kind === 'work-experiences' ? `${(viewing as WorkExperience).company} · ${(viewing as WorkExperience).role}` : (viewing as ProjectExperience).name}</Typography.Title><Descriptions bordered column={2} size="small" items={detailItems} /></> : null}
    </Drawer>
  </>
}
