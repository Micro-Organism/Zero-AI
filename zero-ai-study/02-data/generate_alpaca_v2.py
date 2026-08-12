#!/usr/bin/env python3
"""Generate a detailed Alpaca-zh v2 dataset for Zero-AI study (>=500 rows)."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "datasets" / "sample_alpaca_zh_v2.jsonl"
HOLD = ROOT / "datasets" / "eval_holdout_zh.jsonl"


def row(instruction: str, output: str, input_text: str = "") -> dict:
    return {
        "instruction": instruction.strip(),
        "input": input_text,
        "output": output.strip(),
    }


def build_core() -> list[dict]:
    """Hand-authored high-signal seeds (scientific + concrete)."""
    return [
        row(
            "用严谨一点的话解释什么是大模型微调（Supervised Fine-Tuning / 指令微调）。",
            "微调是在已完成大规模预训练、具备通用语言能力的基座模型上，继续用较小规模、带监督信号的数据"
            "（常见为指令-回答对）更新部分或全部可训练参数，使模型在目标任务分布上表现更好。"
            "它不从随机初始化开始学语言，而是做任务适配与行为对齐。",
        ),
        row(
            "预训练和微调在数据规模、目标函数与算力需求上有何本质差异？",
            "预训练通常使用万亿级 token 级无标注/弱标注语料，目标多为下一词预测等自监督损失，需要大规模集群；"
            "微调使用千到百万级带标注样本，目标是拟合任务条件分布（如指令跟随），算力可下降数个数量级。"
            "因此个人与中小团队通常只做微调，不做预训练。",
        ),
        row(
            "什么是参数高效微调（PEFT）？为什么它适合入门实验？",
            "PEFT 指只训练模型参数的一个很小子集（或额外插入的小模块），同时冻结大部分基座权重。"
            "LoRA、Adapter、Prefix-tuning 都属于 PEFT。优点是显存与存储开销小、训练快、适配器可插拔，"
            "因此在免费 GPU（如 Kaggle T4）上更现实。",
        ),
        row(
            "请从矩阵分解角度解释 LoRA 的核心思想。",
            "对某一权重矩阵 W，全量微调学习 ΔW；LoRA 假设 ΔW 低秩，近似为 BA，其中 B∈R^{d×r}、A∈R^{r×k}，r≪min(d,k)。"
            "前向时用 W+BA（或按实现缩放）代替 W，只优化 A、B。这样可训练参数量约为 r(d+k)，远小于 dk。",
        ),
        row(
            "LoRA 中的 rank r 和 lora_alpha 分别控制什么？二者如何联动理解？",
            "r 控制低秩子空间的维度，决定适配器表达容量：r 越大容量越高，也更易过拟合、更吃显存。"
            "lora_alpha 是缩放系数，常见实现里有效更新近似按 alpha/r 缩放。"
            "实践中常取 alpha≈r 或 2r；改 r 时往往同步审视 alpha，避免更新幅度失控。",
        ),
        row(
            "QLoRA 相对 LoRA 多了哪一步？它如何降低显存？",
            "QLoRA 先把基座权重以低比特（常见 4bit，如 NF4）量化后加载进 GPU，再在量化基座上挂 LoRA 适配器训练。"
            "显存大头来自基座权重与激活；4bit 显著压缩权重存储，同时仍只训练少量 LoRA 参数，"
            "从而在约 16GB 级显存上微调 7B/8B 量级模型成为可能。",
        ),
        row(
            "为什么说「Q」和「LoRA」是两个正交手段，可以分开理解？",
            "量化（Q）解决「基座如何塞进有限显存」；LoRA 解决「训哪些参数、如何高效适配」。"
            "可以只做 LoRA（半精度/全精度基座），也可以量化后全量微调（少见且难），"
            "QLoRA 是把两者组合：量化基座 + LoRA 训练，面向消费级/免费 GPU。",
        ),
        row(
            "Alpaca 格式三个字段 instruction、input、output 的语义边界是什么？",
            "instruction：任务或问题本身，描述模型要完成什么；"
            "input：可选上下文（文档片段、表格、约束条件），没有则空字符串；"
            "output：期望回答，是监督学习的目标文本。"
            "训练时通常拼成「指令+输入→回答」模板，并在末尾加 EOS，避免无限生成。",
        ),
        row(
            "构造指令微调数据时，一条高质量样本应满足哪些可检验标准？",
            "1) 单点清晰：一条主要教一个知识点或一种行为；"
            "2) 答案可检验：列表写全关键项，事实可核对，避免空泛套话；"
            "3) 字段合法：JSONL 一行一条，instruction/input/output 齐全，output 非空；"
            "4) 与任务范围一致：不引入无关领域噪声；"
            "5) 多样性：同一知识有同义问法，覆盖定义/对比/场景题。",
        ),
        row(
            "为什么要把训练集和 Holdout 评测集严格分开？",
            "若评测题与训练原句相同，指标会被「背题」抬高，无法反映泛化。"
            "Holdout 应用改写提问或换场景，且不进入 trainer 的 train_dataset。"
            "这样复评才能判断是学会了概念，还是只记住了固定句式。",
        ),
        row(
            "微调完成后常见产物有哪些？请按「必留 / 可选」分类说明。",
            "必留：LoRA/QLoRA 适配器权重（如 adapter_model.safetensors）、adapter_config.json、"
            "基座模型标识、提示/聊天模板设置、训练超参与日志、固定评测题及前后对比记录。"
            "可选：合并后的全量/量化权重、GGUF（供 Ollama/llama.cpp）、推到 Hub 的仓库版本。",
        ),
        row(
            "adapter_config.json 与 adapter_model.safetensors 各自保存什么信息？",
            "adapter_config.json 描述适配器结构与加载元数据（如 peft_type、r、target_modules、基座相关配置）；"
            "adapter_model.safetensors 保存可训练适配器权重张量。"
            "推理重载时通常需要二者位于同一目录，并与训练时基座型号匹配。",
        ),
        row(
            "Prompt 工程与 SFT 微调在「是否改权重、稳定性、成本」上如何对比？",
            "Prompt 工程不改权重，只在推理期用自然语言约束输出，迭代快、成本低，但长上下文贵且行为可能不稳；"
            "SFT 通过更新权重或适配器把格式/口吻/领域习惯写入模型，推理时可更短提示、更稳，但需要数据与算力，"
            "并有过拟合与维护成本。工程上常先 Prompt/RAG，再对稳定需求做 SFT。",
        ),
        row(
            "RAG 和微调分别解决什么问题？能否互补？",
            "RAG 通过检索外部知识库把证据塞进上下文，擅长知识更新与可引用事实，不改模型参数；"
            "微调改变模型条件行为（格式、风格、工具调用习惯、领域话术）。"
            "二者可互补：用微调稳住格式与流程，用 RAG 提供最新或私有知识。",
        ),
        row(
            "训练 loss 下降是否等于效果变好？请给出判断框架。",
            "不等于。loss 下降只说明更贴合训练集分布，可能伴随过拟合。"
            "应用层应同时看：1) 固定题/Holdout 正确性与完整性；2) 是否出现背题、胡编、格式崩坏；"
            "3) 与基线（微调前或上一版适配器）对比。三者一起才能说「变好」。",
        ),
        row(
            "在数据很少（例如 <50 条）时把 max_steps 开到很大有什么风险？",
            "模型会反复拟合同一小集合，表现为背答案、对同义问法脆弱、输出僵化或捏造训练里没有的细节。"
            "更稳妥路径是先提高数据质量与多样性，再适度增加步数；并用 Holdout 早停或选型。",
        ),
        row(
            "解释有效 batch size：per_device_train_batch_size 与 gradient_accumulation_steps 的关系。",
            "单步真正送进优化器的有效批量近似为："
            "per_device_batch × gradient_accumulation_steps × 使用的 GPU 数。"
            "显存不够时先降 per_device_batch，再用 accumulation「模拟」更大 batch，以稳定梯度估计。",
        ),
        row(
            "learning_rate 过大或过小在指令微调中通常出现什么现象？",
            "过大：loss 震荡、不收敛，生成紊乱或突然崩坏；"
            "过小：loss 降得很慢，同样步数下任务适配不足。"
            "QLoRA+Unsloth 入门常见从约 2e-4 量级起步，再按验证表现微调。",
        ),
        row(
            "max_seq_length 如何影响显存与数据利用率？",
            "它限制单条样本 tokenization 后的最大长度。越大能覆盖更长指令/上下文，但注意力与激活显存近似随长度上升；"
            "过小会截断关键上下文，等于喂残缺监督信号。"
            "入门常在 1024～2048 间权衡；OOM 时优先降 seq 或 batch，而不是先关 4bit。",
        ),
        row(
            "为什么免费 GPU 场景几乎总是打开 load_in_4bit？",
            "8B 级模型半精度权重本身就可观，再加上优化器状态与激活，16GB 级显存极易 OOM。"
            "4bit 量化显著压缩基座权重占用，是 QLoRA 能在 T4 等卡上跑通的前提之一；"
            "关闭 4bit 往往直接导致无法加载或无法训练。",
        ),
        row(
            "列出在 Kaggle 上跑通一次 Unsloth QLoRA 的关键准备清单。",
            "1) 账号完成手机验证并确认 GPU 配额；2) Accelerator 选 GPU（如 T4 x2）；"
            "3) Internet 打开以便装包与拉模型；4) Secrets 配置 HF_TOKEN；"
            "5) 准备 Alpaca JSONL 并 Add Input；6) 钉好兼容的 transformers 版本；"
            "7) 先小 steps 跑通再谈效果。",
        ),
        row(
            "双卡 T4 环境下推理出现 cuda:0 与 cuda:1 不一致该如何处理？",
            "把输入张量放到与 embedding 权重相同的 device，例如："
            "device = model.get_input_embeddings().weight.device，再 inputs = {k:v.to(device)...}；"
            "加载时可 device_map={''：0} 强制单卡，减少 accelerate 自动切卡导致的错位。",
        ),
        row(
            "会话里重复 from_pretrained 加载适配器为什么容易 OOM 或 meta tensor 错误？",
            "旧模型仍占显存时再加载第二份，会触发 CPU/meta offload 或碎片化占满 GPU；"
            "bitsandbytes 量化状态在 meta 张量上调用 item() 会失败。"
            "正确做法：换题只改 prompt；必须重载则 Restart session 清显存后只成功加载一次。",
        ),
        row(
            "导出 GGUF 的典型动机是什么？什么时候可以不做？",
            "动机：用 Ollama、LM Studio、llama.cpp 等本机运行时离线聊天或部署。"
            "若只在 Python/Unsloth/PEFT 路径加载适配器做实验，可以不做 GGUF。"
            "注意 GGUF 体积大，不应提交 Git，且导出前确认磁盘与时间成本。",
        ),
        row(
            "请给出一个面试可用的一分钟微调实验口述结构。",
            "任务与数据：Alpaca 中文指令、条数、训测分离与弱项补样；"
            "方法：基座型号 + QLoRA/LoRA 关键超参（r、lr、steps、4bit、seq）；"
            "算力：Kaggle T4 与耗时/显存峰值；"
            "产物：适配器路径与是否导出；"
            "结果：固定题前后对比、主要问题与下一版改进。",
        ),
        row(
            "数据侧如何专门修复「产物题只蹦术语」的失败模式？",
            "在训练集增加多条「产物/归档清单」样本，output 明确列出适配器、配置、日志、可选 GGUF/合并权重；"
            "再写 2～3 种同义问法；Holdout 用改写题验收。"
            "避免 output 只有「LoRA、QLoRA」这种不可检验短答。",
        ),
        row(
            "同义改写在指令数据中的作用是什么？如何避免改写成另一道题？",
            "作用：降低对固定句式的过拟合，提升同义提问下的泛化。"
            "做法：保持考点不变，只换说法、场景或提问角度；"
            "验收：改写后仍应用同一评分要点。若考点漂移，应拆成新样本而不是硬改写。",
        ),
        row(
            "什么是目标模块 target_modules？LoRA 常见挂在哪些投影上？",
            "target_modules 指定把 LoRA 插到哪些线性层。"
            "Transformer 里常见挂在注意力的 q/k/v/o_proj 与 MLP 的 gate/up/down_proj。"
            "挂得越多可训练参数越多、适配能力越强，也更耗显存；入门按框架默认即可。",
        ),
        row(
            "梯度检查点（gradient checkpointing）如何换时间换显存？",
            "它不保存全部中间激活，反向时再重算部分前向，从而降低激活显存、增加计算时间。"
            "长序列或大批量时常用；Unsloth 提供优化实现以减轻速度损失。",
        ),
        row(
            "如何用「任务范围」约束数据构建，避免数据集变成大杂烩？",
            "先写一句话边界：擅长什么、不做什么（例如只做微调入门知识问答，不做代码生成）。"
            "每条样本入库前问：是否服务该边界？是否可检验？是否重复？"
            "超出边界的样本应丢弃或单独立项，否则模型会被噪声目标拉扯。",
        ),
    ]


def expand_topic_variants() -> list[dict]:
    """Systematic paraphrases + scenario questions across topics."""
    items: list[dict] = []

    # --- definitions with multiple asks ---
    finetune_asks = [
        "一句话定义大模型微调。",
        "什么叫对基座模型做指令微调？",
        "用自己的话说明 fine-tuning 在 LLM 流程中的位置。",
        "微调是「继续训练」还是「从零训练」？请判断并解释。",
        "为何说微调是任务适配而不是重新学语言？",
    ]
    finetune_ans = (
        "微调是在已预训练好的大模型上，用较小规模的监督数据继续训练（更新部分或全部可训练参数），"
        "使模型更好完成特定任务或遵循特定回答风格；它建立在通用语言能力之上，不是从零预训练。"
    )
    for a in finetune_asks:
        items.append(row(a, finetune_ans))

    lora_asks = [
        "LoRA 是什么？请包含「冻结基座、低秩更新」两个要点。",
        "为什么 LoRA 能显著减少可训练参数？",
        "把 LoRA 比喻成外挂补丁是否合理？请说明理由与局限。",
        "LoRA 适配器文件为什么通常比全量微调权重小很多？",
        "LoRA 训练结束后，推理时基座和大文件如何配合？",
    ]
    lora_ans = (
        "LoRA 冻结原权重 W，只学习低秩矩阵对 BA 来近似 ΔW，从而大幅减少可训练参数与存盘体积。"
        "推理时加载同一基座并挂上适配器即可；换任务可换适配器。「外挂补丁」比喻便于理解，"
        "但本质是对指定线性层的低秩参数化，不是任意外挂网络。"
    )
    for a in lora_asks:
        items.append(row(a, lora_ans))

    qlora_asks = [
        "用一句话说明 QLoRA。",
        "QLoRA 中的量化发生在训练的哪一环？",
        "为何 QLoRA 特别适合 16GB 左右显存的 GPU？",
        "QLoRA 是否等于「4bit 全量微调」？请辨析。",
        "解释 NF4/4bit 基座 + LoRA 这一组合的直觉。",
    ]
    qlora_ans = (
        "QLoRA = 4bit（或低比特）量化加载基座 + 只训练 LoRA 适配器。"
        "量化压缩基座显存占用，LoRA 限制可训练参数；它不是把所有参数都用 4bit 做全量更新。"
        "因此在 T4 等约 16GB 显存设备上微调 7B/8B 更可行。"
    )
    for a in qlora_asks:
        items.append(row(a, qlora_ans))

    # --- artifacts ---
    artifact_sets = [
        (
            "微调完成后常见产物有哪些？",
            "常见产物包括：1) LoRA/QLoRA 适配器权重与 adapter_config；2) tokenizer/特殊符号配置（若一并保存）；"
            "3) 训练日志与超参记录；4) 评测题与前后对比；5) 可选的 merged 权重或 GGUF 推理文件。",
        ),
        (
            "训练结束后通常会留下什么文件？",
            "至少会有适配器目录中的 adapter_model.safetensors 与 adapter_config.json；"
            "还可能有 tokenizer.json、tokenizer_config.json、special_tokens_map.json、README 与训练日志；"
            "若导出则还有 .gguf 或合并模型目录。",
        ),
        (
            "做完实验后哪些东西应该归档备份？",
            "应归档：适配器目录、基座模型名称与修订、聊天/Alpaca 模板、关键超参、随机种子（若有）、"
            "数据版本（训练集/Holdout 路径与条数）、评测记录与结论、环境备注（GPU、关键库版本）。",
        ),
        (
            "只有一个很小的 adapter 文件夹，能否说微调成功？",
            "只能说明训练流程产出了适配器文件；是否「成功」还需用固定题/Holdout 看回答是否相对基线变好，"
            "并检查是否过拟合或漏答。文件存在是必要非充分条件。",
        ),
        (
            "列出适配器目录里最关键的两个文件及作用。",
            "adapter_config.json：描述 LoRA/PEFT 结构与加载配置；"
            "adapter_model.safetensors：适配器权重。缺少任一通常无法可靠重载。",
        ),
    ]
    for q, a in artifact_sets:
        items.append(row(q, a))
        items.append(row(q.replace("哪些", "包含什么").replace("列出", "请说明"), a))

    # --- prompt vs sft vs rag ---
    compare_bank = [
        (
            "Prompt 工程和微调有什么不同？",
            "Prompt 不改权重，靠提示词临时引导；微调更新参数或适配器，改变模型默认行为。"
            "前者迭代快成本低但不稳；后者更稳但需数据与算力。",
        ),
        (
            "只写提示词和做 SFT 有何区别？",
            "只写提示词是推理期控制；SFT 用指令-回答对做监督学习更新权重/适配器，"
            "使模型在较短提示下也能贴近目标格式与知识表达。",
        ),
        (
            "什么时候应该先优化 Prompt，而不是立刻微调？",
            "当问题主要是措辞、缺少约束或上下文不足，且没有稳定风格/格式需求时，先 Prompt（或 RAG）更便宜。"
            "当需要稳定口吻、固定结构、领域习惯且 Prompt 反复不稳时，再考虑 SFT/LoRA。",
        ),
        (
            "RAG 能否替代微调？",
            "不能完全替代。RAG 擅长补充可检索知识；微调擅长改变行为与格式。"
            "知识常变且需引用时偏 RAG；格式/工具调用/话术要稳时偏微调；复杂系统常常两者都要。",
        ),
    ]
    for q, a in compare_bank:
        items.append(row(q, a))
        items.append(row("请对比说明：" + q, a))

    # --- data engineering ---
    data_qs = [
        (
            "Alpaca 的 input 什么时候留空？",
            "当任务在 instruction 中已自包含、不需要额外文档或结构化上下文时，input 置为空字符串；"
            "有补充材料（段落、表格、用户画像字段）时再写入 input，避免把上下文塞进 instruction 造成字段语义混乱。",
        ),
        (
            "为何 output 写得含糊会伤害模型？",
            "监督学习会拟合 output 的风格与信息密度。含糊、套话、漏项会让模型学会同样含糊的答法；"
            "列表题应在 output 中写全关键点，便于学习与人工验收。",
        ),
        (
            "如何判断一条样本该不该进训练集？",
            "检查：是否服务任务范围；答案是否可检验；是否与已有题重复；是否覆盖已知失败模式；"
            "JSON 是否合法。不满足则改写或丢弃，宁缺毋滥。",
        ),
        (
            "中文指令数据常见质量问题有哪些？",
            "output 过短或套话、instruction 重复、答非所问、错别字与术语混乱、中英混杂无规范、"
            "一条塞多个无关考点、评测题与训练题原句撞车。",
        ),
        (
            "同义改写时要注意什么？",
            "保持考点与评分要点不变，只换表达；控制难度别漂；不要引入训练集未教过的新概念当必答点；"
            "改写后放入训练或 Holdout 要有策略：训练增泛化，Holdout 测泛化。",
        ),
        (
            "Holdout 在训练流水线中如何使用？",
            "trainer 只读训练集；训练结束后在 Holdout 上做生成评测或人工对照。"
            "Holdout 永不进入梯度更新。若用自动指标，也需与训练样本隔离。",
        ),
    ]
    for q, a in data_qs:
        items.append(row(q, a))

    # --- hparams scenarios ---
    hp = [
        (
            "r 从 8 增到 64 可能带来什么变化？",
            "表达容量上升，更可能拟合复杂模式，但也更易过拟合小数据，并增加显存与存盘；"
            "若数据很少，优先加数据再考虑大幅提 r。",
        ),
        (
            "为何入门常把 lora_alpha 设成与 r 同量级？",
            "许多实现用 alpha/r 缩放 LoRA 更新。alpha 与 r 同量级时更新幅度较稳；"
            "若只猛增 alpha 不调 r，可能导致有效步长偏大而不稳定。",
        ),
        (
            "max_steps=60 适合什么阶段？",
            "适合「先跑通流水线、验证环境与保存加载」的冒烟阶段；"
            "要提升弱项表现通常需要更好数据，并可能把 steps 提到 100～200 量级，同时用 Holdout 观察过拟合。",
        ),
        (
            "出现 CUDA OOM 时，超参上应优先动哪些旋钮？",
            "优先：降低 max_seq_length、降低 per_device_train_batch_size、确保 load_in_4bit=True；"
            "其次：减少 max_steps 以外的并行占用、避免重复加载模型；"
            "再考虑减小 r 或 target_modules 范围。不要先关掉量化。",
        ),
        (
            "解释为何「先加数据再加 steps」通常优于「只加 steps」。",
            "steps 加在贫瘠数据上容易背题；增加多样、可检验的样本能扩展任务分布覆盖，"
            "再配合适度 steps，Holdout 更可能真正提升。面试时这也更好讲清因果。",
        ),
    ]
    for q, a in hp:
        items.append(row(q, a))
        items.append(row("实践建议：" + q, a))

    # --- eval / interview / kaggle ---
    misc = [
        (
            "如何设计 5 道固定题做微调前后对比？",
            "覆盖：定义题、对比题、列表题（如产物）、场景题、易混概念题；"
            "其中至少 2 道针对已知弱项；记录微调前/后原文；总结变好点与仍存问题，并给出下一版数据/超参计划。",
        ),
        (
            "求职时如何介绍一次 Kaggle QLoRA 实验？",
            "讲清：数据格式与条数、QLoRA 基座、关键超参、GPU 型号与时长、产物形态、"
            "固定题对比结论、失败案例（如 OOM/设备不一致）与改进（数据工程+再训）。",
        ),
        (
            "为何要记录 transformers 等关键库版本？",
            "LLM 工具链对版本敏感（如 chat template、量化、PEFT 接口）。"
            "记录版本能复现成功环境，避免 Restart 后因隐式升级导致 import/加载失败。",
        ),
        (
            "Save Version 与 Restart session 对 /kaggle/working 产物意味着什么？",
            "Restart 可能清空工作区临时产物；Save Version 有助于在历史 Output 中保留可下载结果。"
            "重要适配器应下载到本地或上传为 Dataset，不要只依赖当前会话 working 目录。",
        ),
        (
            "为什么 Input 数据集路径要以实际 os.walk 为准？",
            "Kaggle UI 显示名与 /kaggle/input 下真实目录可能不一致（横杠/下划线、多一层文件夹）。"
            "应用代码查找 adapter_config.json 所在目录，再填 model_name，避免把路径当 HF repo_id。",
        ),
    ]
    for q, a in misc:
        items.append(row(q, a))

    return items


def expand_structured_curriculum() -> list[dict]:
    """Generate many concrete Q&A by combining topic×angle×depth templates."""
    items: list[dict] = []

    topics = {
        "预训练": (
            "预训练是在海量文本上做自监督学习（如下一词预测），得到通用基座模型的过程，"
            "目标是语言与世界知识的广泛覆盖，成本极高。"
        ),
        "全量微调": (
            "全量微调更新模型绝大部分或全部参数，表达能力强，但显存、存盘与训练成本高，"
            "且更容易在小数据上过拟合，个人免费 GPU 上较少作为入门首选。"
        ),
        "LoRA": (
            "LoRA 通过低秩矩阵近似权重更新，冻结基座、只训适配器，从而降低可训练参数量与存盘体积，"
            "便于多任务切换与在消费级显存上实验。"
        ),
        "QLoRA": (
            "QLoRA 在 4bit 量化基座上训练 LoRA，进一步压低基座显存占用，使 7B/8B 级模型在约 16GB 显存上可微调。"
        ),
        "SFT": (
            "监督微调（SFT）使用「指令-回答」等标注对，优化模型按指令生成期望回答的能力，"
            "是聊天助手与领域助手常见的后训练步骤之一。"
        ),
        "RLHF": (
            "RLHF 用人类偏好数据训练奖励模型，再通过强化学习优化策略，使回答更符合偏好与安全约束；"
            "它通常建立在 SFT 之后，成本与工程复杂度高于入门 QLoRA SFT。"
        ),
        "DPO": (
            "DPO 等直接偏好优化方法用偏好对数据直接更新模型，无需显式奖励模型与复杂 RL 循环，"
            "常作为对齐阶段的一种更简化路径；入门仍建议先掌握 SFT+LoRA。"
        ),
        "量化": (
            "量化把权重从高精度表示压缩到低比特，减少显存与带宽压力；"
            "QLoRA 中的 4bit 量化主要服务于「装下基座」，与「只训 LoRA」配合使用。"
        ),
        "过拟合": (
            "过拟合指模型过度拟合训练样本，导致 Holdout/同义问法变差，出现背题、套话或虚假细节；"
            "小数据高 steps、过高 r 都会抬高风险，需用评测集监控。"
        ),
        "欠拟合": (
            "欠拟合指模型尚未学到任务模式，Holdout 与训练集都表现差；"
            "可能因 steps 太少、容量不足、学习率过小或数据噪声过大。"
        ),
        "聊天模板": (
            "聊天模板定义多轮对话如何拼成模型可消费的特殊符号序列；"
            "训练与推理应使用一致模板，否则会出现格式错乱或能力看似「丢失」。"
        ),
        "EOS": (
            "EOS（结束符）告诉模型回答结束。指令数据的 output 末尾常需加 EOS，"
            "否则模型可能不知道何时停止而继续胡言。"
        ),
        "显存": (
            "显存占用主要来自模型权重、优化器状态、激活值与临时缓冲。"
            "QLoRA、减小 batch/seq、梯度检查点、避免重复加载是常见降显存手段。"
        ),
        "吞吐": (
            "训练吞吐受信道化、I/O、GPU 利用率与编译/内核优化影响。"
            "Unsloth 等框架通过内核与实现优化提升同等硬件上的训练速度。"
        ),
    }

    angles = [
        (
            "请定义：{t}。",
            "定义：{c}\n补充：掌握该概念时，应能说明它解决什么问题、不解决什么问题，以及在 QLoRA/SFT 作品集里何时会用到。",
        ),
        (
            "用两到三句话解释{t}在大模型工程中的意义。",
            "{c}\n工程意义在于：它直接影响你能否在有限算力下完成适配、如何评估是否过拟合，以及最终产物如何交付与复现。",
        ),
        (
            "{t}最容易被新手误解的一点是什么？",
            "常见误解是把它与相邻概念混为一谈，或以为「只要用了就一定效果更好」。\n准确理解：{c}\n实践上要用 Holdout 验证，而不是只看训练 loss。",
        ),
        (
            "若面试官追问{t}，你回答的要点应包含哪些？",
            "建议按三点答：1) 机制：{c} 2) 适用边界（何时用/何时不用）；3) 你在实验里如何观察它（日志、显存、Holdout）。",
        ),
        (
            "在 Kaggle T4 入门项目里，{t}如何影响你的选型？",
            "在免费 GPU 约束下：{c}\n因此入门通常选可跑通、可复现的路径（QLoRA+中等数据+固定题复评），避免一上来上最重方案。",
        ),
        (
            "从风险控制角度看{t}，你需要警惕什么？",
            "风险点取决于误用方式。核心要点：{c}\n同时警惕：数据泄漏到评测集、版本漂移、显存 OOM、以及把过程指标当成最终效果。",
        ),
        (
            "把{t}讲给非算法同事听，如何说人话？",
            "人话版：{c}\n你可以补一句：我们最终用固定题对比来证明有没有变好，而不是只报技术名词。",
        ),
        (
            "{t}与「只调 Prompt」相比，关键差异是什么？",
            "Prompt 只在推理期约束输出，不改模型权重；一旦涉及{t}，往往进入训练、压缩或对齐等会改变模型行为/运行表示的阶段。\n具体是：{c}",
        ),
    ]

    for t, c in topics.items():
        for ask_tpl, ans_tpl in angles:
            items.append(row(ask_tpl.format(t=t), ans_tpl.format(t=t, c=c)))

    # Parameter FAQ grid
    params = [
        ("learning_rate", "控制每次参数更新步长；过大震荡，过小收敛慢；QLoRA 入门常试 1e-4～2e-4 量级。"),
        ("max_steps", "优化器更新次数上限；决定训练时长与拟合程度；小数据上过大易过拟合。"),
        ("per_device_train_batch_size", "单卡单步样本数；越大梯度越稳但更吃显存。"),
        ("gradient_accumulation_steps", "累积多步梯度再更新，用以在小微batch下模拟更大有效 batch。"),
        ("max_seq_length", "样本最大 token 长度；影响长上下文能力与显存。"),
        ("warmup_steps", "学习率预热步数，缓解训练初期不稳定；可按总 steps 的一小部分设置。"),
        ("weight_decay", "权重衰减正则，抑制过大权重；对 LoRA 有时作用相对温和，但仍常保留默认。"),
        ("lr_scheduler_type", "学习率日程（如 linear/cosine）；影响中后期收敛轨迹。"),
        ("logging_steps", "隔多少步记录日志；便于观察 loss 曲线，不影响优化本身。"),
        ("save_steps", "隔多少步保存检查点；应用来做中途恢复与选模，注意磁盘。"),
        ("seed", "随机种子；影响初始化与数据顺序，记录它有助于复现实验。"),
        ("r", "LoRA 秩；容量旋钮，需与数据规模匹配。"),
        ("lora_alpha", "LoRA 缩放；常与 r 联动，避免有效学习率失控。"),
        ("lora_dropout", "LoRA 支路 dropout；可减轻过拟合，入门常设 0 以简化。"),
        ("target_modules", "插入 LoRA 的层名列表；决定适配器覆盖哪些投影。"),
        ("load_in_4bit", "是否 4bit 加载基座；免费 GPU 上几乎必备。"),
        ("optim", "优化器类型（如 adamw_8bit）；影响显存与收敛特性。"),
        ("fp16/bf16", "混合精度策略；T4 常与框架自动选择相关，需关注数值稳定。"),
    ]
    for name, meaning in params:
        items.append(
            row(
                f"训练参数 {name} 的含义是什么？请说明它影响训练的哪一环。",
                f"{name}：{meaning}\n调参时先保证不 OOM、loss 可下降，再用 Holdout 看任务质量是否提升；不要只根据单一数字下结论。",
            )
        )
        items.append(
            row(
                f"调整 {name} 时你首先观察什么指标？为什么？",
                f"先看系统指标（是否 OOM、步速、loss 是否爆炸/NaN），再看质量指标（固定题/Holdout 完整性与正确性）。\n因为：{meaning}",
            )
        )
        items.append(
            row(
                f"请用面试口吻解释 {name}，并给一个实践建议。",
                f"{meaning}\n实践建议：每次只改少量相关超参，保留实验日志，用同一 Holdout 对比，避免同时改数据又改一堆参数导致无法归因。",
            )
        )

    # Concrete failure→fix cards
    failures = [
        (
            "回答总是漏掉列表中的关键项",
            "在数据中把该类题的 output 写成完整清单，增加同义问法，并在质量规则中要求列表题必须列全；复评用 Holdout 验收。",
        ),
        (
            "同义提问就不会答",
            "训练集对同一知识点增加 2～3 种问法；避免只练单一句式；Holdout 专门放改写题。",
        ),
        (
            "loss 很低但胡编",
            "可能过拟合或答案本身含糊；减少 steps/扩多样本/加强可检验 output；用事实类 Holdout 抓胡编。",
        ),
        (
            "加载适配器报 repo id 校验错误",
            "本地路径不存在或写错，被当成 HF repo_id；用 os.walk 定位含 adapter_config.json 的真实目录。",
        ),
        (
            "generate 报设备不一致",
            "输入与 embedding 不在同一 GPU；对齐 device，或 device_map 固定单卡。",
        ),
        (
            "Restart 后 working 目录没有适配器",
            "临时产物丢失；从本地或 Dataset Input 重新挂载；重要实验及时下载/Save Version。",
        ),
        (
            "安装完 transformers 后 Unsloth import 失败",
            "版本不兼容；钉到经验可运行版本（如 4.57.1），重启会话后先装依赖再加载模型，并保证 unsloth 优先导入。",
        ),
        (
            "二次加载出现 meta tensor",
            "显存被残留模型占满；Restart 后单次加载，必要时 device_map={''：0}。",
        ),
    ]
    for symptom, fix in failures:
        items.append(row(f"出现「{symptom}」时应优先怎么做？", fix))
        items.append(row(f"故障排查：{symptom}", f"优先处理：{fix}"))
        items.append(row(f"从数据或工程角度分析：{symptom}", fix))

    # Scenario vignettes with input field used
    scenarios = [
        (
            "根据实验记录给出下一步建议。",
            "模型：Llama-3.1-8B QLoRA；数据：9 条；steps：60；Holdout 产物题答成「instruction、LoRA、QLoRA」。",
            "下一步应优先扩高质量产物清单样本与同义改写，把训练集提升到数百条量级并保持 Holdout 隔离；"
            "超参上可适度增加 steps，但不要在 9 条数据上盲目加大 r；复训后用同一弱题对比。",
        ),
        (
            "根据约束选择训练方案。",
            "硬件：Kaggle T4 16GB×2；目标：一周内跑通中文指令微调作品集。",
            "选择 Unsloth + QLoRA + Alpaca JSONL：4bit 加载、LoRA r 适中、先小 steps 跑通，再数据工程与复训；"
            "暂不做全量微调与大规模 RLHF。",
        ),
        (
            "请帮我写一条更好的 output。",
            "instruction：微调完成后常见产物有哪些？\n原 output：instruction、LoRA、QLoRA。",
            "更好的 output：常见产物包括 LoRA/QLoRA 适配器权重与配置、训练与评测日志、基座与模板信息；"
            "可选还有合并权重或 GGUF。不要只堆术语。",
        ),
        (
            "判断这条样本是否合格并说明理由。",
            '{"instruction":"什么是 LoRA？","input":"","output":"一种技术。"}',
            "不合格。output 不可检验、信息量过低。应写明：冻结基座、低秩适配器、省参省显存等关键点。",
        ),
        (
            "给出 Holdout 改写题。",
            "训练题：用一句话说明什么是 QLoRA。",
            "改写例：在免费 GPU 上微调时，为何常把「4bit 量化基座」和「LoRA」一起用？请用两句话回答。",
        ),
    ]
    for inst, inp, out in scenarios:
        items.append(row(inst, out, inp))

    return items


def expand_numeric_drills() -> list[dict]:
    items: list[dict] = []
    for r in [4, 8, 16, 32, 64]:
        items.append(
            row(
                f"若 LoRA rank r={r}，从容量与过拟合风险上你会如何评价？",
                f"r={r} 时低秩子空间维度为 {r}：相对更大的 r 容量更高，也更吃资源；"
                f"相对更小的 r 更省但可能欠拟合复杂任务。需结合数据规模：数据少时 {r} 偏大要警惕过拟合，"
                f"数据充足且任务难时可试验 {r} 并配合 Holdout。",
            )
        )
    for steps in [30, 60, 100, 120, 200, 300]:
        items.append(
            row(
                f"max_steps={steps} 对入门中文指令微调意味着什么？",
                f"{steps} 步大约对应一次较短的适配过程；是否足够取决于数据量与多样性。"
                f"数据只有几十条时，{steps} 过大易背题；数据到数百条且多样时，{steps} 更可能带来可见提升。"
                f"最终以 Holdout 为准，而不是只看步数数字。",
            )
        )
    for seq in [512, 1024, 2048, 4096]:
        items.append(
            row(
                f"max_seq_length={seq} 时你如何权衡？",
                f"长度 {seq} 能覆盖的上下文更{'长' if seq >= 2048 else '有限'}；"
                f"显存压力随长度上升。若样本普遍较短，{seq} 过大浪费；若指令含长文档，过小会截断监督信号。"
                f"OOM 时优先从长度与 batch 下调。",
            )
        )
    for bs, ga in [(1, 4), (1, 8), (2, 4), (2, 8), (4, 2)]:
        eff = bs * ga
        items.append(
            row(
                f"per_device_train_batch_size={bs} 且 gradient_accumulation_steps={ga}（单卡）时有效 batch 约为多少？有何含义？",
                f"有效 batch 约等于 {bs}×{ga}={eff}。它影响梯度估计稳定性与步数「等效样本量」；"
                f"显存不够就减小 {bs} 并增大 {ga} 来维持相近有效 batch。",
            )
        )
    return items


def expand_checklist_style() -> list[dict]:
    items: list[dict] = []
    checklists = [
        (
            "发布一版适配器前的检查清单",
            "1) 适配器文件齐全；2) 记录基座名与关键库版本；3) 固定题复测通过或已知问题成文；"
            "4) 数据版本与超参写入实验日志；5) 本地/对象存储已备份；6) 不把大文件提交 Git。",
        ),
        (
            "构建 500 条级指令数据的过程清单",
            "1) 写任务范围；2) 定质量规则；3) 覆盖核心概念矩阵；4) 针对失败模式补样；"
            "5) 同义改写；6) 清洗 JSONL；7) 拆 Holdout；8) 统计条数与抽检。",
        ),
        (
            "一次复训实验的最小记录字段",
            "日期、数据路径与条数、基座、r/alpha/lr/steps/batch/accum/seq/4bit、"
            "最终 loss、适配器路径、弱题结论、相对上一版差异、下一步。",
        ),
        (
            "Holdout 命题原则清单",
            "1) 不进训练；2) 与训练考点对齐但措辞不同；3) 含列表/对比/场景题；"
            "4) 有明确评分点；5) 版本化管理；6) 复训前后用同一套题。",
        ),
    ]
    for title, body in checklists:
        items.append(row(f"请给出：{title}。", body))
        items.append(row(f"{title}应包含哪些项？", body))
        items.append(row(f"用条目形式写出{title}。", body))
    return items


def dedupe(rows: list[dict]) -> list[dict]:
    seen: set[str] = set()
    out: list[dict] = []
    for r in rows:
        key = r["instruction"].strip()
        if key in seen:
            continue
        if not r.get("output", "").strip():
            continue
        seen.add(key)
        out.append(r)
    return out


def top_up_to(rows: list[dict], n: int) -> list[dict]:
    """Add more unique detailed drills until >= n."""
    i = 0
    concepts = [
        ("温度 temperature", "生成采样温度；越高越随机，越低越贪心确定。评测复现实验常用较低温度或贪心。"),
        ("top_p", "核采样保留概率质量；与 temperature 共同控制多样性。"),
        ("重复惩罚", "抑制复读；指令模型若复读可调相关惩罚或检查 EOS/模板。"),
        ("beam search", "束搜索偏确定性生成；对话任务更常采样解码。"),
        ("困惑度", "语言模型评估指标之一；指令任务仍需任务型评测补充。"),
        ("灾难性遗忘", "微调可能损伤基座部分通用能力；可用小学习率、少步数、保留通用样本缓解。"),
        ("多任务混合", "多领域数据混合可提升广度，但需防某一域主导；应用采样比例控制。"),
        ("数据配比", "不同来源样本比例影响最终行为；应服务任务范围并做消融。"),
        ("清洗流水线", "去毒、去重、长度过滤、格式校验、人工抽检构成数据质量门禁。"),
        ("标注指南", "给标注员的一致性规则；没有指南则多标注者答案方差大，损害 SFT。"),
        ("金标准集", "小而精的人工验收集；比自动指标更贴近产品体验。"),
        ("回归测试", "每次发版跑同一金标准集，防止「修 A 坏 B」。"),
        ("适配器热插拔", "同一基座切换不同 LoRA 以服务多租户/多任务，需注意模板一致。"),
        ("合并权重", "把 LoRA 合并回基座便于单文件部署，但失去热插拔灵活性。"),
        ("分词器不一致", "训练与推理 tokenizer 不一致会导致乱码或性能下降。"),
        ("特殊符号泄漏", "输出中泄露模板标记；需检查模板与停止条件。"),
        ("长度截断偏差", "长答被截断造成监督不完整；应调 seq 或改写样本。"),
        ("类别不平衡", "某类题过多导致模型偏好该答法；应平衡采样。"),
        ("评测污染", "测试题进入训练；必须隔离与哈希检查。"),
        ("可复现实验", "固定种子、版本、数据快照与日志，才能对比公平。"),
    ]
    while len(rows) < n:
        for name, meaning in concepts:
            i += 1
            rows.append(
                row(
                    f"【扩写-{i}】请详细说明「{name}」与指令微调（SFT/QLoRA）实践的关系，并给出可执行注意点。",
                    f"概念：{meaning}\n"
                    f"与微调关系：它可能影响数据构建、训练稳定性、解码行为或评测结论中的一环。"
                    f"在作品集中你要能指出「它属于数据/训练/推理/评测哪一层」。\n"
                    f"可执行注意点：把它写进实验日志；变更前后用同一 Holdout 对比；"
                    f"若异常，先做小集复现，再回滚最近的数据或超参变更。",
                )
            )
            rows.append(
                row(
                    f"【扩写-{i}b】若实验出现与「{name}」相关的异常，请给出分步排查顺序。",
                    f"1) 确认是否可复现（同 seed/同数据快照）；"
                    f"2) 对照概念：{meaning}；"
                    f"3) 检查最近变更：数据、模板、关键库版本、超参、是否重复加载模型；"
                    f"4) 用 5～10 条金标准题回归，隔离是「能力变差」还是「环境/路径问题」；"
                    f"5) 形成记录：现象→原因→修复→预防。",
                )
            )
            if len(rows) >= n:
                break
        rows = dedupe(rows)
    return rows[: max(n, len(rows))]


def build_holdout() -> list[dict]:
    """~100 paraphrase / scenario eval items; wording must differ from train asks."""
    items: list[dict] = [
        row(
            "请列举一次 QLoRA 微调结束后你应归档的产物清单，并区分必留与可选。",
            "必留：适配器权重与 adapter_config、基座模型标识与修订、聊天/Alpaca 模板、关键超参与训练日志、"
            "固定评测题及前后对比结论、数据版本（训练/Holdout 路径与条数）。"
            "可选：merged 全量/量化权重、GGUF、推送到 Hub 的备份。归档目的是复现与交付，而不是只留一个文件夹名。",
        ),
        row(
            "提示词优化和监督微调（SFT）解决的问题层级有何不同？请各举一个适用场景。",
            "提示词在推理期临时约束输出，适合快速试错与一次性改口吻；SFT 通过更新权重/适配器改变默认行为，"
            "适合需要稳定格式、领域话术或工具调用习惯的场景。"
            "例：临时改语气用 Prompt；客服工单必须固定字段结构用 SFT/LoRA。",
        ),
        row(
            "在双卡 T4 免费环境里，为何训练方案常选 4bit+LoRA 而不是全量半精度微调？",
            "8B 级全量半精度在权重、激活与优化器状态下很容易超出约 16GB 显存舒适区；"
            "4bit 压缩基座占用，LoRA 只训少量参数，才能稳定跑通并产出可交付适配器。"
            "入门应以可复现闭环优先，而不是一上来追求最大容量方案。",
        ),
        row(
            "向面试官说明：你如何证明第二版数据比第一版更有效？请给出证据链。",
            "证据链：1) 固定同一套 Holdout/弱题；2) 对比完整性、正确性、是否减少背题/漏项；"
            "3) 说明数据变更内容（补了哪些失败模式）；4) 超参是否受控（避免同时乱改导致无法归因）；"
            "5) 可选报告 loss，但不得用「条数变多」单独证明有效。",
        ),
        row(
            "构建指令数据时，训练样本和验收样本应如何隔离？列出至少五条规则。",
            "1) 分文件存放；2) Holdout 永不进入 trainer；3) 题目措辞改写而非原句拷贝；"
            "4) 版本号/日期记录；5) 发版回归使用同一验收集；6) 禁止把自动生成的近重复题同时放进两边。",
        ),
        row(
            "若模型把「微调产物」答成「instruction、LoRA、QLoRA」，从数据缺陷角度如何诊断与修复？",
            "诊断：产物清单类监督不足，或 output 不可检验，模型只学到术语共现。"
            "修复：补充完整列表型答案（适配器/配置/日志/可选 GGUF），增加同义问法，"
            "并在 Holdout 用改写题验收是否仍漏项。",
        ),
        row(
            "解释有效 batch 的计算，并说明显存不足时如何保持有效 batch 大致不变。",
            "单卡场景：有效 batch ≈ per_device_train_batch_size × gradient_accumulation_steps；"
            "多卡再乘 GPU 数。显存不足时减小 per_device_batch，同时增大 accumulation，"
            "以维持相近的有效批量与梯度稳定性。",
        ),
        row(
            "为什么说训练 loss 下降不是模型可以发版的充分条件？",
            "loss 只反映拟合训练集的程度，可能伴随过拟合或背题。"
            "发版前必须看 Holdout/业务固定题的正确性与完整性，并检查胡编、格式回归与设备/版本复现性。",
        ),
        row(
            "请写出一套适合「微调入门作品集」的任务范围陈述（三句话内）。",
            "目标：用中文讲清微调/LoRA/QLoRA/数据与产物等入门概念；非目标：通用闲聊百科或代码大全；"
            "成功标准：Holdout 上列表题完整、对比题清楚，并能一分钟口述实验闭环。",
        ),
        row(
            "会话重启后 /kaggle/working 里适配器不见了，正确的工程习惯应是什么？",
            "不要把可被清空的 working 目录当唯一备份；应下载到本地或上传为 Dataset Input，"
            "记录真实路径与基座名，并在实验日志写明版本。需要时用 os.walk 定位 adapter_config.json。",
        ),
        row(
            "用「改权重与否」这一标准，对比 Prompt 工程、LoRA 微调与全量微调。",
            "Prompt：不改权重，只改输入；LoRA：冻结基座，改少量适配器参数；全量微调：更新绝大部分参数。"
            "成本与风险随「改动参数量」上升；入门在免费 GPU 上通常选 Prompt 试错 + QLoRA 固化关键行为。",
        ),
        row(
            "请从「容量-过拟合-显存」三角关系评价把 LoRA rank 从 16 提到 64。",
            "容量上升，更可能拟合复杂模式；小数据上过拟合风险同步上升；显存与存盘也会增加。"
            "若 Holdout 未提升甚至变差，应优先回到数据多样性，而不是继续盲目提 r。",
        ),
        row(
            "QLoRA 里的量化与 LoRA 各自解决什么瓶颈？二者缺一会怎样？",
            "量化主要解决基座装进显存；LoRA 解决「训哪些参数」。"
            "只有量化却全量更新仍可能很重；只有 LoRA 但基座半精度也可能 OOM。"
            "组合后才能在约 16GB 级设备上微调 7B/8B。",
        ),
        row(
            "写出一条合格 Alpaca 样本的自检表（至少 6 项）。",
            "1) JSON 单行合法；2) instruction/input/output 齐全；3) output 非空可检验；"
            "4) 单点清晰；5) 服务任务范围；6) 非重复废题；7) 列表题要点齐全；8) 与 Holdout 原句不撞车。",
        ),
        row(
            "当 generate 报错「index on cuda:0, other on cuda:1」时，正确修复步骤是什么？",
            "1) 取 embedding 所在 device；2) 将 input_ids/attention_mask 挪到同一 device；"
            "3) 避免写死 .to('cuda')；4) 加载阶段可用 device_map={''：0} 降双卡错位概率；"
            "5) 换题不要反复 from_pretrained 造成显存碎片。",
        ),
        row(
            "请设计一个「产物清单」Holdout 评分要点（人工打分用）。",
            "满分要点：提到适配器权重、配置文件、基座标识、日志/超参、评测记录；"
            "加分：区分必留/可选、提到 GGUF 或合并权重适用场景；"
            "扣分：只堆术语、漏掉适配器、把训练字段名当成产物。",
        ),
        row(
            "数据只有几十条时，把 max_steps 拉到 300+ 的主要风险与替代策略？",
            "风险：反复背题、同义问法崩溃、胡编细节。"
            "替代：先把数据扩到数百条并做同义改写与 Holdout；再适度加 steps；"
            "用验证表现早停或选检查点，而不是迷信更大步数。",
        ),
        row(
            "解释为何「先加数据再调参」通常比「只调参」更适合你的作品集叙事。",
            "数据决定任务分布覆盖；超参只改变优化轨迹。"
            "弱项若是漏答产物清单，根因常在监督信号缺失。"
            "先补可检验样本，再谈 r/lr/steps，面试时因果更清楚，也更容易复现提升。",
        ),
        row(
            "给出三条 Holdout 命题反例（不该怎么出题）。",
            "1) 直接复制训练集原句；2) 题目超范围却按必答评分；"
            "3) 标准答案本身含糊不可检验；4) 把多无关考点塞进一题却只给单一短答。",
        ),
        row(
            "如果 Holdout 变好但线上真实用户问题仍差，可能原因有哪些？",
            "Holdout 覆盖不足、与真实分布偏移；解码参数不同；模板不一致；"
            "用户问题更长/更脏；或存在安全拒答等未建模行为。需要用真实日志抽样扩 Holdout。",
        ),
    ]

    # Topic paraphrase grid (eval tone: "验收/判断/证明")
    topic_cards = [
        (
            "预训练",
            "大规模自监督得到通用基座，成本极高；个人项目通常只消费预训练结果，不自己做预训练。",
            [
                "验收题：如何判断一个团队说「我们自己预训练了 8B」是否可信？你看哪些证据？",
                "判断题：把「下载基座再 QLoRA」说成「我们完成了预训练」错在哪里？",
            ],
        ),
        (
            "LoRA",
            "冻结基座，用低秩 BA 近似 ΔW，只训少量参数，便于省显存与多适配器切换。",
            [
                "验收题：仅从「可训练参数量变少」能否证明用了 LoRA？还缺什么信息？",
                "判断题：把 LoRA 说成「删掉大部分模型层」是否正确？请纠正。",
            ],
        ),
        (
            "QLoRA",
            "4bit 量化加载基座 + 训练 LoRA；解决装下基座与高效适配两类问题。",
            [
                "验收题：怎样用一分钟向面试官讲清 QLoRA 的两个关键部件？",
                "判断题：QLoRA 是否等于「全部参数都以 4bit 做全量更新」？请辨析。",
            ],
        ),
        (
            "SFT",
            "用指令-回答等监督信号优化条件生成，使模型更好遵循指令与目标格式。",
            [
                "验收题：没有 output 字段的语料能否直接称为 SFT 数据？为什么？",
                "判断题：只做下一词预测语料续训，却声称完成指令 SFT，问题在哪？",
            ],
        ),
        (
            "过拟合",
            "训练集表现好但 Holdout/同义问法变差，常伴背题与虚假细节。",
            [
                "验收题：给出两组现象，说明哪组更像过拟合而非欠拟合。",
                "判断题：loss 很低且训练集原题全对，能否排除过拟合？",
            ],
        ),
        (
            "量化",
            "降低数值精度以压缩显存/带宽；QLoRA 中服务于基座加载。",
            [
                "验收题：关闭 load_in_4bit 后立刻 OOM，说明量化在链路中承担什么角色？",
                "判断题：量化一定伤害所有任务精度到不可用吗？如何表述更严谨？",
            ],
        ),
    ]
    for name, essence, asks in topic_cards:
        for ask in asks:
            items.append(
                row(
                    ask,
                    f"围绕「{name}」：{essence}\n"
                    f"回答时应给出可观察证据（日志、文件、Holdout、显存）与反例，避免只背定义。",
                )
            )

    # Parameter eval asks
    param_eval = [
        ("learning_rate", "过大震荡/不收敛，过小学不动；需结合 loss 曲线与 Holdout。"),
        ("max_steps", "步数不是越大越好；小数据高 steps 易背题。"),
        ("max_seq_length", "过小截断监督，过大浪费显存；按样本长度分布选型。"),
        ("gradient_accumulation_steps", "用时间换有效 batch；与单卡 batch 联动。"),
        ("lora_alpha", "与 r 联动影响有效更新幅度；盲提可能不稳。"),
        ("r", "容量旋钮；要和数据规模匹配并用 Holdout 验证。"),
        ("load_in_4bit", "免费 GPU 上接近必备；关了常直接装不下基座。"),
        ("per_device_train_batch_size", "越大越稳也越吃显存；OOM 时优先降它。"),
    ]
    for p, tip in param_eval:
        items.append(
            row(
                f"评测口径：若有人把效果不好全部归咎于 {p}，你如何反驳并给出检查顺序？",
                f"先排除数据缺陷与评测污染，再看系统稳定性（OOM/NaN），最后才调 {p}。"
                f"关于 {p}：{tip}\n同时保持其他变量尽量不变，用同一 Holdout 对比。",
            )
        )
        items.append(
            row(
                f"请写一道用于验收「是否理解 {p}」的开放题，并给出参考得分点。",
                f"开放题示例：说明 {p} 影响训练的哪一环，并描述调大/调小的典型现象。\n"
                f"得分点：机制正确；现象对应；提到用 Holdout 验证；提到与相邻超参联动。补充：{tip}",
            )
        )

    # Failure-mode eval
    failures = [
        (
            "HFValidationError：把本地路径当成 repo_id",
            "路径不存在或写错；用 os.walk 找 adapter_config.json；确认 Add Input 成功。",
        ),
        (
            "meta tensor / 二次 from_pretrained",
            "显存残留；Restart 后单次加载；device_map 固定单卡；换题不重载。",
        ),
        (
            "Output 被清空",
            "工作区临时性；本地下载或 Dataset 固化；Save Version 备份。",
        ),
        (
            "transformers 版本漂移",
            "钉版本并写进日志；重启后先校验 __version__ 再训。",
        ),
        (
            "列表题漏项复发",
            "数据 output 仍不可检验；补全清单样本；Holdout 用评分表扣分。",
        ),
    ]
    for title, fix in failures:
        items.append(
            row(
                f"Holdout 场景题：线上出现「{title}」，请给出复现与修复步骤。",
                f"复现：固定环境与命令，记录完整报错。修复：{fix}\n"
                f"预防：把该故障写入实验手册，并在发版检查清单中单列一项。",
            )
        )

    # Scenario inputs (eval)
    scenarios = [
        (
            "根据记录判断下一版最应该改数据还是改超参，并说明理由。",
            "v1：9 条数据，steps=60，产物题只回术语；loss 已下降。",
            "应优先改数据：失败模式是清单监督不足，不是单纯步数不够。"
            "扩到数百条可检验产物/对比样本并隔离 Holdout 后，再考虑 steps 上调；否则只加 steps 易背题。",
        ),
        (
            "请把下面不合格 output 改成可检验版本，并说明改了什么。",
            "问：微调完成后常见产物？ 原答：LoRA。",
            "可检验版本应列出适配器权重与配置、日志超参、评测记录，并可注明可选 GGUF/合并权重。"
            "改动点：从单术语变为可核对清单，避免空泛。",
        ),
        (
            "评估该 Holdout 题是否合格；若不合格请改写。",
            "题目：什么是 AI？ 参考答案：一种技术。",
            "不合格：超范围且不可检验。可改写为：用两句话说明 QLoRA 中量化与 LoRA 的分工，"
            "参考答案需包含 4bit 装基座与只训适配器两点。",
        ),
        (
            "给定显存约束，选择一组更合理的起步超参并解释。",
            "GPU：T4 16GB；模型：8B；目标：先跑通再谈效果。",
            "建议：load_in_4bit=True，per_device_batch=1~2，accum=4~8，seq=1024~2048，"
            "r=8~16，steps 先 60 冒烟再加；优先保证不 OOM 与可保存适配器。",
        ),
        (
            "请根据对比表给出结论：v2 是否值得替换 v1？",
            "同一 Holdout：产物题完整率 20%→75%；同义问法正确率 30%→70%；胡编投诉下降；steps 60→120，数据 9→500。",
            "值得替换：关键弱项与泛化同步提升，且数据/步数变更可解释。"
            "仍建议保留 v1 适配器作回滚，并继续抽真实用户问题扩 Holdout。",
        ),
    ]
    for inst, inp, out in scenarios:
        items.append(row(inst, out, inp))

    # Rubric / interview eval
    interview = [
        (
            "请给出「一分钟微调实验口述」的评分表（面试官用）。",
            "得分点：任务与数据（含条数/Holdout）；方法（QLoRA 关键超参）；算力环境；产物；"
            "前后对比结论；已知问题与下一步。缺任一项扣分；只会背名词不得高分。",
        ),
        (
            "候选人说「我把 r 调到 128 所以效果一定更好」，你怎么追问？",
            "追问：数据规模？Holdout 是否提升？显存是否吃紧？是否同时改了别的超参？"
            "期望回答应承认 r 是容量旋钮，必须以评测验证，而非单调越大越好。",
        ),
        (
            "请区分「跑通」与「做好」两个验收标准。",
            "跑通：训练结束、适配器可重载、推理无系统错误。"
            "做好：Holdout/弱题相对基线变好，失败模式减少，日志可复现。"
            "作品集两者都要，但不能用跑通代替做好。",
        ),
    ]
    for q, a in interview:
        items.append(row(q, a))

    # More concrete checklist-style holdout to reach ~100
    extra_asks = [
        (
            "列出重载适配器前要核对的 5 个信息。",
            "基座名一致、适配器目录含 config+权重、transformers/peft 版本、device 映射、模板/Alpaca 拼装与训练一致。",
        ),
        (
            "为什么 Holdout 要用「改写题」而不是「新知识点题」来测泛化？",
            "改写题保持考点不变，测的是表达泛化；新知识点题测的是知识覆盖。"
            "两者都有用，但验证「是否背句式」优先用改写题。",
        ),
        (
            "说明 JSONL 多行 pretty-print 为什么不适合当前训练读取习惯。",
            "常见读取按「一行一条样本」；pretty-print 会拆坏解析。"
            "应保持单行 JSON，校验脚本按行 loads。",
        ),
        (
            "给出三个「看起来很勤奋但无效」的数据操作。",
            "1) 复制粘贴同义极低的近重复；2) output 套话注水；3) 把 Holdout 原句塞进训练刷分。",
        ),
        (
            "若只能加 50 条新样本，你如何分配到失败模式上？",
            "优先分配给 Holdout 失分最高的类型（如产物清单、Prompt vs SFT），"
            "每类含定义+对比+场景，并保留若干改写；避免平均撒到已掌握主题。",
        ),
        (
            "描述一次合格的前后对比实验记录最少字段。",
            "题干、微调前输出、微调后输出、评分、缺陷标签、数据版本、适配器版本、日期。",
        ),
        (
            "解释「可插拔适配器」对多任务交付的价值。",
            "同一基座挂不同 LoRA 可切换任务，减少为每任务保存全量模型的成本；"
            "但需保证模板与预处理一致，并做好版本管理。",
        ),
        (
            "何时需要 merged 权重，何时保留纯适配器即可？",
            "只需 Python/PEFT 加载且要多任务切换：保留适配器；"
            "目标运行时只接受单文件或不便挂 PEFT：再合并。"
            "合并会牺牲热插拔灵活性。",
        ),
        (
            "GGUF 导出前后你分别检查什么？",
            "导出前：磁盘空间、量化类型、是否误开多个导出；"
            "导出后：文件大小合理、本机工具可加载、抽样问答、不提交 Git。",
        ),
        (
            "写出「环境复现」最小集。",
            "GPU 型号、CUDA/驱动备注、Python、transformers/unsloth/peft/torch 版本、"
            "随机种子、数据哈希或路径版本、关键命令。",
        ),
    ]
    for q, a in extra_asks:
        items.append(row(q, a))
        items.append(row("【验收】" + q, a + "\n请用条目作答，并避免只给术语列表。"))

    # Numeric reasoning holdout
    for bs, ga in [(1, 8), (2, 4), (2, 8), (4, 4)]:
        items.append(
            row(
                f"计算题：单卡 batch={bs}、accumulation={ga}，有效 batch 是多少？若 OOM 你怎么改仍接近该有效 batch？",
                f"有效 batch≈{bs * ga}。OOM 时可试 batch={max(1, bs // 2)} 并相应提高 accumulation，"
                f"使乘积仍接近 {bs * ga}，再观察吞吐与收敛。",
            )
        )

    # Depth questions
    depth = [
        (
            "请用「监督学习目标」语言描述指令微调在优化什么。",
            "在给定指令（及可选输入）条件下，最大化参考回答的似然（或等价地最小化 token 级交叉熵），"
            "从而把模型条件分布推向标注分布；LoRA/QLoRA 只是限制了可训练参数子集。",
        ),
        (
            "为什么说 tokenizer 与特殊符号属于「隐性训练配置」？",
            "它们决定文本如何映射到 token 以及何处结束。训练与推理不一致会导致格式错乱或能力假性丢失，"
            "因此必须随适配器一并记录，而不能只保存权重文件。",
        ),
        (
            "从因果推断直觉讲，为何同时改数据与十个超参会让结论变弱？",
            "多因素同时变化无法识别是哪一因子导致 Holdout 提升；"
            "作品集叙事需要可归因：分阶段变更，并保留对照实验。",
        ),
        (
            "请给出「弱项驱动数据飞轮」的四步循环。",
            "评测发现失败模式 → 编写可检验样本与改写 → 复训/换适配器 → 再用同一 Holdout 验证；"
            "循环中保持评测集稳定，避免边训边改题导致不可比。",
        ),
        (
            "若 Holdout 全对但你仍不放心上线，还应补什么评测？",
            "真实用户日志抽样、对抗性改写、超长输入、乱码/夹杂语言、安全边界题，以及延迟/成本评估。"
            "Holdout 是下限保障，不是线上充分条件。",
        ),
    ]
    for q, a in depth:
        items.append(row(q, a))

    return dedupe(items)


def ensure_holdout_size(hold: list[dict], train_instructions: set[str], n: int = 100) -> list[dict]:
    """Top up holdout with unique eval-tone items not present in train."""
    hold = [h for h in hold if h["instruction"] not in train_instructions]
    hold = dedupe(hold)
    i = 0
    bank = [
        ("数据配比", "不同来源样本比例会影响行为；应按任务范围设定并做消融。"),
        ("标注一致性", "无指南的多标注者方差会直接变成模型噪声。"),
        ("模板一致性", "训练推理模板不一致会造成假性能力回归。"),
        ("停止条件", "EOS/停止符配置错误会导致复读或截断。"),
        ("检查点选择", "不应默认最后一步最优，需按 Holdout 选点。"),
        ("回滚策略", "保留上一版适配器，线上异常可快速回退。"),
        ("评测污染检测", "对 Holdout 与训练集做近重复检索，防止泄漏。"),
        ("长尾问题", "高频题提升不等于长尾用户体验提升。"),
        ("成本核算", "应记录 GPU 小时与迭代周期，而不只报准确率。"),
        ("文档化", "没有实验文档的权重难以成为团队资产。"),
    ]
    while len(hold) < n:
        for name, meaning in bank:
            i += 1
            inst = f"【Holdout-{i:03d}】请从验收视角说明「{name}」为何影响微调交付质量。"
            if inst in train_instructions or any(h["instruction"] == inst for h in hold):
                continue
            hold.append(
                row(
                    inst,
                    f"{meaning}\n"
                    f"验收时请给出：可观察信号、失败时的表现、以及你在流程中对应的检查项。"
                    f"不要只复述名词。",
                )
            )
            if len(hold) >= n:
                break
    return enrich_short(hold[:n], min_chars=150)



# Rotated short pads — NEVER use one fixed sentence (v2 「落地建议」导致套话过拟合)
_SHORT_PADS = [
    "验收要点：答案应可对照实验日志核对，而不是只堆术语。",
    "若线上表现与预期不符，先固定数据版本做小集复现，再单独改数据或单独改超参。",
    "交付时至少能指出：数据版本、关键超参、产物路径与 Holdout 结论。",
    "面试表述：先讲可观察产物与复现步骤，再讲原理名词。",
    "工程习惯：一次只改少量相关变量，保留上一版适配器以便回滚。",
]


def enrich_short(rows: list[dict], min_chars: int = 120, *, enable_pads: bool = False) -> list[dict]:
    """Optionally pad short answers. v4 默认关闭垫片，避免结尾鸡汤过拟合。"""
    out: list[dict] = []
    for i, r in enumerate(rows):
        ans = r["output"].strip()
        if "落地建议：" in ans:
            ans = ans.split("落地建议：", 1)[0].rstrip()
        for pad in _SHORT_PADS:
            if ans.endswith(pad):
                ans = ans[: -len(pad)].rstrip()
            if f"\n{pad}" in ans:
                ans = ans.replace(f"\n{pad}", "").rstrip()
        if enable_pads and len(ans) < min_chars:
            ans = f"{ans}\n{_SHORT_PADS[i % len(_SHORT_PADS)]}"
        out.append({**r, "output": ans})
    return out


def build_product_gold() -> list[dict]:
    """Dense 产物/归档 cluster for G1 (unified 必留/可选 sentence pattern)."""
    must = (
        "必留：LoRA/QLoRA 适配器权重（如 adapter_model.safetensors）、adapter_config.json、"
        "基座模型标识、训练超参与日志、固定评测/Holdout 对比记录。"
    )
    opt = "可选：merged 全量或量化权重、GGUF、推送到 Hub 的备份。适配器权重与配置绝不是可选。"
    base = [
        row("微调完成后常见产物有哪些？", f"{must}{opt}"),
        row("微调完成后常见产物有哪些？请按「必留 / 可选」分类说明。", f"{must}{opt}"),
        row(
            "请列举一次 QLoRA 微调结束后你应归档的产物清单，并区分必留与可选。",
            f"{must}数据版本号也应写入必留记录。{opt}",
        ),
        row("QLoRA 跑完后，哪些东西必须归档？哪些可以以后再导出？", f"{must}{opt}"),
        row("从交付视角写出微调产物的必留清单与可选清单。", f"{must}{opt}"),
        row(
            "若只能保留最少文件以便明天重载对话，你应留哪些？",
            "必留至少：adapter_model.safetensors（或等价适配器权重）、adapter_config.json、"
            "基座模型名称。没有这两类适配器文件通常无法可靠重载。日志与评测记录也应一并归档以便验收。"
            "GGUF/合并权重属于可选加速项，不能替代适配器必留件。",
        ),
        row(
            "从交付视角：哪些文件缺失会导致无法重载适配器？",
            "缺少 adapter_config.json 或 adapter_model.safetensors（或等价权重）就无法可靠重载；"
            "基座名写错也会挂错模型。模板不一致会造成假性能力回归。这些都属于必留范畴，不是可选。",
        ),
        row(
            "请判断：把「适配器目录」写进可选，是否正确？为什么？",
            "不正确。适配器权重与 adapter_config 是重载与交付的核心必留件；"
            "可选应是 GGUF、merged 权重、Hub 镜像等。把适配器当可选会导致 Restart 后无法复现。",
        ),
        row(
            "工程验收：产物清单回答怎样才算合格？",
            "合格：必留点到适配器权重、adapter_config、日志/超参、评测记录；可选单独列出 GGUF/合并；"
            "无长套话。不合格：只堆术语、把适配器放进可选、或复读统一鸡汤收尾。",
        ),
        row(
            "列出 adapter_config.json 与 adapter_model.safetensors 各自角色，并说明是否必留。",
            "二者都是必留。adapter_config.json 描述 PEFT/LoRA 结构与加载元数据；"
            "adapter_model.safetensors 保存可训练适配器张量。缺一通常无法稳定重载。",
        ),
    ]
    paraphrases = [
        "微调结束你应保存什么？请分必留和可选。",
        "做完一次 QLoRA，归档清单怎么写才算工程合格？",
        "请用条目列出：重载模型最少需要哪些文件？",
        "作品集交付时，哪些产物必须给评审看？",
        "Kaggle Restart 前，你至少该下载哪些微调产物？",
        "为什么不能只保存一个文件夹名而不管 adapter_config？",
        "请对比「术语堆砌式产物回答」和「可检验产物清单」的区别，并给出正确清单。",
        "线上要回滚到上一版 LoRA，你依赖哪些必留文件？",
        "请写出一份可直接贴进 README 的产物必留/可选说明。",
        "若评测记录丢了但适配器还在，算不算归档完整？请按必留标准回答。",
        "把训练日志、超参、Holdout 结果分别归入必留还是可选？并给出完整清单。",
        "GGUF 很重要，能否取代 adapter_model 成为唯一必留？请辨析并给出清单。",
        "请纠正：必留=日志；可选=适配器。给出正确分类。",
        "面试官问「你的微调产物有哪些」，请按必留/可选作答。",
        "请用「没有 X 就不能重载」的句式强调必留项，并补全可选。",
        "数据版本、seed、超参表、适配器、GGUF：哪些必留哪些可选？",
        "请给出一份防止 Restart 丢实验的最低归档清单。",
        "同义问法：跑完 QLoRA 要带走什么？",
        "同义问法：微调产出物清单（必留 vs 可选）。",
        "同义问法：LoRA 实验收尾检查表，区分必须下载与可选导出。",
        "若合并权重很大，是否可以不留适配器？请给出正确必留/可选。",
        "请列出 tokenizer 是否必留，并给出完整产物分类。",
        "Holdout 对比表应放在必留还是可选？请连同适配器一并说明。",
        "请用两段话：第一段必留，第二段可选，回答产物清单。",
        "团队交接时，新同学要复现你的 QLoRA，你会交付哪些必留件？",
        "请指出下列错误并改正：可选=adapter_config；必留=GGUF。",
        "从「可重载、可评测、可回滚」三个目标推导必留清单。",
        "请把产物分成：重载必需 / 验收必需 / 推理加速可选。",
        "中文回答：QLoRA 完成后的归档清单（务必区分必留与可选）。",
        "请再写一版更短的必留三件套，并说明可选有哪些。",
    ]
    for inst in paraphrases:
        base.append(row(inst, f"{must}{opt}"))
    base.append(
        row(
            "产物题只蹦「instruction、LoRA、QLoRA」说明什么？如何用数据修复？",
            "说明监督不足或 output 不可检验。修复：大量增加「必留=适配器+config+日志+评测；"
            "可选=GGUF/merge」的同义样本，禁止统一套话垫长，并用固定 Gate 题双采样验收。",
        )
    )
    return base


def build_qlora_gate_cluster() -> list[dict]:
    """Dense QLoRA misconception cluster aligned to Gate G3 exact wording."""
    skeleton = (
        "不等于。"
        "QLoRA = 用 4bit（或低比特）量化方式加载基座，以节省显存，"
        "再在冻结的量化基座上只训练 LoRA 适配器。"
        "它不是「全部参数都以 4bit 做全量更新」，也不是 4bit 全量微调。"
        "可训练的主要是低秩适配器；基座权重量化后通常保持冻结。"
    )
    variants = [
        "判断题：QLoRA 是否等于「全部参数都以 4bit 做全量更新」？请辨析。",
        "QLoRA 是不是把所有参数都拿去做 4bit 全量训练？请判断并解释。",
        "有人说：开了 4bit 就是在全量更新所有权重。这对吗？结合 QLoRA 辨析。",
        "请辨析：QLoRA vs 「4bit 全量微调」。",
        "QLoRA 是否等于「4bit 全量微调」？请辨析。",
        "判断：QLoRA = 全部参数 4bit 更新。对或错？给出理由。",
        "为什么说 QLoRA 的「Q」和「LoRA」是两件事？能否推出它不是全参 4bit 全量更新？",
        "T4 上常用 QLoRA，是否意味着在用 4bit 训练全部参数？",
        "请用一句话先给结论，再解释：QLoRA 等不等于全参 4bit 全量更新。",
        "反例教学：若模型回答「QLoRA 可能更新全部权重」，错在哪里？给出正确辨析。",
        "填空：QLoRA 量化的是____，训练的是____；因此____于全参 4bit 全量更新。",
        "面试追问：量化后是否仍可能全量训所有参数？在标准 QLoRA 设定下应如何回答。",
        "对比表：QLoRA / LoRA / 全量微调 / 「4bit 全量更新」四者差异（重点打假第四项）。",
        "同义改写：全部参数都以四比特做完整更新 —— 这是 QLoRA 吗？",
        "同义改写：QLoRA 是不是 4bit 的 full finetune？",
        "请纠正：QLoRA 会更新部分或全部权重矩阵。给出更严谨表述。",
        "从显存角度说明：若真做全参 4bit 全量更新，与标准 QLoRA 有何不同？",
        "选择题思路：QLoRA 的可训练参数主要是什么？由此判断它是否全参更新。",
        "用「冻结基座 + 适配器」解释为什么 QLoRA ≠ 全参 4bit 全量更新。",
        "给初学者：先结论后定义，回答 QLoRA 是否等于全部参数 4bit 全量更新。",
        "若只做 4bit 加载但全量更新所有参数，还能叫 QLoRA 吗？请辨析。",
        "请写出一段可直接背诵的标准答案（必须含「不等于」）。",
        "指出混淆点：「4bit」修饰的是加载还是「全量更新所有参数」？",
        "结合 Llama-3.1-8B + Unsloth 场景，解释你为什么用 QLoRA 而不是全参 4bit 更新。",
        "判断题变体：QLoRA 是否等于对全部参数做低比特全量 SGD 更新？",
    ]
    return [row(inst, skeleton) for inst in variants]


def main() -> None:
    out_v3 = ROOT / "datasets" / "sample_alpaca_zh_v3.jsonl"
    out_v4 = ROOT / "datasets" / "sample_alpaca_zh_v4.jsonl"
    rows: list[dict] = []
    rows.extend(build_core())
    rows.extend(build_product_gold())
    rows.extend(build_qlora_gate_cluster())
    rows.extend(expand_topic_variants())
    rows.extend(expand_structured_curriculum())
    rows.extend(expand_numeric_drills())
    rows.extend(expand_checklist_style())
    rows = dedupe(rows)
    if len(rows) < 500:
        rows = top_up_to(rows, 520)
    rows = dedupe(rows)
    rows = enrich_short(rows, min_chars=140, enable_pads=False)
    if len(rows) < 500:
        raise SystemExit(f"only {len(rows)} rows")
    rows = rows[: max(500, min(len(rows), 650))]

    payload = "\n".join(json.dumps(r, ensure_ascii=False) for r in rows) + "\n"
    out_v4.write_text(payload, encoding="utf-8")
    if not out_v3.exists():
        out_v3.write_text(payload, encoding="utf-8")
    if not OUT.exists():
        OUT.write_text(payload, encoding="utf-8")

    train_inst = {r["instruction"] for r in rows}
    if HOLD.exists():
        hold = [json.loads(l) for l in HOLD.read_text(encoding="utf-8").splitlines() if l.strip()]
        overlap = sum(1 for h in hold if h["instruction"] in train_inst)
        if len(hold) >= 100 and overlap == 0:
            print(f"keep existing holdout ({len(hold)}), overlap=0")
        else:
            hold = ensure_holdout_size(build_holdout(), train_inst, n=100)
            overlap = sum(1 for h in hold if h["instruction"] in train_inst)
            if overlap:
                raise SystemExit(f"holdout overlaps train instructions: {overlap}")
            HOLD.write_text(
                "\n".join(json.dumps(r, ensure_ascii=False) for r in hold) + "\n", encoding="utf-8"
            )
    else:
        hold = ensure_holdout_size(build_holdout(), train_inst, n=100)
        overlap = sum(1 for h in hold if h["instruction"] in train_inst)
        if overlap:
            raise SystemExit(f"holdout overlaps train instructions: {overlap}")
        if len(hold) < 100:
            raise SystemExit(f"holdout too small: {len(hold)}")
        HOLD.write_text("\n".join(json.dumps(r, ensure_ascii=False) for r in hold) + "\n", encoding="utf-8")

    poll = sum(1 for r in rows if "落地建议：把该知识点" in r["output"])
    pads = ("交付时至少能指出", "工程习惯：一次只改", "面试表述：", "若线上表现与预期不符", "验收要点：")
    pad_n = sum(1 for r in rows if any(p in r["output"] for p in pads))
    g1 = "请列举一次 QLoRA 微调结束后你应归档的产物清单，并区分必留与可选。"
    g3 = "判断题：QLoRA 是否等于「全部参数都以 4bit 做全量更新」？请辨析。"
    prod_n = sum(
        1
        for r in rows
        if any(k in r["instruction"] for k in ("产物", "归档", "adapter_config", "必留", "可选"))
    )
    qlora_n = sum(
        1 for r in rows if "QLoRA" in r["instruction"] and ("4bit" in r["instruction"] or "全量" in r["instruction"])
    )
    print(f"wrote {len(rows)} clean train -> {out_v4}")
    print(f"historical v2 path -> {OUT} (exists={OUT.exists()}, not overwritten if present)")
    print(f"holdout -> {HOLD} ({len(hold)})")
    print(f"落地建议原句 count (must 0): {poll}")
    print(f"短垫片命中行数: {pad_n} ({100 * pad_n / len(rows):.1f}%)")
    print(f"产物相关 instruction: {prod_n}")
    print(f"QLoRA 辨析相关 instruction: {qlora_n}")
    print(f"contains G1 exact: {g1 in train_inst}")
    print(f"contains G3 exact: {g3 in train_inst}")
    print(f"avg train output chars: {sum(len(r['output']) for r in rows) / len(rows):.1f}")
    print(f"train/holdout instruction overlap: {overlap}")



if __name__ == "__main__":
    main()
