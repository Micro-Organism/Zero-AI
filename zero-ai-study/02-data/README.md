# Step 2 — 数据 Data

**上一步：** [../01-concepts](../01-concepts/)  
**下一步：** [../03-finetune](../03-finetune/)

## 本步目标

看懂 **Alpaca 风格** 指令数据，并扩写样例，供 Step 3 使用。

## 样例文件

路径：[`../datasets/sample_alpaca_zh.jsonl`](../datasets/sample_alpaca_zh.jsonl)

每行一个 JSON，字段：

```json
{"instruction": "用户任务/问题", "input": "可选补充上下文", "output": "期望回答"}
```

- `input` 可为空字符串  
- 质量比数量重要；入门先保证格式正确  

## 操作清单

1. 打开样例，读懂 3～5 条  
2. 在同一文件末尾 **追加至少 5 条** 你自己写的样本（主题自定）  
3. 本地校验：

```bash
cd zero-ai-study
source .venv/bin/activate
python 02-data/validate_dataset.py
```

## 其他格式（了解即可）

| 格式 | 特点 |
|------|------|
| Alpaca | instruction / input / output，入门最常见 |
| ShareGPT / ChatML | 多轮 messages 对话，更贴近聊天模型 |

Unsloth 官方 Notebook 常自带公开数据集；你也可以先用公开数据跑通，再用本文件替换。

## 完成标准

- [ ] `validate_dataset.py` 通过  
- [ ] 至少有「原样例 + 你新增 ≥5 条」  

## 进阶数据版本（工程满意路径）

| 文件 | 说明 |
|------|------|
| `datasets/sample_alpaca_zh_v2.jsonl` | 扩量版（历史；曾含落地建议污染） |
| `datasets/sample_alpaca_zh_v3.jsonl` | 去长套话 |
| `datasets/sample_alpaca_zh_v4.jsonl` | **下一枪**：产物簇+QLoRA 簇+无垫片 |

问题与方案总账：`09-engineering/triage_v1_v2_v3.md`  

开训前检查：

```bash
cd zero-ai-study
python3 02-data/check_v4_ready.py
# 须打印 READY FOR TRAIN
```

重新生成 v4：

```bash
python3 02-data/generate_alpaca_v2.py
```
