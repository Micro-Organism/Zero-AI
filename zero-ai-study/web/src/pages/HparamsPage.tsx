import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Input,
  Space,
  Steps,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import {
  CheckCircleOutlined,
  ExperimentOutlined,
  FormOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SaveOutlined,
} from '@ant-design/icons'
import {
  confirmHparamsChecklist,
  fetchHparamsChecklist,
  updateStep,
  validateHparamsChecklist,
} from '@/api/client'
import type { ActionResult, HparamsChecklist } from '@/types/api'
import './AdvancedStep.scss'
import './HparamsPage.scss'

const PARAM_ROWS = [
  {
    key: 'r',
    name: 'r (LoRA rank)',
    meaning: '低秩维度 / 适配器容量',
    tip: 'ΔW≈BA；r 大→容量↑、过拟合与显存↑。入门 8～32',
  },
  {
    key: 'alpha',
    name: 'lora_alpha',
    meaning: 'LoRA 更新缩放',
    tip: '常与 r 同量级或 2r；和 r 联动看 alpha/r',
  },
  {
    key: 'lr',
    name: 'learning_rate',
    meaning: '学习率（步长）',
    tip: '过大震荡；过小学不动。QLoRA 常见 2e-4',
  },
  {
    key: 'steps',
    name: 'max_steps',
    meaning: '优化器更新次数',
    tip: '先跑通再加；数据少时过大易背题',
  },
  {
    key: 'batch',
    name: 'batch × accum',
    meaning: '有效 batch',
    tip: '≈ per_device_batch × accum（×GPU）。OOM 降 batch 加 accum',
  },
  {
    key: 'seq',
    name: 'max_seq_length',
    meaning: '单条最大 token',
    tip: '过大吃显存；过小截断监督信号',
  },
  {
    key: 'q',
    name: 'load_in_4bit',
    meaning: '4bit 量化加载基座',
    tip: 'QLoRA 关键；T4 上几乎必开',
  },
]

const LEARNING_TEMPLATE: Pick<
  HparamsChecklist,
  | 'lora_r'
  | 'lora_alpha'
  | 'learning_rate'
  | 'max_steps'
  | 'per_device_train_batch_size'
  | 'gradient_accumulation_steps'
  | 'max_seq_length'
  | 'load_in_4bit'
  | 'why_r_alpha'
  | 'why_lr_steps_batch'
  | 'why_seq_quant'
  | 'v2_change_plan'
  | 'interview_talk'
  | 'note'
> = {
  lora_r: '16',
  lora_alpha: '16',
  learning_rate: '2e-4',
  max_steps: '120',
  per_device_train_batch_size: '2',
  gradient_accumulation_steps: '4',
  max_seq_length: '2048',
  load_in_4bit: 'True',
  why_r_alpha:
    'r 是 LoRA 低秩维度：对权重更新 ΔW≈BA，r 越大表达容量越高，也更易过拟合、更吃显存。lora_alpha 是缩放系数，常见实现里有效更新大致按 alpha/r 缩放，所以 alpha 常取与 r 同量级或 2r。我的 v1 用 r=16、alpha=16，属于入门稳妥点；v2 数据虽扩到 500+，但任务仍是入门问答，先保持 16/16，避免「数据刚变好又同时猛提 r」导致无法归因。若 Holdout 仍欠拟合，再试 r=32 并同步审视 alpha。',
  why_lr_steps_batch:
    'learning_rate 控制更新步长：过大 loss 震荡/不收敛，过小同样步数学不动；Unsloth QLoRA 入门常见 2e-4。max_steps 是优化次数：v1=60 只为跑通；数据已到 500+ 后提到 120，让模型多看几遍多样本，但仍避免小数据式「数百步死背」。per_device_batch × gradient_accumulation ≈ 有效 batch（单卡）。T4 上 batch=2、accum=4 → 有效 batch≈8，在显存可承受下让梯度更稳。若 OOM：先降 batch 到 1，再把 accum 提到 8，尽量维持有效 batch。',
  why_seq_quant:
    'max_seq_length=2048：覆盖中等长度中文问答足够；再大（如 4096）显存与注意力开销明显上升，而我的样本多数远短于 2k，盲目加长收益有限。OOM 时可降到 1024。load_in_4bit=True：QLoRA 的关键前提，把 8B 基座塞进约 16GB 显存；关闭后常直接装不下或无法训练。量化解决「装下基座」，LoRA 解决「训哪些参数」，二者一起才适合 Kaggle T4。',
  v2_change_plan:
    '相对 v1（约 9 条数据、steps≈60、r=16、4bit、产物题弱）：\n1) 数据：改用 sample_alpaca_zh_v2.jsonl（500+）+ Holdout 100 条隔离评测；\n2) steps：60→120；\n3) r/alpha：保持 16/16；lr 保持 2e-4；\n4) batch/accum：2×4；seq：2048；4bit：开；\n5) 保存为 llama_lora_zh_v2，不覆盖 v1；\n6) 用同一弱题/Holdout 对比完整性与是否仍术语堆砌；\n7) 若仍 OOM：seq→1024 或 batch→1、accum→8；若仍欠拟合且数据已足：再试 r=32。',
  interview_talk:
    'v1 用 QLoRA 在 T4 跑通，但数据太少、产物题只能蹦术语。v2 我先做数据工程到 500+ 并建 100 条 Holdout，再改超参：steps 60→120，r/alpha 仍 16 以便归因，保持 4bit 与有效 batch≈8。选择依据是「容量-过拟合-显存」权衡：先让监督信号变完整，再适度加步数，而不是盲目加大 r。最终用固定 Holdout 对比 v1/v2，证明是否真变好。',
  note: '以下为学习模板，结合你的 v1 实验；读懂后可改措辞再校验。Notebook 里改参时与本页数字保持一致。',
}

const SNIPPET = `# v2 计划对应的 Notebook 改法（示例）
# 1) 数据：load_dataset 指向你的 v2 jsonl（Kaggle Input 真实路径）
# 2) LoRA
r = 16
lora_alpha = 16
# 3) SFTConfig / TrainingArguments 常见项
learning_rate = 2e-4
max_steps = 120
per_device_train_batch_size = 2
gradient_accumulation_steps = 4
# 4) 加载基座
max_seq_length = 2048
load_in_4bit = True
# 5) 保存
model.save_pretrained("llama_lora_zh_v2")
tokenizer.save_pretrained("llama_lora_zh_v2")`

function toPayload(form: HparamsChecklist) {
  const { confirmed_at: _c, validated_at: _v, ok: _o, ...rest } = form
  return rest
}

export function HparamsPage() {
  const [form, setForm] = useState<HparamsChecklist | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [validating, setValidating] = useState(false)
  const [result, setResult] = useState<ActionResult | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchHparamsChecklist()
      // 后端若未热更新默认值，前端补齐学习模板
      if (!(data.why_r_alpha || '').trim()) {
        setForm({ ...data, ...LEARNING_TEMPLATE })
      } else {
        setForm(data)
      }
    } catch {
      message.error('加载失败：请确认后端已启动')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
    void updateStep('hparams', 'doing', '开始 Step 7 参数深挖').catch(() => undefined)
  }, [load])

  const done = useMemo(() => {
    if (!form) return 0
    return [
      form.read_param_guide,
      form.explained_lora_r_alpha,
      form.explained_lr_steps_batch,
      form.explained_seq_quant,
      form.planned_v2_config,
      form.wrote_interview_answers,
    ].filter(Boolean).length
  }, [form])

  const setFlag = (key: keyof HparamsChecklist, value: boolean | string) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  const applyLearningTemplate = () => {
    setForm((prev) => (prev ? { ...prev, ...LEARNING_TEMPLATE } : prev))
    message.success('已填入完整学习模板（可改成自己的话）')
  }

  const onSave = async () => {
    if (!form) return
    setSaving(true)
    try {
      const res = await confirmHparamsChecklist(toPayload(form))
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
      const res = await validateHparamsChecklist(toPayload(form))
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
      <div className="adv-page hparams-page">
        <h1 className="page-title">训练参数 · Step 7</h1>
        <Card className="panel-card" loading={loading} />
      </div>
    )
  }

  const effBatch =
    (Number(form.per_device_train_batch_size) || 0) *
    (Number(form.gradient_accumulation_steps) || 0)

  return (
    <div className="adv-page hparams-page">
      <div className="adv-head">
        <div>
          <h1 className="page-title">训练参数深挖 · Step 7</h1>
          <p className="page-desc">
            每个旋钮都要能讲清「是什么 / 为什么 / 怎么改」。下方已预填结合你 v1→v2
            的完整答案；先读清单案例，再对照输入框学习，最后勾选校验。
          </p>
        </div>
        <Space wrap>
          <Button icon={<FormOutlined />} onClick={applyLearningTemplate}>
            重新填入学习模板
          </Button>
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

      <Card className="panel-card" style={{ marginBottom: 16 }}>
        <div className="adv-progress">
          <Steps
            size="small"
            current={form.ok ? 2 : done >= 3 ? 1 : 0}
            items={[{ title: '读懂参数' }, { title: '写清为什么' }, { title: '定 v2 计划' }]}
          />
          <Tag color={form.ok ? 'success' : 'processing'}>
            {done}/6 · 有效 batch≈{effBatch || '?'} · {form.ok ? '已通过' : '进行中'}
          </Tag>
        </div>
      </Card>

      <Alert
        style={{ marginBottom: 16 }}
        type="info"
        showIcon
        message="调参原则（结合你的实验）"
        description="先数据后超参；一次少改几项以便归因；系统指标（OOM/loss）与 Holdout 质量一起看。v1 弱在产物题，根因主要是数据，所以 v2 优先用 500+ 数据，steps 只适度 60→120，r 先不动。"
      />

      <Card className="panel-card" style={{ marginBottom: 16 }} title="参数速查表（技术含义）">
        <Table
          size="small"
          pagination={false}
          rowKey="key"
          dataSource={PARAM_ROWS}
          columns={[
            { title: '参数', dataIndex: 'name', width: 160 },
            { title: '含义', dataIndex: 'meaning', width: 160 },
            { title: '调参提示', dataIndex: 'tip' },
          ]}
        />
      </Card>

      <div className="adv-grid">
        <div>
          <Card
            className="panel-card"
            title={
              <Space>
                <ExperimentOutlined />
                操作清单 + v2 配置（照着学，学完再勾）
              </Space>
            }
          >
            <div className="adv-checks">
              <div className="adv-check-item">
                <Checkbox
                  checked={form.read_param_guide}
                  onChange={(e) => setFlag('read_param_guide', e.target.checked)}
                >
                  <strong>① 已读速查表与 07-hparams/README</strong>
                </Checkbox>
                <div className="adv-help">
                  <p>
                    打开 <code>07-hparams/README.md</code>，对照上表。重点记住：
                  </p>
                  <ul>
                    <li>
                      <strong>r / alpha</strong>：容量与缩放（低秩 BA）
                    </li>
                    <li>
                      <strong>lr / steps / batch×accum</strong>：怎么走、走多久、每步看多少样本
                    </li>
                    <li>
                      <strong>seq / 4bit</strong>：上下文长度与能否装进 T4
                    </li>
                  </ul>
                </div>
              </div>

              <div className="adv-check-item">
                <Checkbox
                  checked={form.explained_lora_r_alpha}
                  onChange={(e) => setFlag('explained_lora_r_alpha', e.target.checked)}
                >
                  <strong>② 已理解并确认 r / alpha 说明</strong>
                </Checkbox>
                <div className="adv-help">
                  <p>
                    <strong>技术：</strong>全量微调学 ΔW；LoRA 设 ΔW≈B A，r 是秩。r 太小欠拟合，太大在小/中数据上易背题。
                    alpha 影响更新幅度，常与 r 同量级。
                  </p>
                  <p>
                    <strong>案例：</strong>有人数据 9 条却把 r 拉到 64，Holdout 反而更胡编——典型「容量过剩」。
                    你的 v2：数据 500+，但仍先 <code>r=16, alpha=16</code>，便于证明「变好来自数据+steps」。
                  </p>
                  <p>读完下方「为什么设 r / alpha」框再勾。</p>
                </div>
              </div>

              <div className="adv-check-item">
                <Checkbox
                  checked={form.explained_lr_steps_batch}
                  onChange={(e) => setFlag('explained_lr_steps_batch', e.target.checked)}
                >
                  <strong>③ 已理解 lr / steps / batch×accum</strong>
                </Checkbox>
                <div className="adv-help">
                  <p>
                    <strong>公式（单卡）：</strong>有效 batch ≈{' '}
                    <code>per_device_train_batch_size × gradient_accumulation_steps</code>
                    。你计划 2×4=8。
                  </p>
                  <p>
                    <strong>案例：</strong>v1 steps=60 + 9 条数据 → 容易「跑通但学不深」；若 steps=300
                    仍只有 9 条 → 背题风险极高。v2：数据够了，steps 提到 120 更合理；lr 维持 2e-4。
                  </p>
                  <p>
                    <strong>OOM 套路：</strong>batch 2→1，accum 4→8，有效 batch 仍约 8。
                  </p>
                </div>
              </div>

              <div className="adv-check-item">
                <Checkbox
                  checked={form.explained_seq_quant}
                  onChange={(e) => setFlag('explained_seq_quant', e.target.checked)}
                >
                  <strong>④ 已理解 max_seq_length / 4bit</strong>
                </Checkbox>
                <div className="adv-help">
                  <p>
                    <strong>4bit：</strong>QLoRA 的「Q」。没有它，8B 半精度基座在 T4 上经常直接装不下。
                    它解决显存，不替代 LoRA。
                  </p>
                  <p>
                    <strong>seq：</strong>2048 对入门中文 QA 通常够用。你踩过的双卡 device / 二次加载
                    OOM，优先修加载方式，而不是先关 4bit。
                  </p>
                  <blockquote>
                    口诀：量化装基座，LoRA 改行为；seq 按数据长度设，OOM 先降 batch/seq。
                  </blockquote>
                </div>
              </div>

              <div className="adv-check-item">
                <Checkbox
                  checked={form.planned_v2_config}
                  onChange={(e) => setFlag('planned_v2_config', e.target.checked)}
                >
                  <strong>⑤ 已确认 v2 数字与改动计划</strong>
                </Checkbox>
                <div className="adv-help">
                  <p>
                    核对上方数字区与「相对 v1 的改动计划」。Step 8 训练时按此改 Notebook，保存名{' '}
                    <code>llama_lora_zh_v2</code>。
                  </p>
                  <p>
                    <strong>归因设计：</strong>数据大变 + steps 小变 + r 不变 → 若 Holdout
                    变好，更有说服力说「数据工程有效」。
                  </p>
                </div>
              </div>

              <div className="adv-check-item">
                <Checkbox
                  checked={form.wrote_interview_answers}
                  onChange={(e) => setFlag('wrote_interview_answers', e.target.checked)}
                >
                  <strong>⑥ 已读懂面试口述</strong>
                </Checkbox>
                <div className="adv-help">
                  面试官常问「为什么是这些超参」。你要能不看稿讲：容量-过拟合-显存权衡、有效
                  batch、为何先不动 r。读完下方口述框，能复述再勾。
                </div>
              </div>
            </div>

            <div className="hp-code-block">
              <Typography.Text strong>Notebook 对应片段（对照用）</Typography.Text>
              <pre className="hp-code">{SNIPPET}</pre>
            </div>

            <Typography.Title level={5} style={{ marginTop: 20 }}>
              v2 计划数字
            </Typography.Title>
            <div className="adv-meta">
              <label>
                <span>lora r</span>
                <Input value={form.lora_r} onChange={(e) => setFlag('lora_r', e.target.value)} />
              </label>
              <label>
                <span>lora_alpha</span>
                <Input value={form.lora_alpha} onChange={(e) => setFlag('lora_alpha', e.target.value)} />
              </label>
              <label>
                <span>learning_rate</span>
                <Input
                  value={form.learning_rate}
                  onChange={(e) => setFlag('learning_rate', e.target.value)}
                />
              </label>
              <label>
                <span>max_steps</span>
                <Input value={form.max_steps} onChange={(e) => setFlag('max_steps', e.target.value)} />
              </label>
              <label>
                <span>per_device_train_batch_size</span>
                <Input
                  value={form.per_device_train_batch_size}
                  onChange={(e) => setFlag('per_device_train_batch_size', e.target.value)}
                />
              </label>
              <label>
                <span>gradient_accumulation_steps</span>
                <Input
                  value={form.gradient_accumulation_steps}
                  onChange={(e) => setFlag('gradient_accumulation_steps', e.target.value)}
                />
              </label>
              <label>
                <span>max_seq_length</span>
                <Input
                  value={form.max_seq_length}
                  onChange={(e) => setFlag('max_seq_length', e.target.value)}
                />
              </label>
              <label>
                <span>load_in_4bit</span>
                <Input
                  value={form.load_in_4bit}
                  onChange={(e) => setFlag('load_in_4bit', e.target.value)}
                />
              </label>
            </div>

            <div className="adv-fields">
              <label>
                <span>为什么设 r / alpha *（完整学习答案）</span>
                <Input.TextArea
                  rows={6}
                  value={form.why_r_alpha}
                  onChange={(e) => setFlag('why_r_alpha', e.target.value)}
                />
              </label>
              <label>
                <span>为什么设 lr / steps / batch×accum *</span>
                <Input.TextArea
                  rows={6}
                  value={form.why_lr_steps_batch}
                  onChange={(e) => setFlag('why_lr_steps_batch', e.target.value)}
                />
              </label>
              <label>
                <span>为什么设 seq / 4bit *</span>
                <Input.TextArea
                  rows={5}
                  value={form.why_seq_quant}
                  onChange={(e) => setFlag('why_seq_quant', e.target.value)}
                />
              </label>
              <label>
                <span>相对 v1 的改动计划 *</span>
                <Input.TextArea
                  rows={8}
                  value={form.v2_change_plan}
                  onChange={(e) => setFlag('v2_change_plan', e.target.value)}
                />
              </label>
              <label>
                <span>面试口述 *</span>
                <Input.TextArea
                  rows={5}
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
              <li>点「重新填入学习模板」（若框是空的）</li>
              <li>逐条读 ②～④ 的技术说明与案例</li>
              <li>对照输入框，能复述「为什么」再勾选</li>
              <li>确认 v2 数字与计划 → 保存并校验</li>
              <li>通过后去 Step 8，按计划在 Kaggle 再训</li>
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
