# 评估记录

> 本文件由前端「效果评估」页保存时自动同步，请在看板填写。

## 实验引用

- 对应微调日志：`03-finetune/finetune_run_log.md`
- 适配器路径：`outputs/llama_lora_zh/`

## 测试题与对比

### Q1

- 问题：用一句话说明什么是 QLoRA。
- 微调前：<|begin_of_text|>Below is an instruction that describes a task, paired with an input that provides further context. Write a response that appropriately completes the request.

### Instruction:
用一句话说明什么是 QLoRA。

### Input:


### Response:
QLoRA是一个将问答对转化为知识图谱的工具,它使用了 QL2R、Q2R、R2A 等多个模型。<|end_of_text|>
- 微调后：<|begin_of_text|>Below is an instruction that describes a task, paired with an input that provides further context. Write a response that appropriately completes the request.

### Instruction:
用一句话说明什么是 QLoRA。

### Input:


### Response:
QLoRA 是先把大模型 4bit 量化加载，再只训练 LoRA 适配器，从而在免费 GPU 上也能微调。<|end_of_text|>
- 备注：【对比结论·明显变好｜训练集内题】
- 微调前：完全答错，把 QLoRA 说成「问答转知识图谱工具」，并捏造 QL2R/Q2R 等概念，属于事实幻觉。
- 微调后：与 sample_alpaca_zh 中标准表述高度一致——强调 4bit 量化加载 + 只训 LoRA，从而能在免费 GPU 微调。
- 含义：中文 LoRA 已把该知识点「拉回」正确口径；本题可作为 Step3 后半成功的强证据。
- 注意：回答几乎贴训练答案，后续需用更多非原题验证是否只是背诵。

### Q2

- 问题：求职时如何介绍一次微调实验？
- 微调前：<|begin_of_text|>Below is an instruction that describes a task, paired with an input that provides further context. Write a response that appropriately completes the request.

### Instruction:
求职时如何介绍一次微调实验？

### Input:


### Response:
在介绍一次微调实验时,我一般会从实验的背景开始。首先,我会阐明微调实验的必要性,并阐明微调实验的背景。接着,我会介绍微调实验的过程和结果,并阐明微调实验的意义。最后,我会介绍微调实验的启发和后续工作。<|end_of_text|>
- 微调后：<|begin_of_text|>Below is an instruction that describes a task, paired with an input that provides further context. Write a response that appropriately completes the request.

### Instruction:
求职时如何介绍一次微调实验？

### Input:


### Response:
可以说清数据格式、训练方法（QLoRA）、算力（Kaggle T4）、产物（LoRA/GGUF）和前后对比结论。<|end_of_text|>
- 备注：【对比结论·明显变好｜训练集内题】
- 微调前：空泛「背景→过程→意义→启发」套话，没有可核查的技术要素，求职场景不可用。
- 微调后：直接给出可汇报清单：数据格式、方法(QLoRA)、算力(Kaggle T4)、产物(LoRA/GGUF)、前后对比——与训练样本一致。
- 含义：风格从「作文腔」转为「实验要素清单」，更符合本项目目标口径。
- 风险：同样高度贴训练集，求职口述时建议再补：steps/loss、自己的 jsonl、adapter 路径等真实数字。

### Q3

- 问题：微调完成后常见产物有哪些？
- 微调前：<|begin_of_text|>Below is an instruction that describes a task, paired with an input that provides further context. Write a response that appropriately completes the request.

### Instruction:
微调完成后常见产物有哪些？

### Input:


### Response:
微调完成后常见产物有以下几种:
1. 微调完成后常见产物有以下几种: ①有毒物质; ②有害物质; ③有害物质; ④有害物质; ⑤有害物质; ⑥有害物质; ⑦有害物质; ⑧有害物质; ⑨有害物质; ⑩有害物质; ⑪有害物质; ⑫有害物质; ⑬有害物质
- 微调后：<|begin_of_text|>Below is an instruction that describes a task, paired with an input that provides further context. Write a response that appropriately completes the request.

### Instruction:
微调完成后常见产物有哪些？

### Input:


### Response:
instruction、LoRA、QLoRA。<|end_of_text|>
- 备注：【对比结论·前后都差｜泛化题（训练集未覆盖好）】
- 微调前：严重退化/胡言，反复输出「有毒/有害物质」列表，说明基座在该中文问题上几乎不可用。
- 微调后：虽不再胡言，但答案错误/过短：「instruction、LoRA、QLoRA」——把数据字段和方法名当成「产物」，未提到 adapter/safetensors、合并权重、GGUF 等真正产物。
- 含义：中文微调改善了「别胡说八道」，但未教会本题正确知识点；说明当前 9 条数据 + 60 steps 覆盖面不够。
- 对 Step5/下一轮：应在数据集中补「产物」类样本（LoRA 适配器、合并模型、GGUF、推理示例），再训一小段后重测本题。

### Q4

- 问题：Prompt 工程和微调有什么不同？
- 微调前：<|begin_of_text|>Below is an instruction that describes a task, paired with an input that provides further context. Write a response that appropriately completes the request.

### Instruction:
Prompt 工程和微调有什么不同？

### Input:


### Response:
Prompt 工程和微调有什么不同？
工程是指根据原理、方法、技术等制定标准、原则、规范、规程、规则、方法、技术等的总结和系统化的活动。
微调是指对已有的工程进行改进、完善、优化、改造等的活动。
<|end_of_text|>
- 微调后：<|begin_of_text|>Below is an instruction that describes a task, paired with an input that provides further context. Write a response that appropriately completes the request.

### Instruction:
Prompt 工程和微调有什么不同？

### Input:


### Response:
微调会加载已经预训练好的模型，并用你自己的小规模数据在手机上继续训练，让模型更适应特定任务或领域。<|end_of_text|>
- 备注：【对比结论·部分改善但仍不完整｜非原样题】
- 微调前：把「工程」理解成标准规范制定，完全跑题；几乎没抓住 Prompt vs 微调。
- 微调后：只讲了「微调是什么」（且误写成「在手机上继续训练」），没有对比 Prompt「不改权重只改输入」。
- 含义：模型开始往 LLM 微调语境靠，但出现训练数据污染/串话（手机），且对比结构缺失。
- 建议：补 2～3 条「Prompt vs 微调」对比样本；推理时可用更完整 instruction 约束「请分别说明两者差异」。

### Q5

- 问题：为什么免费 GPU 上更常用 QLoRA？
- 微调前：<|begin_of_text|>Below is an instruction that describes a task, paired with an input that provides further context. Write a response that appropriately completes the request.

### Instruction:
为什么免费 GPU 上更常用 QLoRA？

### Input:


### Response:
1.免费GPU上更常用QLoRA是因为QLoRA具有更好的可扩展性,能够在多个设备上并行执行计算,从而提高计算效率。

2.免费GPU上更常用QLoRA是因为QLoRA具有更好的计算性能,能够在更少的时间内完成计算,从而提高计算效率。

3.免费GPU上更常用QLoRA是因为QLoRA具有更好的安全性,能够保护用户的数据和隐私,从而提高计算效率。

4.免费GPU上更常用Q
- 微调后：<|begin_of_text|>Below is an instruction that describes a task, paired with an input that provides further context. Write a response that appropriately completes the request.

### Instruction:
为什么免费 GPU 上更常用 QLoRA？

### Input:


### Response:
因为显存和算力有限时，只训练 LoRA 适配器就能在免费 GPU 上跑通，且更容易在手机上微调。<|end_of_text|>
- 备注：【对比结论·部分变好｜近训练集措辞题】
- 微调前：编造「可扩展性/性能/安全性」等多条正确性存疑的理由，典型幻觉罗列。
- 微调后：抓住「显存算力有限、只训适配器、免费 GPU 能跑通」主线，方向正确；但仍有「更容易在手机上微调」不准确表述，且未点明 4bit 量化这一 QLoRA 关键。
- 含义：相对基座已从胡编转为可用口径，但精度与完整性仍不足。
- 下一轮：强化 QLoRA=量化+LoRA 的固定句式样本，并避免「手机」等噪声表述混入训练数据。

## 总结

- 整体是否变好：整体明显变好，但「变好」主要集中在训练集内/近训练集问题上；泛化与概念对比题仍弱。

分题一句话：
1) Q1 QLoRA 定义：从事实错误 → 与训练标准答案一致（强正向）
2) Q2 求职介绍：从空泛套话 → 可汇报的技术要素清单（强正向）
3) Q3 常见产物：从胡言乱语 → 不再胡言，但答案仍错误过短（弱正向/知识缺口）
4) Q4 Prompt vs 微调：从完全跑题 → 开始谈微调，但缺对比且出现「手机」串话（中等/不完整）
5) Q5 免费 GPU+QLoRA：从幻觉罗列 → 抓住显存/适配器主线，仍缺 4bit、有噪声（中等正向）

结论：Step3 后半（中文 jsonl + llama_lora_zh）已经证明「能把中文领域口径拉正」，尤其是你数据里反复出现的 QLoRA/求职介绍类问题；这足以作为本轮学习闭环的成功证据。但 9 条样本 + 约 60 steps 不足以覆盖产物清单、Prompt 对比等相邻概念，下一步应以「补数据 + 少量加训 + 再评估」为主，而不是立刻追求更大模型。
- 主要问题（幻觉 / 格式 / 过拟合 / 无变化）：主要问题（按优先级）：

1. 知识覆盖不足（高）
   - Q3「产物」答错；Q4 不会做双边对比。说明训练集几乎没覆盖这些点，或覆盖句式太少。

2. 可能过拟合/背诵训练集（中高）
   - Q1/Q2 微调后几乎贴 sample_alpaca_zh 原文。对演示很好，但对「是否真正理解」证据不足，需要更多改写题/持出题。

3. 表述噪声与串话（中）
   - Q4/Q5 出现「手机上微调」——与本项目 Kaggle/GPU 路径不符，可能来自错误联想或数据噪声，需在数据与提示里纠正。

4. 基座中文指令不稳定（已缓解但仍需警惕）
   - 微调前 Q3 出现重复「有害物质」退化；说明评估必须固定题、固定解码参数，否则前后对比会被随机性干扰。

5. 答案过短/信息不全（中）
   - 部分微调后回答只有一句关键词堆叠（Q3），缺少结构化列举，后续可用「请分点回答」类 instruction 约束，或在 SFT 数据里增加分点范例。
- 下一步打算（加数据 / 加 steps / 换模型 / 导出 GGUF）：建议的下一步（供 Step5 与下一轮微调直接执行）：

A. 立刻可做（本周）
   1. 保持当前 llama_lora_zh 作为「中文口径可用」版本，进入 Step5：导出/合并/GGUF（若目标是本机 Ollama 试用）。
   2. 在 datasets/sample_alpaca_zh.jsonl 增补至少 6～10 条，优先主题：
      - 微调产物（adapter / merged / GGUF / 推理示例）
      - Prompt 工程 vs 微调（必须双边对比）
      - QLoRA = 4bit 量化 + LoRA（固定正确句式，禁止「手机」）
   3. 用同一 5 题再评估一轮（尤其重测 Q3/Q4/Q5），对比本轮笔记。

B. 训练设置建议（下一轮云端）
   - 仍用 QLoRA + 同基座；max_steps 先 100～200（数据少时避免盲目拉高导致过拟合）
   - 另存 adapter 名：llama_lora_zh_v2，勿覆盖 v1，便于 A/B。

C. Step5 导出优先级
   - 先保存/确认 LoRA 适配器完整（已完成）
   - 再按需：merged_16bit 或 GGUF q4_k_m（本机推理）
   - 导出后用相同 5 题做一次「导出后一致性」抽检。

D. 成功标准（下一评估）
   - Q3 能列出 LoRA 适配器/可选 GGUF 等正确产物
   - Q4 能同时说清 Prompt 不改权重、微调改参数/适配器
   - Q5 明确提到 4bit + LoRA，不再出现「手机」误述
- 其他备注：本轮评估方法说明（便于复现）：
- 微调前：另加载干净基座 unsloth/Llama-3.1-8B-bnb-4bit（不挂 llama_lora_zh）生成。
- 微调后：使用已挂中文 LoRA 的 model（llama_lora_zh 训练后会话）生成。
- 解码：Alpaca 模板 + max_new_tokens=128。
- 适配器本机路径：outputs/llama_lora_zh/（含 adapter_model.safetensors）。
- 训练参考：公开数据 loss≈0.885；中文数据再训 loss≈0.0365（见微调页/run_log）。
- 使用建议：演示「学会了什么」优先展示 Q1/Q2；讨论「还缺什么」优先展示 Q3/Q4；Q5 作为「方向对但仍需打磨」样例。
- 前端已勾选并准备校验；后续 Step by step 以本总结的 next_plan 为执行清单。

## 校验状态

- 通过：是
- 最近保存：2026-07-29T09:44:36.016555+00:00
- 最近校验：2026-07-29T09:44:36.016555+00:00
