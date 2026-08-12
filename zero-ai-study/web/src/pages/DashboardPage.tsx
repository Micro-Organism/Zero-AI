import { useCallback, useEffect, useState } from 'react'
import { Button, Card, Progress, Space, Tag, Typography, message, Alert } from 'antd'
import { Link } from 'react-router-dom'
import { checkEnv, fetchOverview, validateDataset } from '@/api/client'
import type { OverviewResponse } from '@/types/api'

const statusColor = {
  todo: 'default',
  doing: 'processing',
  done: 'success',
} as const

const statusLabel = {
  todo: '未开始',
  doing: '进行中',
  done: '已完成',
} as const

export function DashboardPage() {
  const [data, setData] = useState<OverviewResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setData(await fetchOverview())
    } catch {
      message.error('无法加载总览，请确认后端已启动')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const runChecks = async () => {
    try {
      const [env, ds] = await Promise.all([checkEnv(), validateDataset()])
      message[env.ok ? 'success' : 'warning'](env.message)
      message[ds.ok ? 'success' : 'warning'](ds.message)
      await load()
    } catch {
      message.error('检查失败')
    }
  }

  const progress = data?.progress
  const nextStep = progress?.steps.find((s) => s.status !== 'done')
  const nextLink =
    nextStep?.id === 'setup'
      ? '/setup'
      : nextStep?.id === 'concepts'
        ? '/concepts'
        : nextStep?.id === 'data'
          ? '/data'
          : nextStep?.id === 'finetune'
            ? '/finetune'
            : nextStep?.id === 'eval'
              ? '/eval'
              : nextStep?.id === 'export'
                ? '/export'
                : nextStep?.id === 'data_craft'
                  ? '/data-craft'
                  : nextStep?.id === 'hparams'
                    ? '/hparams'
                    : nextStep?.id === 'retrain'
                      ? '/retrain'
                      : nextStep?.id === 'engineering'
                        ? '/engineering'
                        : '/steps'

  return (
    <div>
      <h1 className="page-title">学习总览</h1>
      <p className="page-desc">
        跟踪 Step 0～9 进度，并快速查看环境 / 数据检查与执行产物状态。
      </p>

      {nextStep ? (
        <Alert
          style={{ marginBottom: 16 }}
          type="info"
          showIcon
          message={`下一步：${nextStep.title}`}
          description={nextStep.note || '按 step by step 继续；可从左侧菜单进入对应页面。'}
          action={
            <Link to={nextLink}>
              <Button type="primary" size="small">
                去完成
              </Button>
            </Link>
          }
        />
      ) : null}

      <Space wrap style={{ marginBottom: 20 }}>
        <Button type="primary" onClick={() => void load()} loading={loading}>
          刷新
        </Button>
        <Button onClick={() => void runChecks()}>一键环境+数据检查</Button>
        <Link to="/setup">
          <Button type="default">准备工作</Button>
        </Link>
        <Link to="/concepts">
          <Button>概念笔记</Button>
        </Link>
        <Link to="/data">
          <Button>训练数据</Button>
        </Link>
        <Link to="/steps">
          <Button>学习步骤</Button>
        </Link>
      </Space>

      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <Card className="panel-card" loading={loading}>
          <Typography.Text type="secondary">完成进度</Typography.Text>
          <div style={{ marginTop: 12 }}>
            <Progress
              type="dashboard"
              percent={progress?.percent ?? 0}
              strokeColor="#1f7a5c"
            />
          </div>
        </Card>
        <Card className="panel-card" loading={loading}>
          <Typography.Text type="secondary">已完成步骤</Typography.Text>
          <Typography.Title level={2} style={{ margin: '12px 0 0' }}>
            {progress?.done_count ?? 0}/{progress?.total_count ?? 6}
          </Typography.Title>
        </Card>
        <Card className="panel-card" loading={loading}>
          <Typography.Text type="secondary">产物已生成</Typography.Text>
          <Typography.Title level={2} style={{ margin: '12px 0 0' }}>
            {data?.artifacts.filter((a) => a.exists).length ?? 0}/
            {data?.artifacts.length ?? 0}
          </Typography.Title>
        </Card>
        <Card className="panel-card" loading={loading}>
          <Typography.Text type="secondary">工程根目录</Typography.Text>
          <Typography.Paragraph
            ellipsis={{ rows: 3 }}
            style={{ marginTop: 12, marginBottom: 0, fontFamily: 'monospace', fontSize: 12 }}
          >
            {data?.study_root ?? '—'}
          </Typography.Paragraph>
        </Card>
      </div>

      <h2 style={{ marginBottom: 12 }}>步骤卡片</h2>
      <div className="step-grid">
        {(progress?.steps ?? []).map((step) => (
          <Card key={step.id} className="panel-card" title={step.title} loading={loading}>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Tag color={statusColor[step.status]}>{statusLabel[step.status]}</Tag>
              <Typography.Text type="secondary">目录：{step.dir}</Typography.Text>
              {step.note ? <Typography.Paragraph>{step.note}</Typography.Paragraph> : null}
            </Space>
          </Card>
        ))}
      </div>
    </div>
  )
}
