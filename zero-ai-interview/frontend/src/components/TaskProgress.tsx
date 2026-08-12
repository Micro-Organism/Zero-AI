import { Alert, Progress, Space, Typography } from 'antd'
import type { ProcessingTask } from '@/api/types'
import { StatusTag } from './StatusTag'

const taskLabels: Record<string, string> = {
  resume_parse: '简历解析',
  job_extract: '岗位要求提取',
  matching: '岗位匹配',
  targeted_resume: '定制简历生成',
  export: '文档导出',
}

export function TaskProgress({ task }: { task: ProcessingTask }) {
  return <div className="task-progress">
    <div className="task-progress__header">
      <Space><Typography.Text strong>{taskLabels[task.task_type] ?? task.task_type}</Typography.Text><StatusTag status={task.status} /></Space>
      <Typography.Text type="secondary">{new Date(task.updated_at).toLocaleString()}</Typography.Text>
    </div>
    <Progress percent={task.progress} format={() => `${task.progress}%`} status={task.status === 'failed' ? 'exception' : task.status === 'completed' ? 'success' : 'active'} />
    {task.error_message ? <Alert type="error" showIcon message={task.error_message} /> : null}
  </div>
}
