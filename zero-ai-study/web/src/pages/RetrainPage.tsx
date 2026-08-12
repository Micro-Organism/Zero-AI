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
  FormOutlined,
  ReloadOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
  SaveOutlined,
} from '@ant-design/icons'
import {
  confirmRetrainChecklist,
  fetchRetrainChecklist,
  updateStep,
  validateRetrainChecklist,
} from '@/api/client'
import type { ActionResult, RetrainChecklist } from '@/types/api'
import './AdvancedStep.scss'
import './RetrainPage.scss'

const LEARNING_TEMPLATE: Pick<
  RetrainChecklist,
  | 'dataset_path'
  | 'adapter_name'
  | 'max_steps'
  | 'local_adapter_path'
  | 'cloud_data_hint'
  | 'hparams_ref'
  | 'weak_q_results'
  | 'vs_v1_summary'
  | 'interview_talk'
  | 'note'
> = {
  dataset_path: 'datasets/sample_alpaca_zh_v2.jsonl',
  adapter_name: 'llama_lora_zh_v2',
  max_steps: '120',
  local_adapter_path: 'outputs/llama_lora_zh_v2/',
  cloud_data_hint:
    '上传 sample_alpaca_zh_v2.jsonl 为 Dataset 后 Add Input；用 os.walk(\'/kaggle/input\') 查找 jsonl 真实路径（可能含 datasets/用户名/数据集名/…）。',
  hparams_ref:
    'r=16, alpha=16, lr=2e-4, max_steps=120, batch=2, accum=4, seq=2048, load_in_4bit=True；详见 07-hparams/hparams_notes.md 与看板 Step 7。',
  weak_q_results:
    '【学习模板：训完后把「v2 实际输出」换成真实生成结果】\nQ-产物：微调完成后常见产物有哪些？\n- v1（弱）：instruction、LoRA、QLoRA（术语堆砌）\n- v2（期望/实填）：应覆盖适配器权重与配置、日志/超参、评测记录；可选 GGUF/合并权重。实填：……\n\nQ-对比：Prompt 工程和微调有何不同？\n- v1：常说不清「改不改权重」\n- v2（期望/实填）：明确 Prompt 不改权重、SFT/LoRA 改参数或适配器，并各举场景。实填：……\n\nQ-QLoRA：为什么免费 GPU 更常用 QLoRA？\n- v2（期望/实填）：4bit 装基座 + 只训 LoRA；与「4bit 全量微调」区分。实填：……\n\nHoldout：抽 3～5 题（改写题）记录是否仍漏项/背题。实填题号与结论：……',
  vs_v1_summary:
    '【学习模板：训完后用真实对比改写】\n1) 数据：9 条 → 500+，Holdout 100 隔离；\n2) 超参：steps 60→120，r/alpha 保持 16 以便归因；\n3) 预期变好：产物清单完整性↑、Prompt vs SFT 表述更清楚、同义问法更稳；\n4) 仍可能问题：个别题过拟合、胡编、或 OOM 导致未按计划训练；\n5) 结论：是否用 v2 替换默认交付；是否保留 v1 回滚；下一步（消融/再补长尾题）。\n实填结论：……',
  interview_talk:
    '我完成了两轮 QLoRA：v1 验证流水线（Kaggle T4、约 60 steps、小数据），发现产物题弱；于是做数据工程到 500+ 并建 Holdout，再按可控超参（steps=120、r=16、4bit、有效 batch≈8）训练 llama_lora_zh_v2。用同一弱题/Holdout 对比证明提升来自数据与适度加步，而不是盲目加大 r。产物是可重载适配器与实验日志，能讲清失败案例（路径、双卡 device、二次加载 OOM）与修复。',
  note: '操作按下方清单逐步做；loss/弱题实填必须来自你的 Kaggle 真实输出。模板帮你知道「记什么、怎么对比」。不要覆盖 llama_lora_zh（v1）。',
}

const FIND_DATA = `import os
for root, dirs, files in os.walk("/kaggle/input"):
    for f in files:
        if f.endswith(".jsonl") and "alpaca" in f.lower():
            print(os.path.join(root, f))`

const LOAD_V2 = `# 把 PATH 换成上一格打印的真实路径
from datasets import load_dataset
PATH = "/kaggle/input/..../sample_alpaca_zh_v2.jsonl"
dataset = load_dataset("json", data_files=PATH, split="train")
print(len(dataset), dataset[0])`

const TRAIN_SAVE = `# 按 Step 7：r=16, alpha=16, lr=2e-4, max_steps=120, batch=2, accum=4
# 训完后务必换新目录名，勿覆盖 v1
model.save_pretrained("llama_lora_zh_v2")
tokenizer.save_pretrained("llama_lora_zh_v2")
print("saved llama_lora_zh_v2")`

const INFER_V2 = `from unsloth import FastLanguageModel
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name = "llama_lora_zh_v2",  # 或 /kaggle/working/... 或 Input 路径
    max_seq_length = max_seq_length,
    dtype = dtype,
    load_in_4bit = load_in_4bit,
    device_map = {"": 0},
)
FastLanguageModel.for_inference(model)

prompt = alpaca_prompt.format("微调完成后常见产物有哪些？", "", "")
inputs = tokenizer([prompt], return_tensors="pt")
device = model.get_input_embeddings().weight.device
inputs = {k: v.to(device) for k, v in inputs.items()}
from transformers import TextStreamer
_ = model.generate(**inputs, streamer=TextStreamer(tokenizer), max_new_tokens=128)`

function toPayload(form: RetrainChecklist) {
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

export function RetrainPage() {
  const [form, setForm] = useState<RetrainChecklist | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [validating, setValidating] = useState(false)
  const [result, setResult] = useState<ActionResult | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchRetrainChecklist()
      if (!(data.weak_q_results || '').trim()) {
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
    void updateStep('hparams', 'done', 'Step 7 参数深挖已完成').catch(() => undefined)
    void updateStep('retrain', 'doing', '开始 Step 8 再训与复评').catch(() => undefined)
  }, [load])

  const done = useMemo(() => {
    if (!form) return 0
    return [
      form.uploaded_v2_data,
      form.applied_hparams,
      form.trained_v2,
      form.saved_adapter_v2,
      form.reevaluated_weak_qs,
      form.wrote_comparison,
    ].filter(Boolean).length
  }, [form])

  const setFlag = (key: keyof RetrainChecklist, value: boolean | string) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  const applyLearningTemplate = () => {
    setForm((prev) =>
      prev
        ? {
            ...prev,
            ...LEARNING_TEMPLATE,
            approx_loss: prev.approx_loss, // 保留已填 loss
          }
        : prev,
    )
    message.success('已填入学习模板（不会清空已填的 loss）')
  }

  const onSave = async () => {
    if (!form) return
    setSaving(true)
    try {
      const res = await confirmRetrainChecklist(toPayload(form))
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
      const res = await validateRetrainChecklist(toPayload(form))
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
      <div className="adv-page retrain-page">
        <h1 className="page-title">再训复评 · Step 8</h1>
        <Card className="panel-card" loading={loading} />
      </div>
    )
  }

  return (
    <div className="adv-page retrain-page">
      <div className="adv-head">
        <div>
          <h1 className="page-title">再训与复评 · Step 8</h1>
          <p className="page-desc">
            在 Kaggle 用 Step 6 数据 + Step 7 超参训练 <code>llama_lora_zh_v2</code>，用弱题/Holdout
            对比 v1。清单含具体步骤与可复制代码；下方模板告诉你训完后要记什么。
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
            items={[{ title: '上云准备' }, { title: '训练保存' }, { title: '弱题对比' }]}
          />
          <Tag color={form.ok ? 'success' : 'processing'}>
            {done}/6 · {form.ok ? '已通过' : '进行中'}
          </Tag>
        </div>
      </Card>

      <Alert
        style={{ marginBottom: 16 }}
        type="warning"
        showIcon
        message="校验规则"
        description="可以先保存进度。最终「保存并校验」要求：勾选 6 项、填写真实 loss、并把弱题/对比里的「实填：……」「实填结论：……」换成 Kaggle 真实输出（模板占位无法通过）。"
      />

      <div className="adv-grid">
        <div>
          <Card
            className="panel-card"
            title={
              <Space>
                <RocketOutlined />
                操作清单（Kaggle 逐步做）
              </Space>
            }
          >
            <div className="adv-checks">
              <div className="adv-check-item">
                <Checkbox
                  checked={form.uploaded_v2_data}
                  onChange={(e) => setFlag('uploaded_v2_data', e.target.checked)}
                >
                  <strong>① 已上传 v2 jsonl 并 Add Input</strong>
                </Checkbox>
                <div className="adv-help">
                  <p>
                    本地文件：<code>datasets/sample_alpaca_zh_v2.jsonl</code>（约 521 条）。
                  </p>
                  <ol>
                    <li>Kaggle → Datasets → New → 上传该文件</li>
                    <li>Notebook 右侧 Add Input 选中它</li>
                    <li>跑「查找路径」代码，确认能打印到 .jsonl</li>
                  </ol>
                  <p>
                    注意：路径可能是{' '}
                    <code>/kaggle/input/datasets/你的用户名/…/sample_alpaca_zh_v2.jsonl</code>
                    ，以打印为准（横杠/下划线别猜）。
                  </p>
                </div>
              </div>

              <div className="adv-check-item">
                <Checkbox
                  checked={form.applied_hparams}
                  onChange={(e) => setFlag('applied_hparams', e.target.checked)}
                >
                  <strong>② 已按 Step 7 计划改 Notebook 参数</strong>
                </Checkbox>
                <div className="adv-help">
                  <p>对照：{form.hparams_ref}</p>
                  <ul>
                    <li>
                      <code>load_dataset</code> 改为你的 v2 jsonl（不要再用公开 alpaca-cleaned 当主数据，除非做对照）
                    </li>
                    <li>LoRA：r=16, alpha=16</li>
                    <li>max_steps=120；batch=2；accum=4；lr=2e-4；4bit=True；seq=2048</li>
                  </ul>
                  <p>
                    <strong>归因：</strong>相对 v1 主要变「数据 + steps」，r 不动，方便证明数据工程有效。
                  </p>
                </div>
              </div>

              <div className="adv-check-item">
                <Checkbox
                  checked={form.trained_v2}
                  onChange={(e) => setFlag('trained_v2', e.target.checked)}
                >
                  <strong>③ 已跑完 v2 训练并记录 loss</strong>
                </Checkbox>
                <div className="adv-help">
                  <p>跑完后从 trainer_state / 日志取 last loss，填到下方「approx_loss」（只要真实数字）。</p>
                  <p>若 OOM：按 Step 7 降 batch→1、accum→8 或 seq→1024；不要二次 from_pretrained 占满显存。</p>
                </div>
              </div>

              <div className="adv-check-item">
                <Checkbox
                  checked={form.saved_adapter_v2}
                  onChange={(e) => setFlag('saved_adapter_v2', e.target.checked)}
                >
                  <strong>④ 已保存/下载 llama_lora_zh_v2</strong>
                </Checkbox>
                <div className="adv-help">
                  <p>
                    使用 <code>save_pretrained(&quot;llama_lora_zh_v2&quot;)</code>，
                    <strong>禁止</strong>覆盖 <code>llama_lora_zh</code>（v1 留作对照/回滚）。
                  </p>
                  <p>
                    下载到本机 <code>outputs/llama_lora_zh_v2/</code>；或上传为 Dataset 防 Restart 丢失。
                  </p>
                </div>
              </div>

              <div className="adv-check-item">
                <Checkbox
                  checked={form.reevaluated_weak_qs}
                  onChange={(e) => setFlag('reevaluated_weak_qs', e.target.checked)}
                >
                  <strong>⑤ 已对弱题 / Holdout 复评</strong>
                </Checkbox>
                <div className="adv-help">
                  <p>至少跑：产物清单、Prompt vs 微调、QLoRA 原因；再抽 Holdout 3～5 题。</p>
                  <p>
                    加载用 <code>device_map=&#123;&quot;&quot;:0&#125;</code>，inputs 对齐 embedding
                    device。把真实输出写入下方「弱题复评」，替换所有「实填：……」。
                  </p>
                </div>
              </div>

              <div className="adv-check-item">
                <Checkbox
                  checked={form.wrote_comparison}
                  onChange={(e) => setFlag('wrote_comparison', e.target.checked)}
                >
                  <strong>⑥ 已写相对 v1 对比与面试口述</strong>
                </Checkbox>
                <div className="adv-help">
                  对比要写清：变好点、仍存问题、是否采用 v2、下一步。面试口述要能 1 分钟讲完数据→超参→对比。
                  把「实填结论：……」换成你的真实结论。
                </div>
              </div>
            </div>

            <div className="rt-code-block">
              <div className="rt-code-head">
                <Typography.Text strong>1）查找 Input 里的 jsonl</Typography.Text>
                <Button size="small" icon={<CopyOutlined />} onClick={() => void copyText(FIND_DATA)}>
                  复制
                </Button>
              </div>
              <pre className="rt-code">{FIND_DATA}</pre>
            </div>
            <div className="rt-code-block">
              <div className="rt-code-head">
                <Typography.Text strong>2）加载 v2 数据</Typography.Text>
                <Button size="small" icon={<CopyOutlined />} onClick={() => void copyText(LOAD_V2)}>
                  复制
                </Button>
              </div>
              <pre className="rt-code">{LOAD_V2}</pre>
            </div>
            <div className="rt-code-block">
              <div className="rt-code-head">
                <Typography.Text strong>3）保存 v2 适配器</Typography.Text>
                <Button size="small" icon={<CopyOutlined />} onClick={() => void copyText(TRAIN_SAVE)}>
                  复制
                </Button>
              </div>
              <pre className="rt-code">{TRAIN_SAVE}</pre>
            </div>
            <div className="rt-code-block">
              <div className="rt-code-head">
                <Typography.Text strong>4）加载 v2 推理（复评用）</Typography.Text>
                <Button size="small" icon={<CopyOutlined />} onClick={() => void copyText(INFER_V2)}>
                  复制
                </Button>
              </div>
              <pre className="rt-code">{INFER_V2}</pre>
            </div>

            <div className="adv-meta" style={{ marginTop: 16 }}>
              <label>
                <span>本地数据路径</span>
                <Input value={form.dataset_path} onChange={(e) => setFlag('dataset_path', e.target.value)} />
              </label>
              <label>
                <span>适配器名</span>
                <Input value={form.adapter_name} onChange={(e) => setFlag('adapter_name', e.target.value)} />
              </label>
              <label>
                <span>max_steps</span>
                <Input value={form.max_steps} onChange={(e) => setFlag('max_steps', e.target.value)} />
              </label>
              <label>
                <span>approx_loss *（真实数字）</span>
                <Input
                  value={form.approx_loss}
                  onChange={(e) => setFlag('approx_loss', e.target.value)}
                  placeholder="例如 0.85；训完再填"
                />
              </label>
              <label>
                <span>本地下载路径</span>
                <Input
                  value={form.local_adapter_path}
                  onChange={(e) => setFlag('local_adapter_path', e.target.value)}
                />
              </label>
            </div>

            <div className="adv-fields">
              <label>
                <span>云端数据路径提示</span>
                <Input.TextArea
                  rows={2}
                  value={form.cloud_data_hint}
                  onChange={(e) => setFlag('cloud_data_hint', e.target.value)}
                />
              </label>
              <label>
                <span>超参引用（Step 7）</span>
                <Input.TextArea
                  rows={2}
                  value={form.hparams_ref}
                  onChange={(e) => setFlag('hparams_ref', e.target.value)}
                />
              </label>
              <label>
                <span>弱题复评结果 *（替换所有「实填：……」）</span>
                <Input.TextArea
                  rows={12}
                  value={form.weak_q_results}
                  onChange={(e) => setFlag('weak_q_results', e.target.value)}
                />
              </label>
              <label>
                <span>相对 v1 总结 *（替换「实填结论：……」）</span>
                <Input.TextArea
                  rows={8}
                  value={form.vs_v1_summary}
                  onChange={(e) => setFlag('vs_v1_summary', e.target.value)}
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
              <li>上传 v2 jsonl → Add Input → 复制「查找路径」跑通</li>
              <li>改 load_dataset + Step 7 超参 → 训练</li>
              <li>保存 llama_lora_zh_v2 并下载到 outputs/</li>
              <li>弱题/Holdout 推理，粘贴真实输出，填 loss</li>
              <li>写对比结论 → 保存并校验</li>
            </ol>
            <Alert
              style={{ marginTop: 12 }}
              type="info"
              showIcon
              message="通过后可进阶"
              description="消融实验、自动评测、作品集打磨等见学习路径「进阶路线图」；先完成本步闭环。"
            />
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
