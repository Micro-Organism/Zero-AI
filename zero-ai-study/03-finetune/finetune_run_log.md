# 微调实验记录

> 本文件由前端「云端微调」页保存时自动同步，请在看板填写，勿手改为主。

## 基本信息

- 日期：2026-07-29
- 平台：Kaggle
- 账号：coolrabbit1993
- Notebook：zero-unsloth-llama31-8b
- GPU 型号：T4 x2
- 基座模型（HF 路径）：`unsloth/Llama-3.1-8B-bnb-4bit`
- 方法：QLoRA
- 数据集（前半公开）：`unsloth/alpaca-cleaned`
- max_steps / epochs：60
- max_seq_length：2048
- 最终 train loss（大约）：0.885100
- 训练耗时：351.3431 s（约 5.86 分钟）
- 峰值显存：7.275 GB（训练额外约 0.568 GB）

## 前半通路勾选

- 打开官方本：是
- Copy and Edit：是
- GPU T4 x2：是
- Internet On：是
- HF Token 就绪：是
- max_steps=60：是
- 训练跑通：是
- 已保存 llama_lora：是
- 已确认 adapter 权重：是

## 产物路径（前半）

- 云端：`/kaggle/working/llama_lora/`
- 本机：`outputs/llama_lora/`

## 后半 · 自己的中文数据

- 已 Upload / 挂载 jsonl：是
- Kaggle Input 路径：`/kaggle/input/datasets/coolrabbit1993/sample-alpaca-zh-01/sample_alpaca_zh.jsonl`
- 已改 load_dataset：是
- 已用自己数据再训：是
- 自己数据 max_steps：60
- 自己数据 loss：0.036500
- 已保存 llama_lora_zh：是
- 云端 zh 路径：`/kaggle/working/llama_lora_zh/`
- 已下载到本机：是
- 本机 zh 路径：`outputs/llama_lora_zh/`

## 过程备注

斐波那契 I 正确；流式 II 另一次采样不稳定；adapter_model.safetensors 已确认

## 校验状态

- 前半通过：是
- 后半通过：是
- 最近保存：2026-07-29T09:10:25.161005+00:00
- 最近校验：2026-07-29T09:10:25.161005+00:00

## 下一步

- 前半完成后：换成自己的 `sample_alpaca_zh.jsonl` 再训并保存 `llama_lora_zh`
- 后半完成后：进入 Step 4 评估（固定中文题对比）
