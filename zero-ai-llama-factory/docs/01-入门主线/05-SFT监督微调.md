# 05 · SFT 监督微调

## 本章目标

理解 **YAML + CLI** 做 LoRA SFT 的配置结构与关键参数；概念期能精读/改写一份配置，实操期再真正开训。  
精读练习见 [16-YAML配置精读.md](../03-概念与工具/16-YAML配置精读.md)。

## 核心概念

SFT（Supervised Fine-Tuning）= 用「指令 → 标准回答」教模型按你的格式与领域说话。

CLI 入口：

```bash
llamafactory-cli train examples/train_lora/qwen3_lora_sft.yaml
```

可在命令行覆盖 YAML 字段：

```bash
llamafactory-cli train examples/train_lora/qwen3_lora_sft.yaml \
  learning_rate=1e-5 \
  logging_steps=1
```

默认会使用所有可见设备；可用环境变量限制：

```bash
CUDA_VISIBLE_DEVICES=0 llamafactory-cli train ...
# 昇腾示例：ASCEND_RT_VISIBLE_DEVICES=0
```

> 示例文件名、模型 id 随仓库版本更新；以你本地 `examples/` 为准。

## 官方示例配置（理解结构）

以下摘自官方文档中的 `qwen3_lora_sft.yaml` 思路，便于对照参数分组：

```yaml
### model
model_name_or_path: Qwen/Qwen3-4B-Instruct-2507
trust_remote_code: true

### method
stage: sft
do_train: true
finetuning_type: lora
lora_rank: 8
lora_target: all

### dataset
dataset: identity,alpaca_en_demo
template: qwen3_nothink
cutoff_len: 2048
max_samples: 1000
preprocessing_num_workers: 16
dataloader_num_workers: 4

### output
output_dir: saves/qwen3-4b/lora/sft
logging_steps: 10
save_steps: 500
plot_loss: true
overwrite_output_dir: true
save_only_model: false
report_to: none

### train
per_device_train_batch_size: 1
gradient_accumulation_steps: 8
learning_rate: 1.0e-4
num_train_epochs: 3.0
lr_scheduler_type: cosine
warmup_ratio: 0.1
bf16: true
ddp_timeout: 180000000
resume_from_checkpoint: null
```

**硬约束（官方备注）：** `model_name_or_path`、`dataset` 必须存在，且 **`template` 与模型对应**。

## 重要参数速记

| 名称 | 含义 |
|------|------|
| `model_name_or_path` | 模型名或本地路径 |
| `stage` | `sft` / `pt` / `rm` / `ppo` / `dpo` / `kto` / `orpo` 等 |
| `do_train` | `true` 训练；评估场景另说 |
| `finetuning_type` | `lora` / `freeze` / `full` |
| `lora_target` | LoRA 作用模块，常用 `all` |
| `dataset` | 数据集名，逗号分隔多个 |
| `template` | 对话模板，跟模型族绑定 |
| `cutoff_len` | 截断长度 |
| `output_dir` | 输出目录 |
| `per_device_train_batch_size` | 单卡 batch |
| `gradient_accumulation_steps` | 梯度累积（有效 batch ≈ 二者相乘 × 卡数） |
| `learning_rate` | 学习率 |
| `lr_scheduler_type` | 如 `cosine`、`linear` |
| `num_train_epochs` | 训练轮数 |
| `bf16` | bf16 混合精度 |
| `warmup_ratio` / `warmup_steps` | 学习率预热 |
| `resume_from_checkpoint` | 从 checkpoint 续训 |

## Step by step

1. 确认已完成第 02、03 章；建议先用官方 demo 数据集。
2. 复制一份官方 YAML 到自己的实验名，例如 `my_qwen_lora_sft.yaml`。
3. 修改：`model_name_or_path`、`template`、`dataset`、`output_dir`。
4. 显存紧时：减小 `cutoff_len`、`per_device_train_batch_size`，增大 `gradient_accumulation_steps`。
5. 启动训练；结束后检查 `output_dir` 是否有 adapter / checkpoint。
6. （可选）打开 YAML 里 eval 相关注释，设置 `val_size` 或 `eval_dataset` 做训练中验证。

## 检查点

**概念过关（当前）：**

- [ ] 能解释有效 batch size 怎么算
- [ ] 知道换模型时必须同步换 `template`
- [ ] 能把一份 SFT YAML 按模型/方法/数据/输出/训练五块讲解
- [ ] 知道 `output_dir` 应按实验隔离

**实操过关（以后）：**

- [ ] 命令行训练能正常结束（或至少成功 save 过 checkpoint）

## 常见坑

- `template` 选错 → 特殊 token / 角色格式错乱。
- `overwrite_output_dir: true` 误伤旧实验。
- 只改模型名不改数据与模板。
- 学习率过大导致 loss 炸；过小则几乎不学。
- 多卡时忘记 `CUDA_VISIBLE_DEVICES`，占满所有卡。

## 官方对照

- https://llamafactory.readthedocs.io/zh-cn/latest/getting_started/sft.html
- 仓库 `examples/train_lora/`

## 下一章

→ [06-LoRA合并与模型导出.md](06-LoRA合并与模型导出.md)
