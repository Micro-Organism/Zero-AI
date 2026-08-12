import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { TaskProgress } from '@/components/TaskProgress'

test('shows task type, progress, and error details', () => {
  render(
    <TaskProgress
      task={{
        id: 'task-1',
        task_type: 'resume_parse',
        status: 'failed',
        progress: 35,
        error_message: '解析失败',
        updated_at: '2026-08-03T10:00:00Z',
      }}
    />,
  )

  expect(screen.getByText('简历解析')).toBeInTheDocument()
  expect(screen.getByText('35%')).toBeInTheDocument()
  expect(screen.getByText('解析失败')).toBeInTheDocument()
})
