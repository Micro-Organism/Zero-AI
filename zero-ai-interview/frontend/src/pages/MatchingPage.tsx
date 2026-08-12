import { useState } from 'react'
import { Button, Card, Form, Modal, Progress, Select, Space, Table, Tag, message } from 'antd'
import { PlusOutlined, RocketOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { JobPosting, MatchingProject, PageResult, Resume, ResumeVersion } from '@/api/types'
import { PageHeader } from '@/components/PageHeader'

export function MatchingPage() {
  const [open, setOpen] = useState(false)
  const [resumeId, setResumeId] = useState<string>()
  const [form] = Form.useForm()
  const queryClient = useQueryClient()
  const jobs = useQuery({ queryKey: ['jobs-all'], queryFn: () => api<PageResult<JobPosting>>('/job-postings?page=1&page_size=100') })
  const resumes = useQuery({ queryKey: ['resumes'], queryFn: () => api<PageResult<Resume>>('/resumes?page=1&page_size=100') })
  const versions = useQuery({ queryKey: ['resume-versions', resumeId], enabled: !!resumeId, queryFn: () => api<ResumeVersion[]>(`/resumes/${resumeId}/versions`) })
  const matches = useQuery({ queryKey: ['matches'], queryFn: () => api<PageResult<MatchingProject>>('/matching-projects?page=1&page_size=100') })
  const create = useMutation({ mutationFn: (values: Record<string, unknown>) => api<MatchingProject>('/matching-projects', { method: 'POST', body: JSON.stringify(values) }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['matches'] }); setOpen(false); form.resetFields(); message.success('匹配分析已完成') } })
  const targeted = useMutation({ mutationFn: (id: string) => api(`/matching-projects/${id}/targeted-resume`, { method: 'POST' }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['resumes'] }); message.success('已生成定制简历草稿') } })

  return <>
    <PageHeader title="求职匹配" description="使用确定性权重关联岗位要求和简历证据，AI 只负责建议，不直接决定分数。" actions={<Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>新建匹配</Button>} />
    <Table rowKey="id" loading={matches.isLoading} dataSource={matches.data?.items ?? []} expandable={{ expandedRowRender: (row) => <Card size="small"><Table rowKey={(item) => String(item.requirement_id)} pagination={false} dataSource={row.score_breakdown} columns={[{ title: '类型', dataIndex: 'kind', render: (v) => <Tag>{v}</Tag> }, { title: '能力要求', dataIndex: 'skill' }, { title: '证据强度', dataIndex: 'strength', render: (v) => <Progress percent={v * 25} size="small" /> }, { title: '解释', dataIndex: 'explanation' }]} /></Card> }} columns={[{ title: '状态', dataIndex: 'status' }, { title: '匹配度', dataIndex: 'total_score', render: (value) => <Progress type="circle" size={48} percent={value} /> }, { title: '要求数', dataIndex: 'score_breakdown', render: (items) => items.length }, { title: '更新时间', dataIndex: 'updated_at', render: (value) => new Date(value).toLocaleString() }, { title: '操作', render: (_, row) => <Button icon={<RocketOutlined />} loading={targeted.isPending} onClick={() => targeted.mutate(row.id)}>生成定制简历</Button> }]} />
    <Modal title="新建求职匹配" open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()} confirmLoading={create.isPending}><Form form={form} layout="vertical" onFinish={(values) => create.mutate(values)}><Form.Item name="job_posting_id" label="招聘岗位" rules={[{ required: true }]}><Select showSearch optionFilterProp="label" options={jobs.data?.items.map((item) => ({ value: item.id, label: item.title }))} /></Form.Item><Form.Item name="resume_id" label="主简历" rules={[{ required: true }]}><Select onChange={(value) => { setResumeId(value); form.setFieldValue('resume_version_id', undefined) }} options={resumes.data?.items.filter((item) => item.kind === 'master').map((item) => ({ value: item.id, label: item.title }))} /></Form.Item><Form.Item name="resume_version_id" label="简历版本" rules={[{ required: true, message: '请先为主简历保存一个版本' }]}><Select options={versions.data?.map((item) => ({ value: item.id, label: `v${item.version_no} · ${item.note || '未命名版本'}` }))} /></Form.Item></Form></Modal>
  </>
}
