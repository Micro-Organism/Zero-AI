import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import { api } from '@/api/client'
import { ResumeLibraryPage } from '@/pages/ResumeLibraryPage'

vi.mock('@/api/client', () => ({ api: vi.fn() }))

beforeEach(() => {
  vi.mocked(api).mockResolvedValue({
    items: [{
      id: 'work-1',
      company: '示例公司',
      role: '算法工程师',
      start_date: '2024-01',
      end_date: '2025-01',
      is_current: false,
      description: '负责模型研发',
      achievements: ['完成上线'],
      technologies: ['Python'],
      version: 1,
    }],
    total: 1,
    page: 1,
    page_size: 10,
    pages: 1,
  })
})

test('uses the resume material name and exposes a read-only view action', async () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <ResumeLibraryPage />
    </QueryClientProvider>,
  )

  expect(await screen.findByRole('heading', { name: '简历素材库' })).toBeInTheDocument()
  expect(await screen.findByTitle('查看')).toBeInTheDocument()
})
