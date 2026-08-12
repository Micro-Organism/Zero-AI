import { useState } from 'react'
import { Button, Card, Form, Input, List, Modal, Select, Space, Table, message } from 'antd'
import { DownloadOutlined, EditOutlined, PlusOutlined, PrinterOutlined, SaveOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, downloadUrl } from '@/api/client'
import type { PageResult, ProjectExperience, Resume, ResumeVersion, Skill, WorkExperience } from '@/api/types'
import { PageHeader } from '@/components/PageHeader'
import { ResumePreview } from '@/components/ResumePreview'

export function MasterResumePage() {
  const [open, setOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [selected, setSelected] = useState<Resume>()
  const [version, setVersion] = useState<ResumeVersion>()
  const [form] = Form.useForm()
  const [editForm] = Form.useForm()
  const queryClient = useQueryClient()
  const resumes = useQuery({ queryKey: ['resumes'], queryFn: () => api<PageResult<Resume>>('/resumes?page=1&page_size=100') })
  const works = useQuery({ queryKey: ['work-experiences'], queryFn: () => api<PageResult<WorkExperience>>('/work-experiences?page=1&page_size=100') })
  const projects = useQuery({ queryKey: ['project-experiences'], queryFn: () => api<PageResult<ProjectExperience>>('/project-experiences?page=1&page_size=100') })
  const skills = useQuery({ queryKey: ['skills'], queryFn: () => api<PageResult<Skill>>('/skills?page=1&page_size=100') })
  const versions = useQuery({ queryKey: ['resume-versions', selected?.id], enabled: !!selected, queryFn: () => api<ResumeVersion[]>(`/resumes/${selected!.id}/versions`) })
  const create = useMutation({ mutationFn: (values: Record<string, unknown>) => api<Resume>('/resumes', { method: 'POST', body: JSON.stringify(values) }), onSuccess: (item) => { queryClient.invalidateQueries({ queryKey: ['resumes'] }); setSelected(item); setOpen(false); form.resetFields(); message.success('主简历已创建') } })
  const update = useMutation({ mutationFn: (values: Record<string, unknown>) => api<Resume>(`/resumes/${selected!.id}`, { method: 'PUT', body: JSON.stringify(values) }), onSuccess: (item) => { queryClient.invalidateQueries({ queryKey: ['resumes'] }); setSelected(item); setEditOpen(false); message.success('主简历已更新') } })
  const createVersion = useMutation({ mutationFn: () => api<ResumeVersion>(`/resumes/${selected!.id}/versions`, { method: 'POST', body: JSON.stringify({ note: `手动保存 ${new Date().toLocaleString()}` }) }), onSuccess: (item) => { queryClient.invalidateQueries({ queryKey: ['resume-versions', selected?.id] }); setVersion(item); message.success('版本已保存') } })

  const masters = resumes.data?.items.filter((item) => item.kind === 'master') ?? []
  return <>
    <PageHeader title="我的主简历" description="主简历维护真实职业事实，岗位定制版本从这里派生。" actions={<Space><Button icon={<PlusOutlined />} onClick={() => setOpen(true)}>新建</Button><Button icon={<EditOutlined />} disabled={!selected} onClick={() => { editForm.setFieldsValue({ title: selected?.title, summary: selected?.summary, status: selected?.status, work_ids: selected?.content.work_ids ?? [], project_ids: selected?.content.project_ids ?? [], skill_ids: selected?.content.skill_ids ?? [] }); setEditOpen(true) }}>编排内容</Button><Button type="primary" icon={<SaveOutlined />} disabled={!selected} loading={createVersion.isPending} onClick={() => createVersion.mutate()}>保存版本</Button></Space>} />
    <div className="master-resume-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 360px) 1fr', gap: 16 }}>
      <Card title="主简历列表"><List dataSource={masters} locale={{ emptyText: '还没有主简历' }} renderItem={(item) => <List.Item onClick={() => { setSelected(item); setVersion(undefined) }} style={{ cursor: 'pointer', background: selected?.id === item.id ? '#edf4fb' : undefined, paddingInline: 10 }}><List.Item.Meta title={item.title} description={item.summary || '尚未填写摘要'} /></List.Item>} /></Card>
      <div><ResumePreview resume={selected} version={version} />{selected ? <Card title="版本与导出" style={{ marginTop: 16 }} extra={<Button className="no-print" icon={<PrinterOutlined />} onClick={() => window.print()}>打印/PDF</Button>}><Table rowKey="id" pagination={false} dataSource={versions.data ?? []} columns={[{ title: '版本', dataIndex: 'version_no', render: (value) => `v${value}` }, { title: '说明', dataIndex: 'note' }, { title: '创建时间', dataIndex: 'created_at', render: (value) => new Date(value).toLocaleString() }, { title: '操作', render: (_, row: ResumeVersion) => <Space><Button type="link" onClick={() => setVersion(row)}>预览</Button><Button type="link" icon={<DownloadOutlined />} href={downloadUrl(`/resume-versions/${row.id}/export/docx`)}>DOCX</Button><Select size="small" defaultValue="markdown" onChange={(format) => { window.location.href = downloadUrl(`/resume-versions/${row.id}/export/${format}`) }} options={[{ value: 'markdown', label: 'Markdown' }, { value: 'json', label: 'JSON' }]} /></Space> }]} /></Card> : null}</div>
    </div>
    <Modal title="新建主简历" open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()} confirmLoading={create.isPending}><Form form={form} layout="vertical" onFinish={(values) => create.mutate({ ...values, kind: 'master', content: { skill_names: [] } })}><Form.Item name="title" label="简历名称" rules={[{ required: true }]}><Input placeholder="例如：人工智能工程师主简历" /></Form.Item><Form.Item name="summary" label="职业摘要"><Input.TextArea rows={5} /></Form.Item></Form></Modal>
    <Modal title="编排主简历" width={760} open={editOpen} onCancel={() => setEditOpen(false)} onOk={() => editForm.submit()} confirmLoading={update.isPending}><Form form={editForm} layout="vertical" onFinish={(values) => update.mutate({ title: values.title, summary: values.summary, status: values.status, version: selected!.version, content: { ...selected!.content, work_ids: values.work_ids ?? [], project_ids: values.project_ids ?? [], skill_ids: values.skill_ids ?? [], skill_names: (values.skill_ids ?? []).map((id: string) => skills.data?.items.find((item) => item.id === id)?.name).filter(Boolean) } })}><Form.Item name="title" label="简历名称" rules={[{ required: true }]}><Input /></Form.Item><Form.Item name="summary" label="职业摘要"><Input.TextArea rows={4} /></Form.Item><Form.Item name="work_ids" label="工作经历"><Select mode="multiple" options={works.data?.items.map((item) => ({ value: item.id, label: `${item.company} · ${item.role}` }))} /></Form.Item><Form.Item name="project_ids" label="项目经历"><Select mode="multiple" options={projects.data?.items.map((item) => ({ value: item.id, label: `${item.name} · ${item.role}` }))} /></Form.Item><Form.Item name="skill_ids" label="技能证据"><Select mode="multiple" options={skills.data?.items.map((item) => ({ value: item.id, label: `${item.name} · L${item.level}` }))} /></Form.Item><Form.Item name="status" label="状态"><Select options={[{ value: 'draft', label: '草稿' }, { value: 'ready', label: '可投递' }, { value: 'archived', label: '归档' }]} /></Form.Item></Form></Modal>
  </>
}
