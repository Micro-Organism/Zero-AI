import { useState } from 'react'
import { Button, Card, Empty, Popconfirm, Space, Table, Tabs, Upload, message } from 'antd'
import { DeleteOutlined, DownloadOutlined, InboxOutlined, ReloadOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { UploadProps } from 'antd'
import { api, downloadUrl } from '@/api/client'
import type { FileAsset, PageResult, ProcessingTask } from '@/api/types'
import { PageHeader } from '@/components/PageHeader'
import { StatusTag } from '@/components/StatusTag'
import { TaskProgress } from '@/components/TaskProgress'

export function FilesTasksPage() {
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()
  const files = useQuery({ queryKey: ['files', page], queryFn: () => api<PageResult<FileAsset>>(`/files?page=${page}&page_size=10`) })
  const tasks = useQuery({ queryKey: ['tasks'], queryFn: () => api<ProcessingTask[]>('/system/tasks'), refetchInterval: 5000 })
  const remove = useMutation({ mutationFn: (id: string) => api(`/files/${id}`, { method: 'DELETE' }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['files'] }); message.success('文件已移入回收站') } })

  const upload: UploadProps['customRequest'] = async ({ file, onSuccess, onError }) => {
    const data = new FormData()
    data.append('file', file as Blob)
    try {
      await api<FileAsset>('/files', { method: 'POST', body: data })
      await queryClient.invalidateQueries({ queryKey: ['files'] })
      onSuccess?.({})
      message.success('文件上传并解析完成')
    } catch (error) {
      onError?.(error as Error)
      message.error(error instanceof Error ? error.message : '上传失败')
    }
  }

  return <>
    <PageHeader title="文件与任务" description="集中管理简历、招聘附件、解析结果和后台处理进度。" actions={<Button icon={<ReloadOutlined />} onClick={() => { files.refetch(); tasks.refetch() }}>刷新</Button>} />
    <Tabs items={[
      { key: 'files', label: '文件库', children: <>
        <Upload.Dragger className="upload-zone" customRequest={upload} showUploadList={false} multiple accept=".txt,.md,.json,.docx,.pdf,.png,.jpg,.jpeg">
          <p className="ant-upload-drag-icon"><InboxOutlined /></p>
          <p className="ant-upload-text">点击或拖入文件</p>
          <p className="ant-upload-hint">支持 TXT、Markdown、JSON、DOCX、PDF 和图片，单文件最大 15 MB</p>
        </Upload.Dragger>
        <Card style={{ marginTop: 16 }}>
          <Table rowKey="id" loading={files.isLoading} dataSource={files.data?.items ?? []} pagination={{ current: page, pageSize: 10, total: files.data?.total, onChange: setPage }} columns={[
            { title: '文件名', dataIndex: 'original_name' },
            { title: '类型', dataIndex: 'mime_type', responsive: ['md'] },
            { title: '大小', dataIndex: 'size', render: (size: number) => `${(size / 1024).toFixed(1)} KB` },
            { title: '状态', dataIndex: 'status', render: (status: string) => <StatusTag status={status} /> },
            { title: '操作', key: 'actions', render: (_: unknown, row: FileAsset) => <Space><Button type="text" icon={<DownloadOutlined />} href={downloadUrl(`/files/${row.id}/download`)} title="下载" /><Popconfirm title="移入回收站？" onConfirm={() => remove.mutate(row.id)}><Button danger type="text" icon={<DeleteOutlined />} title="删除" /></Popconfirm></Space> },
          ]} />
        </Card>
      </> },
      { key: 'tasks', label: `处理任务 (${tasks.data?.length ?? 0})`, children: <div className="task-list">{tasks.data?.length ? tasks.data.map((task) => <TaskProgress key={task.id} task={task} />) : <Empty description="暂无处理任务" />}</div> },
    ]} />
  </>
}
