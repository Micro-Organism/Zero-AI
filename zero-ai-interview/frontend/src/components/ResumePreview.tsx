import type { Resume, ResumeVersion } from '@/api/types'

type ResumeContent = {
  work_experiences?: Array<Record<string, unknown>>
  project_experiences?: Array<Record<string, unknown>>
  skills?: Array<Record<string, unknown>>
  highlights?: string[]
  source_text?: string
}

function stringList(value: unknown) {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : []
}

function period(item: Record<string, unknown>) {
  const start = String(item.start_date || '')
  const end = item.is_current ? '至今' : String(item.end_date || '')
  return [start, end].filter(Boolean).join(' - ')
}

function BulletList({ items }: { items: unknown }) {
  const values = stringList(items)
  return values.length ? <ul>{values.map((item) => <li key={item}>{item}</li>)}</ul> : null
}

export function ResumePreview({ resume, version }: { resume?: Resume; version?: ResumeVersion }) {
  const content = (resume?.content ?? {}) as ResumeContent
  const snapshot = version?.snapshot as ResumeContent | undefined
  const workExperiences = snapshot?.work_experiences ?? content.work_experiences ?? []
  const projectExperiences = snapshot?.project_experiences ?? content.project_experiences ?? []
  const skills = snapshot?.skills ?? content.skills ?? []
  const highlights = snapshot?.highlights ?? content.highlights ?? []

  return <article className="print-sheet">
    <h1>{resume?.title ?? '简历预览'}</h1>
    <p>{resume?.summary || '在左侧选择或创建一份简历后开始完善内容。'}</p>
    {workExperiences.length ? <section><h2>工作经历</h2>{workExperiences.map((item, index) => <div className="resume-entry" key={index}>
      <div className="resume-entry__heading"><h3>{String(item.company)} · {String(item.role)}</h3><span>{period(item)}</span></div>
      {item.description ? <p>{String(item.description)}</p> : null}
      <BulletList items={item.achievements} />
      {stringList(item.technologies).length ? <p className="resume-entry__tech">技术栈：{stringList(item.technologies).join('、')}</p> : null}
    </div>)}</section> : null}
    {projectExperiences.length ? <section><h2>项目经历</h2>{projectExperiences.map((item, index) => <div className="resume-entry" key={index}>
      <div className="resume-entry__heading"><h3>{String(item.name)}</h3><span>{period(item)}</span></div>
      {item.role ? <p><strong>角色：</strong>{String(item.role)}</p> : null}
      {item.background ? <p>{String(item.background)}</p> : null}
      <BulletList items={item.responsibilities} />
      <BulletList items={item.achievements} />
      <BulletList items={item.metrics} />
      {stringList(item.technologies).length ? <p className="resume-entry__tech">技术栈：{stringList(item.technologies).join('、')}</p> : null}
    </div>)}</section> : null}
    {skills.length ? <section><h2>技能</h2><div className="resume-skill-list">{skills.map((item, index) => <div key={index}><strong>{String(item.name)}</strong>{item.category ? ` · ${String(item.category)}` : ''}{item.level ? <span className="resume-entry__tech"> L{String(item.level)}</span> : null}{item.evidence ? <p>{String(item.evidence)}</p> : null}</div>)}</div></section> : null}
    {highlights.length ? <section><h2>原文要点</h2><BulletList items={highlights} /></section> : null}
  </article>
}
