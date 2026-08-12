import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import { api } from '@/api/client'
import { ReferenceResumePage } from '@/pages/ReferenceResumePage'

vi.mock('@/api/client', () => ({
  api: vi.fn(),
  downloadUrl: vi.fn((path: string) => path),
}))

const sampleResume = {
  id: 'reference-1',
  title: '参考候选人简历',
  kind: 'reference',
  status: 'ready',
  summary: '候选人完整简历',
  content: {
    source_text: '精通 Python，熟悉 PyTorch，负责 RAG 问答系统。',
    skills: [
      { name: 'Python', category: '编程与工程', level: 5, count: 2, evidence: '精通 Python' },
      { name: 'PyTorch', category: '机器学习与深度学习', level: 4, count: 1, evidence: '熟悉 PyTorch' },
    ],
    interview_roadmap: [{
      skill: 'Python',
      category: '编程与工程',
      levels: [{ level: 'L1 概念认知', label: '先讲清是什么、为什么', questions: ['GIL 是什么？'] }],
    }],
    highlights: ['检索准确率提升 30%'],
    work_experiences: [],
    project_experiences: [],
  },
  version: 1,
  updated_at: '2026-08-03T10:00:00Z',
}

beforeEach(() => {
  vi.mocked(api).mockImplementation(async (path: string) => {
    if (path.startsWith('/resumes?kind=reference')) {
      return {
        items: [sampleResume],
        total: 1,
        page: 1,
        page_size: 10,
        pages: 1,
      }
    }
    if (path === '/resumes/reference-1/versions') return []
    return undefined
  })
})

test('lists one candidate as one reference resume with a view action', async () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <ReferenceResumePage />
    </QueryClientProvider>,
  )

  expect(await screen.findByRole('heading', { name: '参考简历库' })).toBeInTheDocument()
  expect(await screen.findByText('参考候选人简历')).toBeInTheDocument()
  expect(await screen.findByTitle('查看参考简历')).toBeInTheDocument()
})

test('shows extracted skills and interview ladder in detail', async () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <ReferenceResumePage />
    </QueryClientProvider>,
  )

  fireEvent.click(await screen.findByTitle('查看参考简历'))
  expect(await screen.findByText('由浅入深面试路线')).toBeInTheDocument()
  expect(await screen.findByText('L1 概念认知')).toBeInTheDocument()
  expect((await screen.findAllByText('Python')).length).toBeGreaterThan(0)
})
