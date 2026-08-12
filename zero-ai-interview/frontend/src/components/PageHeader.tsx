import type { ReactNode } from 'react'

export function PageHeader({ title, description, actions }: { title: string; description: string; actions?: ReactNode }) {
  return <div className="page-title-row"><div><h1>{title}</h1><p>{description}</p></div><div className="page-actions">{actions}</div></div>
}
