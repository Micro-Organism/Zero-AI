import { Card, Empty, List, Progress, Statistic, Table, Typography } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { SkillInsights } from '@/api/types'
import { PageHeader } from '@/components/PageHeader'

export function InsightsPage() {
  const insights = useQuery({ queryKey: ['skill-insights'], queryFn: () => api<SkillInsights>('/insights/skills') })
  const maxCount = Math.max(...(insights.data?.skill_frequency.map((item) => item.count) ?? [1]))

  return <>
    <PageHeader title="洞察与学习计划" description="从持续收集的招聘样本中识别高频能力、证据缺口和学习优先级。" />
    <div className="insight-grid">
      <Card><Statistic title="待补能力项" value={insights.data?.open_gap_count ?? 0} valueStyle={{ color: '#b94c3b' }} /></Card>
      <Card title="行动建议"><List size="small" dataSource={insights.data?.recommendations ?? []} locale={{ emptyText: '录入并分析招聘信息后生成建议' }} renderItem={(item, index) => <List.Item><Typography.Text><b>{index + 1}.</b> {item}</Typography.Text></List.Item>} /></Card>
    </div>
    <Card title="岗位技能频率" style={{ marginTop: 16 }}>
      <Table rowKey="skill" pagination={false} loading={insights.isLoading} dataSource={insights.data?.skill_frequency ?? []} locale={{ emptyText: <Empty description="暂无已提取的岗位技能" /> }} columns={[
        { title: '技能', dataIndex: 'skill', width: 220 },
        { title: '出现次数', dataIndex: 'count', width: 110 },
        { title: '相对热度', dataIndex: 'count', render: (count: number) => <Progress percent={Math.round(count / maxCount * 100)} showInfo={false} /> },
      ]} />
    </Card>
  </>
}
