# 24 · 与手写 Trainer 对比

## 本章目标

弄清：LLaMA-Factory 帮你挡掉了哪些工程细节；什么时候继续用它就够；什么时候值得退回 Hugging Face `Trainer` / 自写循环。加深「配置化微调」的理解，不要求手写代码。

## 一张对照表

| 维度 | LLaMA-Factory | 手写 Transformers Trainer / 训练脚本 |
|------|---------------|--------------------------------------|
| 入口 | WebUI 或 YAML + `llamafactory-cli` | Python 脚本 + `TrainingArguments` |
| 数据 | `dataset_info` + 内置格式转换 | 自己 `Dataset` / `map` / collator |
| 对话模板 | `template` 名称选型 | 自己拼 special tokens / chat template |
| 算法切换 | 改 `stage` / `finetuning_type` | 换 Trainer 子类或损失实现 |
| LoRA | 配置项 | 自己挂 PEFT |
| 分布式 | 示例 + deepspeed/fsdp 配置 | 自己写 accelerate/deepspeed 启动 |
| 推理/导出 | 同一套 CLI 生态 | 另写 generate / merge 脚本 |
| 可控性 | 高覆盖常见路径；极端定制要改源码 | 每一层都可改，成本高 |
| 学习曲线 | 先学配置与数据格式 | 先学 HF 生态与调试 |

## LLaMA-Factory 替你做了什么（概念）

```text
读 YAML/WebUI
  → 解析模型与 template
  → 按 dataset_info 加载并转成训练样本
  → 选择 SFT/DPO/… 的 Trainer 路径
  → 挂 LoRA / 量化 / 加速选项
  → 写 output_dir、日志、可选上报
  → 提供 chat / export / eval 后续出口
```

手写时，上面每一框都可能是你自己的几十～几百行代码与隐患。

## 什么时候 LF 足够

- 标准 SFT / 常见对齐（DPO 等）且数据能落在 Alpaca/ShareGPT
- 想快速对比多种模型与超参
- 团队希望「配置可复现」，而不是每人一份私有脚本
- 教学与实验原型

## 什么时候考虑手写 / 改源码

- 数据格式极特殊，硬改 `dataset_info` 也不自然
- 损失函数、采样策略、多任务混合要深度定制
- 要嵌入已有训练平台（自研调度、特有回调）
- 需要研究级改动（新并行策略、新模块）

过渡策略：先用 LF 验证数据与任务是否成立 → 再决定是否把稳态流程沉淀为自有脚本。

## 概念映射（方便读 HF 文档）

| LF 配置直觉 | HF 世界里的近亲 |
|-------------|-----------------|
| `output_dir` / `save_steps` | `TrainingArguments` 同名思想 |
| `per_device_train_batch_size` + 累积 | 同样存在于 `TrainingArguments` |
| `finetuning_type: lora` | PEFT `LoraConfig` |
| `template` | `tokenizer.apply_chat_template` 一类 |
| `llamafactory-cli train` | `trainer.train()` |
| `llamafactory-cli chat` | `model.generate` + 对话拼装 |

## 纸面练习

1. 用五步写出「LF 一次 SFT」；再标出若手写，哪三步最容易写错。  
2. 你的业务若只有标准中文指令对，优先 LF 还是手写？一句话理由。  
3. 若要对损失加一项自定义正则，你更可能：改 LF 源码、fork 插件，还是外迁手写？

## 检查点

- [ ] 能说明 LF 的价值是「工程封装」而非「替代数据与评价」
- [ ] 能举出至少两个「该继续用 LF」与两个「该考虑手写」的场景
- [ ] 能把若干 LF 配置映射到 HF 概念

## 相关

- 认识框架：[01-认识LLaMA-Factory.md](../01-入门主线/01-认识LLaMA-Factory.md)
- 参数：[12-参数速查与监控.md](../02-进阶专题/12-参数速查与监控.md)

## 下一章

→ [25-推理解码参数细表.md](25-推理解码参数细表.md)
