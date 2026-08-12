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
  CloudDownloadOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SaveOutlined,
} from '@ant-design/icons'
import {
  confirmExportChecklist,
  fetchExportChecklist,
  updateStep,
  validateExportChecklist,
} from '@/api/client'
import type { ActionResult, ExportChecklist } from '@/types/api'
import './ExportPage.scss'

const RELOAD_SNIPPET = `# ========== 做法 A（推荐）：同一会话里只改问题，不要再 from_pretrained ==========
# 若上一格已经成功加载过 llama_lora_zh，只跑下面这段即可：

prompt = alpaca_prompt.format(
    "微调完成后常见产物有哪些？",  # 换题只改这里
    "",
    "",
)
inputs = tokenizer([prompt], return_tensors="pt")
device = model.get_input_embeddings().weight.device
inputs = {k: v.to(device) for k, v in inputs.items()}
print("device =", device)

from transformers import TextStreamer
text_streamer = TextStreamer(tokenizer)
_ = model.generate(**inputs, streamer = text_streamer, max_new_tokens = 128)

# ========== 做法 B：必须「重新加载」时（会话重启后，或第一次验证重载）==========
# 1) 先 Restart session / 清空 GPU，再只跑加载，不要连着训两份模型
# 2) 强制单卡，避免 T4 x2 把参数卸到 meta/CPU

# import gc, torch
# try:
#     del model
# except NameError:
#     pass
# gc.collect()
# torch.cuda.empty_cache()
#
# from unsloth import FastLanguageModel
# model, tokenizer = FastLanguageModel.from_pretrained(
#     model_name = "llama_lora_zh",
#     max_seq_length = max_seq_length,
#     dtype = dtype,
#     load_in_4bit = load_in_4bit,
#     device_map = {"": 0},  # 关键：只用 cuda:0
# )
# FastLanguageModel.for_inference(model)`

const GGUF_SNIPPET = `# 章节 L：只打开你需要的一行，把 if False 改成 if True
# 推荐先本地 q4_k_m（体积相对小；仍可能很大，勿提交 Git）
model.save_pretrained_gguf(
    "llama_finetune_zh",
    tokenizer,
    quantization_method = "q4_k_m",
)
# 可选：推到 HF（把 HF_USERNAME 换成 organism93）
# model.push_to_hub_gguf("organism93/llama_finetune_zh", tokenizer, quantization_method="q4_k_m", token=os.environ["HF_TOKEN"])`

function toPayload(form: ExportChecklist) {
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

export function ExportPage() {
  const [form, setForm] = useState<ExportChecklist | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [validating, setValidating] = useState(false)
  const [result, setResult] = useState<ActionResult | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setForm(await fetchExportChecklist())
    } catch {
      message.error('加载失败：请确认后端已启动')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
    void updateStep('finetune', 'done', 'Step 3 已完成，进入导出').catch(() => undefined)
    void updateStep('eval', 'done', 'Step 4 已完成，进入导出').catch(() => undefined)
    void updateStep('export', 'doing', '开始 Step 5 导出与复现加载').catch(() => undefined)
  }, [load])

  const done = useMemo(() => {
    if (!form) return 0
    return [
      form.confirmed_local_adapter,
      form.reloaded_adapter,
      form.ran_reload_infer,
      form.wrote_notes,
    ].filter(Boolean).length
  }, [form])

  const setFlag = (key: keyof ExportChecklist, value: boolean | string) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  const onSave = async () => {
    if (!form) return
    setSaving(true)
    try {
      const res = await confirmExportChecklist(toPayload(form))
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
      const res = await validateExportChecklist(toPayload(form))
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
      <div className="export-page">
        <h1 className="page-title">导出与推理 · Step 5</h1>
        <Card className="panel-card" loading={loading} />
      </div>
    )
  }

  return (
    <div className="export-page">
      <div className="ex-page-head">
        <div>
          <h1 className="page-title">导出与推理 · Step 5</h1>
          <p className="page-desc">
            每条清单下面都有具体操作说明。先做「重载 + 答一题」；笔记跑完再填（或发我代填）。GGUF
            可跳过。
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
        <div className="ex-progress">
          <Steps
            size="small"
            current={form.ok ? 2 : done >= 2 ? 1 : 0}
            items={[
              { title: '确认适配器' },
              { title: '重载并推理' },
              { title: '笔记 + 可选 GGUF' },
            ]}
          />
          <Tag color={form.ok ? 'success' : 'processing'}>
            {done}/4 · {form.ok ? '已通过' : '进行中'}
          </Tag>
        </div>
      </Card>

      <Alert
        style={{ marginBottom: 16 }}
        type="info"
        showIcon
        message="什么是 if False？"
        description={
          <span>
            Notebook 里很多可选步骤写成 <code>if False:</code>，意思是<strong>开关关掉</strong>：你点运行也什么都不做、没有输出。
            要真正执行，把那一行改成 <code>if True:</code>（或删掉 if，只留里面的代码）。章节 K / L 都是这种写法。
          </span>
        }
      />

      <div className="export-grid">
        <div>
          <Card
            className="panel-card"
            title={
              <Space>
                <CloudDownloadOutlined />
                操作清单（照着做，做完再勾）
              </Space>
            }
          >
            <div className="ex-checks">
              <div className="ex-check-item">
                <Checkbox
                  checked={form.confirmed_local_adapter}
                  onChange={(e) => setFlag('confirmed_local_adapter', e.target.checked)}
                >
                  <strong>① 确认适配器文件还在</strong>
                </Checkbox>
                <div className="ex-check-help">
                  <p>
                    打开本机文件夹{' '}
                    <code>zero-ai-study/outputs/llama_lora_zh/</code>
                    ，里面应有 <code>adapter_model.safetensors</code>（还有
                    adapter_config.json、tokenizer 等）。
                  </p>
                  <p>
                    若本机没有：到 Kaggle 该次运行的 <strong>Output</strong> 里下载
                    llama_lora_zh 目录；或确认会话还在、云端路径{' '}
                    <code>/kaggle/working/llama_lora_zh</code> 仍存在。
                  </p>
                </div>
              </div>

              <div className="ex-check-item">
                <Checkbox
                  checked={form.reloaded_adapter}
                  onChange={(e) => setFlag('reloaded_adapter', e.target.checked)}
                >
                  <strong>② 在 Kaggle「重新加载」适配器（章节 K）</strong>
                </Checkbox>
                <div className="ex-check-help">
                  <p>
                    找到 Notebook 里标题类似「重新加载 / load adapter」的格子（注解文档叫{' '}
                    <strong>章节 K</strong>）。格子开头大概是：
                  </p>
                  <pre className="ex-mini-code">{`if False:
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name = "llama_lora",  # 要改成你的目录名
        ...
    )`}</pre>
                  <p>你要做的：</p>
                  <ol>
                    <li>
                      把 <code>if False:</code> 改成 <code>if True:</code>（否则点运行等于白跑）
                    </li>
                    <li>
                      把 <code>model_name = &quot;llama_lora&quot;</code> 改成{' '}
                      <code>&quot;llama_lora_zh&quot;</code>（和你 Step 3 保存的文件夹名一致）
                    </li>
                    <li>运行这一格，等到模型加载完（无报错）</li>
                  </ol>
                  <p>
                    「重载」= 不靠内存里刚训完的 model，而是从磁盘目录再读一遍适配器，证明以后还能复现。
                  </p>
                </div>
              </div>

              <div className="ex-check-item">
                <Checkbox
                  checked={form.ran_reload_infer}
                  onChange={(e) => setFlag('ran_reload_infer', e.target.checked)}
                >
                  <strong>③ 重载后跑一次问答（generate）</strong>
                </Checkbox>
                <div className="ex-check-help">
                  <p>
                    加载成功后，在同会话里再跑一格「提问 → 生成回答」。常见写法是{' '}
                    <code>model.generate(...)</code>，单元格输出里会出现模型回复。
                  </p>
                  <p>任选一题即可，例如：</p>
                  <ul>
                    <li>「用一句话说明什么是 QLoRA。」</li>
                    <li>或章节 K 自带的巴黎铁塔英文题</li>
                  </ul>
                  <p>
                    <strong>换题时：</strong>不要再跑{' '}
                    <code>from_pretrained</code>。显存里已有模型时再加载一次，T4 x2
                    常会把权重卸到 CPU/meta，然后报{' '}
                    <code>Tensor.item() cannot be called on meta tensors</code>。
                    只改 <code>prompt = ...</code> 再跑 generate。
                  </p>
                  <p>
                    <strong>若出现 OOM / meta tensors：</strong>说明显存已被「加载失败的残留」占满，情况
                    1 救不了。必须 <strong>Restart session</strong>，再按做法 B
                    只加载一次（加 <code>device_map = &#123;&quot;&quot;: 0&#125;</code>），然后只改
                    prompt 提问。
                  </p>
                  <p>
                    <strong>T4 x2：</strong>generate 时不要写死{' '}
                    <code>.to(&quot;cuda&quot;)</code>，用{' '}
                    <code>model.get_input_embeddings().weight.device</code>。
                  </p>
                </div>
              </div>

              <div className="ex-check-item">
                <Checkbox
                  checked={form.wrote_notes}
                  onChange={(e) => setFlag('wrote_notes', e.target.checked)}
                >
                  <strong>④ 填写本页下方 LoRA 笔记</strong>
                </Checkbox>
                <div className="ex-check-help">
                  <p>至少填这三项（跑完后你自己补，或把输出发给我帮你写）：</p>
                  <ul>
                    <li>
                      <strong>基座模型</strong>：一般是{' '}
                      <code>unsloth/Llama-3.1-8B-bnb-4bit</code>
                    </li>
                    <li>
                      <strong>本地 / 云端适配器目录</strong>：例如{' '}
                      <code>outputs/llama_lora_zh/</code>、{' '}
                      <code>/kaggle/working/llama_lora_zh</code>
                    </li>
                    <li>
                      <strong>加载 / 推理摘要</strong>：一两句话即可，例如「章节 K 改
                      True，model_name=llama_lora_zh，问了 QLoRA，中文回答正常」
                    </li>
                  </ul>
                </div>
              </div>

              <div className="ex-check-item ex-check-optional">
                <Typography.Text type="secondary" strong>
                  下面二选一（GGUF 很大，入门可跳过）
                </Typography.Text>
              </div>

              <div className="ex-check-item">
                <Checkbox
                  checked={form.skipped_gguf}
                  onChange={(e) => {
                    setFlag('skipped_gguf', e.target.checked)
                    if (e.target.checked) setFlag('did_gguf', false)
                  }}
                >
                  <strong>⑤a 本轮跳过 GGUF</strong>（勾这个也能完成 Step 5）
                </Checkbox>
                <div className="ex-check-help">
                  <p>
                    GGUF = 给 Ollama / LM Studio 等本机工具用的量化权重文件，体积常达数
                    GB。你暂时不打算本机离线聊天，就勾这里，不必动章节 L。
                  </p>
                </div>
              </div>

              <div className="ex-check-item">
                <Checkbox
                  checked={form.did_gguf}
                  onChange={(e) => {
                    setFlag('did_gguf', e.target.checked)
                    if (e.target.checked) setFlag('skipped_gguf', false)
                  }}
                >
                  <strong>⑤b 已导出 GGUF</strong>（想做再勾；与 ⑤a 互斥）
                </Checkbox>
                <div className="ex-check-help">
                  <p>
                    找到 Notebook <strong>章节 L</strong> 里类似{' '}
                    <code>save_pretrained_gguf</code> / <code>q4_k_m</code> 的那一行：
                  </p>
                  <pre className="ex-mini-code">{`if False: model.save_pretrained_gguf(..., quantization_method = "q4_k_m")`}</pre>
                  <p>
                    把这一行改成 <code>if True:</code>，其余 merge / 多量化行保持{' '}
                    <code>if False</code>（一次只开一种，防磁盘满）。跑完后在 Output
                    里找 <code>.gguf</code> 文件，把路径填到下方「GGUF 文件路径」。
                  </p>
                </div>
              </div>

              <div className="ex-check-item">
                <Checkbox
                  checked={form.did_ollama}
                  onChange={(e) => setFlag('did_ollama', e.target.checked)}
                >
                  <strong>⑥（可选）本机工具试聊</strong>
                </Checkbox>
                <div className="ex-check-help">
                  <p>只有你已经导出了 .gguf 才需要。任选一种即可，例如：</p>
                  <ul>
                    <li>
                      <strong>Ollama</strong>：写 Modelfile 指向 gguf →{' '}
                      <code>ollama create …</code> → <code>ollama run …</code>
                    </li>
                    <li>
                      <strong>LM Studio</strong>：在软件里导入该 gguf 后聊天
                    </li>
                    <li>
                      <strong>llama.cpp</strong>：用其 CLI 加载 gguf 提问
                    </li>
                  </ul>
                  <p>没做就不要勾；也不影响 Step 5 校验通过。</p>
                </div>
              </div>
            </div>

            <div className="ex-meta">
              <label>
                <span>基座模型 *</span>
                <Input value={form.base_model} onChange={(e) => setFlag('base_model', e.target.value)} />
              </label>
              <label>
                <span>本地适配器目录 *</span>
                <Input value={form.adapter_dir} onChange={(e) => setFlag('adapter_dir', e.target.value)} />
              </label>
              <label>
                <span>云端适配器目录</span>
                <Input
                  value={form.cloud_adapter_dir}
                  onChange={(e) => setFlag('cloud_adapter_dir', e.target.value)}
                />
              </label>
              <label>
                <span>GGUF 量化类型</span>
                <Input
                  value={form.gguf_quant}
                  onChange={(e) => setFlag('gguf_quant', e.target.value)}
                  placeholder="q4_k_m"
                  disabled={form.skipped_gguf && !form.did_gguf}
                />
              </label>
            </div>

            <div className="ex-fields">
              <label>
                <span>加载 / 推理摘要 *</span>
                <Input.TextArea
                  rows={3}
                  value={form.load_summary}
                  onChange={(e) => setFlag('load_summary', e.target.value)}
                  placeholder="跑完再填。例：章节K if True + model_name=llama_lora_zh；问「什么是QLoRA」；输出：……（可粘贴一两句）"
                />
              </label>
              <label>
                <span>GGUF 文件路径</span>
                <Input
                  value={form.gguf_path}
                  onChange={(e) => setFlag('gguf_path', e.target.value)}
                  placeholder="导出后填写；跳过可留空"
                  disabled={form.skipped_gguf && !form.did_gguf}
                />
              </label>
              <label>
                <span>Ollama / 本机命令</span>
                <Input.TextArea
                  rows={2}
                  value={form.ollama_cmd}
                  onChange={(e) => setFlag('ollama_cmd', e.target.value)}
                  placeholder="可选：Modelfile + ollama create / run …"
                />
              </label>
              <label>
                <span>问题记录</span>
                <Input.TextArea
                  rows={2}
                  value={form.issues}
                  onChange={(e) => setFlag('issues', e.target.value)}
                  placeholder="导出失败、模板不对、乱码等"
                />
              </label>
              <label>
                <span>其他备注</span>
                <Input.TextArea rows={2} value={form.note} onChange={(e) => setFlag('note', e.target.value)} />
              </label>
            </div>
          </Card>

          <Card className="panel-card" style={{ marginTop: 16 }} title="可复制代码">
            <div className="ex-code-block">
              <div className="ex-code-head">
                <Typography.Text strong>1）重载适配器 + 推理</Typography.Text>
                <Button size="small" icon={<CopyOutlined />} onClick={() => void copyText(RELOAD_SNIPPET)}>
                  复制
                </Button>
              </div>
              <pre className="ex-code">{RELOAD_SNIPPET}</pre>
            </div>
            <div className="ex-code-block">
              <div className="ex-code-head">
                <Typography.Text strong>2）（可选）导出 q4_k_m GGUF</Typography.Text>
                <Button size="small" icon={<CopyOutlined />} onClick={() => void copyText(GGUF_SNIPPET)}>
                  复制
                </Button>
              </div>
              <pre className="ex-code">{GGUF_SNIPPET}</pre>
              <Typography.Paragraph type="secondary" style={{ marginBottom: 0, marginTop: 8 }}>
                GGUF 很大，不要提交 Git。本机试聊可装 Ollama，用 Modelfile 指向下载的 .gguf。
              </Typography.Paragraph>
            </div>
          </Card>
        </div>

        <div className="ex-side">
          <Card className="panel-card" title="你现在该做什么">
            <ol className="ex-steps">
              <li>
                先做清单 <strong>①</strong>：确认本机或 Kaggle 上还有 llama_lora_zh
              </li>
              <li>
                做 <strong>②</strong>：章节 K 把 <code>if False</code> →{' '}
                <code>if True</code>，model_name 改成 llama_lora_zh，运行加载
              </li>
              <li>
                做 <strong>③</strong>：同一会话再跑一题 generate，看到回答即可
              </li>
              <li>
                把输出要点填进「加载 / 推理摘要」，勾 <strong>④</strong>（或发我帮你填）
              </li>
              <li>
                GGUF：入门勾 <strong>⑤a 跳过</strong>；想玩本机聊天再做 ⑤b
              </li>
              <li>点「保存并校验」</li>
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
