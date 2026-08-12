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
  DatabaseOutlined,
  FormOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SaveOutlined,
} from '@ant-design/icons'
import {
  confirmDataCraftChecklist,
  fetchDataCraftChecklist,
  updateStep,
  validateDataCraftChecklist,
} from '@/api/client'
import type { ActionResult, DataCraftChecklist } from '@/types/api'
import './AdvancedStep.scss'
import './DataCraftPage.scss'

const LEARNING_TEMPLATE: Pick<
  DataCraftChecklist,
  | 'task_scope'
  | 'quality_rules'
  | 'weak_spots_covered'
  | 'construction_notes'
  | 'interview_talk'
  | 'note'
> = {
  task_scope:
    '让模型用中文回答「大模型微调入门」相关问题：能讲清微调/LoRA/QLoRA、Alpaca 字段、训练产物、Prompt 与 SFT 区别、简单评估方法；面向求职作品集讲解，不追求百科全覆盖。',
  quality_rules:
    '1) 一条样本只教一个清晰点；\n2) output 必须可检验：列表题写全关键项，禁止只丢术语；\n3) 同一知识至少 2 种问法（防死记）；\n4) 针对 v1 弱项（产物清单、Prompt vs 微调、QLoRA 表述）优先补全；\n5) Holdout 措辞不得与训练集原句相同；\n6) 禁止空 output、明显错答、无意义重复。',
  weak_spots_covered:
    'v1 上「微调完成后常见产物」易答成术语堆砌；v2 已扩展到 500+ 条，系统覆盖预训练/LoRA/QLoRA/数据工程/超参/故障排查/面试口述，并单独维护 Holdout 改写题。',
  construction_notes:
    '1) 用 02-data/generate_alpaca_v2.py 生成科学具体的 Alpaca 中文样本；\n2) 覆盖概念定义、对比、场景、数值题、故障卡、清单题；\n3) 另建 eval_holdout_zh.jsonl（≥100）不进训练；\n4) 逐行 JSON 校验 + 去重 instruction；\n5) 看板自动计数，训练 ≥500、Holdout ≥100。',
  interview_talk:
    '我做中文微调入门问答作品集。数据是 Alpaca JSONL，v2 扩到 500+ 条，强调可检验答案、同义问法与训测分离；方法是 Unsloth QLoRA；用固定弱题/Holdout 对比，再决定超参与是否复训。我能讲清 r/lr/steps/4bit 与数据质量如何共同影响效果。',
  note: '数据由 generate_alpaca_v2.py 生成；学习时请抽读不同主题样本，不要只看条数。',
}

const EXAMPLE_JSONL = `{"instruction":"微调完成后常见产物有哪些？","input":"","output":"常见产物包括：LoRA/QLoRA 适配器权重与配置、（可选）合并后的全量或量化模型、GGUF 等推理格式、训练日志与评测记录。"}
{"instruction":"Prompt 工程和微调有什么不同？","input":"","output":"Prompt 工程不改模型权重，只靠提示词引导；微调会更新参数（或适配器），把任务习惯写进模型，通常更稳、可复现。"}`

function toPayload(form: DataCraftChecklist) {
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

export function DataCraftPage() {
  const [form, setForm] = useState<DataCraftChecklist | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [validating, setValidating] = useState(false)
  const [result, setResult] = useState<ActionResult | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setForm(await fetchDataCraftChecklist())
    } catch {
      message.error('加载失败：请确认后端已启动')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
    void updateStep('export', 'done', 'Step 5 已完成，进入进阶').catch(() => undefined)
    void updateStep('data_craft', 'doing', '开始 Step 6 数据工程').catch(() => undefined)
  }, [load])

  const done = useMemo(() => {
    if (!form) return 0
    return [
      form.read_guidelines,
      form.defined_task_scope,
      form.wrote_weak_spot_samples,
      form.built_holdout_eval,
      form.cleaned_and_validated,
      form.wrote_construction_notes,
    ].filter(Boolean).length
  }, [form])

  const setFlag = (key: keyof DataCraftChecklist, value: boolean | string) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  const applyLearningTemplate = () => {
    setForm((prev) => (prev ? { ...prev, ...LEARNING_TEMPLATE } : prev))
    message.success('已填入学习模板（可改成自己的话）')
  }

  const onSave = async () => {
    if (!form) return
    setSaving(true)
    try {
      const res = await confirmDataCraftChecklist(toPayload(form))
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
      const res = await validateDataCraftChecklist(toPayload(form))
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
      <div className="adv-page data-craft-page">
        <h1 className="page-title">数据工程 · Step 6</h1>
        <Card className="panel-card" loading={loading} />
      </div>
    )
  }

  return (
    <div className="adv-page data-craft-page">
      <div className="adv-head">
        <div>
          <h1 className="page-title">数据工程深挖 · Step 6</h1>
          <p className="page-desc">
            不懂就先读每条下面的「具体怎么做」，再对照已填好的学习模板。仓库训练集约 500+
            条、Holdout ≥100；你的任务是抽读理解、勾选、必要时改成自己的表述后校验。
          </p>
        </div>
        <Space wrap>
          <Button icon={<FormOutlined />} onClick={applyLearningTemplate}>
            重新填入学习模板
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => void load()}>
            刷新（含自动计数）
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

      <Card className="panel-card" style={{ marginBottom: 16 }}>
        <div className="adv-progress">
          <Steps
            size="small"
            current={form.ok ? 2 : done >= 3 ? 1 : 0}
            items={[{ title: '读懂原则' }, { title: '对照数据' }, { title: '笔记校验' }]}
          />
          <Tag color={form.ok ? 'success' : 'processing'}>
            {done}/6 · 训练 {form.train_count || '?'} · Holdout {form.eval_count || '?'} ·{' '}
            {form.ok ? '已通过' : '进行中'}
          </Tag>
        </div>
      </Card>

      <Alert
        style={{ marginBottom: 16 }}
        type="info"
        showIcon
        message="和「导出与推理」页一样：勾选前先搞懂"
        description="下面每条清单都有详细步骤。下方文本框已预填推荐表述（学习模板）——先读懂再勾选；面试时最好能不看稿讲出来。条数会在刷新时按 jsonl 自动统计。"
      />

      <div className="adv-grid">
        <div>
          <Card
            className="panel-card"
            title={
              <Space>
                <DatabaseOutlined />
                操作清单（照着做，做完再勾）
              </Space>
            }
          >
            <div className="adv-checks">
              <div className="adv-check-item">
                <Checkbox
                  checked={form.read_guidelines}
                  onChange={(e) => setFlag('read_guidelines', e.target.checked)}
                >
                  <strong>① 已读构建原则</strong>
                </Checkbox>
                <div className="adv-help">
                  <p>打开仓库 <code>06-data-craft/README.md</code>，记住六条：</p>
                  <ul>
                    <li>一题一答</li>
                    <li>output 可检验（列表写全）</li>
                    <li>同义改写防背题</li>
                    <li>难易搭配</li>
                    <li>训测分离</li>
                    <li>先补 v1 弱项</li>
                  </ul>
                  <p>读完再勾本项。</p>
                </div>
              </div>

              <div className="adv-check-item">
                <Checkbox
                  checked={form.defined_task_scope}
                  onChange={(e) => setFlag('defined_task_scope', e.target.checked)}
                >
                  <strong>② 已写清任务范围</strong>
                </Checkbox>
                <div className="adv-help">
                  <p>
                    <strong>任务范围 = 这版模型要擅长什么、不擅长什么。</strong>
                    不是写「做一个 AI」，而是写可验收边界。
                  </p>
                  <p>好例子（已预填在下方，可改）：</p>
                  <blockquote>
                    中文回答微调入门知识：LoRA/QLoRA、Alpaca 字段、产物、Prompt vs SFT、简单评估；服务求职讲解，不做百科。
                  </blockquote>
                  <p>坏例子：「什么都会」「通用聊天」。读完下方「任务范围」框，认同就勾选。</p>
                </div>
              </div>

              <div className="adv-check-item">
                <Checkbox
                  checked={form.wrote_weak_spot_samples}
                  onChange={(e) => setFlag('wrote_weak_spot_samples', e.target.checked)}
                >
                  <strong>③ 已针对弱项补样本并扩训练集</strong>
                </Checkbox>
                <div className="adv-help">
                  <p>
                    打开 <code>datasets/sample_alpaca_zh_v2.jsonl</code>（当前约{' '}
                    <strong>{form.train_count || '500+'}</strong> 条，校验要 ≥500）。
                  </p>
                  <p>
                    可用生成脚本复现：<code>python 02-data/generate_alpaca_v2.py</code>
                    。主题覆盖：预训练/LoRA/QLoRA/SFT、数据工程、超参、故障排查、面试清单等。
                  </p>
                  <p>v1 弱项与补法：</p>
                  <ul>
                    <li>
                      <strong>产物题</strong>：output 要写适配器/配置/日志/可选 GGUF，不能只回
                      「instruction、LoRA」
                    </li>
                    <li>
                      <strong>Prompt vs 微调</strong>：强调改不改权重
                    </li>
                    <li>
                      <strong>QLoRA</strong>：拆开讲 Q=量化、LoRA=适配器
                    </li>
                  </ul>
                  <p>你可以先浏览文件确认已有这些题，再勾选；若要自己加条，复制下方示例格式追加一行。</p>
                </div>
              </div>

              <div className="adv-check-item">
                <Checkbox
                  checked={form.built_holdout_eval}
                  onChange={(e) => setFlag('built_holdout_eval', e.target.checked)}
                >
                  <strong>④ 已维护 Holdout 评测集</strong>
                </Checkbox>
                <div className="adv-help">
                  <p>
                    Holdout = <strong>不参与训练</strong>的验收题，文件：
                    <code>datasets/eval_holdout_zh.jsonl</code>（约 {form.eval_count || '100'}{' '}
                    条，校验 ≥100）。
                  </p>
                  <p>和训练集的区别：问同一类知识，但<strong>换措辞</strong>。例如训练写「常见产物有哪些」，Holdout 写「应归档的产物清单」。</p>
                  <p>
                    Step 8 再训后只用 Holdout/弱题对比 v1/v2。训练 Notebook 的{' '}
                    <code>load_dataset</code> <strong>不要</strong>读这个文件。
                  </p>
                </div>
              </div>

              <div className="adv-check-item">
                <Checkbox
                  checked={form.cleaned_and_validated}
                  onChange={(e) => setFlag('cleaned_and_validated', e.target.checked)}
                >
                  <strong>⑤ 已清洗并确认 JSONL 合法</strong>
                </Checkbox>
                <div className="adv-help">
                  <p>自检清单：</p>
                  <ul>
                    <li>每行一个 JSON 对象（不要漂亮打印成多行）</li>
                    <li>字段只有 / 至少含 <code>instruction</code> <code>input</code> <code>output</code></li>
                    <li>
                      <code>output</code> 非空；列表题不是两三个词糊弄
                    </li>
                    <li>没有完全重复的 instruction（同义改写可以）</li>
                  </ul>
                  <p>
                    本机可跑：
                    <code>python 02-data/validate_dataset.py</code>
                    （若脚本只认旧文件，也可人工抽查 v2 / holdout）。
                  </p>
                </div>
              </div>

              <div className="adv-check-item">
                <Checkbox
                  checked={form.wrote_construction_notes}
                  onChange={(e) => setFlag('wrote_construction_notes', e.target.checked)}
                >
                  <strong>⑥ 已填下方笔记与面试口述</strong>
                </Checkbox>
                <div className="adv-help">
                  <p>
                    下方文本框已有完整学习模板。你要做的是：<strong>读懂 → 可改成自己的话 → 勾选 →
                    保存并校验</strong>。面试口述要能 1 分钟讲完「范围 / 规则 / 弱项 / 训测分离 /
                    下一步再训」。
                  </p>
                </div>
              </div>
            </div>

            <div className="dc-code-block">
              <div className="dc-code-head">
                <Typography.Text strong>JSONL 示例（可复制到编辑器对照）</Typography.Text>
                <Button size="small" icon={<CopyOutlined />} onClick={() => void copyText(EXAMPLE_JSONL)}>
                  复制
                </Button>
              </div>
              <pre className="dc-code">{EXAMPLE_JSONL}</pre>
            </div>

            <div className="adv-fields">
              <label>
                <span>任务范围 *（这版模型要擅长什么）</span>
                <Input.TextArea
                  rows={3}
                  value={form.task_scope}
                  onChange={(e) => setFlag('task_scope', e.target.value)}
                />
              </label>
              <label>
                <span>质量规则 *（怎样算一条好样本）</span>
                <Input.TextArea
                  rows={5}
                  value={form.quality_rules}
                  onChange={(e) => setFlag('quality_rules', e.target.value)}
                />
              </label>
              <div className="adv-meta">
                <label>
                  <span>训练集路径</span>
                  <Input value={form.train_path} onChange={(e) => setFlag('train_path', e.target.value)} />
                </label>
                <label>
                  <span>训练条数（刷新自动统计，≥500）</span>
                  <Input value={form.train_count} onChange={(e) => setFlag('train_count', e.target.value)} />
                </label>
                <label>
                  <span>Holdout 路径</span>
                  <Input value={form.eval_path} onChange={(e) => setFlag('eval_path', e.target.value)} />
                </label>
                <label>
                  <span>Holdout 条数（自动统计，≥100）</span>
                  <Input value={form.eval_count} onChange={(e) => setFlag('eval_count', e.target.value)} />
                </label>
              </div>
              <label>
                <span>弱项覆盖说明 *</span>
                <Input.TextArea
                  rows={3}
                  value={form.weak_spots_covered}
                  onChange={(e) => setFlag('weak_spots_covered', e.target.value)}
                />
              </label>
              <label>
                <span>构建过程 *</span>
                <Input.TextArea
                  rows={5}
                  value={form.construction_notes}
                  onChange={(e) => setFlag('construction_notes', e.target.value)}
                />
              </label>
              <label>
                <span>面试口述（约 1 分钟）*</span>
                <Input.TextArea
                  rows={4}
                  value={form.interview_talk}
                  onChange={(e) => setFlag('interview_talk', e.target.value)}
                />
              </label>
              <label>
                <span>其他备注</span>
                <Input.TextArea rows={2} value={form.note} onChange={(e) => setFlag('note', e.target.value)} />
              </label>
            </div>
          </Card>
        </div>

        <div className="adv-side">
          <Card className="panel-card" title="你现在该做什么">
            <ol className="adv-steps">
              <li>点「刷新」，确认训练条数 ≥500、Holdout ≥100</li>
              <li>逐条阅读清单说明（②～⑥ 最重要）</li>
              <li>阅读下方已填模板；可点「重新填入学习模板」</li>
              <li>打开 jsonl 文件对照弱项样本，理解后勾选</li>
              <li>保存并校验 → 通过后去 Step 7</li>
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
