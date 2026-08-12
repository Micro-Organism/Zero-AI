# Step 6 — 数据工程深挖 Data Craft

**上一步：** [../05-export-infer](../05-export-infer/)  
**下一步：** [../07-hparams](../07-hparams/)  
**看板：** http://localhost:5173/data-craft

## 本步目标（求职向）

1. 会说明「数据比盲目加 steps 更重要」  
2. 维护高质量 Alpaca 训练集（**≥500 条**）与 Holdout（**≥100 条**）  
3. 覆盖：概念、对比、场景、超参、故障排查、面试清单  
4. 能口述：范围 → 规则 → 弱项 → 训测分离 → 再训  

## 生成与复现

```bash
python 02-data/generate_alpaca_v2.py
```

输出：

- `datasets/sample_alpaca_zh_v2.jsonl`（约 500+）  
- `datasets/eval_holdout_zh.jsonl`（≥100，不进训练；验收口吻/改写题）  

## 内容结构（科学具体）

| 类别 | 内容 |
|------|------|
| 核心种子 | 微调/LoRA 矩阵观点/QLoRA/Alpaca/评测框架等手写详答 |
| 主题×角度 | 预训练、SFT、RLHF、量化、过拟合等 × 定义/面试/风险 |
| 超参网格 | lr、steps、batch、seq、r、alpha… |
| 故障卡 | OOM、device mismatch、路径错误、版本冲突… |
| 数值题 | 有效 batch、不同 r/steps 的权衡 |

## 完成标准

前端校验：训练 ≥500、Holdout ≥100、笔记齐全 → 同步 `data_craft_notes.md`。
