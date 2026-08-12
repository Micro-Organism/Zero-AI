# 再训与复评记录

> 本文件由前端「再训复评」页保存时自动同步。

## 实验配置

- 数据：`datasets/sample_alpaca_zh_v2.jsonl`
- 适配器名：`llama_lora_zh_v2`
- max_steps：120
- approx_loss：0.123600
- 本地路径：`outputs/llama_lora_zh_v2/`
- 云端数据提示：jsonl: /kaggle/input/datasets/coolrabbit1993/zero-datasets/sample_alpaca_zh_v2.jsonl（以实际为准）；Holdout: /kaggle/input/datasets/coolrabbit1993/zero-datasets/eval_holdout_zh.jsonl
- 超参引用：r=16, alpha=16, lr=2e-4, max_steps=120, batch=2, accum=4, seq=2048, load_in_4bit=True

## 弱题复评

【v2 复评 · Kaggle 真机 · Holdout i=0,10,25,50,80 · loss=0.123600】

Q-产物（Holdout#0 等价弱题）：请列举一次 QLoRA 微调结束后你应归档的产物清单，并区分必留与可选。
- v1（弱）：易答成 instruction/LoRA/QLoRA 术语堆砌
- v2 实际输出：1) 基线题：Holdout 与全量微调相比… 2) 作品集：把该知识点对应到你的实验日志… 3) 个人记录：… 4) 可选：… + 反复「落地建议」套话
- 判定：仍弱。未给出适配器权重/配置、训练日志超参、评测记录、可选 GGUF 等清单；明显背训练数据里的「落地建议」模板，产物题未真正修好。

Q-对比（Holdout#10 等价弱题）：用「改权重与否」对比 Prompt / LoRA / 全量微调。
- v2 实际输出：Prompt 工程不改权重；LoRA 可以改权重但约束可微入门；全量微调改权重且需重训数据与算力。
- 判定：明显变好。核心标准「改不改权重」说清了，比 v1 强。

Q-QLoRA（Holdout#25 等价弱题）：QLoRA 是否等于「全部参数都以 4bit 做全量更新」？
- v2 实际输出：QLoRA 只在 4bit 做 LoRA 适配器更新，并不等于全量参数 4bit 量化。LoRA 通过低秩…冻结基座并只训适配器…
- 判定：方向正确（否定全量 4bit 更新、强调只训适配器）；表述略含糊（「只在 4bit 做 LoRA」），但比 v1 术语堆砌可用。

Holdout 追加：
- #50 Output 被清空：给出复现→对照 Holdout→查变更→金标准回归→记录，流程可用。
- #80 环境复现最小集：数据版本/库版本/超参/seed/产物路径/一次少改超参+Holdout 验收，要点对；末尾仍偶发「落地建议」套话。

总评：概念对比与 QLoRA 辨析有提升；产物清单题与套话污染是当前最大短板（数据模板副作用）。

## 相对 v1

【v2 vs v1 · 基于本轮 Holdout 真输出】
1) 数据：约 9 条 → 521 条 + Holdout 100；超参：steps 60→120，r/alpha=16 不变，便于归因「数据+步数」。
2) 变好：Prompt/LoRA/全量（改权重标准）说清；QLoRA≠全量 4bit 更新能辨析；场景题/验收题有基本流程。
3) 仍弱：产物归档清单题答偏，反复输出训练数据里的「落地建议」boilerplate，说明部分样本模板污染导致过拟合套话。
4) loss≈0.1236（相对 v1≈0.88 很低）：记作本轮数字，但需结合生成质量解读——loss 低≠产物题已好。
5) 结论：v2 可作「概念题更稳」的迭代版，暂不完全替换作品集主叙事中的「产物清单」能力；保留 v1 对照。下一步优先清洗/重写带「落地建议」的长尾样本后再小步补训（进阶 C），不必先加大 r。
实填结论：采用 v2 作为主实验记录；产物题未达标，需定向补数据后再训；Holdout 对比证明「数据工程有效但不均匀」。

## 面试口述

我完成了两轮 QLoRA：v1 用小数据验证流水线；v2 用 500+ 中文数据与 steps=120、r=16 再训，Holdout 复评显示 Prompt/LoRA/全量对比和 QLoRA 辨析明显变好，但产物归档清单仍被训练数据里的「落地建议」套话污染。结论是提升来自数据与加步且不均匀，下一步应清洗模板噪声再补训，而不是盲目加大 r。产物保留 llama_lora_zh_v2 与实验日志，v1 作回滚对照。

- 其他：Step8 已通过。工程未达标（G1/G4）：v2 训练数据曾有约55%「落地建议」套话。下一步：用 datasets/sample_alpaca_zh_v3.jsonl 训 llama_lora_zh_v3，按 08-retrain/engineering_acceptance.md 门禁复评。本机请下载 v2 到 outputs/llama_lora_zh_v2/。

## 校验

- 通过：是
- 保存：2026-07-29T12:14:35.006753+00:00
- 校验：（无）
