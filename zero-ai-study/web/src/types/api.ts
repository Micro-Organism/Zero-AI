export type StepStatus = 'todo' | 'doing' | 'done'
export type StepId =
  | 'setup'
  | 'concepts'
  | 'data'
  | 'finetune'
  | 'eval'
  | 'export'
  | 'data_craft'
  | 'hparams'
  | 'retrain'
  | 'engineering'

export interface StepProgress {
  id: StepId
  title: string
  dir: string
  status: StepStatus
  note: string
}

export interface ProgressResponse {
  version: number
  updated_at: string | null
  steps: StepProgress[]
  done_count: number
  total_count: number
  percent: number
}

export interface ActionResult {
  ok: boolean
  message: string
  details: string[]
  checked_at: string
}

export interface ArtifactInfo {
  name: string
  path: string
  exists: boolean
  size: number | null
  preview: string | null
}

export interface OverviewResponse {
  progress: ProgressResponse
  artifacts: ArtifactInfo[]
  study_root: string
}

export interface TokenStatus {
  configured: boolean
  masked: string | null
  source: string | null
  env_file_exists: boolean
  env_file_path: string
}

export interface TokenTestResult extends ActionResult {
  masked: string | null
  username: string | null
  raw_keys: string[]
}

export interface ActivityItem {
  ts: string
  action: string
  ok: boolean
  message: string
  meta: Record<string, unknown>
}

export type KaggleAccelerator = 'gpu_t4_x2' | 'gpu_p100' | 'cpu' | 'none'

export interface KaggleSetupStatus {
  account: string
  notebook_name: string
  accelerator: KaggleAccelerator
  phone_verified: boolean
  gpu_selected: boolean
  secret_hf_token: boolean
  confirmed_at: string | null
  recommended: string
  note: string
}

export interface ConceptsNotes {
  pretrain_vs_finetune: string
  why_finetune: string
  what_is_lora: string
  what_is_qlora: string
  sft_fields: string
  scenario: string
}

export interface DatasetItem {
  instruction: string
  input: string
  output: string
}

export interface DatasetResponse {
  items: DatasetItem[]
  count: number
  path: string
  errors: string[]
}

export interface FinetuneChecklist {
  opened_official_link: boolean
  copied_notebook: boolean
  gpu_t4: boolean
  internet_on: boolean
  hf_login_cell: boolean
  max_steps_60: boolean
  run_all_ok: boolean
  saved_lora: boolean
  adapter_confirmed: boolean

  date: string
  platform: string
  account: string
  notebook_name: string
  gpu_model: string
  model_name: string
  method: string
  dataset_public: string
  max_steps: string
  max_seq_length: string
  approx_loss: string
  train_seconds: string
  train_minutes: string
  peak_memory_gb: string
  train_extra_memory_gb: string
  cloud_lora_path: string
  local_lora_path: string
  note: string

  uploaded_own_jsonl: boolean
  kaggle_input_path: string
  changed_load_dataset: boolean
  retrained_own_data: boolean
  own_max_steps: string
  own_approx_loss: string
  saved_lora_zh: boolean
  cloud_lora_zh_path: string
  downloaded_to_local: boolean
  local_lora_zh_path: string

  confirmed_at: string | null
  validated_at: string | null
  phase_a_ok: boolean
  phase_b_ok: boolean
}

export interface EvalQuestion {
  id: string
  question: string
  before: string
  after: string
  note: string
}

export interface EvalChecklist {
  prepared_questions: boolean
  ran_before_infer: boolean
  ran_after_infer: boolean
  filled_comparison: boolean
  wrote_conclusion: boolean
  adapter_path: string
  finetune_log_ref: string
  questions: EvalQuestion[]
  overall_better: string
  main_issues: string
  next_plan: string
  note: string
  confirmed_at: string | null
  validated_at: string | null
  ok: boolean
}

export interface ExportChecklist {
  confirmed_local_adapter: boolean
  reloaded_adapter: boolean
  ran_reload_infer: boolean
  wrote_notes: boolean
  skipped_gguf: boolean
  did_gguf: boolean
  did_ollama: boolean
  base_model: string
  adapter_dir: string
  cloud_adapter_dir: string
  load_summary: string
  gguf_quant: string
  gguf_path: string
  ollama_cmd: string
  issues: string
  note: string
  confirmed_at: string | null
  validated_at: string | null
  ok: boolean
}

export interface DataCraftChecklist {
  read_guidelines: boolean
  defined_task_scope: boolean
  wrote_weak_spot_samples: boolean
  built_holdout_eval: boolean
  cleaned_and_validated: boolean
  wrote_construction_notes: boolean
  task_scope: string
  quality_rules: string
  train_path: string
  eval_path: string
  train_count: string
  eval_count: string
  weak_spots_covered: string
  construction_notes: string
  interview_talk: string
  note: string
  confirmed_at: string | null
  validated_at: string | null
  ok: boolean
}

export interface HparamsChecklist {
  read_param_guide: boolean
  explained_lora_r_alpha: boolean
  explained_lr_steps_batch: boolean
  explained_seq_quant: boolean
  planned_v2_config: boolean
  wrote_interview_answers: boolean
  lora_r: string
  lora_alpha: string
  learning_rate: string
  max_steps: string
  per_device_train_batch_size: string
  gradient_accumulation_steps: string
  max_seq_length: string
  load_in_4bit: string
  why_r_alpha: string
  why_lr_steps_batch: string
  why_seq_quant: string
  v2_change_plan: string
  interview_talk: string
  note: string
  confirmed_at: string | null
  validated_at: string | null
  ok: boolean
}

export interface RetrainChecklist {
  uploaded_v2_data: boolean
  applied_hparams: boolean
  trained_v2: boolean
  saved_adapter_v2: boolean
  reevaluated_weak_qs: boolean
  wrote_comparison: boolean
  dataset_path: string
  adapter_name: string
  max_steps: string
  approx_loss: string
  local_adapter_path: string
  cloud_data_hint: string
  hparams_ref: string
  weak_q_results: string
  vs_v1_summary: string
  interview_talk: string
  note: string
  confirmed_at: string | null
  validated_at: string | null
  ok: boolean
}

export interface EngineeringChecklist {
  archived_v2: boolean
  uploaded_v3_data: boolean
  trained_v3: boolean
  saved_adapter_v3: boolean
  gate_g1: boolean
  gate_g2: boolean
  gate_g3: boolean
  gate_g4: boolean
  gate_g5: boolean
  kaggle_dataset: string
  dataset_path: string
  cloud_data_hint: string
  train_mode: string
  adapter_name: string
  max_steps: string
  approx_loss: string
  local_v2_path: string
  local_v3_path: string
  hparams_ref: string
  g1_output: string
  g2_output: string
  g3_output: string
  g4_note: string
  vs_v2_summary: string
  interview_talk: string
  note: string
  confirmed_at: string | null
  validated_at: string | null
  ok: boolean
}
