import { useCallback, useEffect, useState } from 'react'
import { Card, Input, Select, Space, Table, Tag, message } from 'antd'
import { fetchProgress, updateStep } from '@/api/client'
import type { ProgressResponse, StepId, StepStatus } from '@/types/api'

const statusOptions = [
  { value: 'todo', label: '未开始' },
  { value: 'doing', label: '进行中' },
  { value: 'done', label: '已完成' },
]

export function StepsPage() {
  const [data, setData] = useState<ProgressResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setData(await fetchProgress())
    } catch {
      message.error('加载进度失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const onStatus = async (id: StepId, status: StepStatus) => {
    try {
      setData(await updateStep(id, status))
      message.success('已更新状态')
    } catch {
      message.error('更新失败')
    }
  }

  const onNote = async (id: StepId, note: string, status: StepStatus) => {
    try {
      setData(await updateStep(id, status, note))
      message.success('备注已保存')
    } catch {
      message.error('保存备注失败')
    }
  }

  return (
    <div>
      <h1 className="page-title">学习步骤</h1>
      <p className="page-desc">在这里更新每一步的学习状态与备注，前端会写入 data/progress.json。</p>

      <Card className="panel-card">
        <Table
          rowKey="id"
          loading={loading}
          pagination={false}
          scroll={{ x: 720 }}
          dataSource={data?.steps ?? []}
          columns={[
            {
              title: '步骤',
              dataIndex: 'title',
              render: (title: string, row) => (
                <Space direction="vertical" size={0}>
                  <strong>{title}</strong>
                  <Tag>{row.dir}</Tag>
                </Space>
              ),
            },
            {
              title: '状态',
              dataIndex: 'status',
              width: 160,
              render: (status: StepStatus, row) => (
                <Select
                  style={{ width: 130 }}
                  value={status}
                  options={statusOptions}
                  onChange={(v) => void onStatus(row.id, v as StepStatus)}
                />
              ),
            },
            {
              title: '备注',
              dataIndex: 'note',
              render: (note: string, row) => (
                <Input.TextArea
                  autoSize={{ minRows: 1, maxRows: 3 }}
                  defaultValue={note}
                  placeholder="例如：已完成 HF Token"
                  onBlur={(e) => {
                    if (e.target.value !== note) {
                      void onNote(row.id, e.target.value, row.status)
                    }
                  }}
                />
              ),
            },
          ]}
        />
      </Card>
    </div>
  )
}
