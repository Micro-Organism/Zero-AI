from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, Field

StepStatus = Literal["todo", "doing", "done"]
StepId = Literal[
    "setup",
    "concepts",
    "data",
    "finetune",
    "eval",
    "export",
    "data_craft",
    "hparams",
    "retrain",
    "engineering",
]


class StepProgress(BaseModel):
    id: StepId
    title: str
    dir: str
    status: StepStatus = "todo"
    note: str = ""


class ProgressUpdate(BaseModel):
    status: StepStatus
    note: str | None = None


class ProgressResponse(BaseModel):
    version: int = 1
    updated_at: str | None = None
    steps: list[StepProgress]
    done_count: int = 0
    total_count: int = 0
    percent: float = 0.0


class ActionResult(BaseModel):
    ok: bool
    message: str
    details: list[str] = Field(default_factory=list)
    checked_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )


class ArtifactInfo(BaseModel):
    name: str
    path: str
    exists: bool
    size: int | None = None
    preview: str | None = None


class OverviewResponse(BaseModel):
    progress: ProgressResponse
    artifacts: list[ArtifactInfo]
    study_root: str


class TokenStatus(BaseModel):
    configured: bool
    masked: str | None = None
    source: str | None = None
    env_file_exists: bool = False
    env_file_path: str = ".env"


class TokenSaveRequest(BaseModel):
    token: str


class TokenTestRequest(BaseModel):
    token: str | None = None


class TokenTestResult(ActionResult):
    masked: str | None = None
    username: str | None = None
    raw_keys: list[str] = Field(default_factory=list)


class ActivityItem(BaseModel):
    ts: str
    action: str
    ok: bool
    message: str
    meta: dict = Field(default_factory=dict)


class KaggleSetupStatus(BaseModel):
    account: str = "coolrabbit1993"
    notebook_name: str = "zero-notebook"
    accelerator: Literal["gpu_t4_x2", "gpu_p100", "cpu", "none"] = "none"
    phone_verified: bool = False
    gpu_selected: bool = False
    secret_hf_token: bool = False
    confirmed_at: str | None = None
    recommended: str = "gpu_t4_x2"
    note: str = ""


class KaggleConfirmRequest(BaseModel):
    account: str = "coolrabbit1993"
    notebook_name: str = "zero-notebook"
    accelerator: Literal["gpu_t4_x2", "gpu_p100", "cpu", "none"]
    phone_verified: bool = False
    secret_hf_token: bool = False
    note: str | None = None


class ConceptsNotes(BaseModel):
    pretrain_vs_finetune: str = ""
    why_finetune: str = ""
    what_is_lora: str = ""
    what_is_qlora: str = ""
    sft_fields: str = ""
    scenario: str = ""


class DatasetItem(BaseModel):
    instruction: str
    input: str = ""
    output: str


class DatasetResponse(BaseModel):
    items: list[DatasetItem]
    count: int
    path: str
    errors: list[str] = Field(default_factory=list)


class DatasetSaveRequest(BaseModel):
    items: list[DatasetItem]


class FinetuneChecklist(BaseModel):
    # —— 前半：公开数据通路 ——
    opened_official_link: bool = False
    copied_notebook: bool = False
    gpu_t4: bool = False
    internet_on: bool = False
    hf_login_cell: bool = False
    max_steps_60: bool = False
    run_all_ok: bool = False
    saved_lora: bool = False
    adapter_confirmed: bool = False

    # —— 实验记录（前端填写，后端同步写 md）——
    date: str = "2026-07-29"
    platform: str = "Kaggle"
    account: str = "coolrabbit1993"
    notebook_name: str = "zero-unsloth-llama31-8b"
    gpu_model: str = "T4 x2"
    model_name: str = "unsloth/Llama-3.1-8B-bnb-4bit"
    method: str = "QLoRA"
    dataset_public: str = "unsloth/alpaca-cleaned"
    max_steps: str = "60"
    max_seq_length: str = "2048"
    approx_loss: str = "0.885100"
    train_seconds: str = "351.3431"
    train_minutes: str = "5.86"
    peak_memory_gb: str = "7.275"
    train_extra_memory_gb: str = "0.568"
    cloud_lora_path: str = "/kaggle/working/llama_lora/"
    local_lora_path: str = "outputs/llama_lora/"
    note: str = ""

    # —— 后半：自己的中文数据 ——
    uploaded_own_jsonl: bool = True
    kaggle_input_path: str = (
        "/kaggle/input/datasets/coolrabbit1993/sample-alpaca-zh-01/sample_alpaca_zh.jsonl"
    )
    changed_load_dataset: bool = False
    retrained_own_data: bool = False
    own_max_steps: str = "60"
    own_approx_loss: str = ""
    saved_lora_zh: bool = False
    cloud_lora_zh_path: str = "/kaggle/working/llama_lora_zh/"
    downloaded_to_local: bool = False
    local_lora_zh_path: str = "outputs/llama_lora_zh/"

    confirmed_at: str | None = None
    validated_at: str | None = None
    phase_a_ok: bool = False
    phase_b_ok: bool = False


class FinetuneConfirmRequest(BaseModel):
    opened_official_link: bool = False
    copied_notebook: bool = False
    gpu_t4: bool = False
    internet_on: bool = False
    hf_login_cell: bool = False
    max_steps_60: bool = False
    run_all_ok: bool = False
    saved_lora: bool = False
    adapter_confirmed: bool = False

    date: str = "2026-07-29"
    platform: str = "Kaggle"
    account: str = "coolrabbit1993"
    notebook_name: str = "zero-unsloth-llama31-8b"
    gpu_model: str = "T4 x2"
    model_name: str = "unsloth/Llama-3.1-8B-bnb-4bit"
    method: str = "QLoRA"
    dataset_public: str = "unsloth/alpaca-cleaned"
    max_steps: str = "60"
    max_seq_length: str = "2048"
    approx_loss: str = ""
    train_seconds: str = ""
    train_minutes: str = ""
    peak_memory_gb: str = ""
    train_extra_memory_gb: str = ""
    cloud_lora_path: str = "/kaggle/working/llama_lora/"
    local_lora_path: str = "outputs/llama_lora/"
    note: str = ""

    uploaded_own_jsonl: bool = True
    kaggle_input_path: str = (
        "/kaggle/input/datasets/coolrabbit1993/sample-alpaca-zh-01/sample_alpaca_zh.jsonl"
    )
    changed_load_dataset: bool = False
    retrained_own_data: bool = False
    own_max_steps: str = "60"
    own_approx_loss: str = ""
    saved_lora_zh: bool = False
    cloud_lora_zh_path: str = "/kaggle/working/llama_lora_zh/"
    downloaded_to_local: bool = False
    local_lora_zh_path: str = "outputs/llama_lora_zh/"



class EvalQuestion(BaseModel):
    id: str = ""
    question: str = ""
    before: str = ""
    after: str = ""
    note: str = ""


class EvalChecklist(BaseModel):
    prepared_questions: bool = False
    ran_before_infer: bool = False
    ran_after_infer: bool = False
    filled_comparison: bool = False
    wrote_conclusion: bool = False

    adapter_path: str = "outputs/llama_lora_zh/"
    finetune_log_ref: str = "03-finetune/finetune_run_log.md"
    questions: list[EvalQuestion] = Field(default_factory=list)

    overall_better: str = ""
    main_issues: str = ""
    next_plan: str = ""
    note: str = ""

    confirmed_at: str | None = None
    validated_at: str | None = None
    ok: bool = False


class EvalConfirmRequest(BaseModel):
    prepared_questions: bool = False
    ran_before_infer: bool = False
    ran_after_infer: bool = False
    filled_comparison: bool = False
    wrote_conclusion: bool = False

    adapter_path: str = "outputs/llama_lora_zh/"
    finetune_log_ref: str = "03-finetune/finetune_run_log.md"
    questions: list[EvalQuestion] = Field(default_factory=list)

    overall_better: str = ""
    main_issues: str = ""
    next_plan: str = ""
    note: str = ""


class ExportChecklist(BaseModel):
    confirmed_local_adapter: bool = False
    reloaded_adapter: bool = False
    ran_reload_infer: bool = False
    wrote_notes: bool = False
    skipped_gguf: bool = False
    did_gguf: bool = False
    did_ollama: bool = False

    base_model: str = "unsloth/Llama-3.1-8B-bnb-4bit"
    adapter_dir: str = "outputs/llama_lora_zh/"
    cloud_adapter_dir: str = "/kaggle/working/llama_lora_zh"
    load_summary: str = ""
    gguf_quant: str = "q4_k_m"
    gguf_path: str = ""
    ollama_cmd: str = ""
    issues: str = ""
    note: str = ""

    confirmed_at: str | None = None
    validated_at: str | None = None
    ok: bool = False


class ExportConfirmRequest(BaseModel):
    confirmed_local_adapter: bool = False
    reloaded_adapter: bool = False
    ran_reload_infer: bool = False
    wrote_notes: bool = False
    skipped_gguf: bool = False
    did_gguf: bool = False
    did_ollama: bool = False

    base_model: str = "unsloth/Llama-3.1-8B-bnb-4bit"
    adapter_dir: str = "outputs/llama_lora_zh/"
    cloud_adapter_dir: str = "/kaggle/working/llama_lora_zh"
    load_summary: str = ""
    gguf_quant: str = "q4_k_m"
    gguf_path: str = ""
    ollama_cmd: str = ""
    issues: str = ""
    note: str = ""


class DataCraftChecklist(BaseModel):
    read_guidelines: bool = False
    defined_task_scope: bool = False
    wrote_weak_spot_samples: bool = False
    built_holdout_eval: bool = False
    cleaned_and_validated: bool = False
    wrote_construction_notes: bool = False

    task_scope: str = (
        "让模型用中文回答「大模型微调入门」相关问题：能讲清微调/LoRA/QLoRA、Alpaca 字段、"
        "训练产物、Prompt 与 SFT 区别、简单评估方法；面向求职作品集讲解，不追求百科全覆盖。"
    )
    quality_rules: str = (
        "1) 一条样本只教一个清晰点；\n"
        "2) output 必须可检验：列表题写全关键项，禁止只丢术语；\n"
        "3) 同一知识至少 2 种问法（防死记）；\n"
        "4) 针对 v1 弱项（产物清单、Prompt vs 微调、QLoRA 表述）优先补全；\n"
        "5) Holdout 措辞不得与训练集原句相同；\n"
        "6) 禁止空 output、明显错答、无意义重复。"
    )
    train_path: str = "datasets/sample_alpaca_zh_v2.jsonl"
    eval_path: str = "datasets/eval_holdout_zh.jsonl"
    train_count: str = ""
    eval_count: str = ""
    weak_spots_covered: str = (
        "v1 上「微调完成后常见产物」易答成术语堆砌；v2 已扩展到 500+ 条，系统覆盖预训练/LoRA/QLoRA/数据工程/"
        "超参/故障排查/面试口述，并单独维护 Holdout 改写题。"
    )
    construction_notes: str = (
        "1) 用 02-data/generate_alpaca_v2.py 生成科学具体的 Alpaca 中文样本；\n"
        "2) 覆盖概念定义、对比、场景、数值题、故障卡、清单题；\n"
        "3) 另建 eval_holdout_zh.jsonl（≥100）不进训练；\n"
        "4) 逐行 JSON 校验 + 去重 instruction；\n"
        "5) 看板自动计数，训练 ≥500。"
    )
    interview_talk: str = (
        "我做中文微调入门问答作品集。数据是 Alpaca JSONL，v2 扩到 500+ 条，强调可检验答案、同义问法与训测分离；"
        "方法是 Unsloth QLoRA；用固定弱题/Holdout 对比，再决定超参与是否复训。"
        "我能讲清 r/lr/steps/4bit 与数据质量如何共同影响效果。"
    )
    note: str = "数据由 generate_alpaca_v2.py 生成；学习时请抽读不同主题样本，不要只看条数。"

    confirmed_at: str | None = None
    validated_at: str | None = None
    ok: bool = False


class DataCraftConfirmRequest(BaseModel):
    read_guidelines: bool = False
    defined_task_scope: bool = False
    wrote_weak_spot_samples: bool = False
    built_holdout_eval: bool = False
    cleaned_and_validated: bool = False
    wrote_construction_notes: bool = False

    task_scope: str = ""
    quality_rules: str = ""
    train_path: str = "datasets/sample_alpaca_zh_v2.jsonl"
    eval_path: str = "datasets/eval_holdout_zh.jsonl"
    train_count: str = ""
    eval_count: str = ""
    weak_spots_covered: str = ""
    construction_notes: str = ""
    interview_talk: str = ""
    note: str = ""


class HparamsChecklist(BaseModel):
    read_param_guide: bool = False
    explained_lora_r_alpha: bool = False
    explained_lr_steps_batch: bool = False
    explained_seq_quant: bool = False
    planned_v2_config: bool = False
    wrote_interview_answers: bool = False

    lora_r: str = "16"
    lora_alpha: str = "16"
    learning_rate: str = "2e-4"
    max_steps: str = "120"
    per_device_train_batch_size: str = "2"
    gradient_accumulation_steps: str = "4"
    max_seq_length: str = "2048"
    load_in_4bit: str = "True"
    why_r_alpha: str = (
        "r 是 LoRA 低秩维度：对权重更新 ΔW≈BA，r 越大表达容量越高，也更易过拟合、更吃显存。"
        "lora_alpha 是缩放系数，常见实现里有效更新大致按 alpha/r 缩放，所以 alpha 常取与 r 同量级或 2r。"
        "我的 v1 用 r=16、alpha=16，属于入门稳妥点；v2 数据虽扩到 500+，但任务仍是入门问答，"
        "先保持 16/16，避免「数据刚变好又同时猛提 r」导致无法归因。若 Holdout 仍欠拟合，再试 r=32 并同步审视 alpha。"
    )
    why_lr_steps_batch: str = (
        "learning_rate 控制更新步长：过大 loss 震荡/不收敛，过小同样步数学不动；Unsloth QLoRA 入门常见 2e-4。"
        "max_steps 是优化次数：v1=60 只为跑通；数据已到 500+ 后提到 120，让模型多看几遍多样本，但仍避免小数据式「数百步死背」。"
        "per_device_batch × gradient_accumulation ≈ 有效 batch（单卡）。T4 上 batch=2、accum=4 → 有效 batch≈8，"
        "在显存可承受下让梯度更稳。若 OOM：先降 batch 到 1，再把 accum 提到 8，尽量维持有效 batch。"
    )
    why_seq_quant: str = (
        "max_seq_length=2048：覆盖中等长度中文问答足够；再大（如 4096）显存与注意力开销明显上升，"
        "而我的样本多数远短于 2k，盲目加长收益有限。OOM 时可降到 1024。"
        "load_in_4bit=True：QLoRA 的关键前提，把 8B 基座塞进约 16GB 显存；关闭后常直接装不下或无法训练。"
        "量化解决「装下基座」，LoRA 解决「训哪些参数」，二者一起才适合 Kaggle T4。"
    )
    v2_change_plan: str = (
        "相对 v1（约 9 条数据、steps≈60、r=16、4bit、产物题弱）：\n"
        "1) 数据：改用 sample_alpaca_zh_v2.jsonl（500+）+ Holdout 100 条隔离评测；\n"
        "2) steps：60→120；\n"
        "3) r/alpha：保持 16/16；lr 保持 2e-4；\n"
        "4) batch/accum：2×4；seq：2048；4bit：开；\n"
        "5) 保存为 llama_lora_zh_v2，不覆盖 v1；\n"
        "6) 用同一弱题/Holdout 对比完整性与是否仍术语堆砌；\n"
        "7) 若仍 OOM：seq→1024 或 batch→1、accum→8；若仍欠拟合且数据已足：再试 r=32。"
    )
    interview_talk: str = (
        "v1 用 QLoRA 在 T4 跑通，但数据太少、产物题只能蹦术语。v2 我先做数据工程到 500+ 并建 100 条 Holdout，"
        "再改超参：steps 60→120，r/alpha 仍 16 以便归因，保持 4bit 与有效 batch≈8。"
        "选择依据是「容量-过拟合-显存」权衡：先让监督信号变完整，再适度加步数，而不是盲目加大 r。"
        "最终用固定 Holdout 对比 v1/v2，证明是否真变好。"
    )
    note: str = "以下为学习模板，结合你的 v1 实验；读懂后可改措辞再校验。Notebook 里改参时与本页数字保持一致。"

    confirmed_at: str | None = None
    validated_at: str | None = None
    ok: bool = False


class HparamsConfirmRequest(BaseModel):
    read_param_guide: bool = False
    explained_lora_r_alpha: bool = False
    explained_lr_steps_batch: bool = False
    explained_seq_quant: bool = False
    planned_v2_config: bool = False
    wrote_interview_answers: bool = False

    lora_r: str = "16"
    lora_alpha: str = "16"
    learning_rate: str = "2e-4"
    max_steps: str = "120"
    per_device_train_batch_size: str = "2"
    gradient_accumulation_steps: str = "4"
    max_seq_length: str = "2048"
    load_in_4bit: str = "True"
    why_r_alpha: str = ""
    why_lr_steps_batch: str = ""
    why_seq_quant: str = ""
    v2_change_plan: str = ""
    interview_talk: str = ""
    note: str = ""


class RetrainChecklist(BaseModel):
    uploaded_v2_data: bool = False
    applied_hparams: bool = False
    trained_v2: bool = False
    saved_adapter_v2: bool = False
    reevaluated_weak_qs: bool = False
    wrote_comparison: bool = False

    dataset_path: str = "datasets/sample_alpaca_zh_v2.jsonl"
    adapter_name: str = "llama_lora_zh_v2"
    max_steps: str = "120"
    approx_loss: str = ""
    local_adapter_path: str = "outputs/llama_lora_zh_v2/"
    cloud_data_hint: str = (
        "上传 sample_alpaca_zh_v2.jsonl 为 Dataset 后 Add Input；"
        "用 os.walk('/kaggle/input') 查找 jsonl 真实路径（可能含 datasets/用户名/数据集名/…）。"
    )
    hparams_ref: str = (
        "r=16, alpha=16, lr=2e-4, max_steps=120, batch=2, accum=4, seq=2048, load_in_4bit=True；"
        "详见 07-hparams/hparams_notes.md 与看板 Step 7。"
    )
    weak_q_results: str = (
        "【学习模板：训完后把「v2 实际输出」换成真实生成结果】\n"
        "Q-产物：微调完成后常见产物有哪些？\n"
        "- v1（弱）：instruction、LoRA、QLoRA（术语堆砌）\n"
        "- v2（期望/实填）：应覆盖适配器权重与配置、日志/超参、评测记录；可选 GGUF/合并权重。"
        "实填：……\n\n"
        "Q-对比：Prompt 工程和微调有何不同？\n"
        "- v1：常说不清「改不改权重」\n"
        "- v2（期望/实填）：明确 Prompt 不改权重、SFT/LoRA 改参数或适配器，并各举场景。实填：……\n\n"
        "Q-QLoRA：为什么免费 GPU 更常用 QLoRA？\n"
        "- v2（期望/实填）：4bit 装基座 + 只训 LoRA；与「4bit 全量微调」区分。实填：……\n\n"
        "Holdout：抽 3～5 题（改写题）记录是否仍漏项/背题。实填题号与结论：……"
    )
    vs_v1_summary: str = (
        "【学习模板：训完后用真实对比改写】\n"
        "1) 数据：9 条 → 500+，Holdout 100 隔离；\n"
        "2) 超参：steps 60→120，r/alpha 保持 16 以便归因；\n"
        "3) 预期变好：产物清单完整性↑、Prompt vs SFT 表述更清楚、同义问法更稳；\n"
        "4) 仍可能问题：个别题过拟合、胡编、或 OOM 导致未按计划训练；\n"
        "5) 结论：是否用 v2 替换默认交付；是否保留 v1 回滚；下一步（消融/再补长尾题）。\n"
        "实填结论：……"
    )
    interview_talk: str = (
        "我完成了两轮 QLoRA：v1 验证流水线（Kaggle T4、约 60 steps、小数据），发现产物题弱；"
        "于是做数据工程到 500+ 并建 Holdout，再按可控超参（steps=120、r=16、4bit、有效 batch≈8）训练 llama_lora_zh_v2。"
        "用同一弱题/Holdout 对比证明提升来自数据与适度加步，而不是盲目加大 r。"
        "产物是可重载适配器与实验日志，能讲清失败案例（路径、双卡 device、二次加载 OOM）与修复。"
    )
    note: str = (
        "操作按下方清单逐步做；loss/弱题实填必须来自你的 Kaggle 真实输出。"
        "模板帮你知道「记什么、怎么对比」。不要覆盖 llama_lora_zh（v1）。"
    )

    confirmed_at: str | None = None
    validated_at: str | None = None
    ok: bool = False


class RetrainConfirmRequest(BaseModel):
    uploaded_v2_data: bool = False
    applied_hparams: bool = False
    trained_v2: bool = False
    saved_adapter_v2: bool = False
    reevaluated_weak_qs: bool = False
    wrote_comparison: bool = False

    dataset_path: str = "datasets/sample_alpaca_zh_v2.jsonl"
    adapter_name: str = "llama_lora_zh_v2"
    max_steps: str = "120"
    approx_loss: str = ""
    local_adapter_path: str = "outputs/llama_lora_zh_v2/"
    cloud_data_hint: str = ""
    hparams_ref: str = ""
    weak_q_results: str = ""
    vs_v1_summary: str = ""
    interview_talk: str = ""
    note: str = ""


class EngineeringChecklist(BaseModel):
    """Step 9 · 工程验收：清洗数据 v3 → 再训 → G1～G5 门禁。"""

    archived_v2: bool = False
    uploaded_v3_data: bool = False
    trained_v3: bool = False
    saved_adapter_v3: bool = False
    gate_g1: bool = False
    gate_g2: bool = False
    gate_g3: bool = False
    gate_g4: bool = False
    gate_g5: bool = False

    kaggle_dataset: str = "zero-ds-v3"
    dataset_path: str = "datasets/sample_alpaca_zh_v3.jsonl"
    cloud_data_hint: str = (
        "Add Input 选择 Dataset「zero-ds-v3」后，用 os.walk('/kaggle/input') 查找 "
        "sample_alpaca_zh_v3.jsonl。常见路径形如 "
        "/kaggle/input/datasets/coolrabbit1993/zero-ds-v3/sample_alpaca_zh_v3.jsonl"
    )
    train_mode: str = "continue_from_v2"
    adapter_name: str = "llama_lora_zh_v3"
    max_steps: str = "60"
    approx_loss: str = ""
    local_v2_path: str = "outputs/llama_lora_zh_v2/"
    local_v3_path: str = "outputs/llama_lora_zh_v3/"
    hparams_ref: str = (
        "续训推荐：挂载 v2 适配器 + v3 数据，max_steps=60，lr=1e-4～2e-4，"
        "r=16,alpha=16,batch=2,accum=4,4bit,seq=2048。"
        "全量重训则从基座重新挂 LoRA，max_steps=120。"
    )
    g1_output: str = (
        "【粘贴 Holdout#0 / 产物清单题的 Response】\n"
        "合格须点到：适配器权重、adapter_config、日志/超参、评测记录；禁止「落地建议」套话。"
    )
    g2_output: str = "【粘贴 Holdout#10 Prompt/LoRA/全量 的 Response】"
    g3_output: str = "【粘贴 Holdout#25 QLoRA 判断题的 Response】"
    g4_note: str = (
        "抽检任意 5 题：含固定长套话的题数 ≤1 才勾 G4。"
        "记录题号与是否出现「落地建议/把该知识点对应到实验日志」。"
    )
    vs_v2_summary: str = (
        "相对 v2：数据去掉统一「落地建议」垫长；产物题是否过 G1；"
        "概念题是否保持；是否采用 v3 作为交付默认。"
    )
    interview_talk: str = (
        "v2 证明数据扩量有效但不均匀，产物题被模板套话污染；"
        "我清洗生成器、产出 v3 数据并再训 llama_lora_zh_v3，"
        "用固定 Holdout 门禁 G1～G5 验收，而不是只看 loss。"
    )
    note: str = (
        "Kaggle Dataset 名：zero-ds-v3。先确认本机已留档 llama_lora_zh_v2，"
        "再训只保存 llama_lora_zh_v3，禁止覆盖 v2。"
    )

    confirmed_at: str | None = None
    validated_at: str | None = None
    ok: bool = False


class EngineeringConfirmRequest(BaseModel):
    archived_v2: bool = False
    uploaded_v3_data: bool = False
    trained_v3: bool = False
    saved_adapter_v3: bool = False
    gate_g1: bool = False
    gate_g2: bool = False
    gate_g3: bool = False
    gate_g4: bool = False
    gate_g5: bool = False

    kaggle_dataset: str = "zero-ds-v3"
    dataset_path: str = "datasets/sample_alpaca_zh_v3.jsonl"
    cloud_data_hint: str = ""
    train_mode: str = "continue_from_v2"
    adapter_name: str = "llama_lora_zh_v3"
    max_steps: str = "60"
    approx_loss: str = ""
    local_v2_path: str = "outputs/llama_lora_zh_v2/"
    local_v3_path: str = "outputs/llama_lora_zh_v3/"
    hparams_ref: str = ""
    g1_output: str = ""
    g2_output: str = ""
    g3_output: str = ""
    g4_note: str = ""
    vs_v2_summary: str = ""
    interview_talk: str = ""
    note: str = ""
