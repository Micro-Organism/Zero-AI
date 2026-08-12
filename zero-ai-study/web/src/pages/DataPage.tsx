import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  List,
  Pagination,
  Popconfirm,
  Space,
  Table,
  Tag,
  Timeline,
  Typography,
  message,
} from 'antd'
import {
  CheckOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
} from '@ant-design/icons'
import axios from 'axios'
import {
  fetchActivity,
  fetchDataset,
  saveDataset,
  validateDataset,
} from '@/api/client'
import type { ActionResult, ActivityItem, DatasetItem } from '@/types/api'
import './DataPage.scss'

type TemplateItem = DatasetItem & { id: string }

const templates: TemplateItem[] = [
  { id: 't01', instruction: '用一句话说明什么是 QLoRA。', input: '', output: 'QLoRA 是先把大模型 4bit 量化加载，再只训练 LoRA 适配器，从而在免费 GPU 上也能微调。' },
  { id: 't02', instruction: '求职时如何介绍一次微调实验？', input: '', output: '可以说清数据格式、训练方法（QLoRA）、算力（Kaggle T4）、产物（LoRA/GGUF）和前后对比结论。' },
  { id: 't03', instruction: 'instruction、input、output 分别是什么？', input: '', output: 'instruction 是任务或问题，input 是可选上下文，output 是期望模型给出的回答。' },
  { id: 't04', instruction: '为什么入门不建议先做预训练？', input: '', output: '预训练需要海量数据和大量 GPU；入门应先用现成模型做微调，成本低、闭环快。' },
  { id: 't05', instruction: 'Kaggle 上微调前要准备什么？', input: '', output: '手机验证、选择 GPU（推荐 T4 x2）、在 Secrets 配置 HF_TOKEN，并准备好 jsonl 数据。' },
  { id: 't06', instruction: 'LoRA 和全量微调有什么区别？', input: '', output: '全量微调更新几乎全部参数，成本高；LoRA 只训练少量适配器参数，基座冻结，更省资源。' },
  { id: 't07', instruction: '什么是 SFT？', input: '', output: 'SFT 是监督微调，用带标准答案的问答/指令数据，让模型学会按期望方式回答。' },
  { id: 't08', instruction: '微调完成后常见产物有哪些？', input: '', output: '常见有 LoRA 适配器、合并后的 safetensors，以及转换为 GGUF 供 Ollama/llama.cpp 使用的文件。' },
  { id: 't09', instruction: '为什么免费 GPU 更常用 QLoRA？', input: '', output: '因为显存有限；4bit 量化基座再加 LoRA，能让 7B/8B 模型在 T4/P100 上训起来。' },
  { id: 't10', instruction: 'Prompt 工程和微调有什么不同？', input: '', output: 'Prompt 不改模型权重，只改输入；微调会更新参数或适配器，让行为更稳定可复现。' },
  { id: 't11', instruction: 'RAG 和微调分别解决什么问题？', input: '', output: 'RAG 解决知识新鲜与可引用；微调更适合固定口吻、格式和领域习惯。两者可组合。' },
  { id: 't12', instruction: 'Alpaca 数据格式长什么样？', input: '', output: '每行一个 JSON，包含 instruction、input、output 三个字符串字段，input 可为空。' },
  { id: 't13', instruction: '如何判断微调是否有效？', input: '', output: '用固定测试题对比微调前后回答，看是否更贴任务；同时观察 loss 是否下降且未明显过拟合。' },
  { id: 't14', instruction: 'Unsloth 适合做什么？', input: '', output: '适合在消费级/免费 GPU 上高效做 LoRA/QLoRA 微调，并导出适配器或 GGUF。' },
  { id: 't15', instruction: 'HF Token 有什么用？', input: '', output: '用于登录 Hugging Face，下载门控模型/数据集，也可上传自己的微调产物。' },
  { id: 't16', instruction: '什么时候该选 GPU T4 x2？', input: '', output: 'Kaggle 首轮微调推荐 T4 x2：较新且贴近常见教程；单卡任务通常先用其中一张。' },
  { id: 't17', instruction: '适配器文件为什么比全模型小？', input: '', output: '因为只保存 LoRA 增量参数，不保存整份基座权重，所以体积通常小很多。' },
  { id: 't18', instruction: '训练数据质量重要还是数量重要？', input: '', output: '入门阶段质量优先：字段正确、答案清晰；数量够跑通即可，后续再逐步扩充。' },
  { id: 't19', instruction: '如何避免把密钥提交到 Git？', input: '', output: '把 Token 放在 .env，并确保 .gitignore 忽略 .env；前端只显示脱敏后的 Token。' },
  { id: 't20', instruction: '一次完整微调学习闭环包含哪些步骤？', input: '', output: '准备 Token 与 GPU、理解概念、准备 jsonl 数据、云端 QLoRA 训练、评估对比、导出试用。' },
]

const actionLabel: Record<string, string> = {
  dataset_saved: '保存数据集',
  dataset_validated: '校验数据集',
  concepts_saved: '保存概念笔记',
  kaggle_setup: 'Kaggle GPU',
}

function errMsg(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const detail = e.response?.data?.detail
    if (typeof detail === 'string') return detail
    if (e.message?.includes('Network Error')) return '网络错误：后端可能未启动（请确认 :8000）'
    return e.message || '请求失败'
  }
  return '未知错误'
}

function sameSample(a: DatasetItem, b: DatasetItem): boolean {
  return (
    a.instruction.trim() === b.instruction.trim() &&
    (a.input || '').trim() === (b.input || '').trim() &&
    a.output.trim() === b.output.trim()
  )
}

export function DataPage() {
  const [items, setItems] = useState<DatasetItem[]>([])
  const [path, setPath] = useState('datasets/sample_alpaca_zh.jsonl')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [validating, setValidating] = useState(false)
  const [saveResult, setSaveResult] = useState<ActionResult | null>(null)
  const [validateResult, setValidateResult] = useState<ActionResult | null>(null)
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [samplePage, setSamplePage] = useState(1)
  const [tplPage, setTplPage] = useState(1)
  const [form] = Form.useForm<DatasetItem>()
  const samplePageSize = 5

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [ds, acts] = await Promise.all([fetchDataset(), fetchActivity(30)])
      setItems(ds.items)
      setPath(ds.path)
      setActivity(acts)
    } catch (e) {
      message.error(`加载失败：${errMsg(e)}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const addedHint = useMemo(() => {
    const n = items.length
    return n >= 8
      ? `已有 ${n} 条，达到入门建议`
      : `已有 ${n} 条，还差约 ${Math.max(0, 8 - n)} 条到建议值 8`
  }, [items.length])

  const isTemplateAdded = useCallback(
    (tpl: DatasetItem) => items.some((it) => sameSample(it, tpl)),
    [items],
  )

  const pagedSamples = useMemo(() => {
    const start = (samplePage - 1) * samplePageSize
    return items.slice(start, start + samplePageSize).map((item, i) => ({
      ...item,
      __index: start + i,
    }))
  }, [items, samplePage, samplePageSize])

  const pagedTemplates = useMemo(() => {
    const start = (tplPage - 1) * 5
    return templates.slice(start, start + 5)
  }, [tplPage])

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(items.length / samplePageSize) || 1)
    if (samplePage > maxPage) setSamplePage(maxPage)
  }, [items.length, samplePage, samplePageSize])

  const onAdd = async () => {
    try {
      const values = await form.validateFields()
      const next = { instruction: values.instruction, input: values.input || '', output: values.output }
      if (items.some((it) => sameSample(it, next))) {
        message.warning('列表里已有相同样本，未重复加入')
        return
      }
      setItems((prev) => [...prev, next])
      form.resetFields()
      form.setFieldValue('input', '')
      message.success('已加入列表（记得点保存）')
    } catch {
      /* form errors */
    }
  }

  const onAddTemplate = (tpl: TemplateItem) => {
    if (isTemplateAdded(tpl)) {
      message.info('该模板已加入，无需重复')
      return
    }
    setItems((prev) => [...prev, { instruction: tpl.instruction, input: tpl.input, output: tpl.output }])
    message.success('已加入模板样本（记得点保存）')
  }

  const onSave = async () => {
    setSaving(true)
    try {
      const res = await saveDataset(items)
      setSaveResult(res)
      message[res.ok ? 'success' : 'error'](res.message)
      const ds = await fetchDataset()
      setItems(ds.items)
      setActivity(await fetchActivity(30))
    } catch (e) {
      message.error(`保存失败：${errMsg(e)}`)
      setSaveResult({
        ok: false,
        message: `保存失败：${errMsg(e)}`,
        details: ['请确认后端 http://localhost:8000 已启动'],
        checked_at: new Date().toISOString(),
      })
    } finally {
      setSaving(false)
    }
  }

  const onValidate = async () => {
    setValidating(true)
    try {
      const saved = await saveDataset(items)
      setSaveResult(saved)
      const res = await validateDataset()
      setValidateResult(res)
      message[res.ok ? 'success' : 'warning'](res.message)
      await refresh()
    } catch (e) {
      message.error(`校验失败：${errMsg(e)}`)
    } finally {
      setValidating(false)
    }
  }

  return (
    <div className="data-page">
      <h1 className="page-title">训练数据 · Step 2</h1>
      <p className="page-desc">
        维护 Alpaca 样本并保存到 <code>{path}</code>。若保存失败，多半是后端未启动。
      </p>

      <Alert
        style={{ marginBottom: 16 }}
        type={items.length >= 8 ? 'success' : 'info'}
        showIcon
        message={addedHint}
        description="建议至少 8 条。可从模板加入（已加入会显示状态，避免重复）。"
      />

      <div className="data-layout">
        <div>
          <Card
            className="panel-card"
            title={
              <Space>
                <DatabaseOutlined />
                样本列表
                <Tag color="processing">{items.length} 条</Tag>
              </Space>
            }
            extra={
              <Space wrap>
                <Button icon={<ReloadOutlined />} onClick={() => void refresh()}>
                  刷新
                </Button>
                <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={() => void onSave()}>
                  保存到 jsonl
                </Button>
                <Button loading={validating} onClick={() => void onValidate()}>
                  保存并校验
                </Button>
              </Space>
            }
            loading={loading}
          >
            <Table
              className="sample-table"
              rowKey={(row) => String(row.__index)}
              size="small"
              pagination={false}
              dataSource={pagedSamples}
              scroll={{ x: 720 }}
              columns={[
                {
                  title: '#',
                  width: 50,
                  align: 'center',
                  render: (_, row) => row.__index + 1,
                },
                {
                  title: 'instruction',
                  dataIndex: 'instruction',
                  align: 'center',
                  ellipsis: true,
                },
                {
                  title: 'input',
                  dataIndex: 'input',
                  width: 100,
                  align: 'center',
                  ellipsis: true,
                  render: (v: string) => v || <Tag>空</Tag>,
                },
                {
                  title: 'output',
                  dataIndex: 'output',
                  align: 'center',
                  ellipsis: true,
                },
                {
                  title: '操作',
                  width: 80,
                  align: 'center',
                  render: (_, row) => (
                    <Popconfirm
                      title="删除这条？"
                      onConfirm={() => setItems((prev) => prev.filter((_, i) => i !== row.__index))}
                    >
                      <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  ),
                },
              ]}
            />
            <div className="panel-pagination">
              <Pagination
                current={samplePage}
                pageSize={samplePageSize}
                total={items.length}
                onChange={(p) => setSamplePage(p)}
                showSizeChanger={false}
                showTotal={(t) => `共 ${t} 条样本`}
              />
            </div>
          </Card>

          <Card
            className="panel-card add-card"
            style={{ marginTop: 16 }}
            title={
              <div className="add-card-header">
                <span className="add-card-title">新增一条</span>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => void onAdd()}>
                  加入列表
                </Button>
              </div>
            }
          >
            <Form form={form} layout="vertical" initialValues={{ input: '' }} requiredMark="optional">
              <Form.Item
                name="instruction"
                label="instruction（问题/任务）"
                rules={[{ required: true, message: '必填' }]}
              >
                <Input.TextArea rows={2} placeholder="例如：用一句话解释 LoRA" />
              </Form.Item>
              <Form.Item name="input" label="input（可选上下文）">
                <Input placeholder="可留空" />
              </Form.Item>
              <Form.Item
                name="output"
                label="output（期望回答）"
                rules={[{ required: true, message: '必填' }]}
              >
                <Input.TextArea rows={3} placeholder="期望模型怎么答" />
              </Form.Item>
            </Form>
          </Card>

          <Card
            className="panel-card"
            style={{ marginTop: 16 }}
            title={
              <Space>
                一键加入模板（求职/微调主题）
                <Tag>{templates.length} 条</Tag>
              </Space>
            }
          >
            <div className="template-list">
              {pagedTemplates.map((item) => {
                const added = isTemplateAdded(item)
                return (
                  <div key={item.id} className={added ? 'tpl-row added' : 'tpl-row'}>
                    <div className="tpl-body">
                      <div className="tpl-instruction">{item.instruction}</div>
                      <div className="tpl-output">{item.output}</div>
                    </div>
                    <div className="tpl-action">
                      {added ? (
                        <Tag color="success" icon={<CheckOutlined />}>
                          已加入
                        </Tag>
                      ) : (
                        <Button size="small" type="primary" ghost onClick={() => onAddTemplate(item)}>
                          加入
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="panel-pagination">
              <Pagination
                current={tplPage}
                pageSize={5}
                total={templates.length}
                onChange={(p) => setTplPage(p)}
                showSizeChanger={false}
                showTotal={(t) => `共 ${t} 条模板`}
              />
            </div>
          </Card>
        </div>

        <div>
          <Card className="panel-card" title="校验 / 保存结果">
            {saveResult ? (
              <Alert
                style={{ marginBottom: 12 }}
                type={saveResult.ok ? 'success' : 'error'}
                showIcon
                message={saveResult.message}
                description={saveResult.details.join(' · ')}
              />
            ) : (
              <Alert style={{ marginBottom: 12 }} type="info" showIcon message="保存后显示结果" />
            )}
            {validateResult ? (
              <Alert
                type={validateResult.ok ? 'success' : 'warning'}
                showIcon
                message={validateResult.message}
                description={
                  <List
                    size="small"
                    dataSource={validateResult.details}
                    renderItem={(d) => <List.Item>{d}</List.Item>}
                  />
                }
              />
            ) : (
              <Typography.Paragraph type="secondary">
                点「保存并校验」会写入文件并跑后端校验。
              </Typography.Paragraph>
            )}
          </Card>

          <Card className="panel-card" style={{ marginTop: 16 }} title="字段速记">
            <ul className="data-bullets">
              <li>
                <b>instruction</b>：用户问题或任务
              </li>
              <li>
                <b>input</b>：补充上下文，可空
              </li>
              <li>
                <b>output</b>：期望回答
              </li>
            </ul>
          </Card>

          <Card className="panel-card" style={{ marginTop: 16 }} title="操作记录">
            <Timeline
              items={activity.slice(0, 10).map((item) => ({
                color: item.ok ? 'green' : 'red',
                children: (
                  <div>
                    <div>
                      <Tag>{actionLabel[item.action] || item.action}</Tag>
                      {item.message}
                    </div>
                    <div style={{ fontSize: 12, color: '#5c6f66' }}>
                      {new Date(item.ts).toLocaleString()}
                    </div>
                  </div>
                ),
              }))}
            />
          </Card>
        </div>
      </div>
    </div>
  )
}
