import { useState } from 'react'
import { Button, Card, Empty, List, Space, Table, message } from 'antd'
import { DownloadOutlined, PrinterOutlined, SaveOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, downloadUrl } from '@/api/client'
import type { PageResult, Resume, ResumeVersion } from '@/api/types'
import { PageHeader } from '@/components/PageHeader'
import { ResumePreview } from '@/components/ResumePreview'

export function TargetedResumePage() {
  const [selected, setSelected] = useState<Resume>()
  const [previewVersion, setPreviewVersion] = useState<ResumeVersion>()
  const queryClient = useQueryClient()
  const resumes = useQuery({ queryKey: ['resumes'], queryFn: () => api<PageResult<Resume>>('/resumes?page=1&page_size=100') })
  const versions = useQuery({ queryKey: ['resume-versions', selected?.id], enabled: !!selected, queryFn: () => api<ResumeVersion[]>(`/resumes/${selected!.id}/versions`) })
  const createVersion = useMutation({ mutationFn: (resume: Resume) => api<ResumeVersion>(`/resumes/${resume.id}/versions`, { method: 'POST', body: JSON.stringify({ note: `定制版 ${new Date().toLocaleString()}` }) }), onSuccess: (version, resume) => { setSelected(resume); setPreviewVersion(version); queryClient.invalidateQueries({ queryKey: ['resume-versions', resume.id] }); message.success('定制简历版本已保存，可导出或打印') } })
  const targeted = resumes.data?.items.filter((item) => item.kind === 'targeted') ?? []
  return <><PageHeader title="定制简历" description="每份岗位定制简历都保留主简历来源和匹配项目，不会污染主档案。" /><List grid={{ gutter: 16, xs: 1, md: 2, xl: 3 }} dataSource={targeted} locale={{ emptyText: <Empty description="在求职匹配页面生成第一份定制简历" /> }} renderItem={(item) => <List.Item><Card title={item.title} actions={[<Button type="text" icon={<SaveOutlined />} loading={createVersion.isPending} onClick={() => createVersion.mutate(item)}>保存版本</Button>, <Button type="text" onClick={() => { setSelected(item); setPreviewVersion(undefined) }}>查看版本</Button>]}><p>{item.summary || '待完善岗位定制摘要'}</p><p>匹配度：{String(item.content.match_score ?? '-')}%</p><small>来源匹配：{item.source_matching_id}</small></Card></List.Item>} />{selected ? <div style={{ marginTop: 20 }}><ResumePreview resume={selected} version={previewVersion ?? versions.data?.[0]} /><Card className="no-print" title="版本导出" style={{ marginTop: 16 }} extra={<Button icon={<PrinterOutlined />} onClick={() => window.print()}>打印/PDF</Button>}><Table rowKey="id" pagination={false} dataSource={versions.data ?? []} columns={[{ title: '版本', dataIndex: 'version_no', render: (value: number) => `v${value}` }, { title: '说明', dataIndex: 'note' }, { title: '操作', render: (_: unknown, row: ResumeVersion) => <Space><Button type="link" onClick={() => setPreviewVersion(row)}>预览</Button><Button type="link" icon={<DownloadOutlined />} href={downloadUrl(`/resume-versions/${row.id}/export/docx`)}>DOCX</Button><Button type="link" href={downloadUrl(`/resume-versions/${row.id}/export/markdown`)}>Markdown</Button><Button type="link" href={downloadUrl(`/resume-versions/${row.id}/export/json`)}>JSON</Button></Space> }]} /></Card></div> : null}</>
}
