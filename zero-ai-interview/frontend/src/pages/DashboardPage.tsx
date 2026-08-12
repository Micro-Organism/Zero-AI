import { Card, Empty, Progress, Statistic, Table, Typography } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { DashboardData } from '@/api/types'
import { PageHeader } from '@/components/PageHeader'

const steps = ['导入招聘', '提取能力', '完善主简历', '生成定制版', '匹配与检查', '导出/打印']

export function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: () => api<DashboardData>('/dashboard') })
  return <>
    <PageHeader title="工作台" description="从岗位要求出发，持续完善职业证据和求职材料。" />
    <div className="stat-grid">
      <Card loading={isLoading}><Statistic title="主简历完整度" value={data?.resume_completeness ?? 0} suffix="%" /><Progress percent={data?.resume_completeness ?? 0} showInfo={false} /></Card>
      <Card loading={isLoading}><Statistic title="招聘样本" value={data?.recruitment_count ?? 0} /></Card>
      <Card loading={isLoading}><Statistic title="定制简历" value={data?.targeted_resume_count ?? 0} /></Card>
      <Card loading={isLoading}><Statistic title="待补能力" value={data?.open_gap_count ?? 0} valueStyle={{ color: '#b94c3b' }} /></Card>
    </div>
    <Card title="求职匹配闭环" style={{ marginTop: 16 }}><div className="workflow-strip">{steps.map((step, index) => <div className="workflow-step" key={step}><Typography.Text type="secondary">步骤 {index + 1}</Typography.Text><br /><b>{step}</b></div>)}</div></Card>
    <Card title="最近匹配" style={{ marginTop: 16 }}><Table rowKey="id" pagination={false} dataSource={data?.recent_matches ?? []} locale={{ emptyText: <Empty description="创建第一个求职匹配后，这里会显示进展" /> }} columns={[{ title: '状态', dataIndex: 'status' }, { title: '匹配度', dataIndex: 'total_score', render: (value) => `${value}%` }, { title: '更新时间', dataIndex: 'updated_at', render: (value) => new Date(value).toLocaleString() }]} /></Card>
  </>
}
