import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Input,
  Space,
  Tag,
  Timeline,
  Typography,
  message,
} from 'antd'
import { BookOutlined, ReloadOutlined, SaveOutlined } from '@ant-design/icons'
import {
  fetchActivity,
  fetchConceptsNotes,
  saveConceptsNotes,
} from '@/api/client'
import type { ActionResult, ActivityItem, ConceptsNotes } from '@/types/api'
import './ConceptsPage.scss'

const { TextArea } = Input

type FieldKey = keyof ConceptsNotes

const optionBanks: Record<
  FieldKey,
  { tip: string; options: { label: string; text: string }[] }
> = {
  pretrain_vs_finetune: {
    tip: '可多选，点选项会追加进答案框，再自己改表述。',
    options: [
      {
        label: '先微调，不先预训练',
        text: '我还没做过预训练也没做过微调。入门应先从微调入手，不要先做预训练。预训练要用海量数据和很多GPU，成本极高；微调是在现成大模型上用小数据适配，免费GPU就能练手。',
      },
      {
        label: '预训练像通识教育',
        text: '预训练：大公司用海量文本先把模型训成「通才」（学会语言和常识）。',
      },
      {
        label: '微调像岗位培训',
        text: '微调：在已有通才模型上，用我的小数据继续训练，让它更懂特定任务/口吻/领域。',
      },
    ],
  },
  why_finetune: {
    tip: '结合找工作动机，可多选拼接。',
    options: [
      {
        label: '求职作品集',
        text: '我学微调主要是为了找工作：能讲清并跑通「数据→训练→导出」闭环，作为 LLM 应用/算法岗作品集。',
      },
      {
        label: '比只写 Prompt 更深',
        text: '只写 Prompt 不改权重；微调会改模型参数（或适配器），让能力更稳定、可复现，面试更能体现工程深度。',
      },
      {
        label: '和 RAG 不同',
        text: 'RAG 是检索外部知识喂给模型；微调是把风格/格式/领域习惯「写进」模型。两者可互补，入门先掌握微调流程。',
      },
    ],
  },
  what_is_lora: {
    tip: 'LoRA 是什么——选方向理解。',
    options: [
      {
        label: '不改全量参数',
        text: 'LoRA：不更新大模型全部参数，只训练很小的低秩适配器矩阵，省显存、训得快、适配器文件也小。',
      },
      {
        label: '像外挂补丁',
        text: '可以把 LoRA 理解成给大模型加的「外挂补丁」：基座冻结，补丁学会新任务；换任务可以换补丁。',
      },
      {
        label: '适合免费GPU',
        text: 'LoRA 参数量远小于全量微调，所以在 Kaggle T4 这类免费GPU上更现实。',
      },
    ],
  },
  what_is_qlora: {
    tip: 'QLoRA = 量化 + LoRA。',
    options: [
      {
        label: '多了4bit量化',
        text: 'QLoRA 相对 LoRA：先把基座模型用 4bit 量化加载（更省显存），再在上面做 LoRA。',
      },
      {
        label: '为何适合T4',
        text: '免费 T4/P100 显存有限；QLoRA 能让 7B/8B 级模型在单卡上训起来，所以本项目首轮用 QLoRA。',
      },
      {
        label: '效果与代价',
        text: 'QLoRA 通常比全量微调省很多资源，效果在很多任务上够用；入门优先跑通，再追求极限效果。',
      },
    ],
  },
  sft_fields: {
    tip: '用「客服助手」场景理解字段。',
    options: [
      {
        label: '场景：客服话术',
        text: '场景：训练一个简短客服助手。SFT（监督微调）数据常见 Alpaca 字段：instruction（用户问题/任务）、input（可选补充上下文）、output（期望回答）。',
      },
      {
        label: '举一条样例',
        text: '例：instruction=「用户问退货要多久」, input="", output=「一般7天内可退，收到商品后我们会在3个工作日内处理。」',
      },
      {
        label: '字段名记住三个',
        text: '记住三个字段名即可：instruction / input / output。',
      },
    ],
  },
  scenario: {
    tip: '本轮目标可选。',
    options: [
      {
        label: '学习跑通',
        text: '本轮目标：学习跑通一次 QLoRA 微调闭环（不追求业务效果）。',
      },
      {
        label: '求职导向',
        text: '本轮目标：做出可演示的微调作品（数据+训练记录+导出），方便求职讲解。',
      },
    ],
  },
}

const fieldOrder: { key: FieldKey; title: string }[] = [
  { key: 'pretrain_vs_finetune', title: '1. 预训练 vs 微调（先从哪入手）' },
  { key: 'why_finetune', title: '2. 我为什么要微调' },
  { key: 'what_is_lora', title: '3. LoRA 是干什么的' },
  { key: 'what_is_qlora', title: '4. QLoRA 多了什么' },
  { key: 'sft_fields', title: '5. SFT 数据有哪些字段' },
  { key: 'scenario', title: '6. 本轮场景（可选）' },
]

const actionLabel: Record<string, string> = {
  concepts_saved: '保存概念笔记',
  token_tested: '测试 Token',
  token_saved: '保存 Token',
  kaggle_setup: 'Kaggle GPU',
}

export function ConceptsPage() {
  const [notes, setNotes] = useState<ConceptsNotes>({
    pretrain_vs_finetune: '',
    why_finetune: '',
    what_is_lora: '',
    what_is_qlora: '',
    sft_fields: '',
    scenario: '',
  })
  const [picked, setPicked] = useState<Record<string, string[]>>({})
  const [saving, setSaving] = useState(false)
  const [saveResult, setSaveResult] = useState<ActionResult | null>(null)
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [n, acts] = await Promise.all([fetchConceptsNotes(), fetchActivity(20)])
      setNotes(n)
      setActivity(acts.filter((a) => a.action === 'concepts_saved' || true).slice(0, 15))
    } catch {
      message.error('加载概念笔记失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const appendOption = (key: FieldKey, text: string, label: string, checked: boolean) => {
    setPicked((prev) => {
      const cur = new Set(prev[key] || [])
      if (checked) cur.add(label)
      else cur.delete(label)
      return { ...prev, [key]: [...cur] }
    })
    setNotes((prev) => {
      const current = prev[key] || ''
      if (checked) {
        const next = current.includes(text) ? current : `${current}${current ? '\n' : ''}${text}`
        return { ...prev, [key]: next }
      }
      return {
        ...prev,
        [key]: current
          .split('\n')
          .filter((line) => line.trim() !== text.trim())
          .join('\n'),
      }
    })
  }

  const onSave = async () => {
    setSaving(true)
    try {
      const res = await saveConceptsNotes(notes)
      setSaveResult(res)
      message[res.ok ? 'success' : 'warning'](res.message)
      await refresh()
    } catch {
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="concepts-page">
      <h1 className="page-title">概念笔记 · Step 1</h1>
      <p className="page-desc">
        先看右侧「一句话概念」，再点左侧选项拼答案，可改字。保存后写入
        <code> 01-concepts/notes.md </code>，并记入操作记录。
      </p>

      <Alert
        style={{ marginBottom: 16 }}
        type="success"
        showIcon
        message="先记住结论：你应该先学「微调」，不要先学「预训练」"
        description="预训练是大厂用海量数据和大量GPU炼「通才模型」；你要做的是用免费 T4 + Unsloth，在现成模型上做 QLoRA 微调，做出可讲的作品。"
      />

      <div className="concepts-layout">
        <div className="concepts-main">
          {fieldOrder.map(({ key, title }) => (
            <Card key={key} className="panel-card" style={{ marginBottom: 16 }} loading={loading} title={title}>
              <Typography.Paragraph type="secondary">{optionBanks[key].tip}</Typography.Paragraph>
              <Space direction="vertical" style={{ width: '100%', marginBottom: 12 }}>
                {optionBanks[key].options.map((opt) => (
                  <Checkbox
                    key={opt.label}
                    checked={(picked[key] || []).includes(opt.label)}
                    onChange={(e) => appendOption(key, opt.text, opt.label, e.target.checked)}
                  >
                    <Tag color="blue">{opt.label}</Tag>
                    <span style={{ color: '#5c6f66' }}>{opt.text.slice(0, 42)}…</span>
                  </Checkbox>
                ))}
              </Space>
              <TextArea
                rows={4}
                value={notes[key]}
                onChange={(e) => setNotes((p) => ({ ...p, [key]: e.target.value }))}
                placeholder="在这里形成你的最终表述"
              />
            </Card>
          ))}

          <Space>
            <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={() => void onSave()}>
              保存概念笔记
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => void refresh()}>
              重新加载
            </Button>
          </Space>
        </div>

        <div className="concepts-side">
          <Card className="panel-card" title={<Space><BookOutlined />一句话概念速览</Space>}>
            <ul className="concept-bullets">
              <li><b>预训练</b>：海量数据炼通才，贵，入门不做。</li>
              <li><b>微调 SFT</b>：用问答数据教模型按你的期望回答。</li>
              <li><b>LoRA</b>：只训小补丁，不改整模。</li>
              <li><b>QLoRA</b>：4bit 压缩基座 + LoRA，省显存。</li>
              <li><b>SFT 字段</b>：instruction / input / output。</li>
            </ul>
          </Card>

          <Card className="panel-card" style={{ marginTop: 16 }} title="可选抽读 · 我帮你总结">
            <Typography.Paragraph>
              <b>Hello LLM Fine-Tuning</b>：体系课本。先看「四阶路线、微调入门、LoRA」。Prompt/Agent、vLLM 可后置。
            </Typography.Paragraph>
            <Typography.Paragraph>
              <b>Unsloth 指南</b>：动手手册。核心是 QLoRA + 小指令模型 + Notebook 跑通 + 导出 GGUF/适配器。和你 Kaggle T4 路线一致。
            </Typography.Paragraph>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
              细节以后细读；现在先把左边笔记保存完整即可。
            </Typography.Paragraph>
          </Card>

          <Card className="panel-card" style={{ marginTop: 16 }} title="保存结果">
            {saveResult ? (
              <Alert type={saveResult.ok ? 'success' : 'warning'} showIcon message={saveResult.message} description={saveResult.details.join(' · ')} />
            ) : (
              <Alert type="info" showIcon message="保存后这里显示结果" />
            )}
          </Card>

          <Card className="panel-card" style={{ marginTop: 16 }} title="操作记录">
            <Timeline
              items={activity.slice(0, 8).map((item) => ({
                color: item.ok ? 'green' : 'red',
                children: (
                  <div>
                    <div>
                      <Tag>{actionLabel[item.action] || item.action}</Tag>
                      {item.message}
                    </div>
                    <div style={{ fontSize: 12, color: '#5c6f66' }}>{new Date(item.ts).toLocaleString()}</div>
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
