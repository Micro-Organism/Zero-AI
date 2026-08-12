import { useState } from 'react'
import { Button, Drawer, Form, Input, Modal, Popconfirm, Select, Space, Table, Tag, Typography, message } from 'antd'
import { DeleteOutlined, EditOutlined, FileSearchOutlined, PlusOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { JobPosting, JobRequirement, PageResult } from '@/api/types'
import { PageHeader } from '@/components/PageHeader'
import { StatusTag } from '@/components/StatusTag'

export function RecruitmentPage() {
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<JobPosting>()
  const [detailId, setDetailId] = useState<string>()
  const [form] = Form.useForm()
  const queryClient = useQueryClient()
  const jobs = useQuery({ queryKey: ['jobs', page, keyword], queryFn: () => api<PageResult<JobPosting>>(`/job-postings?page=${page}&page_size=10&keyword=${encodeURIComponent(keyword)}`) })
  const detail = useQuery({ queryKey: ['job-detail', detailId], enabled: !!detailId, queryFn: () => api<{ job: JobPosting; requirements: JobRequirement[] }>(`/job-postings/${detailId}`) })
  const save = useMutation({ mutationFn: (values: Record<string, unknown>) => api<JobPosting>(editing ? `/job-postings/${editing.id}` : '/job-postings', { method: editing ? 'PUT' : 'POST', body: JSON.stringify(values) }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['jobs'] }); setOpen(false); setEditing(undefined); form.resetFields(); message.success('招聘信息已保存') } })
  const remove = useMutation({ mutationFn: (id: string) => api(`/job-postings/${id}`, { method: 'DELETE' }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['jobs'] }); message.success('招聘信息已移入回收站') } })
  const extract = useMutation({ mutationFn: (id: string) => api(`/job-postings/${id}/extract`, { method: 'POST' }), onSuccess: (_, id) => { queryClient.invalidateQueries({ queryKey: ['job-detail', id] }); message.success('岗位要求已提取，可继续人工校对') } })

  return <>
    <PageHeader title="招聘信息" description="持续积累岗位原文，并将企业要求拆解成可比较的能力项。" actions={<Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(undefined); form.resetFields(); setOpen(true) }}>录入招聘</Button>} />
    <div className="toolbar"><Input.Search allowClear placeholder="搜索岗位或原文" style={{ maxWidth: 360 }} onSearch={(value) => { setKeyword(value); setPage(1) }} /><Typography.Text type="secondary">共 {jobs.data?.total ?? 0} 条招聘样本</Typography.Text></div>
    <Table rowKey="id" loading={jobs.isLoading} dataSource={jobs.data?.items ?? []} pagination={{ current: page, pageSize: 10, total: jobs.data?.total, onChange: setPage }} columns={[{ title: '岗位', dataIndex: 'title' }, { title: '岗位族', dataIndex: 'job_family' }, { title: '地点', dataIndex: 'location', render: (value) => value || '-' }, { title: '状态', dataIndex: 'status', render: (value) => <StatusTag status={value} /> }, { title: '更新时间', dataIndex: 'updated_at', render: (value) => new Date(value).toLocaleDateString() }, { title: '操作', render: (_, row: JobPosting) => <Space><Button type="link" icon={<FileSearchOutlined />} onClick={() => setDetailId(row.id)}>查看</Button><Button type="link" icon={<ThunderboltOutlined />} loading={extract.isPending} onClick={() => extract.mutate(row.id)}>提取</Button><Button type="text" icon={<EditOutlined />} title="编辑" onClick={() => { setEditing(row); form.setFieldsValue(row); setOpen(true) }} /><Popconfirm title="移入回收站？" onConfirm={() => remove.mutate(row.id)}><Button danger type="text" icon={<DeleteOutlined />} title="删除" /></Popconfirm></Space> }]} />
    <Modal title={editing ? '编辑招聘信息' : '录入招聘信息'} width={720} open={open} onCancel={() => { setOpen(false); setEditing(undefined) }} onOk={() => form.submit()} confirmLoading={save.isPending}><Form form={form} layout="vertical" initialValues={{ job_family: '人工智能工程师', status: 'active' }} onFinish={(values) => save.mutate(values)}><Form.Item name="title" label="岗位名称" rules={[{ required: true }]}><Input /></Form.Item><div className="form-grid"><Form.Item name="job_family" label="岗位族"><Input /></Form.Item><Form.Item name="level" label="级别"><Input /></Form.Item><Form.Item name="location" label="地点"><Input /></Form.Item><Form.Item name="status" label="状态"><Select options={[{ value: 'active', label: '进行中' }, { value: 'archived', label: '已归档' }]} /></Form.Item></div><Form.Item name="source_url" label="来源链接"><Input /></Form.Item><Form.Item name="source_text" label="招聘原文" rules={[{ required: true }]}><Input.TextArea rows={12} /></Form.Item></Form></Modal>
    <Drawer title={detail.data?.job.title ?? '岗位详情'} width={720} open={!!detailId} onClose={() => setDetailId(undefined)}><Typography.Title level={5}>招聘原文</Typography.Title><div className="detail-pre">{detail.data?.job.source_text}</div><Typography.Title level={5} style={{ marginTop: 24 }}>结构化要求</Typography.Title><Table rowKey="id" pagination={false} dataSource={detail.data?.requirements ?? []} columns={[{ title: '类型', dataIndex: 'kind', render: (value) => <Tag>{value}</Tag> }, { title: '技能', dataIndex: 'skill' }, { title: '要求', dataIndex: 'description' }, { title: '重要度', dataIndex: 'importance' }]} /></Drawer>
  </>
}
