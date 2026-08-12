# 16 · YAML 配置精读

## 本章目标

不跑训练，也能读懂一份 SFT / 推理 / 合并 YAML：每个关键键控制什么、改它会影响什么。

## 怎么练（纸面作业）

1. 打开官方任意 `examples/train_lora/*_lora_sft.yaml`（GitHub 网页即可）。
2. 按下表分组，在笔记里写「键 → 人话 → 我若修改会怎样」。
3. 再打开一份 `examples/inference/*.yaml`、一份 `examples/merge_lora/*.yaml`，标出 **三者共有字段** 与 **各自独有字段**。

## SFT 训练 YAML：分组精读

### 模型组

| 键 | 人话 | 改它时要想 |
|----|------|------------|
| `model_name_or_path` | 基座模型 | 换模型几乎一定要换 `template` |
| `trust_remote_code` | 是否信任远程自定义代码 | 部分模型需要 |

### 方法组

| 键 | 人话 | 改它时要想 |
|----|------|------------|
| `stage` | 训练阶段 | 入门固定 `sft` |
| `do_train` | 是否训练 | 预测/评估场景会不同 |
| `finetuning_type` | lora/freeze/full | 显存与效果权衡 |
| `lora_rank` | LoRA 秩 | 更大更强也更占显存/更易过拟合 |
| `lora_target` | 作用模块 | 常用 `all` 入门 |

### 数据组

| 键 | 人话 | 改它时要想 |
|----|------|------------|
| `dataset` | 数据集名（可逗号多选） | 必须已在 `dataset_info.json` 注册 |
| `template` | 对话模板 | **和模型绑定**，最易踩坑 |
| `cutoff_len` | 截断长度 | 显存敏感 |
| `max_samples` | 最多用多少条 | 试跑时主动限制 |

### 输出组

| 键 | 人话 | 改它时要想 |
|----|------|------------|
| `output_dir` | 实验输出目录 | 每次实验独立路径 |
| `logging_steps` / `save_steps` | 日志与存盘间隔 | 太密占盘，太疏难续训 |
| `overwrite_output_dir` | 是否覆盖 | 防误删旧实验 |
| `plot_loss` | 画 loss 曲线 | 概念期知道有即可 |
| `save_only_model` | 是否只存权重 | `true` 常不能完整 resume |
| `report_to` | 上报到哪些监控 | none / tensorboard / wandb… |

### 训练组

| 键 | 人话 | 改它时要想 |
|----|------|------------|
| `per_device_train_batch_size` | 单卡 batch | OOM 时先降到 1 |
| `gradient_accumulation_steps` | 梯度累积 | 有效 batch ≈ 相乘（再 ×卡数） |
| `learning_rate` | 学习率 | LoRA 常用比全参更大一档的量级（仍以示例为准） |
| `num_train_epochs` | 轮数 | 数据少更要防过拟合 |
| `lr_scheduler_type` | 学习率形状 | 常用 cosine |
| `warmup_ratio` | 预热比例 | 训练初期慢慢升 lr |
| `bf16` | bf16 精度 | 看硬件是否支持 |
| `resume_from_checkpoint` | 续训路径 | 指向 `checkpoint-*` |

**有效 batch 口诀：**

```text
有效 batch ≈ per_device_train_batch_size
           × gradient_accumulation_steps
           × GPU 数量
```

## 推理 YAML：多了什么 / 少了什么

相对训练，推理配置通常更短：

- 需要：`model_name_or_path`、`template`
- 若用 LoRA：`adapter_name_or_path`、`finetuning_type`
- 可选：`infer_backend`（`huggingface` / `vllm`）
- 通常 **没有** 一整套 lr、epoch、dataset 训练字段

## 合并 YAML：多了什么

- `adapter_name_or_path` + 基座
- `export_dir`、`export_size`、`export_device` 等
- 量化导出时才出现 `export_quantization_bit`、`export_quantization_dataset`
- **合并 LoRA：不要用量化基座**（见第 06 章）

## 纸面练习题（写在笔记里）

1. 若显存不够，你会先动哪些键？排出优先级。
2. 换 Qwen → Llama 类模型，至少要同步检查哪些键？
3. 训练用了 `identity,alpaca_en_demo`，推理 YAML 还需要写 `dataset` 吗？为什么？
4. `save_only_model: true` 对续训意味着什么？

参考思路见 [18-自我检测题.md](18-自我检测题.md)。

## 检查点

- [ ] 能把一份 SFT YAML 分成模型/方法/数据/输出/训练五块讲解
- [ ] 能对比训练 vs 推理 vs 合并配置的差异
- [ ] 能口算有效 batch

## 官方对照

- SFT：https://llamafactory.readthedocs.io/zh-cn/latest/getting_started/sft.html
- 参数百科：https://llamafactory.readthedocs.io/zh-cn/latest/advanced/arguments.html

## 下一章

→ [17-显存与规模估算.md](17-显存与规模估算.md)
