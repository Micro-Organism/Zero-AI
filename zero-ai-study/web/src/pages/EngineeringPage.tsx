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
  CopyOutlined,
  FormOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SaveOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import {
  confirmEngineeringChecklist,
  fetchEngineeringChecklist,
  updateStep,
  validateEngineeringChecklist,
} from '@/api/client'
import type { ActionResult, EngineeringChecklist } from '@/types/api'
import './AdvancedStep.scss'
import './EngineeringPage.scss'

const LEARNING_TEMPLATE: Pick<
  EngineeringChecklist,
  | 'kaggle_dataset'
  | 'dataset_path'
  | 'cloud_data_hint'
  | 'train_mode'
  | 'adapter_name'
  | 'max_steps'
  | 'local_v2_path'
  | 'local_v3_path'
  | 'hparams_ref'
  | 'g1_output'
  | 'g2_output'
  | 'g3_output'
  | 'g4_note'
  | 'vs_v2_summary'
  | 'interview_talk'
  | 'note'
> = {
  kaggle_dataset: 'zero-ds-v3',
  dataset_path: 'datasets/sample_alpaca_zh_v3.jsonl',
  cloud_data_hint:
    'Add Input「zero-ds-v3」；os.walk 找 sample_alpaca_zh_v3.jsonl。常见：/kaggle/input/datasets/coolrabbit1993/zero-ds-v3/sample_alpaca_zh_v3.jsonl（以打印为准）。续训还需 Add Input 挂上 llama_lora_zh_v2 适配器 Dataset。',
  train_mode: 'continue_from_v2',
  adapter_name: 'llama_lora_zh_v3',
  max_steps: '60',
  local_v2_path: 'outputs/llama_lora_zh_v2/',
  local_v3_path: 'outputs/llama_lora_zh_v3/',
  hparams_ref:
    '【续训推荐】加载 ADAPTER_V2（已是 LoRA，不要再 get_peft_model）；数据=v3 jsonl；max_steps=60；lr=1e-4；r/alpha 已在 v2 内=16；batch=2；accum=4；seq=2048；4bit=True。\n【全量备选】基座 Llama-3.1-8B-bnb-4bit + 新挂 LoRA r=16/alpha=16；max_steps=120；lr=2e-4；其余同上。保存名一律 llama_lora_zh_v3，禁止覆盖 v2。',
  g1_output:
    '【学习模板 · 训完后换成真实 Response】\n题：请列举一次 QLoRA 微调结束后你应归档的产物清单，并区分必留与可选。\n- v2（未过）：答偏 +「落地建议」套话\n- v3 实填：……\n合格：必留点到适配器权重、adapter_config、日志/超参、评测记录；可选可写 GGUF/合并；禁止出现「落地建议：」。',
  g2_output:
    '【学习模板】题：用「改权重与否」对比 Prompt / LoRA / 全量。\nv3 实填：……\n合格：明确 Prompt 不改权重；LoRA 改适配器；全量改基座。',
  g3_output:
    '【学习模板】题：QLoRA 是否等于「全部参数都以 4bit 做全量更新」？\nv3 实填：……\n合格：否定；强调 4bit 装基座 + 只训 LoRA。',
  g4_note:
    '【学习模板】抽检 5 题（可含 #50/#80 + 任意 3 题）：\n#__ ：有无「落地建议：」或固定「把该知识点对应到实验日志」→ 是/否\n…\n统计：套话题数 = __ / 5（须 ≤1 才勾 G4）',
  vs_v2_summary:
    '【学习模板 · 换成真实结论】\n1) 数据：去掉统一「落地建议」垫长 → sample_alpaca_zh_v3 + Dataset zero-ds-v3\n2) 训练：continue_from_v2 / steps=__ / loss=__\n3) G1～G5：过/不过\n4) 是否采用 v3 为交付默认；v2 是否保留回滚\n实填结论：……',
  interview_talk:
    'v2 证明扩数据有效，但产物题被「落地建议」模板污染。我清洗生成器得到 v3，在 Kaggle 用 zero-ds-v3 从 v2 续训（或全量重训）得到 llama_lora_zh_v3，用固定 Holdout 门禁 G1～G5 验收，不把 loss 当满意度。工程结论以门禁为准。',
  note: '按下方 ①～⑨ 与可复制代码逐步做。续训最易错：二次 get_peft_model、覆盖 v2、jsonl 路径猜错、二次 from_pretrained OOM。',
}

const GATE_ROWS = [
  {
    key: 'g1',
    id: 'G1',
    q: '产物清单（Holdout#0）',
    pass: '适配器权重 + adapter_config + 日志/超参 + 评测；可选 GGUF',
    fail: '术语堆砌；「落地建议：」套话；答成别的题',
  },
  {
    key: 'g2',
    id: 'G2',
    q: 'Prompt/LoRA/全量（#10）',
    pass: '用「改不改权重」分清三者',
    fail: '含混、只堆名词',
  },
  {
    key: 'g3',
    id: 'G3',
    q: 'QLoRA 判断（#25）',
    pass: '否定全参 4bit 全量更新；强调只训 LoRA',
    fail: '说成全部参数 4bit 训练',
  },
  {
    key: 'g4',
    id: 'G4',
    q: '套话抽检 5 题',
    pass: '固定长套话 ≤1/5',
    fail: '≥2 题复读同一模板句',
  },
  {
    key: 'g5',
    id: 'G5',
    q: '可交付',
    pass: '本机/云端可重载 llama_lora_zh_v3 + 日志',
    fail: '仅 /kaggle/working 临时、Restart 即丢',
  },
]

const FIND_PATHS = `import os

jsonls, adapters = [], []
for root, dirs, files in os.walk("/kaggle/input"):
    for f in files:
        if f.endswith(".jsonl"):
            jsonls.append(os.path.join(root, f))
    if "adapter_config.json" in files:
        adapters.append(root)

print("=== jsonl ===")
for p in jsonls:
    print(p)
print("=== adapters ===")
for p in adapters:
    print(p)

# 按打印结果改下面两行（不要猜路径）
DATA_PATH = [p for p in jsonls if "sample_alpaca_zh_v3" in p][0]
ADAPTER_V2 = adapters[0]  # 若多条，选含 llama_lora_zh_v2 的目录
print("DATA_PATH =", DATA_PATH)
print("ADAPTER_V2 =", ADAPTER_V2)`

const LOAD_CONTINUE = `# ========== 推荐：从 v2 续训（不要跑空白基座+新挂 LoRA）==========
from unsloth import FastLanguageModel
import torch

max_seq_length = 2048
dtype = None
load_in_4bit = True

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name = ADAPTER_V2,  # v2 适配器目录，不是 unsloth/Llama-...
    max_seq_length = max_seq_length,
    dtype = dtype,
    load_in_4bit = load_in_4bit,
    device_map = {"": 0},
)
print("loaded v2 adapter for continue train")
# ❌ 禁止再执行 FastLanguageModel.get_peft_model(...)  （已经是 LoRA）`

const LOAD_SCRATCH = `# ========== 备选：全量重训（从基座重新挂 LoRA）==========
from unsloth import FastLanguageModel
import torch

max_seq_length = 2048
dtype = None
load_in_4bit = True

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name = "unsloth/Llama-3.1-8B-bnb-4bit",
    max_seq_length = max_seq_length,
    dtype = dtype,
    load_in_4bit = load_in_4bit,
    device_map = {"": 0},
)
model = FastLanguageModel.get_peft_model(
    model,
    r = 16,
    target_modules = ["q_proj","k_proj","v_proj","o_proj","gate_proj","up_proj","down_proj"],
    lora_alpha = 16,
    lora_dropout = 0,
    bias = "none",
    use_gradient_checkpointing = "unsloth",
    random_state = 3407,
)
print("fresh LoRA on base")`

const LOAD_DATA = `alpaca_prompt = """Below is an instruction that describes a task, paired with an input that provides further context. Write a response that appropriately completes the request.

### Instruction:
{}

### Input:
{}

### Response:
{}"""

EOS_TOKEN = tokenizer.eos_token

def formatting_prompts_func(examples):
    texts = []
    for instruction, input, output in zip(
        examples["instruction"], examples["input"], examples["output"]
    ):
        texts.append(alpaca_prompt.format(instruction, input, output) + EOS_TOKEN)
    return {"text": texts}

from datasets import load_dataset
# ❌ 不要再用 alpaca-cleaned 或 v2 污染集当主数据
dataset = load_dataset("json", data_files=DATA_PATH, split="train")
print("rows:", len(dataset))
print(dataset[0])
# 抽查：不应再大量出现「落地建议：」
n_poll = sum(1 for i in range(min(100, len(dataset))) if "落地建议" in dataset[i]["output"])
print("落地建议 in first100:", n_poll)
dataset = dataset.map(formatting_prompts_func, batched=True)`

const TRAIN_CONTINUE = `from trl import SFTConfig, SFTTrainer

trainer = SFTTrainer(
    model = model,
    tokenizer = tokenizer,
    train_dataset = dataset,
    dataset_text_field = "text",
    max_seq_length = max_seq_length,
    packing = False,
    args = SFTConfig(
        per_device_train_batch_size = 2,
        gradient_accumulation_steps = 4,
        warmup_steps = 5,
        max_steps = 60,        # 续训 60；全量重训改 120
        learning_rate = 1e-4,  # 续训略降；全量可用 2e-4
        logging_steps = 1,
        optim = "adamw_8bit",
        weight_decay = 0.001,
        lr_scheduler_type = "linear",
        seed = 3407,
        output_dir = "outputs_v3",
        report_to = "none",
    ),
)

trainer_stats = trainer.train()
# 从日志最后一行 {'loss': ...} 填看板 approx_loss`

const SAVE_V3 = `# ❌ 禁止 save_pretrained("llama_lora_zh_v2") 覆盖对照版
model.save_pretrained("llama_lora_zh_v3")
tokenizer.save_pretrained("llama_lora_zh_v3")
print("saved llama_lora_zh_v3")
!ls -la llama_lora_zh_v3 | head`

const ASK_GATES = `from transformers import TextStreamer
FastLanguageModel.for_inference(model)

def ask(instruction, max_new_tokens=256):
    inputs = tokenizer([alpaca_prompt.format(instruction, "", "")], return_tensors="pt")
    device = model.get_input_embeddings().weight.device
    inputs = {k: v.to(device) for k, v in inputs.items()}
    print("=" * 60)
    print("Q:", instruction)
    _ = model.generate(**inputs, streamer=TextStreamer(tokenizer), max_new_tokens=max_new_tokens)
    print()

# G1 / G2 / G3（同一题面，便于和 v2 对比）
ask("请列举一次 QLoRA 微调结束后你应归档的产物清单，并区分必留与可选。")
ask("用「改权重与否」这一标准，对比 Prompt 工程、LoRA 微调与全量微调。")
ask("判断题：QLoRA 是否等于「全部参数都以 4bit 做全量更新」？请辨析。")

# G4 抽检（再跑 2 题，加上面共 5 题看套话）
ask("Holdout 场景题：线上出现「Output 被清空」，请给出复现与修复步骤。")
ask("【验收】写出「环境复现」最小集。")`

function toPayload(form: EngineeringChecklist) {
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

function CodeBlock({ title, code }: { title: string; code: string }) {
  return (
    <div className="eng-code-block">
      <div className="eng-code-head">
        <Typography.Text strong>{title}</Typography.Text>
        <Button size="small" icon={<CopyOutlined />} onClick={() => void copyText(code)}>
          复制
        </Button>
      </div>
      <pre className="eng-code">{code}</pre>
    </div>
  )
}

export function EngineeringPage() {
  const [form, setForm] = useState<EngineeringChecklist | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [validating, setValidating] = useState(false)
  const [result, setResult] = useState<ActionResult | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchEngineeringChecklist()
      // 已有真实 loss / 真实判定时不要用空模板覆盖
      const hasReal =
        Boolean((data.approx_loss || '').trim()) ||
        (data.g1_output || '').includes('【v3 真机') ||
        (data.g1_output || '').includes('判定（G1）')
      if (!hasReal && (!(data.g1_output || '').trim() || (data.g1_output || '').includes('【粘贴'))) {
        setForm({
          ...data,
          ...LEARNING_TEMPLATE,
          archived_v2: data.archived_v2,
          uploaded_v3_data: data.uploaded_v3_data,
          approx_loss: data.approx_loss,
        })
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
    void updateStep('retrain', 'done', 'Step 8 完成，进入工程验收').catch(() => undefined)
    void updateStep('engineering', 'doing', '开始 Step 9 工程验收 v3').catch(() => undefined)
  }, [load])

  const done = useMemo(() => {
    if (!form) return 0
    return [
      form.archived_v2,
      form.uploaded_v3_data,
      form.trained_v3,
      form.saved_adapter_v3,
      form.gate_g1,
      form.gate_g2,
      form.gate_g3,
      form.gate_g4,
      form.gate_g5,
    ].filter(Boolean).length
  }, [form])

  const setFlag = (key: keyof EngineeringChecklist, value: boolean | string) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  const applyLearningTemplate = () => {
    setForm((prev) =>
      prev
        ? {
            ...prev,
            ...LEARNING_TEMPLATE,
            approx_loss: prev.approx_loss,
            archived_v2: prev.archived_v2,
            uploaded_v3_data: prev.uploaded_v3_data,
          }
        : prev,
    )
    message.success('已填入学习模板（保留 loss 与已勾 ①②）')
  }

  const onSave = async () => {
    if (!form) return
    setSaving(true)
    try {
      const res = await confirmEngineeringChecklist(toPayload(form))
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
      const res = await validateEngineeringChecklist(toPayload(form))
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
      <div className="adv-page eng-page">
        <h1 className="page-title">工程验收 · Step 9</h1>
        <Card className="panel-card" loading={loading} />
      </div>
    )
  }

  return (
    <div className="adv-page eng-page">
      <div className="adv-head">
        <div>
          <h1 className="page-title">工程验收 v3 · Step 9</h1>
          <p className="page-desc">
            目标不是「loss 更低」，而是过门禁 G1～G5。数据：Dataset{' '}
            <code>{form.kaggle_dataset}</code> / <code>sample_alpaca_zh_v3.jsonl</code>；产物：
            <code>llama_lora_zh_v3</code>。推荐从 v2 <strong>续训 60 steps</strong>（见下方可复制代码）。
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
            current={form.ok ? 3 : done >= 6 ? 2 : done >= 2 ? 1 : 0}
            items={[
              { title: '留档+上云' },
              { title: '续训/重训' },
              { title: '门禁复评' },
              { title: '校验通过' },
            ]}
          />
          <Tag color={form.ok ? 'success' : 'processing'}>
            {done}/9 · {form.ok ? '已通过' : '进行中'}
          </Tag>
        </div>
      </Card>

      <Alert
        style={{ marginBottom: 16 }}
        type="error"
        showIcon
        icon={<WarningOutlined />}
        message="最容易踩的坑（先看再跑）"
        description={
          <ul className="eng-pitfalls">
            <li>
              <strong>续训</strong>：加载的是 v2 <em>适配器目录</em>，不要再{' '}
              <code>get_peft_model</code>；也不要加载空白基座再挂新 LoRA（除非你选全量重训）。
            </li>
            <li>
              <strong>路径</strong>：以 <code>os.walk</code> 打印为准，不要手猜{' '}
              <code>zero-ds-v3</code> 下的嵌套目录。
            </li>
            <li>
              <strong>保存</strong>：只准 <code>llama_lora_zh_v3</code>，禁止覆盖{' '}
              <code>llama_lora_zh_v2</code>。
            </li>
            <li>
              <strong>显存</strong>：同一 session 不要二次 <code>from_pretrained</code>；OOM 就
              Restart 后按顺序只加载一次。
            </li>
            <li>
              <strong>门禁</strong>：G1 若仍出现「落地建议：」= 未过；loss 再低也不算工程满意。
            </li>
          </ul>
        }
      />

      <Alert
        style={{ marginBottom: 16 }}
        type="warning"
        showIcon
        message="校验规则"
        description="可先保存进度。最终校验要求：勾选 9 项、真实 loss、G1～G3 为真实记录。若正文写明「G1/G3=未通过」则不能勾对应门禁。G1 勾通过时须含适配器+配置要点，且不能含原污染句「落地建议：把该知识点」。"
      />

      {form.approx_loss ? (
        <Alert
          style={{ marginBottom: 16 }}
          type={form.ok ? 'success' : 'info'}
          showIcon
          message={`本轮 v3 记录 · loss=${form.approx_loss} · 模式 ${form.train_mode}`}
          description={
            <div className="eng-verdict">
              <p>
                门禁状态：G1 {form.gate_g1 ? '✓' : '✗'} · G2 {form.gate_g2 ? '✓' : '✗'} · G3{' '}
                {form.gate_g3 ? '✓' : '✗'} · G4 {form.gate_g4 ? '✓' : '✗'} · G5{' '}
                {form.gate_g5 ? '✓' : '✗'}
              </p>
              <p>
                工程结论：去「落地建议」污染已成功（G4）；概念对比（G2）稳定；产物必留边界（G1）与
                QLoRA 辨析（G3）仍需定向补数据后再训。未全过门禁前，不宣称工程满意。
              </p>
              {!form.gate_g5 ? (
                <p>
                  待办：确认本机 <code>{form.local_v3_path}</code> 已下载齐文件后勾 G5。
                </p>
              ) : null}
            </div>
          }
        />
      ) : null}

      <Card className="panel-card" title="门禁一览（工程满意标准）" style={{ marginBottom: 16 }}>
        <Table
          size="small"
          pagination={false}
          rowKey="key"
          dataSource={GATE_ROWS}
          columns={[
            { title: '门禁', dataIndex: 'id', width: 56 },
            { title: '题面', dataIndex: 'q' },
            { title: '合格', dataIndex: 'pass' },
            { title: '一票否决', dataIndex: 'fail' },
          ]}
        />
      </Card>

      <div className="adv-grid">
        <div>
          <Card className="panel-card" title="操作清单（按①→⑨顺序）">
            <div className="adv-checks">
              <div className="adv-check-item">
                <Checkbox
                  checked={form.archived_v2}
                  onChange={(e) => setFlag('archived_v2', e.target.checked)}
                >
                  <strong>① 已本机留档 llama_lora_zh_v2</strong>
                </Checkbox>
                <div className="adv-help">
                  <p>
                    目录建议：<code>{form.local_v2_path}</code>（含{' '}
                    <code>adapter_config.json</code>、权重文件）。
                  </p>
                  <p>
                    <strong>续训还必须：</strong>把同一份上传为 Kaggle Dataset，并在 Notebook{' '}
                    <strong>Add Input</strong>（仅本机有不够）。
                  </p>
                </div>
              </div>

              <div className="adv-check-item">
                <Checkbox
                  checked={form.uploaded_v3_data}
                  onChange={(e) => setFlag('uploaded_v3_data', e.target.checked)}
                >
                  <strong>② 已上传 zero-ds-v3 并 Add Input</strong>
                </Checkbox>
                <div className="adv-help">
                  <ol>
                    <li>
                      Dataset 名：<code>{form.kaggle_dataset}</code>，文件{' '}
                      <code>sample_alpaca_zh_v3.jsonl</code>
                    </li>
                    <li>Notebook 右侧 Add Input 勾选它</li>
                    <li>跑下方「找路径」代码，确认打印到 v3 jsonl</li>
                  </ol>
                  <p>{form.cloud_data_hint}</p>
                </div>
              </div>

              <div className="adv-check-item">
                <Checkbox
                  checked={form.trained_v3}
                  onChange={(e) => setFlag('trained_v3', e.target.checked)}
                >
                  <strong>③ 已完成 v3 训练并记录 loss</strong>
                </Checkbox>
                <div className="adv-help">
                  <p>
                    模式：<code>{form.train_mode}</code> · max_steps=
                    <code>{form.max_steps}</code>（续训 60 / 全量 120）
                  </p>
                  <p>顺序：Restart → A～C 依赖 → 找路径 → 加载（续训或全量二选一）→ 数据 F → 训练 G/H。</p>
                  <p>训完把最后一次 loss 填到下方 approx_loss。</p>
                </div>
              </div>

              <div className="adv-check-item">
                <Checkbox
                  checked={form.saved_adapter_v3}
                  onChange={(e) => setFlag('saved_adapter_v3', e.target.checked)}
                >
                  <strong>④ 已保存/下载 llama_lora_zh_v3</strong>
                </Checkbox>
                <div className="adv-help">
                  <p>
                    <code>save_pretrained(&quot;llama_lora_zh_v3&quot;)</code> → Download →{' '}
                    <code>{form.local_v3_path}</code>；建议再 Upload 成 Dataset 防丢。
                  </p>
                </div>
              </div>

              <div className="adv-check-item">
                <Checkbox checked={form.gate_g1} onChange={(e) => setFlag('gate_g1', e.target.checked)}>
                  <strong>⑤ G1 产物清单合格</strong>
                </Checkbox>
                <div className="adv-help">
                  跑 ask(Holdout#0 题)。粘贴 Response 到下方 G1。须含适配器+配置；不能有「落地建议：」。
                </div>
              </div>

              <div className="adv-check-item">
                <Checkbox checked={form.gate_g2} onChange={(e) => setFlag('gate_g2', e.target.checked)}>
                  <strong>⑥ G2 Prompt/LoRA/全量合格</strong>
                </Checkbox>
                <div className="adv-help">Holdout#10；用「改权重与否」说清三者。</div>
              </div>

              <div className="adv-check-item">
                <Checkbox checked={form.gate_g3} onChange={(e) => setFlag('gate_g3', e.target.checked)}>
                  <strong>⑦ G3 QLoRA 辨析合格</strong>
                </Checkbox>
                <div className="adv-help">Holdout#25；否定「全参 4bit 全量更新」。</div>
              </div>

              <div className="adv-check-item">
                <Checkbox checked={form.gate_g4} onChange={(e) => setFlag('gate_g4', e.target.checked)}>
                  <strong>⑧ G4 套话抽检合格（≤1/5）</strong>
                </Checkbox>
                <div className="adv-help">5 题里固定长套话 ≤1；把题号记在 G4 笔记。</div>
              </div>

              <div className="adv-check-item">
                <Checkbox checked={form.gate_g5} onChange={(e) => setFlag('gate_g5', e.target.checked)}>
                  <strong>⑨ G5 可重载交付物齐备</strong>
                </Checkbox>
                <div className="adv-help">
                  本机 <code>{form.local_v3_path}</code> 可重载，或云端 Dataset 可 Add Input；日志已同步。
                </div>
              </div>
            </div>

            <Typography.Title level={5} style={{ marginTop: 20 }}>
              可复制代码（Kaggle 按序粘贴）
            </Typography.Title>
            <CodeBlock title="0）找 DATA_PATH / ADAPTER_V2（必跑）" code={FIND_PATHS} />
            <CodeBlock title="1A）续训：加载 v2 适配器（推荐）" code={LOAD_CONTINUE} />
            <CodeBlock title="1B）全量：基座+新 LoRA（仅当你不用续训）" code={LOAD_SCRATCH} />
            <CodeBlock title="2）加载 v3 数据并格式化" code={LOAD_DATA} />
            <CodeBlock title="3）训练（续训 steps=60 / lr=1e-4）" code={TRAIN_CONTINUE} />
            <CodeBlock title="4）保存 v3（勿覆盖 v2）" code={SAVE_V3} />
            <CodeBlock title="5）门禁推理 G1～G4" code={ASK_GATES} />

            <div className="adv-meta" style={{ marginTop: 16 }}>
              <label>
                <span>Kaggle Dataset</span>
                <Input
                  value={form.kaggle_dataset}
                  onChange={(e) => setFlag('kaggle_dataset', e.target.value)}
                />
              </label>
              <label>
                <span>train_mode（continue_from_v2 / from_scratch）</span>
                <Input value={form.train_mode} onChange={(e) => setFlag('train_mode', e.target.value)} />
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
                  placeholder="训完再填"
                />
              </label>
              <label>
                <span>local_v2_path</span>
                <Input value={form.local_v2_path} onChange={(e) => setFlag('local_v2_path', e.target.value)} />
              </label>
              <label>
                <span>local_v3_path</span>
                <Input value={form.local_v3_path} onChange={(e) => setFlag('local_v3_path', e.target.value)} />
              </label>
            </div>

            <div className="adv-fields">
              <label>
                <span>云端数据 / Input 提示</span>
                <Input.TextArea
                  rows={3}
                  value={form.cloud_data_hint}
                  onChange={(e) => setFlag('cloud_data_hint', e.target.value)}
                />
              </label>
              <label>
                <span>超参与训练说明</span>
                <Input.TextArea
                  rows={4}
                  value={form.hparams_ref}
                  onChange={(e) => setFlag('hparams_ref', e.target.value)}
                />
              </label>
              <label>
                <span>G1 产物输出 *（替换模板为真实 Response）</span>
                <Input.TextArea
                  rows={8}
                  value={form.g1_output}
                  onChange={(e) => setFlag('g1_output', e.target.value)}
                />
              </label>
              <label>
                <span>G2 输出 *</span>
                <Input.TextArea
                  rows={5}
                  value={form.g2_output}
                  onChange={(e) => setFlag('g2_output', e.target.value)}
                />
              </label>
              <label>
                <span>G3 输出 *</span>
                <Input.TextArea
                  rows={5}
                  value={form.g3_output}
                  onChange={(e) => setFlag('g3_output', e.target.value)}
                />
              </label>
              <label>
                <span>G4 抽检笔记 *</span>
                <Input.TextArea
                  rows={5}
                  value={form.g4_note}
                  onChange={(e) => setFlag('g4_note', e.target.value)}
                />
              </label>
              <label>
                <span>相对 v2 总结 *</span>
                <Input.TextArea
                  rows={6}
                  value={form.vs_v2_summary}
                  onChange={(e) => setFlag('vs_v2_summary', e.target.value)}
                />
              </label>
              <label>
                <span>面试口述 *</span>
                <Input.TextArea
                  rows={4}
                  value={form.interview_talk}
                  onChange={(e) => setFlag('interview_talk', e.target.value)}
                />
              </label>
              <label>
                <span>备注</span>
                <Input.TextArea rows={2} value={form.note} onChange={(e) => setFlag('note', e.target.value)} />
              </label>
            </div>
          </Card>
        </div>

        <div className="adv-side">
          <Card className="panel-card" title="今天推荐执行顺序">
            <ol className="adv-steps">
              <li>
                确认 Input：<code>zero-ds-v3</code> + v2 适配器 Dataset
              </li>
              <li>Restart Session</li>
              <li>A～C 依赖 → 复制「找路径」</li>
              <li>复制「1A 续训加载」→「2 数据」→「3 训练」</li>
              <li>复制「4 保存」并下载到本机</li>
              <li>复制「5 门禁」→ 粘贴 G1～G4 → 勾选 → 校验</li>
            </ol>
            <Alert
              style={{ marginTop: 12 }}
              type="info"
              showIcon
              message="和 Step 8 的关系"
              description="Step 8 已证明有效但不均匀。Step 9 用清洗数据修 G1/G4；Holdout 题面尽量不变，才能和 v2 对比。"
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
