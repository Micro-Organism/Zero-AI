# 06 · LoRA 合并与模型导出

## 本章目标

搞清训练产物保存在哪、如何断点续训、如何把 LoRA 合并成完整模型，以及合并时量化的注意点。

## 核心概念

### 1. 模型保存围绕 `output_dir`

训练相关产物通常包括：最终 adapter/模型、中间 checkpoint、Trainer state、日志、loss 曲线等。

建议：**每个实验独立 `output_dir`**。

### 2. Checkpoint 策略

| 参数 | 作用 |
|------|------|
| `save_strategy` | `steps` / `epoch` / `no` |
| `save_steps` | 按 step 保存的间隔 |
| `save_total_limit` | 最多保留几个 checkpoint |

示例：

```yaml
output_dir: saves/qwen3_8b_lora_sft
save_strategy: steps
save_steps: 200
save_total_limit: 3
```

### 3. `save_only_model`

- `true`：主要保存权重，减小磁盘；**通常无法完整 resume**（缺 optimizer 等状态）。
- 需要严格断点续训时，不要只开这个。

### 4. 断点续训

```yaml
resume_from_checkpoint: saves/qwen3_8b_lora_sft/checkpoint-1000
```

指向具体 `checkpoint-*` 目录。WebUI 侧则是指定适配器路径加载断点。

### 5. LoRA 合并

推理时若不想每次「基座 + adapter」分开加载，可合并导出：

```bash
llamafactory-cli export examples/merge_lora/qwen3_lora_sft.yaml
```

示例结构：

```yaml
### model
model_name_or_path: Qwen/Qwen3-4B-Instruct-2507
adapter_name_or_path: saves/qwen3-4b/lora/sft
template: qwen3_nothink
trust_remote_code: true

### export
export_dir: saves/qwen3_sft_merged
export_size: 5
export_device: cpu
export_legacy_format: false
```

**官方硬提醒：** 合并 LoRA 时，**不要使用量化模型，也不要指定量化位数**；请用未量化的预训练基座来合并。

### 6. 导出量化（PTQ 等）

合并得到完整模型后，若要压缩部署，可在 export 配置里设置例如：

- `export_quantization_bit`
- `export_quantization_dataset`（校准数据）

GPTQ 类示例见官方 `examples/merge_lora/*gptq*.yaml`。

**QLoRA 训练**是另一条线：在量化权重上挂 LoRA 训练；与「合并后再 GPTQ」不要混为一谈。合并 LoRA 时同样记住：不要拿量化基座乱合并。

## Step by step

1. 确认 SFT 的 `output_dir`（adapter）路径正确。
2. 复制官方 merge YAML，填：`model_name_or_path`、`adapter_name_or_path`、`template`、`export_dir`。
3. 执行 `llamafactory-cli export ...`。
4. 检查 `export_dir` 是否生成完整模型文件。
5. （可选）再做 GPTQ/AWQ 等导出；或直接用「基座 + adapter」进第 07 章推理。

## 检查点

**概念过关（当前）：**

- [ ] 能说出 `save_only_model` 对续训的影响
- [ ] 会口头配置 `resume_from_checkpoint`（指向 `checkpoint-*`）
- [ ] 能讲清 merge YAML 关键字段，并记住：合并时不用量化基座
- [ ] 能区分「训练期 QLoRA」与「导出期 GPTQ」

**实操过关（以后）：**

- [ ] 成功合并一次 LoRA 或完成一次导出

## 常见坑

- adapter 路径指到了错误实验目录。
- 用 GPTQ/AWQ 量化模型当 `model_name_or_path` 去做 LoRA merge。
- `export_device` / 磁盘空间不足导致导出失败。
- 续训时 `output_dir` 与原实验不一致，文件散落难找。

## 官方对照

- https://llamafactory.readthedocs.io/zh-cn/latest/getting_started/merge_lora.html
- 仓库 `examples/merge_lora/`

## 下一章

→ [07-推理.md](07-推理.md)
