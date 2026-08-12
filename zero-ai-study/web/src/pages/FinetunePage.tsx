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
  CloudDownloadOutlined,
  CloudServerOutlined,
  CopyOutlined,
  DatabaseOutlined,
  LinkOutlined,
  ReloadOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
  SaveOutlined,
} from '@ant-design/icons'
import {
  confirmFinetuneChecklist,
  fetchFinetuneChecklist,
  updateStep,
  validateFinetuneChecklist,
} from '@/api/client'
import type { ActionResult, FinetuneChecklist } from '@/types/api'
import './FinetunePage.scss'

export const OFFICIAL_KAGGLE_LLAMA31 =
  'https://www.kaggle.com/notebooks/welcome?src=https%3A%2F%2Fgithub.com%2Funslothai%2Fnotebooks%2Fblob%2Fmain%2Fnb%2FKaggle-Llama3.1_%288B%29-Alpaca.ipynb'

const TOKEN_SNIPPET = `import os
from kaggle_secrets import UserSecretsClient

if not os.environ.get("HF_TOKEN"):
    os.environ["HF_TOKEN"] = UserSecretsClient().get_secret("HF_TOKEN")

print("HF_TOKEN ready:", bool(os.environ.get("HF_TOKEN")))`

const DEFAULT_OWN_JSONL =
  '/kaggle/input/datasets/coolrabbit1993/sample-alpaca-zh-01/sample_alpaca_zh.jsonl'

const FIND_INPUT_SNIPPET = `from pathlib import Path
import os

print("input exists:", Path("/kaggle/input").exists())
print("listdir:", os.listdir("/kaggle/input") if Path("/kaggle/input").exists() else [])

target = Path("/kaggle/input/datasets/coolrabbit1993/sample-alpaca-zh-01/sample_alpaca_zh.jsonl")
print("target exists:", target.exists(), target)

for root, dirs, files in os.walk("/kaggle/input"):
    for f in files:
        print(os.path.join(root, f))

# 你的真实路径是：
# /kaggle/input/datasets/coolrabbit1993/sample-alpaca-zh-01/sample_alpaca_zh.jsonl`

const LOAD_OWN_SNIPPET = `from datasets import load_dataset

# 若仍 FileNotFoundError：先跑「查找 Input 路径」格子，把 data_files 改成打印出的真实路径
dataset = load_dataset(
    "json",
    data_files="${DEFAULT_OWN_JSONL}",
    split="train",
)
dataset = dataset.map(formatting_prompts_func, batched=True)`

const SAVE_ZH_SNIPPET = `model.save_pretrained("llama_lora_zh")
tokenizer.save_pretrained("llama_lora_zh")
print("saved llama_lora_zh")`

const empty: FinetuneChecklist = {
  opened_official_link: false,
  copied_notebook: false,
  gpu_t4: false,
  internet_on: false,
  hf_login_cell: false,
  max_steps_60: false,
  run_all_ok: false,
  saved_lora: false,
  adapter_confirmed: false,
  date: '2026-07-29',
  platform: 'Kaggle',
  account: 'coolrabbit1993',
  notebook_name: 'zero-unsloth-llama31-8b',
  gpu_model: 'T4 x2',
  model_name: 'unsloth/Llama-3.1-8B-bnb-4bit',
  method: 'QLoRA',
  dataset_public: 'unsloth/alpaca-cleaned',
  max_steps: '60',
  max_seq_length: '2048',
  approx_loss: '',
  train_seconds: '',
  train_minutes: '',
  peak_memory_gb: '',
  train_extra_memory_gb: '',
  cloud_lora_path: '/kaggle/working/llama_lora/',
  local_lora_path: 'outputs/llama_lora/',
  note: '',
  uploaded_own_jsonl: true,
  kaggle_input_path: DEFAULT_OWN_JSONL,
  changed_load_dataset: false,
  retrained_own_data: false,
  own_max_steps: '60',
  own_approx_loss: '',
  saved_lora_zh: false,
  cloud_lora_zh_path: '/kaggle/working/llama_lora_zh/',
  downloaded_to_local: false,
  local_lora_zh_path: 'outputs/llama_lora_zh/',
  confirmed_at: null,
  validated_at: null,
  phase_a_ok: false,
  phase_b_ok: false,
}

function toPayload(form: FinetuneChecklist) {
  const {
    confirmed_at: _c,
    validated_at: _v,
    phase_a_ok: _a,
    phase_b_ok: _b,
    ...rest
  } = form
  return rest
}

async function copyText(text: string, okMsg: string) {
  try {
    await navigator.clipboard.writeText(text)
    message.success(okMsg)
  } catch {
    message.warning('复制失败，请手动选中复制')
  }
}

export function FinetunePage() {
  const [form, setForm] = useState<FinetuneChecklist>(empty)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [validating, setValidating] = useState(false)
  const [result, setResult] = useState<ActionResult | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setForm(await fetchFinetuneChecklist())
    } catch {
      message.error('加载失败：请确认后端 :8000 已启动')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
    void updateStep('finetune', 'doing', '前端 Step 3 前半/后半推进中').catch(() => undefined)
  }, [load])

  const aDone = useMemo(() => {
    return [
      form.opened_official_link,
      form.copied_notebook,
      form.gpu_t4,
      form.internet_on,
      form.hf_login_cell,
      form.max_steps_60,
      form.run_all_ok,
      form.saved_lora,
      form.adapter_confirmed,
    ].filter(Boolean).length
  }, [form])

  const bDone = useMemo(() => {
    return [
      form.uploaded_own_jsonl,
      form.changed_load_dataset,
      form.retrained_own_data,
      form.saved_lora_zh,
      form.downloaded_to_local,
    ].filter(Boolean).length
  }, [form])

  const phaseIndex = useMemo(() => {
    if (form.phase_b_ok) return 2
    if (form.phase_a_ok || aDone >= 9) return 1
    return 0
  }, [form.phase_a_ok, form.phase_b_ok, aDone])

  const setFlag = (key: keyof FinetuneChecklist, value: boolean | string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const onSave = async () => {
    setSaving(true)
    try {
      const res = await confirmFinetuneChecklist(toPayload(form))
      setResult(res)
      message[res.ok ? 'success' : 'warning'](res.message)
      await load()
    } catch {
      message.error('保存失败：请确认后端已启动')
    } finally {
      setSaving(false)
    }
  }

  const onValidate = async () => {
    setValidating(true)
    try {
      const res = await validateFinetuneChecklist(toPayload(form))
      setResult(res)
      message[res.ok ? 'success' : 'warning'](res.message)
      await load()
    } catch {
      message.error('校验失败：请确认后端已启动')
    } finally {
      setValidating(false)
    }
  }

  return (
    <div className="finetune-page">
      <div className="ft-page-head">
        <div>
          <h1 className="page-title">云端微调 · Step 3</h1>
          <p className="page-desc">
            前半跑通公开数据通路，后半换成自己的中文 jsonl。填写后点保存，会自动同步实验记录；再点校验检查是否齐全。
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

      <Card className="panel-card ft-top-card" loading={loading}>
        <div className="ft-progress-bar">
          <Steps
            size="small"
            current={phaseIndex}
            items={[
              { title: '前半 · 公开数据通路' },
              { title: '后半 · 自己的中文数据' },
              { title: 'Step 3 完成' },
            ]}
          />
          <Space wrap>
            <Tag color={form.phase_a_ok ? 'success' : 'processing'}>前半 {aDone}/9</Tag>
            <Tag color={form.phase_b_ok ? 'success' : 'default'}>后半 {bDone}/5</Tag>
          </Space>
        </div>
      </Card>

      <div className="finetune-grid">
        <div className="ft-main">
          <Card
            className="panel-card"
            loading={loading}
            title={
              <Space>
                <RocketOutlined />
                前半 · 公开数据通路
                {form.phase_a_ok ? <Tag color="success">已通过</Tag> : null}
              </Space>
            }
          >
            <div className="ft-check-grid">
              {(
                [
                  ['opened_official_link', '已打开官方 Kaggle Notebook 链接'],
                  ['copied_notebook', '已 Copy and Edit 为自己的本'],
                  ['gpu_t4', '已确认 GPU T4 x2'],
                  ['internet_on', '已确认 Internet = On'],
                  ['hf_login_cell', 'HF_TOKEN 就绪（登录格已跑通）'],
                  ['max_steps_60', '已设 max_steps = 60'],
                  ['run_all_ok', '训练已跑通'],
                  ['saved_lora', '已保存 llama_lora'],
                  ['adapter_confirmed', '已确认 adapter_model.safetensors'],
                ] as const
              ).map(([key, label]) => (
                <Checkbox
                  key={key}
                  checked={form[key]}
                  onChange={(e) => setFlag(key, e.target.checked)}
                >
                  {label}
                </Checkbox>
              ))}
            </div>

            <div className="ft-block">
              <div className="ft-block-title">官方本入口</div>
              <Button type="primary" ghost icon={<LinkOutlined />} href={OFFICIAL_KAGGLE_LLAMA31} target="_blank">
                打开 Llama 3.1 8B Alpaca
              </Button>
            </div>

            <div className="ft-block">
              <div className="ft-block-head">
                <div className="ft-block-title">Token 单元格（可复制）</div>
                <Button size="small" icon={<CopyOutlined />} onClick={() => void copyText(TOKEN_SNIPPET, '已复制 Token 代码')}>
                  复制
                </Button>
              </div>
              <pre className="ft-code">{TOKEN_SNIPPET}</pre>
            </div>
          </Card>

          <Card
            className="panel-card"
            style={{ marginTop: 16 }}
            title={
              <Space>
                <DatabaseOutlined />
                实验记录（自动同步到 finetune_run_log.md）
              </Space>
            }
          >
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 14 }}
              message="不用手改 md"
              description="在这里改字段 → 点「保存进度」或「保存并校验」，后端会写入 data/finetune_checklist.json 并同步 03-finetune/finetune_run_log.md。"
            />

            <div className="ft-fields-2">
              <label>
                <span>日期</span>
                <Input value={form.date} onChange={(e) => setFlag('date', e.target.value)} />
              </label>
              <label>
                <span>平台</span>
                <Input value={form.platform} onChange={(e) => setFlag('platform', e.target.value)} />
              </label>
              <label>
                <span>账号</span>
                <Input value={form.account} onChange={(e) => setFlag('account', e.target.value)} />
              </label>
              <label>
                <span>Notebook 名</span>
                <Input value={form.notebook_name} onChange={(e) => setFlag('notebook_name', e.target.value)} />
              </label>
              <label>
                <span>GPU</span>
                <Input value={form.gpu_model} onChange={(e) => setFlag('gpu_model', e.target.value)} />
              </label>
              <label>
                <span>方法</span>
                <Input value={form.method} onChange={(e) => setFlag('method', e.target.value)} />
              </label>
            </div>

            <div className="ft-fields-1" style={{ marginTop: 10 }}>
              <label>
                <span>基座模型</span>
                <Input value={form.model_name} onChange={(e) => setFlag('model_name', e.target.value)} />
              </label>
              <label>
                <span>公开数据集</span>
                <Input value={form.dataset_public} onChange={(e) => setFlag('dataset_public', e.target.value)} />
              </label>
            </div>

            <div className="ft-fields-3" style={{ marginTop: 10 }}>
              <label>
                <span>max_steps</span>
                <Input value={form.max_steps} onChange={(e) => setFlag('max_steps', e.target.value)} />
              </label>
              <label>
                <span>max_seq_length</span>
                <Input value={form.max_seq_length} onChange={(e) => setFlag('max_seq_length', e.target.value)} />
              </label>
              <label>
                <span>最终 loss *</span>
                <Input
                  value={form.approx_loss}
                  placeholder="例如 0.885100"
                  onChange={(e) => setFlag('approx_loss', e.target.value)}
                />
              </label>
            </div>

            <div className="ft-fields-4" style={{ marginTop: 10 }}>
              <label>
                <span>训练秒数</span>
                <Input value={form.train_seconds} onChange={(e) => setFlag('train_seconds', e.target.value)} />
              </label>
              <label>
                <span>训练分钟</span>
                <Input value={form.train_minutes} onChange={(e) => setFlag('train_minutes', e.target.value)} />
              </label>
              <label>
                <span>峰值显存 GB</span>
                <Input value={form.peak_memory_gb} onChange={(e) => setFlag('peak_memory_gb', e.target.value)} />
              </label>
              <label>
                <span>训练额外 GB</span>
                <Input
                  value={form.train_extra_memory_gb}
                  onChange={(e) => setFlag('train_extra_memory_gb', e.target.value)}
                />
              </label>
            </div>

            <div className="ft-fields-2" style={{ marginTop: 10 }}>
              <label>
                <span>云端 LoRA 路径</span>
                <Input value={form.cloud_lora_path} onChange={(e) => setFlag('cloud_lora_path', e.target.value)} />
              </label>
              <label>
                <span>本机 LoRA 路径</span>
                <Input value={form.local_lora_path} onChange={(e) => setFlag('local_lora_path', e.target.value)} />
              </label>
            </div>

            <label className="ft-note-label">
              <span>备注</span>
              <Input.TextArea
                rows={3}
                value={form.note}
                onChange={(e) => setFlag('note', e.target.value)}
                placeholder="坑、推理抽检结论等"
              />
            </label>
          </Card>

          <Card
            className="panel-card"
            style={{ marginTop: 16 }}
            title={
              <Space>
                <CloudDownloadOutlined />
                后半 · 换成自己的中文数据
                {form.phase_b_ok ? <Tag color="success">已通过</Tag> : <Tag>进行中</Tag>}
              </Space>
            }
          >
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 14 }}
              message="已同步你的真实 Input 路径"
              description={
                <span>
                  本机账号数据集路径为 <code>{DEFAULT_OWN_JSONL}</code>
                  （不是侧栏短名）。复制下方 load_dataset 代码到 Notebook 即可。
                </span>
              }
            />

            <div className="ft-block" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
              <div className="ft-block-head">
                <div className="ft-block-title">查找 Input 路径（报错时先跑）</div>
                <Button
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => void copyText(FIND_INPUT_SNIPPET, '已复制查找路径代码')}
                >
                  复制
                </Button>
              </div>
              <pre className="ft-code">{FIND_INPUT_SNIPPET}</pre>
            </div>
            <div className="ft-item">
              <div className="ft-item-head">
                <span className="ft-num">1</span>
                <div>
                  <div className="ft-item-title">确认已 Upload / 挂载 sample_alpaca_zh.jsonl</div>
                  <div className="ft-item-desc">你已在 Input → DATASETS 看到该文件，可直接勾选。</div>
                </div>
              </div>
              <div className="ft-item-body stacked">
                <Checkbox
                  checked={form.uploaded_own_jsonl}
                  onChange={(e) => setFlag('uploaded_own_jsonl', e.target.checked)}
                >
                  已挂载自己的 jsonl
                </Checkbox>
                <Input
                  placeholder={DEFAULT_OWN_JSONL}
                  value={form.kaggle_input_path}
                  onChange={(e) => setFlag('kaggle_input_path', e.target.value)}
                />
              </div>
            </div>

            <div className="ft-item">
              <div className="ft-item-head">
                <span className="ft-num">2</span>
                <div>
                  <div className="ft-item-title">把 load_dataset 改成读你的 jsonl</div>
                  <div className="ft-item-desc">替换原来的 unsloth/alpaca-cleaned。</div>
                </div>
              </div>
              <div className="ft-item-body stacked">
                <div className="ft-code-wrap">
                  <Button
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() =>
                      void copyText(
                        LOAD_OWN_SNIPPET.replace(
                          DEFAULT_OWN_JSONL,
                          form.kaggle_input_path || DEFAULT_OWN_JSONL,
                        ),
                        '已复制 load_dataset 代码',
                      )
                    }
                  >
                    复制代码
                  </Button>
                  <pre className="ft-code">
                    {LOAD_OWN_SNIPPET.replace(
                      DEFAULT_OWN_JSONL,
                      form.kaggle_input_path || DEFAULT_OWN_JSONL,
                    )}
                  </pre>
                </div>
                <Checkbox
                  checked={form.changed_load_dataset}
                  onChange={(e) => setFlag('changed_load_dataset', e.target.checked)}
                >
                  已改 load_dataset 并成功加载
                </Checkbox>
              </div>
            </div>

            <div className="ft-item">
              <div className="ft-item-head">
                <span className="ft-num">3</span>
                <div>
                  <div className="ft-item-title">再训一小段（建议 60～200 steps）</div>
                  <div className="ft-item-desc">改 max_steps 后重新 trainer.train()。</div>
                </div>
              </div>
              <div className="ft-item-body stacked">
                <div className="ft-fields-2">
                  <label>
                    <span>本次 max_steps</span>
                    <Input value={form.own_max_steps} onChange={(e) => setFlag('own_max_steps', e.target.value)} />
                  </label>
                  <label>
                    <span>本次最终 loss</span>
                    <Input
                      placeholder="训完后填写"
                      value={form.own_approx_loss}
                      onChange={(e) => setFlag('own_approx_loss', e.target.value)}
                    />
                  </label>
                </div>
                <Checkbox
                  checked={form.retrained_own_data}
                  onChange={(e) => setFlag('retrained_own_data', e.target.checked)}
                >
                  已用自己的数据训练完成
                </Checkbox>
              </div>
            </div>

            <div className="ft-item">
              <div className="ft-item-head">
                <span className="ft-num">4</span>
                <div>
                  <div className="ft-item-title">保存 llama_lora_zh</div>
                  <div className="ft-item-desc">另存一份，避免覆盖前半的 llama_lora。</div>
                </div>
              </div>
              <div className="ft-item-body stacked">
                <div className="ft-code-wrap">
                  <Button
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => void copyText(SAVE_ZH_SNIPPET, '已复制保存代码')}
                  >
                    复制
                  </Button>
                  <pre className="ft-code">{SAVE_ZH_SNIPPET}</pre>
                </div>
                <Input
                  value={form.cloud_lora_zh_path}
                  onChange={(e) => setFlag('cloud_lora_zh_path', e.target.value)}
                  placeholder="云端路径"
                />
                <Checkbox
                  checked={form.saved_lora_zh}
                  onChange={(e) => setFlag('saved_lora_zh', e.target.checked)}
                >
                  已保存 llama_lora_zh（含 adapter_model.safetensors）
                </Checkbox>
              </div>
            </div>

            <div className="ft-item last">
              <div className="ft-item-head">
                <span className="ft-num">5</span>
                <div>
                  <div className="ft-item-title">Download 到本机 outputs/</div>
                  <div className="ft-item-desc">下载到 zero-ai-study/outputs/llama_lora_zh/（勿提交 Git）。</div>
                </div>
              </div>
              <div className="ft-item-body stacked">
                <Input
                  value={form.local_lora_zh_path}
                  onChange={(e) => setFlag('local_lora_zh_path', e.target.value)}
                />
                <Checkbox
                  checked={form.downloaded_to_local}
                  onChange={(e) => setFlag('downloaded_to_local', e.target.checked)}
                >
                  已下载到本机
                </Checkbox>
              </div>
            </div>
          </Card>
        </div>

        <div className="ft-side">
          <Card
            className="panel-card"
            title={
              <Space>
                <CloudServerOutlined />
                当前状态
              </Space>
            }
          >
            <div className="ft-status-list">
              <div>
                <Typography.Text type="secondary">前半</Typography.Text>
                <div>
                  <Tag color={form.phase_a_ok ? 'success' : 'processing'}>
                    {form.phase_a_ok ? '校验通过' : `${aDone}/9`}
                  </Tag>
                </div>
              </div>
              <div>
                <Typography.Text type="secondary">后半</Typography.Text>
                <div>
                  <Tag color={form.phase_b_ok ? 'success' : 'default'}>
                    {form.phase_b_ok ? '校验通过' : `${bDone}/5`}
                  </Tag>
                </div>
              </div>
              <div>
                <Typography.Text type="secondary">loss（公开数据）</Typography.Text>
                <div className="ft-status-value">{form.approx_loss || '未填'}</div>
              </div>
              <div>
                <Typography.Text type="secondary">最近保存</Typography.Text>
                <div className="ft-status-value">
                  {form.confirmed_at ? new Date(form.confirmed_at).toLocaleString() : '尚未保存'}
                </div>
              </div>
            </div>

            {result ? (
              <Alert
                style={{ marginTop: 12 }}
                type={result.ok ? 'success' : 'warning'}
                showIcon
                message={result.message}
                description={result.details.join(' · ')}
              />
            ) : (
              <Typography.Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
                先点「保存进度」写入；确认无误后再「保存并校验」。
              </Typography.Paragraph>
            )}

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

          <Card className="panel-card" title="你现在该做什么">
            <ul className="ft-bullets">
              <li>核对前半勾选与 loss（已预填 0.885100，可改）</li>
              <li>填写 Kaggle Input 真实路径</li>
              <li>复制 load_dataset 代码到 Notebook 替换</li>
              <li>再训 → 保存 llama_lora_zh → 下载</li>
              <li>每做完一小步就回前端勾选并保存</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}
