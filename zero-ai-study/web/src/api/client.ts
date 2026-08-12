import axios from 'axios'
import type {
  ActionResult,
  ActivityItem,
  ConceptsNotes,
  DatasetItem,
  DatasetResponse,
  KaggleAccelerator,
  KaggleSetupStatus,
  OverviewResponse,
  ProgressResponse,
  StepId,
  StepStatus,
  TokenStatus,
  TokenTestResult,
  FinetuneChecklist,
  EvalChecklist,
  ExportChecklist,
  DataCraftChecklist,
  HparamsChecklist,
  RetrainChecklist,
  EngineeringChecklist,
} from '@/types/api'

const http = axios.create({
  baseURL: '/api',
  timeout: 45000,
})

export async function fetchOverview() {
  const { data } = await http.get<OverviewResponse>('/overview')
  return data
}

export async function fetchProgress() {
  const { data } = await http.get<ProgressResponse>('/progress')
  return data
}

export async function updateStep(stepId: StepId, status: StepStatus, note?: string) {
  const { data } = await http.put<ProgressResponse>(`/progress/${stepId}`, {
    status,
    note,
  })
  return data
}

export async function checkEnv() {
  const { data } = await http.post<ActionResult>('/actions/check-env')
  return data
}

export async function validateDataset() {
  const { data } = await http.post<ActionResult>('/actions/validate-dataset')
  return data
}

export async function fetchHealth() {
  const { data } = await http.get<{ status: string }>('/health')
  return data
}

export async function fetchTokenStatus() {
  const { data } = await http.get<TokenStatus>('/setup/token-status')
  return data
}

export async function saveToken(token: string) {
  const { data } = await http.post<ActionResult>('/setup/save-token', { token })
  return data
}

export async function testToken(token?: string) {
  const { data } = await http.post<TokenTestResult>('/setup/test-token', {
    token: token || null,
  })
  return data
}

export async function fetchActivity(limit = 40) {
  const { data } = await http.get<ActivityItem[]>('/activity', { params: { limit } })
  return data
}

export async function fetchKaggleStatus() {
  const { data } = await http.get<KaggleSetupStatus>('/setup/kaggle-status')
  return data
}

export async function confirmKaggleSetup(body: {
  account: string
  notebook_name: string
  accelerator: KaggleAccelerator
  phone_verified: boolean
  secret_hf_token: boolean
  note?: string
}) {
  const { data } = await http.post<ActionResult>('/setup/kaggle-confirm', body)
  return data
}

export async function fetchConceptsNotes() {
  const { data } = await http.get<ConceptsNotes>('/concepts/notes')
  return data
}

export async function saveConceptsNotes(body: ConceptsNotes) {
  const { data } = await http.post<ActionResult>('/concepts/notes', body)
  return data
}

export async function fetchDataset() {
  const { data } = await http.get<DatasetResponse>('/dataset')
  return data
}

export async function saveDataset(items: DatasetItem[]) {
  const { data } = await http.post<ActionResult>('/dataset', { items })
  return data
}

export async function fetchFinetuneChecklist() {
  const { data } = await http.get<FinetuneChecklist>('/finetune/checklist')
  return data
}

export async function confirmFinetuneChecklist(
  body: Omit<FinetuneChecklist, 'confirmed_at' | 'validated_at' | 'phase_a_ok' | 'phase_b_ok'>,
) {
  const { data } = await http.post<ActionResult>('/finetune/confirm', body)
  return data
}

export async function validateFinetuneChecklist(
  body: Omit<FinetuneChecklist, 'confirmed_at' | 'validated_at' | 'phase_a_ok' | 'phase_b_ok'>,
) {
  const { data } = await http.post<ActionResult>('/finetune/validate', body)
  return data
}

export async function fetchEvalChecklist() {
  const { data } = await http.get<EvalChecklist>('/eval/checklist')
  return data
}

export async function confirmEvalChecklist(
  body: Omit<EvalChecklist, 'confirmed_at' | 'validated_at' | 'ok'>,
) {
  const { data } = await http.post<ActionResult>('/eval/confirm', body)
  return data
}

export async function validateEvalChecklist(
  body: Omit<EvalChecklist, 'confirmed_at' | 'validated_at' | 'ok'>,
) {
  const { data } = await http.post<ActionResult>('/eval/validate', body)
  return data
}

export async function fetchExportChecklist() {
  const { data } = await http.get<ExportChecklist>('/export/checklist')
  return data
}

export async function confirmExportChecklist(
  body: Omit<ExportChecklist, 'confirmed_at' | 'validated_at' | 'ok'>,
) {
  const { data } = await http.post<ActionResult>('/export/confirm', body)
  return data
}

export async function validateExportChecklist(
  body: Omit<ExportChecklist, 'confirmed_at' | 'validated_at' | 'ok'>,
) {
  const { data } = await http.post<ActionResult>('/export/validate', body)
  return data
}

export async function fetchDataCraftChecklist() {
  const { data } = await http.get<DataCraftChecklist>('/data-craft/checklist')
  return data
}

export async function confirmDataCraftChecklist(
  body: Omit<DataCraftChecklist, 'confirmed_at' | 'validated_at' | 'ok'>,
) {
  const { data } = await http.post<ActionResult>('/data-craft/confirm', body)
  return data
}

export async function validateDataCraftChecklist(
  body: Omit<DataCraftChecklist, 'confirmed_at' | 'validated_at' | 'ok'>,
) {
  const { data } = await http.post<ActionResult>('/data-craft/validate', body)
  return data
}

export async function fetchHparamsChecklist() {
  const { data } = await http.get<HparamsChecklist>('/hparams/checklist')
  return data
}

export async function confirmHparamsChecklist(
  body: Omit<HparamsChecklist, 'confirmed_at' | 'validated_at' | 'ok'>,
) {
  const { data } = await http.post<ActionResult>('/hparams/confirm', body)
  return data
}

export async function validateHparamsChecklist(
  body: Omit<HparamsChecklist, 'confirmed_at' | 'validated_at' | 'ok'>,
) {
  const { data } = await http.post<ActionResult>('/hparams/validate', body)
  return data
}

export async function fetchRetrainChecklist() {
  const { data } = await http.get<RetrainChecklist>('/retrain/checklist')
  return data
}

export async function confirmRetrainChecklist(
  body: Omit<RetrainChecklist, 'confirmed_at' | 'validated_at' | 'ok'>,
) {
  const { data } = await http.post<ActionResult>('/retrain/confirm', body)
  return data
}

export async function validateRetrainChecklist(
  body: Omit<RetrainChecklist, 'confirmed_at' | 'validated_at' | 'ok'>,
) {
  const { data } = await http.post<ActionResult>('/retrain/validate', body)
  return data
}

export async function fetchEngineeringChecklist() {
  const { data } = await http.get<EngineeringChecklist>('/engineering/checklist')
  return data
}

export async function confirmEngineeringChecklist(
  body: Omit<EngineeringChecklist, 'confirmed_at' | 'validated_at' | 'ok'>,
) {
  const { data } = await http.post<ActionResult>('/engineering/confirm', body)
  return data
}

export async function validateEngineeringChecklist(
  body: Omit<EngineeringChecklist, 'confirmed_at' | 'validated_at' | 'ok'>,
) {
  const { data } = await http.post<ActionResult>('/engineering/validate', body)
  return data
}
