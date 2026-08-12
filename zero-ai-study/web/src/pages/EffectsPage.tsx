import { useCallback, useEffect, useState } from 'react'
import { Alert, Button, Card, Empty, Space, Tag, Typography, message } from 'antd'
import { fetchOverview } from '@/api/client'
import type { OverviewResponse } from '@/types/api'

export function EffectsPage() {
  const [data, setData] = useState<OverviewResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setData(await fetchOverview())
    } catch {
      message.error('加载执行效果失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const artifacts = data?.artifacts ?? []

  return (
    <div>
      <h1 className="page-title">执行效果</h1>
      <p className="page-desc">
        查看微调日志、评估记录、概念笔记等产物是否已生成，以及内容预览。
      </p>

      <Space style={{ marginBottom: 20 }}>
        <Button type="primary" loading={loading} onClick={() => void load()}>
          刷新产物
        </Button>
      </Space>

      {!loading && artifacts.length === 0 ? <Empty description="暂无产物信息" /> : null}

      <div className="step-grid">
        {artifacts.map((item) => (
          <Card
            key={item.path}
            className="panel-card"
            loading={loading}
            title={item.name}
            extra={
              <Tag color={item.exists ? 'success' : 'default'}>
                {item.exists ? '已存在' : '未生成'}
              </Tag>
            }
          >
            <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
              {item.path}
              {item.size != null ? ` · ${item.size} bytes` : ''}
            </Typography.Text>
            {item.exists && item.preview ? (
              <pre className="mono-preview">{item.preview}</pre>
            ) : (
              <Alert
                type="info"
                showIcon
                message="尚未生成"
                description="完成对应学习步骤并创建日志文件后，这里会显示摘要。"
              />
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
