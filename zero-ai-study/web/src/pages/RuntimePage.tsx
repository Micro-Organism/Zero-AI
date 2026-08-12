import { useState } from 'react'
import { Alert, Button, Card, List, Space, message } from 'antd'
import { checkEnv, validateDataset } from '@/api/client'
import type { ActionResult } from '@/types/api'

export function RuntimePage() {
  const [env, setEnv] = useState<ActionResult | null>(null)
  const [dataset, setDataset] = useState<ActionResult | null>(null)
  const [loadingEnv, setLoadingEnv] = useState(false)
  const [loadingDs, setLoadingDs] = useState(false)

  const runEnv = async () => {
    setLoadingEnv(true)
    try {
      const res = await checkEnv()
      setEnv(res)
      message[res.ok ? 'success' : 'warning'](res.message)
    } catch {
      message.error('环境检查请求失败')
    } finally {
      setLoadingEnv(false)
    }
  }

  const runDs = async () => {
    setLoadingDs(true)
    try {
      const res = await validateDataset()
      setDataset(res)
      message[res.ok ? 'success' : 'warning'](res.message)
    } catch {
      message.error('数据集校验请求失败')
    } finally {
      setLoadingDs(false)
    }
  }

  return (
    <div>
      <h1 className="page-title">运行检查</h1>
      <p className="page-desc">调用后端执行环境检查与样例数据集校验，结果即时展示。</p>

      <Space wrap style={{ marginBottom: 20 }}>
        <Button type="primary" loading={loadingEnv} onClick={() => void runEnv()}>
          执行环境检查
        </Button>
        <Button loading={loadingDs} onClick={() => void runDs()}>
          校验样例数据集
        </Button>
      </Space>

      <div className="step-grid">
        <Card className="panel-card" title="环境检查">
          {env ? (
            <>
              <Alert
                type={env.ok ? 'success' : 'warning'}
                showIcon
                message={env.message}
                description={`检查时间：${env.checked_at}`}
                style={{ marginBottom: 12 }}
              />
              <List
                size="small"
                dataSource={env.details}
                renderItem={(item) => <List.Item>{item}</List.Item>}
              />
            </>
          ) : (
            <Alert type="info" message="尚未执行，点击上方按钮开始" showIcon />
          )}
        </Card>

        <Card className="panel-card" title="数据集校验">
          {dataset ? (
            <>
              <Alert
                type={dataset.ok ? 'success' : 'error'}
                showIcon
                message={dataset.message}
                description={`检查时间：${dataset.checked_at}`}
                style={{ marginBottom: 12 }}
              />
              <List
                size="small"
                dataSource={dataset.details}
                renderItem={(item) => <List.Item>{item}</List.Item>}
              />
            </>
          ) : (
            <Alert type="info" message="尚未执行，点击上方按钮开始" showIcon />
          )}
        </Card>
      </div>
    </div>
  )
}
