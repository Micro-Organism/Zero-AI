import { useState } from 'react'
import { Alert, Button, Collapse, Drawer, Empty, Form, Input, Modal, Popconfirm, Space, Table, Tag, Typography, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DeleteOutlined, EditOutlined, EyeOutlined, ImportOutlined, PlusOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { InterviewRoadmapItem, PageResult, ReferenceAnalysis, ReferenceSkill, Resume, SkillImportResult } from '@/api/types'
import { PageHeader } from '@/components/PageHeader'

type ReferenceContent = {
  source_text?: string
  skills?: ReferenceSkill[]
  interview_roadmap?: InterviewRoadmapItem[]
  highlights?: string[]
  work_experiences?: Array<Record<string, unknown>>
  project_experiences?: Array<Record<string, unknown>>
}

function asContent(resume?: Resume): ReferenceContent {
  return (resume?.content ?? {}) as ReferenceContent
}

function stringList(value: unknown) {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : []
}

function BulletItems({ items }: { items: unknown }) {
  const values = stringList(items)
  return values.length ? <ul>{values.map((item) => <li key={item}>{item}</li>)}</ul> : null
}

function ExperienceSection({ title, items }: { title: string; items: Array<Record<string, unknown>> }) {
  if (!items.length) return null
  return <section className="reference-detail__section">
    <h2>{title}</h2>
    {items.map((item, index) => {
      const name = String(item.company || item.name || '')
      const meta = [String(item.role || ''), String(item.period || '')].filter(Boolean).join(' · ')
      return <div className="reference-exp" key={index}>
        <h3>{name}</h3>
        {meta ? <p className="muted">{meta}</p> : null}
        {item.description ? <p>{String(item.description)}</p> : null}
        {item.background ? <p>{String(item.background)}</p> : null}
        <BulletItems items={item.responsibilities} />
        <BulletItems items={item.achievements} />
        <BulletItems items={item.metrics} />
        {stringList(item.technologies).length ? <p className="muted">技术栈：{stringList(item.technologies).join('、')}</p> : null}
      </div>
    })}
  </section>
}

export function ReferenceResumePage() {
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [viewing, setViewing] = useState<Resume>()
  const [editing, setEditing] = useState<Resume>()
  const [formOpen, setFormOpen] = useState(false)
  const [analysis, setAnalysis] = useState<ReferenceAnalysis>()
  const [analyzing, setAnalyzing] = useState(false)
  const [form] = Form.useForm()
  const queryClient = useQueryClient()

  const references = useQuery({
    queryKey: ['reference-resumes', page, keyword],
    queryFn: () => api<PageResult<Resume>>(`/resumes?kind=reference&page=${page}&page_size=10&keyword=${encodeURIComponent(keyword)}`),
  })

  const save = useMutation({
    mutationFn: (values: { title: string; summary?: string; source_text?: string }) => {
      const content: ReferenceContent = {
        ...asContent(editing),
        source_text: values.source_text ?? '',
        skills: analysis?.skills ?? asContent(editing).skills ?? [],
        interview_roadmap: analysis?.interview_roadmap ?? asContent(editing).interview_roadmap ?? [],
        highlights: analysis?.highlights ?? asContent(editing).highlights ?? [],
        work_experiences: analysis?.work_experiences ?? asContent(editing).work_experiences ?? [],
        project_experiences: analysis?.project_experiences ?? asContent(editing).project_experiences ?? [],
      }
      const base = { title: values.title, summary: values.summary ?? '' }
      return editing
        ? api<Resume>(`/resumes/${editing.id}`, { method: 'PUT', body: JSON.stringify({ ...base, content, version: editing.version }) })
        : api<Resume>('/resumes', { method: 'POST', body: JSON.stringify({ ...base, kind: 'reference', status: 'ready', content }) })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reference-resumes'] })
      setFormOpen(false)
      setEditing(undefined)
      setAnalysis(undefined)
      form.resetFields()
      message.success('参考简历已保存')
    },
  })

  const remove = useMutation({
    mutationFn: (id: string) => api(`/resumes/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reference-resumes'] })
      message.success('参考简历已移入回收站')
    },
  })

  const importSkills = useMutation({
    mutationFn: (skills: ReferenceSkill[]) => api<SkillImportResult>(`/resumes/${viewing!.id}/import-skills`, {
      method: 'POST',
      body: JSON.stringify({
        skills: skills.map((skill) => ({
          name: skill.name,
          category: skill.category,
          evidence: skill.evidence ? `参考简历《${viewing!.title}》：${skill.evidence}` : '',
        })),
      }),
    }),
    onSuccess: (result) => {
      message.success(result.created.length ? `已导入 ${result.created.length} 个技能到素材库` : '这些技能已经在素材库中')
    },
  })

  const runAnalyze = async () => {
    const sourceText = String(form.getFieldValue('source_text') ?? '').trim()
    if (!sourceText) {
      message.warning('请先填写简历原文或要点')
      return
    }
    setAnalyzing(true)
    try {
      const result = await api<ReferenceAnalysis>('/resumes/analyze', {
        method: 'POST',
        body: JSON.stringify({
          source_text: sourceText,
          title: String(form.getFieldValue('title') ?? ''),
          summary: String(form.getFieldValue('summary') ?? ''),
        }),
      })
      setAnalysis(result)
      message.success(`已提取 ${result.skills.length} 个技能点、${result.interview_roadmap.length} 个面试主题`)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '技能提取失败')
    } finally {
      setAnalyzing(false)
    }
  }

  const openForm = (resume?: Resume) => {
    const content = asContent(resume)
    setEditing(resume)
    setAnalysis(undefined)
    form.setFieldsValue({
      title: resume?.title ?? '',
      summary: resume?.summary ?? '',
      source_text: content.source_text ?? '',
    })
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditing(undefined)
    setAnalysis(undefined)
    form.resetFields()
  }

  const skillsOf = (record: Resume) => asContent(record).skills ?? []

  const columns: ColumnsType<Resume> = [
    {
      title: '候选人 / 简历名称', dataIndex: 'title', width: 240, align: 'center',
      render: (value: string) => <div className="reference-title-cell"><Typography.Text strong>{value}</Typography.Text><small>参考简历</small></div>,
    },
    { title: '技能点', width: 260, render: (_, record) => {
      const skills = skillsOf(record)
      return skills.length
        ? <div className="reference-skill-cell">{skills.slice(0, 3).map((skill) => <Tag key={skill.name} color="blue">{skill.name}</Tag>)}{skills.length > 3 ? <span className="more">+{skills.length - 3}</span> : null}</div>
        : <span className="muted">待提取</span>
    } },
    { title: '简历概述', dataIndex: 'summary', ellipsis: true, render: (value: string) => value || '暂无概述' },
    { title: '状态', dataIndex: 'status', width: 100, align: 'center', render: (value: string) => <Tag color={value === 'ready' ? 'green' : 'default'}>{value === 'ready' ? '已整理' : '草稿'}</Tag> },
    { title: '更新时间', dataIndex: 'updated_at', width: 180, align: 'center', render: (value: string) => new Date(value).toLocaleString() },
    {
      title: '操作', key: 'actions', width: 170, fixed: 'right', align: 'center',
      render: (_, record: Resume) => <Space size={2}>
        <Button type="text" icon={<EyeOutlined />} title="查看参考简历" onClick={() => setViewing(record)}>查看</Button>
        <Button type="text" icon={<EditOutlined />} title="编辑" onClick={() => openForm(record)} />
        <Popconfirm title="移入回收站？" onConfirm={() => remove.mutate(record.id)}><Button danger type="text" icon={<DeleteOutlined />} title="删除" /></Popconfirm>
      </Space>,
    },
  ]

  const viewingContent = asContent(viewing)
  const viewingSkills = viewingContent.skills ?? []
  const viewingRoadmap = viewingContent.interview_roadmap ?? []
  const viewingHighlights = viewingContent.highlights ?? []
  const analysisSkills = analysis?.skills ?? []
  const analysisRoadmap = analysis?.interview_roadmap ?? []

  return <>
    <PageHeader title="参考简历库" description="录入外部候选人简历，提取可借鉴的技能点，并按概念、落地、系统设计、深挖复盘生成由浅入深的面试路线。" actions={<Button type="primary" icon={<PlusOutlined />} onClick={() => openForm()}>新增参考简历</Button>} />
    <div className="toolbar"><Input.Search allowClear placeholder="搜索候选人或简历" style={{ maxWidth: 360 }} onSearch={(value) => { setKeyword(value); setPage(1) }} /></div>
    <div className="reference-resume-table">
      <Table<Resume> rowKey="id" loading={references.isLoading} dataSource={references.data?.items ?? []} columns={columns} scroll={{ x: 1080 }} pagination={{ current: page, pageSize: 10, total: references.data?.total, onChange: setPage }} />
    </div>
    <Drawer title="参考简历详情" width={960} open={!!viewing} onClose={() => setViewing(undefined)} extra={<Button icon={<EditOutlined />} onClick={() => { const resume = viewing; setViewing(undefined); if (resume) openForm(resume) }}>编辑基本信息</Button>}>
      {viewing ? <div className="reference-detail">
        <div className="reference-detail__hero">
          <div>
            <Typography.Title level={4} style={{ margin: 0 }}>{viewing.title}</Typography.Title>
            <Typography.Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>{viewing.summary || '暂无概述'}</Typography.Paragraph>
          </div>
          <Tag color={viewing.status === 'ready' ? 'green' : 'default'}>{viewing.status === 'ready' ? '已整理' : '草稿'}</Tag>
        </div>
        <div className="reference-detail__stats">
          <div className="stat-block"><b>{viewingSkills.length}</b><span>技能点</span></div>
          <div className="stat-block"><b>{viewingRoadmap.length}</b><span>面试主题</span></div>
          <div className="stat-block"><b>{viewingHighlights.length}</b><span>原文要点</span></div>
        </div>
        <ExperienceSection title="工作经历" items={viewingContent.work_experiences ?? []} />
        <ExperienceSection title="项目经历" items={viewingContent.project_experiences ?? []} />
        {viewingSkills.length ? <section className="reference-detail__section">
          <div className="section-heading"><h2>技能点</h2><Button size="small" icon={<ImportOutlined />} loading={importSkills.isPending} onClick={() => importSkills.mutate(viewingSkills)}>全部导入素材库</Button></div>
          <div className="skill-grid">
            {viewingSkills.map((skill) => <div className="skill-card" key={skill.name}>
              <div className="skill-card__head"><strong>{skill.name}</strong><Tag color="blue">L{skill.level}</Tag></div>
              <small>{skill.category} · 出现 {skill.count} 次</small>
              {skill.evidence ? <p>{skill.evidence}</p> : null}
              <Button size="small" type="link" icon={<ImportOutlined />} loading={importSkills.isPending} onClick={() => importSkills.mutate([skill])}>导入素材库</Button>
            </div>)}
          </div>
        </section> : null}
        {viewingRoadmap.length ? <section className="reference-detail__section">
          <h2>由浅入深面试路线</h2>
          <Collapse defaultActiveKey={[viewingRoadmap[0]?.skill]} items={viewingRoadmap.map((item) => ({
            key: item.skill,
            label: <div className="roadmap-label"><strong>{item.skill}</strong><span>{item.category}</span></div>,
            children: <div className="roadmap-levels">{item.levels.map((level, index) => <div className="roadmap-level" key={level.level}>
              <div className="roadmap-level__head"><span className="roadmap-badge">{index + 1}</span><strong>{level.level}</strong><small>{level.label}</small></div>
              <ol>{level.questions.map((question) => <li key={question}>{question}</li>)}</ol>
            </div>)}</div>,
          }))} />
        </section> : null}
        {viewingHighlights.length ? <section className="reference-detail__section">
          <h2>原文要点</h2>
          <ul className="highlight-list">{viewingHighlights.map((item) => <li key={item}>{item}</li>)}</ul>
        </section> : null}
        {viewingContent.source_text ? <section className="reference-detail__section"><h2>简历原文</h2><div className="detail-pre">{viewingContent.source_text}</div></section> : null}
        {!viewingSkills.length && !viewingRoadmap.length && !viewingHighlights.length && !viewingContent.source_text ? <Empty description="这份参考简历还没有内容，点击右上角编辑后粘贴原文并提取" style={{ marginTop: 32 }} /> : null}
      </div> : null}
    </Drawer>
    <Modal title={editing ? '编辑参考简历' : '新增参考简历'} width={860} open={formOpen} onCancel={closeForm} onOk={() => form.submit()} confirmLoading={save.isPending}>
      <Form form={form} layout="vertical" onFinish={(values) => save.mutate(values)}>
        <Form.Item name="title" label="候选人 / 简历名称" rules={[{ required: true, message: '请输入候选人或简历名称' }]}><Input placeholder="例如：张三 · 人工智能算法工程师" /></Form.Item>
        <Form.Item name="summary" label="候选人亮点 / 概述"><Input.TextArea rows={3} placeholder="记录候选人定位、年限、核心方向和可借鉴之处" /></Form.Item>
        <Form.Item name="source_text" label="简历原文或要点" extra="粘贴完整简历或重点内容，保存前可以先提取技能点与面试路线。"><Input.TextArea rows={12} placeholder={'工作经历\n2021-2023 某公司 AI 工程师\n负责 RAG 问答系统\n- 检索准确率提升 30%\n\n技能\nPython、PyTorch、FastAPI、Docker'} /></Form.Item>
        <div className="extract-actions">
          <Button icon={<ThunderboltOutlined />} loading={analyzing} onClick={runAnalyze}>提取技能点与面试路线</Button>
          {analysis ? <span className="extract-summary">已提取 {analysisSkills.length} 个技能、{analysisRoadmap.length} 个面试主题</span> : null}
        </div>
        {analysis ? <Alert type={analysisSkills.length ? 'success' : 'warning'} showIcon message={analysisSkills.length ? '技能与面试路线已生成' : '暂未识别到内置技能库中的技能点'} description={analysisSkills.length ? `技能：${analysisSkills.slice(0, 8).map((skill) => skill.name).join('、')}${analysisSkills.length > 8 ? ' 等' : ''}` : '可以继续补充关键词或保存原文，之后在详情页手动导入技能。'} /> : null}
      </Form>
    </Modal>
  </>
}
