# 导出笔记

> 本文件由前端「导出与推理」页保存时自动同步，请在看板填写。

## LoRA

- 基座模型：unsloth/Llama-3.1-8B-bnb-4bit
- 适配器目录（本地）：`outputs/llama_lora_zh/`
- 适配器目录（云端）：`/kaggle/input/datasets/coolrabbit1993/llama-lora-zh/llama_lora_zh`
- 加载命令 / Notebook 单元格摘要：

Restart 后从 Dataset 重载：model_name=/kaggle/input/datasets/coolrabbit1993/llama-lora-zh/llama_lora_zh，device_map={'':0}，device=cuda:0。问「微调完成后常见产物有哪些？」→「instruction、LoRA、QLoRA。」（偏短、不完整，与 Step4 Q3 弱项一致）。

## GGUF（可选）

- 本轮跳过：是
- 已导出 GGUF：否
- 量化类型（如 q4_k_m）：q4_k_m
- 文件路径：（未填）
- 已用 Ollama / 其它工具试聊：否
- Ollama / 其它工具命令：

（未填）

## 问题记录

Restart 清空 /kaggle/working；路径易写成 llama_lora_zh 横杠应为 llama-lora-zh；T4x2 需 device_map 与 inputs 对齐 device；二次 from_pretrained 易 OOM/meta。

- 其他备注：本轮跳过 GGUF。效果：能复现加载，但该题回答仍弱，需加数据后再训。

## 校验状态

- 通过：是
- 最近保存：2026-07-29T10:36:10.005569+00:00
- 最近校验：2026-07-29T10:36:10.005569+00:00
