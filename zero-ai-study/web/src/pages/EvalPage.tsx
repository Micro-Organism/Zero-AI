import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Input,
  Space,
  Steps,
  Tag,
  Typography,
  message,
} from 'antd'
import {
  CheckCircleOutlined,
  CopyOutlined,
  ExperimentOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SaveOutlined,
} from '@ant-design/icons'
import {
  confirmEvalChecklist,
  fetchEvalChecklist,
  updateStep,
  validateEvalChecklist,
} from '@/api/client'
import type { ActionResult, EvalChecklist, EvalQuestion } from '@/types/api'
import './EvalPage.scss'

const INFER_SNIPPET = `FastLanguageModel.for_inference(model)
prompt = alpaca_prompt.format(
    "用一句话说明什么是 QLoRA。",  # 换成下面题目
    "",
    "",
)
inputs = tokenizer([prompt], return_tensors="pt").to("cuda")
out = model.generate(**inputs, max_new_tokens=128, use_cache=True)
print(tokenizer.batch_decode(out)[0])`

function toPayload(form: EvalChecklist) {
  const { confirmed_at: _c, validated_at: _v, ok: _o, ...rest } = form
  return rest
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    message.success('已复制')
  } catch {
    message.warning('复制失败，请手动选中')
  }
}

export function EvalPage() {
  const [form, setForm] = useState<EvalChecklist | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [validating, setValidating] = useState(false)
  const [result, setResult] = useState<ActionResult | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setForm(await fetchEvalChecklist())
    } catch {
      message.error('加载失败：请确认后端已启动')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void (async () => {
      await load()
      try {
        const checklist = await fetchEvalChecklist()
        if (!checklist.ok) {
          await updateStep('eval', 'doing', '开始 Step 4 评估对比')
        }
      } catch {
        /* ignore */
      }
    })()
  }, [load])

  const done = useMemo(() => {
    if (!form) return 0
    return [
      form.prepared_questions,
      form.ran_before_infer,
      form.ran_after_infer,
      form.filled_comparison,
      form.wrote_conclusion,
    ].filter(Boolean).length
  }, [form])

  const setFlag = (key: keyof EvalChecklist, value: boolean | string) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  const setQuestion = (index: number, key: keyof EvalQuestion, value: string) => {
    setForm((prev) => {
      if (!prev) return prev
      const questions = prev.questions.map((q, i) => (i === index ? { ...q, [key]: value } : q))
      return { ...prev, questions }
    })
  }

  const onSave = async () => {
    if (!form) return
    setSaving(true)
    try {
      const res = await confirmEvalChecklist(toPayload(form))
      setResult(res)
      message[res.ok ? 'success' : 'warning'](res.message)
      await load()
    } catch {
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const onValidate = async () => {
    if (!form) return
    setValidating(true)
    try {
      const res = await validateEvalChecklist(toPayload(form))
      setResult(res)
      message[res.ok ? 'success' : 'warning'](res.message)
      await load()
    } catch {
      message.error('校验失败')
    } finally {
      setValidating(false)
    }
  }

  if (!form) {
    return (
      <div className="eval-page">
        <h1 className="page-title">效果评估 · Step 4</h1>
        <Card className="panel-card" loading={loading} />
      </div>
    )
  }

  return (
    <div className="eval-page">
      <div className="ev-page-head">
        <div>
          <h1 className="page-title">效果评估 · Step 4</h1>
          <p className="page-desc">
            Step 3 已完成。用固定题目对比「微调前 / 加载 llama_lora_zh 后」的回答，在前端填写并校验（自动同步
            eval_log.md）。
          </p>
        </div>
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={() => void load()}>
            刷新
          </Button>
          <Button icon={<SaveOutlined />} loading={saving} onClick={() => void onSave()}>
            保存进度
          </Button>
          <Button
            type="primary"
            icon={<SafetyCertificateOutlined />}
            loading={validating}
            onClick={() => void onValidate()}
          >
            保存并校验
          </Button>
        </Space>
      </div>

      <Card className="panel-card" style={{ marginBottom: 16 }} loading={loading}>
        <div className="ev-progress">
          <Steps
            size="small"
            current={form.ok ? 2 : done >= 3 ? 1 : 0}
            items={[
              { title: '准备题目' },
              { title: '前后对比填写' },
              { title: '总结并校验' },
            ]}
          />
          <Tag color={form.ok ? 'success' : 'processing'}>{done}/5 · {form.ok ? '已通过' : '进行中'}</Tag>
        </div>
      </Card>

      <div className="eval-grid">
        <div>
          <Card
            className="panel-card"
            title={
              <Space>
                <ExperimentOutlined />
                操作清单
              </Space>
            }
          >
            <div className="ev-checks">
              <Checkbox
                checked={form.prepared_questions}
                onChange={(e) => setFlag('prepared_questions', e.target.checked)}
              >
                已确认下方 5 道测试题（可改措辞）
              </Checkbox>
              <Checkbox
                checked={form.ran_before_infer}
                onChange={(e) => setFlag('ran_before_infer', e.target.checked)}
              >
                已记录微调前回答（可用公开数据训完前的记忆，或基座不加中文 LoRA）
              </Checkbox>
              <Checkbox
                checked={form.ran_after_infer}
                onChange={(e) => setFlag('ran_after_infer', e.target.checked)}
              >
                已用 llama_lora_zh 推理并记录微调后回答
              </Checkbox>
              <Checkbox
                checked={form.filled_comparison}
                onChange={(e) => setFlag('filled_comparison', e.target.checked)}
              >
                至少 3 道题填完前后对比
              </Checkbox>
              <Checkbox
                checked={form.wrote_conclusion}
                onChange={(e) => setFlag('wrote_conclusion', e.target.checked)}
              >
                已写总结（是否变好 / 问题 / 下一步）
              </Checkbox>
            </div>

            <div className="ev-meta">
              <label>
                <span>适配器路径</span>
                <Input value={form.adapter_path} onChange={(e) => setFlag('adapter_path', e.target.value)} />
              </label>
              <label>
                <span>微调日志引用</span>
                <Input
                  value={form.finetune_log_ref}
                  onChange={(e) => setFlag('finetune_log_ref', e.target.value)}
                />
              </label>
            </div>

            <div className="ev-code-block">
              <div className="ev-code-head">
                <Typography.Text strong>Kaggle 推理模板（可复制）</Typography.Text>
                <Button size="small" icon={<CopyOutlined />} onClick={() => void copyText(INFER_SNIPPET)}>
                  复制
                </Button>
              </div>
              <pre className="ev-code">{INFER_SNIPPET}</pre>
              <Typography.Paragraph type="secondary" style={{ marginBottom: 0, marginTop: 8 }}>
                当前会话若还挂着刚训完的 model，可直接改问题再 generate，把输出贴到「微调后」。
              </Typography.Paragraph>
            </div>
          </Card>

          <Card className="panel-card" style={{ marginTop: 16 }} title="测试题对比（至少填 3 道）">
            {form.questions.map((q, index) => (
              <div key={q.id || index} className="ev-q">
                <div className="ev-q-title">
                  <Tag color="blue">Q{index + 1}</Tag>
                  <Input
                    value={q.question}
                    onChange={(e) => setQuestion(index, 'question', e.target.value)}
                    placeholder="问题"
                  />
                </div>
                <div className="ev-q-cols">
                  <label>
                    <span>微调前</span>
                    <Input.TextArea
                      rows={3}
                      value={q.before}
                      onChange={(e) => setQuestion(index, 'before', e.target.value)}
                      placeholder="粘贴微调前回答"
                    />
                  </label>
                  <label>
                    <span>微调后</span>
                    <Input.TextArea
                      rows={3}
                      value={q.after}
                      onChange={(e) => setQuestion(index, 'after', e.target.value)}
                      placeholder="粘贴 llama_lora_zh 回答"
                    />
                  </label>
                </div>
                <Input
                  style={{ marginTop: 8 }}
                  value={q.note}
                  onChange={(e) => setQuestion(index, 'note', e.target.value)}
                  placeholder="本题备注（可选）"
                />
              </div>
            ))}
          </Card>

          <Card className="panel-card" style={{ marginTop: 16 }} title="总结">
            <div className="ev-summary">
              <label>
                <span>整体是否变好 *</span>
                <Input.TextArea
                  rows={2}
                  value={form.overall_better}
                  onChange={(e) => setFlag('overall_better', e.target.value)}
                  placeholder="例如：中文问答更贴训练风格 / 变化不明显"
                />
              </label>
              <label>
                <span>主要问题 *</span>
                <Input.TextArea
                  rows={2}
                  value={form.main_issues}
                  onChange={(e) => setFlag('main_issues', e.target.value)}
                  placeholder="幻觉 / 格式 / 过拟合 / 无变化 …"
                />
              </label>
              <label>
                <span>下一步打算 *</span>
                <Input.TextArea
                  rows={2}
                  value={form.next_plan}
                  onChange={(e) => setFlag('next_plan', e.target.value)}
                  placeholder="加数据 / 加 steps / 进入导出 GGUF …"
                />
              </label>
              <label>
                <span>其他备注</span>
                <Input.TextArea rows={2} value={form.note} onChange={(e) => setFlag('note', e.target.value)} />
              </label>
            </div>
          </Card>
        </div>

        <div className="ev-side">
          <Card className="panel-card" title="你现在该做什么">
            <ol className="ev-steps">
              <li>在 Kaggle 用上面模板，对 Q1～Q5 各生成一次（微调后）</li>
              <li>把回答粘贴到左侧「微调后」；微调前可用记忆或基座结果</li>
              <li>至少填完 3 道 + 总结三栏</li>
              <li>勾选清单 → 保存并校验</li>
            </ol>
            {result ? (
              <Alert
                style={{ marginTop: 12 }}
                type={result.ok ? 'success' : 'warning'}
                showIcon
                message={result.message}
                description={result.details.join(' · ')}
              />
            ) : null}
            <Button
              block
              type="primary"
              style={{ marginTop: 12 }}
              icon={<CheckCircleOutlined />}
              loading={validating}
              onClick={() => void onValidate()}
            >
              保存并校验
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
