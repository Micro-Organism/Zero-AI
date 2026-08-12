import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Input,
  List,
  Radio,
  Space,
  Steps,
  Tag,
  Timeline,
  Typography,
  message,
} from 'antd'
import {
  CheckCircleOutlined,
  CloudServerOutlined,
  KeyOutlined,
  LinkOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons'
import {
  confirmKaggleSetup,
  fetchActivity,
  fetchKaggleStatus,
  fetchTokenStatus,
  saveToken,
  testToken,
  updateStep,
} from '@/api/client'
import type {
  ActionResult,
  ActivityItem,
  KaggleAccelerator,
  KaggleSetupStatus,
  TokenStatus,
  TokenTestResult,
} from '@/types/api'
import './SetupPage.scss'

const actionLabel: Record<string, string> = {
  token_saved: '保存 Token',
  token_tested: '测试 Token',
  env_checked: '环境检查',
  dataset_validated: '数据集校验',
  kaggle_setup: 'Kaggle GPU',
}

const accelOptions: { value: KaggleAccelerator; title: string; desc: string; tag?: string }[] = [
  {
    value: 'gpu_t4_x2',
    title: 'GPU T4 x2',
    desc: '推荐。较新，和 Unsloth/Colab 场景接近；首轮通常用其中一张 T4 即可。',
    tag: '最推荐',
  },
  {
    value: 'gpu_p100',
    title: 'GPU P100',
    desc: '单卡更直观，也能跑通 QLoRA；没有 T4 时再选它。',
  },
  {
    value: 'cpu',
    title: 'CPU',
    desc: '只能写代码，不能做本轮微调。',
  },
]

export function SetupPage() {
  const [status, setStatus] = useState<TokenStatus | null>(null)
  const [tokenInput, setTokenInput] = useState('')
  const [testResult, setTestResult] = useState<TokenTestResult | null>(null)
  const [kaggle, setKaggle] = useState<KaggleSetupStatus | null>(null)
  const [kaggleResult, setKaggleResult] = useState<ActionResult | null>(null)
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(true)

  const [account, setAccount] = useState('coolrabbit1993')
  const [notebookName, setNotebookName] = useState('zero-notebook')
  const [accelerator, setAccelerator] = useState<KaggleAccelerator>('gpu_t4_x2')
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [secretHf, setSecretHf] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [st, kg, acts] = await Promise.all([
        fetchTokenStatus(),
        fetchKaggleStatus(),
        fetchActivity(40),
      ])
      setStatus(st)
      setKaggle(kg)
      setActivity(acts)
      setAccount(kg.account || 'coolrabbit1993')
      setNotebookName(kg.notebook_name || 'zero-notebook')
      if (kg.accelerator !== 'none') setAccelerator(kg.accelerator)
      setPhoneVerified(kg.phone_verified)
      setSecretHf(kg.secret_hf_token)
    } catch {
      message.error('无法加载准备工作状态，请确认后端已启动')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const tokenOk = Boolean(testResult?.ok || status?.configured)
  const kaggleOk = Boolean(kaggle?.gpu_selected && kaggle?.phone_verified)
  const stepIndex = useMemo(() => {
    if (kaggleOk) return 4
    if (tokenOk && testResult?.ok) return 3
    if (status?.configured) return 2
    if (status?.configured === false) return 0
    return status?.configured ? 1 : 0
  }, [kaggleOk, tokenOk, testResult?.ok, status?.configured])

  const onSave = async () => {
    if (!tokenInput.trim()) {
      message.warning('请先粘贴 Token')
      return
    }
    setSaving(true)
    try {
      const res = await saveToken(tokenInput.trim())
      message[res.ok ? 'success' : 'error'](res.message)
      setTokenInput('')
      await refresh()
    } catch {
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const onTest = async (useInput = false) => {
    setTesting(true)
    try {
      const res = await testToken(useInput ? tokenInput.trim() || undefined : undefined)
      setTestResult(res)
      message[res.ok ? 'success' : 'error'](res.message)
      if (res.ok) {
        await updateStep(
          'setup',
          'doing',
          `HF Token 测试通过${res.username ? `（${res.username}）` : ''}`,
        )
      }
      await refresh()
    } catch {
      message.error('测试请求失败（可能是网络无法访问 Hugging Face）')
    } finally {
      setTesting(false)
    }
  }

  const onConfirmKaggle = async () => {
    if (!phoneVerified) {
      message.warning('请先完成手机验证，并勾选「已完成手机验证」')
      return
    }
    if (accelerator !== 'gpu_t4_x2' && accelerator !== 'gpu_p100') {
      message.warning('微调请选择 GPU T4 x2（推荐）或 P100')
      return
    }
    setConfirming(true)
    try {
      const res = await confirmKaggleSetup({
        account,
        notebook_name: notebookName,
        accelerator,
        phone_verified: phoneVerified,
        secret_hf_token: secretHf,
        note: accelerator === 'gpu_t4_x2' ? '已选推荐方案 T4 x2' : '已选 P100',
      })
      setKaggleResult(res)
      message[res.ok ? 'success' : 'warning'](res.message)
      if (res.ok && tokenOk) {
        await updateStep(
          'setup',
          'done',
          `Token OK + Kaggle ${accelerator === 'gpu_t4_x2' ? 'T4 x2' : 'P100'}`,
        )
      }
      await refresh()
    } catch {
      message.error('保存 Kaggle 校验失败')
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className="setup-page">
      <h1 className="page-title">准备工作 · Step 0</h1>
      <p className="page-desc">
        按步骤推进：HF Token → Kaggle GPU。左侧操作、右侧结果，底部是操作记录。
      </p>

      <Card className="panel-card" style={{ marginBottom: 20 }} loading={loading}>
        <Steps
          current={Math.min(stepIndex, 4)}
          items={[
            { title: '创建 Token', description: 'HF 网站' },
            { title: '写入本地', description: '.env' },
            { title: '测试 Token', description: 'whoami' },
            { title: '选 Kaggle GPU', description: 'T4 x2 推荐' },
            { title: '校验确认', description: '写入记录' },
          ]}
        />
      </Card>

      <Typography.Title level={4}>① Hugging Face Token</Typography.Title>
      <div className="setup-grid">
        <Card
          className="panel-card"
          title={
            <Space>
              <KeyOutlined />
              Token 操作
            </Space>
          }
          extra={
            <Button icon={<ReloadOutlined />} onClick={() => void refresh()}>
              刷新
            </Button>
          }
        >
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Alert
              type={status?.configured ? 'success' : 'info'}
              showIcon
              message={
                status?.configured
                  ? `本地已配置 Token：${status.masked}`
                  : '本地尚未配置有效 Token'
              }
              description={
                status?.configured
                  ? `来源：${status.source || '未知'} · 文件：${status.env_file_path}`
                  : '可在下方粘贴后保存；Token 只存本机 .env'
              }
            />

            <div>
              <Typography.Text strong>打开 HF Token 页面</Typography.Text>
              <div style={{ marginTop: 8 }}>
                <Button
                  type="link"
                  icon={<LinkOutlined />}
                  href="https://huggingface.co/settings/tokens"
                  target="_blank"
                  rel="noreferrer"
                  style={{ paddingInline: 0 }}
                >
                  huggingface.co/settings/tokens
                </Button>
              </div>
            </div>

            <div>
              <Typography.Text strong>粘贴 Token（可选覆盖）</Typography.Text>
              <Input.Password
                style={{ marginTop: 8 }}
                placeholder="hf_xxxxxxxx…"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                autoComplete="off"
              />
              <Space wrap style={{ marginTop: 12 }}>
                <Button type="primary" loading={saving} onClick={() => void onSave()}>
                  保存到 .env
                </Button>
                <Button
                  loading={testing}
                  icon={<SafetyCertificateOutlined />}
                  onClick={() => void onTest(false)}
                >
                  测试已保存的 Token
                </Button>
              </Space>
            </div>
          </Space>
        </Card>

        <Card
          className="panel-card"
          title={
            <Space>
              <SafetyCertificateOutlined />
              Token 测试结果
            </Space>
          }
        >
          {testResult ? (
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Alert
                type={testResult.ok ? 'success' : 'error'}
                showIcon
                icon={testResult.ok ? <CheckCircleOutlined /> : undefined}
                message={testResult.message}
                description={`时间：${testResult.checked_at}`}
              />
              <div>
                <Tag color={testResult.ok ? 'success' : 'error'}>
                  {testResult.ok ? '可用' : '不可用'}
                </Tag>
                {testResult.masked ? <Tag>脱敏 {testResult.masked}</Tag> : null}
                {testResult.username ? <Tag color="blue">用户 {testResult.username}</Tag> : null}
              </div>
              <List
                size="small"
                dataSource={testResult.details}
                renderItem={(item) => <List.Item>{item}</List.Item>}
              />
            </Space>
          ) : (
            <Alert type="info" showIcon message="还没有测试过 Token" />
          )}
        </Card>
      </div>

      <Typography.Title level={4} style={{ marginTop: 28 }}>
        ② Kaggle GPU（账号 coolrabbit1993）
      </Typography.Title>
      <Alert
        style={{ marginBottom: 16 }}
        type="success"
        showIcon
        message="最推荐：选 GPU T4 x2"
        description="第一轮 Unsloth QLoRA 用 T4 x2。P100 也能跑，作备选。不要选 CPU。"
      />

      <div className="setup-grid">
        <Card
          className="panel-card"
          title={
            <Space>
              <CloudServerOutlined />
              Kaggle 选择与勾选
            </Space>
          }
        >
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <div>
              <Typography.Text strong>账号 / Notebook</Typography.Text>
              <Space direction="vertical" style={{ width: '100%', marginTop: 8 }}>
                <Input value={account} onChange={(e) => setAccount(e.target.value)} addonBefore="账号" />
                <Input
                  value={notebookName}
                  onChange={(e) => setNotebookName(e.target.value)}
                  addonBefore="Notebook"
                />
              </Space>
            </div>

            <div>
              <Typography.Text strong>Accelerator（去 Kaggle 选完后，在这里登记）</Typography.Text>
              <Radio.Group
                style={{ width: '100%', marginTop: 12 }}
                value={accelerator}
                onChange={(e) => setAccelerator(e.target.value)}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  {accelOptions.map((opt) => (
                    <Radio
                      key={opt.value}
                      value={opt.value}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        whiteSpace: 'normal',
                        height: 'auto',
                        padding: '10px 12px',
                        border: '1px solid #d7e3dc',
                        borderRadius: 10,
                        background: accelerator === opt.value ? '#e6f4ee' : '#fff',
                      }}
                    >
                      <div>
                        <Space>
                          <strong>{opt.title}</strong>
                          {opt.tag ? <Tag color="green">{opt.tag}</Tag> : null}
                        </Space>
                        <div style={{ color: '#5c6f66', fontSize: 13, marginTop: 4 }}>{opt.desc}</div>
                      </div>
                    </Radio>
                  ))}
                </Space>
              </Radio.Group>
            </div>

            <Checkbox checked={phoneVerified} onChange={(e) => setPhoneVerified(e.target.checked)}>
              我已完成 Kaggle 手机验证（Phone Verification）
            </Checkbox>
            <Checkbox checked={secretHf} onChange={(e) => setSecretHf(e.target.checked)}>
              我已在 Kaggle Add-ons → Secrets 添加 HF_TOKEN
            </Checkbox>

            <Button type="primary" loading={confirming} onClick={() => void onConfirmKaggle()}>
              校验并保存 Kaggle 配置
            </Button>
          </Space>
        </Card>

        <Card className="panel-card" title="Kaggle 校验结果">
          {kaggleResult ? (
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Alert
                type={kaggleResult.ok ? 'success' : 'warning'}
                showIcon
                message={kaggleResult.message}
                description={`时间：${kaggleResult.checked_at}`}
              />
              <List
                size="small"
                dataSource={kaggleResult.details}
                renderItem={(item) => <List.Item>{item}</List.Item>}
              />
            </Space>
          ) : kaggle?.confirmed_at ? (
            <Alert
              type={kaggle.gpu_selected && kaggle.phone_verified ? 'success' : 'warning'}
              showIcon
              message={`上次确认：${kaggle.accelerator}`}
              description={`账号 ${kaggle.account} · Notebook ${kaggle.notebook_name} · ${kaggle.confirmed_at}`}
            />
          ) : (
            <Alert
              type="info"
              showIcon
              message="还没有校验过 Kaggle"
              description="在 Kaggle 选好 GPU T4 x2 后，左侧勾选并点「校验并保存」。"
            />
          )}
        </Card>
      </div>

      <Card
        className="panel-card"
        style={{ marginTop: 20 }}
        title="我做了什么（操作记录）"
        extra={<Typography.Text type="secondary">最近 {activity.length} 条</Typography.Text>}
      >
        {activity.length === 0 ? (
          <Alert type="info" message="暂无记录" showIcon />
        ) : (
          <Timeline
            items={activity.map((item) => ({
              color: item.ok ? 'green' : 'red',
              children: (
                <div className="activity-item">
                  <div className="activity-title">
                    <Tag>{actionLabel[item.action] || item.action}</Tag>
                    <span>{item.message}</span>
                  </div>
                  <div className="activity-meta">{new Date(item.ts).toLocaleString()}</div>
                </div>
              ),
            }))}
          />
        )}
      </Card>
    </div>
  )
}
