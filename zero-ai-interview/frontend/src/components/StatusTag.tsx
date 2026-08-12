import { Tag } from 'antd'

const colors: Record<string, string> = { active: 'green', analyzed: 'blue', draft: 'gold', ready: 'green', completed: 'green', running: 'blue', pending: 'gold', failed: 'red', ocr_pending: 'orange', archived: 'default' }
const labels: Record<string, string> = { active: '进行中', analyzed: '已分析', draft: '草稿', ready: '已就绪', completed: '已完成', running: '处理中', pending: '等待中', failed: '失败', ocr_pending: '待 OCR', archived: '已归档' }

export function StatusTag({ status }: { status: string }) {
  return <Tag color={colors[status] ?? 'default'}>{labels[status] ?? status}</Tag>
}
